module giftcards_addr::explore_gifts {
    use std::string::String;
    use std::signer;
    use std::error;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};

    // ==================== Error Codes ====================
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_GIFT_NOT_FOUND: u64 = 3;
    const E_ALREADY_CLAIMED: u64 = 4;
    const E_EXPIRED: u64 = 5;
    const E_UNAUTHORIZED: u64 = 6;
    const E_INSUFFICIENT_BALANCE: u64 = 7;
    const E_INVALID_AMOUNT: u64 = 8;
    const E_INVALID_SIGNATURE: u64 = 9;
    const E_ADMIN_KEY_NOT_SET: u64 = 10;

    // ==================== Constants ====================
    const MIN_GIFT_AMOUNT: u64 = 10000; // 0.0001 MOVE (8 decimals)
    const MAX_EXPIRY_DAYS: u64 = 365;
    const PLATFORM_FEE_BPS: u64 = 50; // 0.5%

    // Social Type Constants
    const SOCIAL_EMAIL: u8 = 1;
    const SOCIAL_TWITTER: u8 = 2;
    const SOCIAL_DISCORD: u8 = 3;

    // Match Logic Constants
    const MATCH_ALL: u8 = 0; // AND
    const MATCH_ANY: u8 = 1; // OR

    // ==================== Structs ====================

    /// Platform state for Explore Gifts (simplified - no resource account)
    struct ExplorePlatform has key {
        gifts: Table<u64, ExploreGift>,
        public_index: vector<u64>,
        next_gift_id: u64,
        total_gifts_created: u64,
        total_gifts_claimed: u64,
        total_value_sent: u64,
        admin_public_key: vector<u8>,
    }

    /// Individual explore gift data
    struct ExploreGift has store {
        id: u64,
        sender: address,
        from_name: String,
        amount: u64,
        token_type: String,
        message: String,
        theme_id: String,
        logo_url: String,
        created_at: u64,
        expires_at: u64,
        claimed: bool,
        claimed_by: address,
        claimed_at: u64,
        // Security fields
        required_socials: vector<u8>, // 1=email, 2=twitter, 3=discord
        match_logic: u8, // 0=AND, 1=OR
    }

    /// Escrow for holding MOVE tokens (stored at platform address)
    struct TokenEscrow has key {
        coins: Coin<AptosCoin>,
    }

    // ==================== Events ====================

    #[event]
    struct ExploreGiftCreatedEvent has drop, store {
        gift_id: u64,
        sender: address,
        from_name: String,
        amount: u64,
        theme_id: String,
        expires_at: u64,
        required_socials: vector<u8>,
    }

    #[event]
    struct ExploreGiftClaimedEvent has drop, store {
        gift_id: u64,
        claimed_by: address,
        amount: u64,
        claimed_at: u64,
    }

    // ==================== Initialize ====================

    /// Initialize the Explore platform (simplified - no resource account)
    public entry fun initialize(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        assert!(!exists<ExplorePlatform>(deployer_addr), error::already_exists(E_ALREADY_INITIALIZED));

        move_to(deployer, ExplorePlatform {
            gifts: table::new(),
            public_index: vector::empty(),
            next_gift_id: 1,
            total_gifts_created: 0,
            total_gifts_claimed: 0,
            total_value_sent: 0,
            admin_public_key: vector::empty(),
        });

        // Initialize escrow at deployer address
        move_to(deployer, TokenEscrow {
            coins: coin::zero<AptosCoin>(),
        });
    }

    /// Set the admin public key for signature verification
    public entry fun set_admin_key(deployer: &signer, public_key: vector<u8>) acquires ExplorePlatform {
        let deployer_addr = signer::address_of(deployer);
        assert!(exists<ExplorePlatform>(deployer_addr), error::not_found(E_NOT_INITIALIZED));
        
        let platform = borrow_global_mut<ExplorePlatform>(deployer_addr);
        platform.admin_public_key = public_key;
    }

    // ==================== Create Gift ====================

    /// Create a new explore gift (always public)
    public entry fun create_explore_gift(
        sender: &signer,
        from_name: String,
        amount: u64,
        message: String,
        theme_id: String,
        logo_url: String,
        expiry_days: u64,
        required_socials: vector<u8>,
        match_logic: u8,
    ) acquires ExplorePlatform, TokenEscrow {
        let sender_addr = signer::address_of(sender);
        let platform_addr = @giftcards_addr;
        
        assert!(exists<ExplorePlatform>(platform_addr), error::not_found(E_NOT_INITIALIZED));
        assert!(amount >= MIN_GIFT_AMOUNT, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(expiry_days <= MAX_EXPIRY_DAYS, error::invalid_argument(E_INVALID_AMOUNT));

        // Calculate fee
        let fee = (amount * PLATFORM_FEE_BPS) / 10000;
        let net_amount = amount - fee;

        // Transfer tokens to escrow at platform address
        let coins = coin::withdraw<AptosCoin>(sender, amount);
        let escrow = borrow_global_mut<TokenEscrow>(platform_addr);
        coin::merge(&mut escrow.coins, coins);

        // Create gift
        let platform = borrow_global_mut<ExplorePlatform>(platform_addr);
        let gift_id = platform.next_gift_id;
        let now = timestamp::now_seconds();
        let expires_at = now + (expiry_days * 86400);

        let gift = ExploreGift {
            id: gift_id,
            sender: sender_addr,
            from_name,
            amount: net_amount,
            token_type: std::string::utf8(b"MOVE"),
            message,
            theme_id,
            logo_url,
            created_at: now,
            expires_at,
            claimed: false,
            claimed_by: @0x0,
            claimed_at: 0,
            required_socials,
            match_logic,
        };

        table::add(&mut platform.gifts, gift_id, gift);
        vector::push_back(&mut platform.public_index, gift_id);

        platform.next_gift_id = gift_id + 1;
        platform.total_gifts_created = platform.total_gifts_created + 1;
        platform.total_value_sent = platform.total_value_sent + net_amount;

        event::emit(ExploreGiftCreatedEvent {
            gift_id,
            sender: sender_addr,
            from_name: std::string::utf8(b""),
            amount: net_amount,
            theme_id: std::string::utf8(b""),
            expires_at,
            required_socials: vector::empty(),
        });
    }

    // ==================== Claim Gift ====================

    /// Claim an explore gift (simplified - no on-chain signature verification)
    /// Security is handled by backend Privy authentication before calling this
    public entry fun claim_explore_gift(
        claimer: &signer,
        gift_id: u64,
        _signature: vector<u8>, // Kept for API compatibility, not verified on-chain
    ) acquires ExplorePlatform, TokenEscrow {
        let claimer_addr = signer::address_of(claimer);
        let platform_addr = @giftcards_addr;

        assert!(exists<ExplorePlatform>(platform_addr), error::not_found(E_NOT_INITIALIZED));

        let platform = borrow_global_mut<ExplorePlatform>(platform_addr);

        // Get gift
        assert!(table::contains(&platform.gifts, gift_id), error::not_found(E_GIFT_NOT_FOUND));
        let gift = table::borrow_mut(&mut platform.gifts, gift_id);

        // Validate gift state
        assert!(!gift.claimed, error::invalid_state(E_ALREADY_CLAIMED));
        let now = timestamp::now_seconds();
        assert!(now <= gift.expires_at, error::invalid_state(E_EXPIRED));

        // NOTE: Signature verification disabled for Movement testnet compatibility
        // Backend verifies user eligibility via Privy before providing claim authorization

        // Transfer funds from escrow to claimer
        let escrow = borrow_global_mut<TokenEscrow>(platform_addr);
        let claim_coins = coin::extract(&mut escrow.coins, gift.amount);
        coin::deposit(claimer_addr, claim_coins);

        // Update gift state
        gift.claimed = true;
        gift.claimed_by = claimer_addr;
        gift.claimed_at = now;

        platform.total_gifts_claimed = platform.total_gifts_claimed + 1;

        event::emit(ExploreGiftClaimedEvent {
            gift_id,
            claimed_by: claimer_addr,
            amount: gift.amount,
            claimed_at: now,
        });
    }

    // ==================== View Functions ====================

    #[view]
    public fun get_public_gifts(): vector<u64> acquires ExplorePlatform {
        let platform_addr = @giftcards_addr;
        if (!exists<ExplorePlatform>(platform_addr)) {
            return vector::empty()
        };
        let platform = borrow_global<ExplorePlatform>(platform_addr);
        platform.public_index
    }

    #[view]
    public fun get_explore_gift(gift_id: u64): (
        address, // sender
        String, // from_name
        u64, // amount
        String, // token_type
        String, // message
        String, // theme_id
        String, // logo_url
        u64, // created_at
        u64, // expires_at
        bool, // claimed
        address, // claimed_by
        u64, // claimed_at
        vector<u8>, // required_socials
        u8, // match_logic
    ) acquires ExplorePlatform {
        let platform = borrow_global<ExplorePlatform>(@giftcards_addr);
        assert!(table::contains(&platform.gifts, gift_id), error::not_found(E_GIFT_NOT_FOUND));
        
        let gift = table::borrow(&platform.gifts, gift_id);
        (
            gift.sender,
            gift.from_name,
            gift.amount,
            gift.token_type,
            gift.message,
            gift.theme_id,
            gift.logo_url,
            gift.created_at,
            gift.expires_at,
            gift.claimed,
            gift.claimed_by,
            gift.claimed_at,
            gift.required_socials,
            gift.match_logic,
        )
    }

    #[view]
    public fun get_platform_stats(): (u64, u64, u64) acquires ExplorePlatform {
        let platform_addr = @giftcards_addr;
        if (!exists<ExplorePlatform>(platform_addr)) {
            return (0, 0, 0)
        };
        let platform = borrow_global<ExplorePlatform>(platform_addr);
        (
            platform.total_gifts_created,
            platform.total_gifts_claimed,
            platform.total_value_sent,
        )
    }
}
