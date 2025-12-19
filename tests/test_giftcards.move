#[test_only]
module giftcards_addr::test_giftcards {
    use std::signer;
    use std::string::{Self};
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    use giftcards_addr::move_giftcards;

    // Test initialization of the platform
    #[test(deployer = @giftcards_addr)]
    fun test_initialize(deployer: &signer) {
        account::create_account_for_test(signer::address_of(deployer));
        move_giftcards::initialize(deployer);
    }

    // Test creating and claiming a gift card
    #[test(deployer = @giftcards_addr, sender = @0x123, claimer = @0x456, framework = @0x1)]
    fun test_create_and_claim(deployer: &signer, sender: &signer, claimer: &signer, framework: &signer) {
        // Setup time
        timestamp::set_time_has_started_for_testing(framework);

        // Setup accounts
        let deployer_addr = signer::address_of(deployer);
        account::create_account_for_test(deployer_addr);
        account::create_account_for_test(signer::address_of(sender));
        account::create_account_for_test(signer::address_of(claimer));

        // Initialize coins
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Register and mint for sender
        coin::register<AptosCoin>(sender);
        coin::register<AptosCoin>(claimer); // Claimer needs to be registered to receive? Actually deposit usually requires it
        let coins = coin::mint(100000000, &mint_cap); // 1 APT
        coin::deposit(signer::address_of(sender), coins);

        // Initialize platform
        move_giftcards::initialize(deployer);

        // Create gift card
        let recipient_id = string::utf8(b"alice@example.com");
        let amount = 10000000; // 0.1 APT
        let message = string::utf8(b"Happy Birthday!");
        move_giftcards::create_giftcard_move(
            sender,
            1, // email
            recipient_id,
            amount,
            message,
            30 // 30 days expiry
        );

        // Verify stats
        let (created, claimed, value, fees) = move_giftcards::get_platform_stats();
        assert!(created == 1, 0);
        assert!(claimed == 0, 1);
        assert!(value == amount, 2);
        assert!(fees == (amount * 50 / 10000), 3);

        // Claim gift card
        let giftcard_id = 1;
        move_giftcards::claim_giftcard(claimer, giftcard_id, recipient_id);

        // Verify claim
        let (_, _, _, _, _, _, _, _, is_claimed, claimed_by_addr, _) = move_giftcards::get_giftcard(giftcard_id);
        assert!(is_claimed, 4);
        assert!(claimed_by_addr == signer::address_of(claimer), 5);

        // Clean up
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    // Test refunding an expired gift card
    #[test(deployer = @giftcards_addr, sender = @0x123, framework = @0x1)]
    fun test_refund_expired(deployer: &signer, sender: &signer, framework: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(deployer));
        account::create_account_for_test(signer::address_of(sender));

        // Coins setup
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        coin::register<AptosCoin>(sender);
        coin::deposit(signer::address_of(sender), coin::mint(100000000, &mint_cap));

        move_giftcards::initialize(deployer);

        // Create
        let recipient_id = string::utf8(b"bob@example.com");
        let amount = 10000000;
        move_giftcards::create_giftcard_move(
            sender, 1, recipient_id, amount, string::utf8(b"Expire me"), 1 // 1 day expiry
        );

        // Fast forward 2 days (86400 * 2 seconds)
        timestamp::update_global_time_for_test_secs(86400 * 2 + 1);

        // Sender record balance before refund (account has 1 APT - amount - fee)
        // Fee = 50000
        // Spent = 10000000 + 50000 = 10050000
        // Remaining = 89950000

        // Refund
        move_giftcards::refund_expired_giftcard(sender, 1);

        // Check balance: should have initial - fee (refunded amount comes back)
        // Expected: 89950000 + 10000000 = 99950000
        let balance = coin::balance<AptosCoin>(signer::address_of(sender));
        assert!(balance == 99950000, 0);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}
