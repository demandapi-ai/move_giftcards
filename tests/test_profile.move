#[test_only]
module user_profile::test_profile {
    use std::signer;
    use std::string::{Self};
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use user_profile::profile;

    // Test creating a profile and updating bio
    #[test(user = @0x123)]
    fun test_create_and_update_profile(user: &signer) {
        let username = string::utf8(b"alice");
        let bio = string::utf8(b"Hello World");
        
        // Create account
        account::create_account_for_test(signer::address_of(user));

        // Create profile
        profile::create_profile(user, username, bio);

        // Verify
        let (stored_username, stored_bio) = profile::get_profile(signer::address_of(user));
        assert!(stored_username == username, 0);
        assert!(stored_bio == bio, 1);

        // Update bio
        let new_bio = string::utf8(b"New Bio");
        profile::update_bio(user, new_bio);
        
        let (_, updated_bio) = profile::get_profile(signer::address_of(user));
        assert!(updated_bio == new_bio, 2);
    }

    // Test validation: cannot overwrite profile
    #[test(user = @0x123)]
    #[expected_failure(abort_code = 524289, location = user_profile::profile)]
    fun test_cannot_overwrite_profile(user: &signer) {
        let username = string::utf8(b"alice");
        let bio = string::utf8(b"Hello");
        account::create_account_for_test(signer::address_of(user));
        
        profile::create_profile(user, username, bio);
        profile::create_profile(user, username, bio); // Should fail
    }

    // Test transaction logic (mocking AptosCoin)
    #[test(from = @0x111, to = @0x222, framework = @0x1)]
    fun test_send_move(from: &signer, to: &signer, framework: &signer) {
        let from_addr = signer::address_of(from);
        let to_addr = signer::address_of(to);

        account::create_account_for_test(from_addr);
        account::create_account_for_test(to_addr);
        
        // Initialize coin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(framework);
        
        // Register and Mint
        coin::register<AptosCoin>(from);
        coin::register<AptosCoin>(to);
        
        let coins = coin::mint(1000, &mint_cap);
        coin::deposit(from_addr, coins);

        // Transfer 500 via profile::send_move
        profile::send_move(from, to_addr, 500);

        assert!(coin::balance<AptosCoin>(from_addr) == 500, 0);
        assert!(coin::balance<AptosCoin>(to_addr) == 500, 1);

        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}
