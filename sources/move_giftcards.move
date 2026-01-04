module giftcards_addr::move_giftcards {
    use std::string::String;
    use std::signer;
    use std::error;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::fungible_asset::{Self, Metadata};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::object::{Self, Object};
    use std::option::{Self, Option};
    use aptos_framework::account;
    // account alias removed
    use aptos_std::table::{Self, Table};
    // simple_map import removed

    // ==================== Error Codes ====================
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_GIFTCARD_NOT_FOUND: u64 = 3;
    const E_ALREADY_CLAIMED: u64 = 4;
    const E_EXPIRED: u64 = 5;
    const E_INVALID_RECIPIENT: u64 = 6;
    const E_UNAUTHORIZED: u64 = 7;
    const E_INSUFFICIENT_BALANCE: u64 = 8;
    const E_INVALID_AMOUNT: u64 = 9;

    // ==================== Constants ====================
    const MIN_GIFTCARD_AMOUNT: u64 = 10000; // Adjusted for 6 decimals tokens too
    const MAX_EXPIRY_DAYS: u64 = 365; // 1 year max
    const PLATFORM_FEE_BPS: u64 = 50; // 0.5% fee (50 basis points)

    // ==================== Structs ====================

    /// Platform state - holds all giftcards and configuration
    struct GiftCardPlatform has key {
        // Map giftcard_id => GiftCard
        giftcards: Table<u64, GiftCard>,
        // Map recipient_identifier (email/twitter/discord) => vector of giftcard_ids
        recipient_index: Table<String, vector<u64>>,
        // Map sender address => vector of giftcard_ids
        sender_index: Table<address, vector<u64>>,
        next_giftcard_id: u64,
        total_giftcards_created: u64,
        total_giftcards_claimed: u64,
        total_value_sent: u64,
        platform_fees_collected: u64,
        signer_cap: account::SignerCapability,
    }

    /// Individual giftcard data
    struct GiftCard has store {
        id: u64,
        sender: address,
        from_name: String, // Optional display name for sender
        recipient_type: u8, // 1=email, 2=twitter, 3=discord
        recipient_identifier: String, // email/twitter/discord handle (hashed for privacy)
        amount: u64,
        token_type: String, // "MOVE", "USDC", "USDT", etc.
        fa_address: Option<address>, // Address of FA if applicable, None if Coin
        message: String,
        theme_id: String, // UI theme identifier
        logo_url: String, // Optional logo URL
        created_at: u64,
        expires_at: u64,
        claimed: bool,
        claimed_by: address,
        claimed_at: u64,
    }

    /// Escrow for holding coins per token type
    struct TokenEscrow<phantom CoinType> has key {
        coins: Coin<CoinType>,
    }

    // ==================== Events ====================

    #[event]
    struct GiftCardCreatedEvent has drop, store {
        giftcard_id: u64,
        sender: address,
        from_name: String,
        recipient_type: u8,
        recipient_identifier: String,
        amount: u64,
        token_type: String,
        fa_address: Option<address>,
        theme_id: String,
        expires_at: u64,
    }

    #[event]
    struct GiftCardClaimedEvent has drop, store {
        giftcard_id: u64,
        claimed_by: address,
        recipient_identifier: String,
        amount: u64,
        token_type: String,
        claimed_at: u64,
    }

    #[event]
    struct GiftCardExpiredEvent has drop, store {
        giftcard_id: u64,
        refunded_to: address,
        amount: u64,
    }

    // ==================== Initialize ====================

    /// Initialize the platform (call once by deployer)
    public entry fun initialize(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        assert!(!exists<GiftCardPlatform>(deployer_addr), error::already_exists(E_ALREADY_INITIALIZED));

        // Create Resource Account for holding FA assets
        let (_resource_signer, signer_cap) = account::create_resource_account(deployer, b"giftcards");

        let platform = GiftCardPlatform {
            giftcards: table::new(),
            recipient_index: table::new(),
            sender_index: table::new(),
            next_giftcard_id: 1,
            total_giftcards_created: 0,
            total_giftcards_claimed: 0,
            total_value_sent: 0,
            platform_fees_collected: 0,
            signer_cap,
        };

        move_to(deployer, platform);

        // Initialize escrows for different token types (Coins still held by deployer for now or we could move them too)
        // For backward compatibility/simplicity, we keep CoinEscrow on deployer if that worked, 
        // BUT better to move everything to RA? 
        // Existing Coin logic uses `borrow_global_mut<TokenEscrow<AptosCoin>>(platform_addr)` where platform_addr is hardcoded to @giftcards_addr (deployer).
        // So we keep Coin logic as is (on deployer). RA is ONLY for FA.
        move_to(deployer, TokenEscrow<AptosCoin> {
            coins: coin::zero<AptosCoin>(),
        });
    }

    // ==================== Create GiftCard ====================

    /// Create a giftcard with MOVE tokens
    public entry fun create_giftcard_move(
        sender: &signer,
        recipient_type: u8, // 1=email, 2=twitter, 3=discord
        recipient_identifier: String,
        amount: u64,
        token_type: String, // "MOVE", "USDC", "USDT"
        message: String,
        expiry_days: u64,
        theme_id: String,
        from_name: String, // Optional display name
        logo_url: String, // Optional logo URL
    ) acquires GiftCardPlatform, TokenEscrow {
        assert!(amount >= MIN_GIFTCARD_AMOUNT, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(expiry_days <= MAX_EXPIRY_DAYS, error::invalid_argument(E_INVALID_AMOUNT));

        let sender_addr = signer::address_of(sender);
        
        // Calculate fee
        let fee = (amount * PLATFORM_FEE_BPS) / 10000;
        let total_amount = amount + fee;

        // Transfer coins to escrow
        let coins = coin::withdraw<AptosCoin>(sender, total_amount);
        let platform_addr = @giftcards_addr;
        
        let escrow = borrow_global_mut<TokenEscrow<AptosCoin>>(platform_addr);
        coin::merge(&mut escrow.coins, coins);

        // Create giftcard
        let platform = borrow_global_mut<GiftCardPlatform>(platform_addr);
        let giftcard_id = platform.next_giftcard_id;
        
        let now = timestamp::now_seconds();
        let expires_at = now + (expiry_days * 86400); // days to seconds

        let giftcard = GiftCard {
            id: giftcard_id,
            sender: sender_addr,
            from_name,
            recipient_type,
            recipient_identifier,
            amount,
            token_type,
            fa_address: option::none(), 
            message,
            theme_id,
            logo_url,
            created_at: now,
            expires_at,
            claimed: false,
            claimed_by: @0x0,
            claimed_at: 0,
        };

        // Store giftcard
        table::add(&mut platform.giftcards, giftcard_id, giftcard);

        // Update indices
        if (!table::contains(&platform.recipient_index, recipient_identifier)) {
            table::add(&mut platform.recipient_index, recipient_identifier, vector::empty<u64>());
        };
        let recipient_cards = table::borrow_mut(&mut platform.recipient_index, recipient_identifier);
        vector::push_back(recipient_cards, giftcard_id);

        if (!table::contains(&platform.sender_index, sender_addr)) {
            table::add(&mut platform.sender_index, sender_addr, vector::empty<u64>());
        };
        let sender_cards = table::borrow_mut(&mut platform.sender_index, sender_addr);
        vector::push_back(sender_cards, giftcard_id);

        // Update stats
        platform.next_giftcard_id = giftcard_id + 1;
        platform.total_giftcards_created = platform.total_giftcards_created + 1;
        platform.total_value_sent = platform.total_value_sent + amount;
        platform.platform_fees_collected = platform.platform_fees_collected + fee;

        // Emit event
        event::emit(GiftCardCreatedEvent {
            giftcard_id,
            sender: sender_addr,
            from_name,
            recipient_type,
            recipient_identifier,
            amount,
            token_type,
            fa_address: option::none(),
            theme_id,
            expires_at,
        });
    }

    /// Create a giftcard with Fungible Asset tokens (USDC.e, WETH.e, etc.)
    public entry fun create_giftcard_fa(
        sender: &signer,
        recipient_type: u8, 
        recipient_identifier: String,
        amount: u64,
        token_type: String,
        fa_address: address, // The address of the FA specific object
        message: String,
        expiry_days: u64,
        theme_id: String,
        from_name: String,
        logo_url: String, 
    ) acquires GiftCardPlatform {
        assert!(amount >= MIN_GIFTCARD_AMOUNT, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(expiry_days <= MAX_EXPIRY_DAYS, error::invalid_argument(E_INVALID_AMOUNT));

        let sender_addr = signer::address_of(sender);
        
        // Calculate fee
        let fee = (amount * PLATFORM_FEE_BPS) / 10000;
        let total_amount = amount + fee;

        // Transfer FA to platform (using PrimaryFungibleStore)
        let platform_addr = @giftcards_addr;
        let platform = borrow_global_mut<GiftCardPlatform>(platform_addr);
        
        // Get Resource Account Address
        let ra_addr = account::get_signer_capability_address(&platform.signer_cap);
        let asset_metadata = object::address_to_object<Metadata>(fa_address);
        
        // Ensure sender has balance and transfer to RA
        primary_fungible_store::transfer(sender, asset_metadata, ra_addr, total_amount);

        // Create giftcard
        let giftcard_id = platform.next_giftcard_id;
        
        let now = timestamp::now_seconds();
        let expires_at = now + (expiry_days * 86400);

        let giftcard = GiftCard {
            id: giftcard_id,
            sender: sender_addr,
            from_name,
            recipient_type,
            recipient_identifier,
            amount,
            token_type,
            fa_address: option::some(fa_address), 
            message,
            theme_id,
            logo_url,
            created_at: now,
            expires_at,
            claimed: false,
            claimed_by: @0x0,
            claimed_at: 0,
        };

        // Store giftcard
        table::add(&mut platform.giftcards, giftcard_id, giftcard);

        // Update indices (same logic as before)
        if (!table::contains(&platform.recipient_index, recipient_identifier)) {
            table::add(&mut platform.recipient_index, recipient_identifier, vector::empty<u64>());
        };
        let recipient_cards = table::borrow_mut(&mut platform.recipient_index, recipient_identifier);
        vector::push_back(recipient_cards, giftcard_id);

        if (!table::contains(&platform.sender_index, sender_addr)) {
            table::add(&mut platform.sender_index, sender_addr, vector::empty<u64>());
        };
        let sender_cards = table::borrow_mut(&mut platform.sender_index, sender_addr);
        vector::push_back(sender_cards, giftcard_id);

        // Update stats
        platform.next_giftcard_id = giftcard_id + 1;
        platform.total_giftcards_created = platform.total_giftcards_created + 1;
        platform.total_value_sent = platform.total_value_sent + amount;
        platform.platform_fees_collected = platform.platform_fees_collected + fee;

        // Emit event
        event::emit(GiftCardCreatedEvent {
            giftcard_id,
            sender: sender_addr,
            from_name,
            recipient_type,
            recipient_identifier,
            amount,
            token_type,
            fa_address: option::some(fa_address),
            theme_id,
            expires_at,
        });
    }

    // ==================== Claim GiftCard ====================

    /// Claim a giftcard by providing the recipient identifier
    public entry fun claim_giftcard(
        claimer: &signer,
        giftcard_id: u64,
        recipient_identifier: String, 
    ) acquires GiftCardPlatform, TokenEscrow {
        let claimer_addr = signer::address_of(claimer);
        let platform_addr = @giftcards_addr;
        
        let platform = borrow_global_mut<GiftCardPlatform>(platform_addr);
        
        assert!(table::contains(&platform.giftcards, giftcard_id), error::not_found(E_GIFTCARD_NOT_FOUND));
        
        let giftcard = table::borrow_mut(&mut platform.giftcards, giftcard_id);
        
        // Verify not claimed
        assert!(!giftcard.claimed, error::invalid_state(E_ALREADY_CLAIMED));
        
        // Verify not expired
        let now = timestamp::now_seconds();
        assert!(now <= giftcard.expires_at, error::invalid_state(E_EXPIRED));
        
        // Verify recipient identifier matches
        assert!(giftcard.recipient_identifier == recipient_identifier, error::permission_denied(E_INVALID_RECIPIENT));

        // Mark as claimed
        giftcard.claimed = true;
        giftcard.claimed_by = claimer_addr;
        giftcard.claimed_at = now;

        // Distribute funds based on type
        if (option::is_some(&giftcard.fa_address)) {
            // It's a Fungible Asset
            let fa_addr = *option::borrow(&giftcard.fa_address);
            let metadata = object::address_to_object<Metadata>(fa_addr);
            
            // Generate Resource Account Signer
            let ra_signer = account::create_signer_with_capability(&platform.signer_cap);
            
            // Transfer from RA to claimer
            primary_fungible_store::transfer(&ra_signer, metadata, claimer_addr, giftcard.amount);
            
        } else {
            // Coin path (existing)
            let escrow = borrow_global_mut<TokenEscrow<AptosCoin>>(platform_addr);
            let claim_coins = coin::extract(&mut escrow.coins, giftcard.amount);
            coin::deposit(claimer_addr, claim_coins);
        };

        // Update stats
        platform.total_giftcards_claimed = platform.total_giftcards_claimed + 1;

        // Emit event
        event::emit(GiftCardClaimedEvent {
            giftcard_id,
            claimed_by: claimer_addr,
            recipient_identifier,
            amount: giftcard.amount,
            token_type: giftcard.token_type,
            claimed_at: now,
        });
    }

    // ==================== Refund Expired ====================

    /// Refund an expired giftcard back to sender
    public entry fun refund_expired_giftcard(
        sender: &signer,
        giftcard_id: u64,
    ) acquires GiftCardPlatform, TokenEscrow {
        let sender_addr = signer::address_of(sender);
        let platform_addr = @giftcards_addr;
        
        let platform = borrow_global_mut<GiftCardPlatform>(platform_addr);
        
        assert!(table::contains(&platform.giftcards, giftcard_id), error::not_found(E_GIFTCARD_NOT_FOUND));
        
        let giftcard = table::borrow_mut(&mut platform.giftcards, giftcard_id);
        
        // Verify sender owns this giftcard
        assert!(giftcard.sender == sender_addr, error::permission_denied(E_UNAUTHORIZED));
        
        // Verify not claimed
        assert!(!giftcard.claimed, error::invalid_state(E_ALREADY_CLAIMED));
        
        // Verify expired
        let now = timestamp::now_seconds();
        assert!(now > giftcard.expires_at, error::invalid_state(E_EXPIRED));

        // Mark as claimed to prevent double refund
        giftcard.claimed = true;
        giftcard.claimed_by = sender_addr;
        giftcard.claimed_at = now;

        // Distribute funds based on type
        if (option::is_some(&giftcard.fa_address)) {
            // It's a Fungible Asset
            let fa_addr = *option::borrow(&giftcard.fa_address);
            let metadata = object::address_to_object<Metadata>(fa_addr);
            
            // Generate Resource Account Signer
            let ra_signer = account::create_signer_with_capability(&platform.signer_cap);
            
            // Transfer from RA to claimer (sender)
            primary_fungible_store::transfer(&ra_signer, metadata, sender_addr, giftcard.amount);
            
        } else {
            // Coin path (existing)
            let escrow = borrow_global_mut<TokenEscrow<AptosCoin>>(platform_addr);
            let refund_coins = coin::extract(&mut escrow.coins, giftcard.amount);
            coin::deposit(sender_addr, refund_coins);
        };

        // Emit event
        event::emit(GiftCardExpiredEvent {
            giftcard_id,
            refunded_to: sender_addr,
            amount: giftcard.amount,
        });
    }

    // ==================== View Functions ====================

    #[view]
    public fun get_giftcard(giftcard_id: u64): (
        address, // sender
        String, // from_name
        u8, // recipient_type
        String, // recipient_identifier
        u64, // amount
        String, // token_type
        Option<address>, // fa_address
        String, // message
        String, // theme_id
        String, // logo_url
        u64, // created_at
        u64, // expires_at
        bool, // claimed
        address, // claimed_by
        u64, // claimed_at
    ) acquires GiftCardPlatform {
        let platform = borrow_global<GiftCardPlatform>(@giftcards_addr);
        assert!(table::contains(&platform.giftcards, giftcard_id), error::not_found(E_GIFTCARD_NOT_FOUND));
        
        let giftcard = table::borrow(&platform.giftcards, giftcard_id);
        (
            giftcard.sender,
            giftcard.from_name,
            giftcard.recipient_type,
            giftcard.recipient_identifier,
            giftcard.amount,
            giftcard.token_type,
            giftcard.fa_address,
            giftcard.message,
            giftcard.theme_id,
            giftcard.logo_url,
            giftcard.created_at,
            giftcard.expires_at,
            giftcard.claimed,
            giftcard.claimed_by,
            giftcard.claimed_at,
        )
    }

    #[view]
    public fun get_recipient_giftcards(recipient_identifier: String): vector<u64> acquires GiftCardPlatform {
        let platform = borrow_global<GiftCardPlatform>(@giftcards_addr);
        if (table::contains(&platform.recipient_index, recipient_identifier)) {
            *table::borrow(&platform.recipient_index, recipient_identifier)
        } else {
            vector::empty<u64>()
        }
    }

    #[view]
    public fun get_sender_giftcards(sender: address): vector<u64> acquires GiftCardPlatform {
        let platform = borrow_global<GiftCardPlatform>(@giftcards_addr);
        if (table::contains(&platform.sender_index, sender)) {
            *table::borrow(&platform.sender_index, sender)
        } else {
            vector::empty<u64>()
        }
    }

    #[view]
    public fun get_platform_stats(): (u64, u64, u64, u64) acquires GiftCardPlatform {
        let platform = borrow_global<GiftCardPlatform>(@giftcards_addr);
        (
            platform.total_giftcards_created,
            platform.total_giftcards_claimed,
            platform.total_value_sent,
            platform.platform_fees_collected,
        )
    }

    #[view]
    public fun get_move_balance(): u64 acquires TokenEscrow {
        let platform_addr = @giftcards_addr;
        if (exists<TokenEscrow<AptosCoin>>(platform_addr)) {
            let escrow = borrow_global<TokenEscrow<AptosCoin>>(platform_addr);
            coin::value(&escrow.coins)
        } else {
            0
        }
    }
}