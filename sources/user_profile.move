module user_profile::profile {
    use std::string::String;
    use std::signer;
    use std::error;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::account;

    /// Error: User already has a profile
    const E_PROFILE_EXISTS: u64 = 1;
    /// Error: User does not have a profile
    const E_NO_PROFILE: u64 = 2;

    /// The UserProfile resource stored under the user's account
    struct UserProfile has key {
        username: String,
        bio: String,
        profile_events: event::EventHandle<ProfileUpdateEvent>,
    }

    /// Event emitted when a profile is updated
    struct ProfileUpdateEvent has drop, store {
        old_bio: String,
        new_bio: String,
    }

    /// Initialize and create a new profile
    public entry fun create_profile(
        account: &signer, 
        username: String, 
        bio: String
    ) {
        let addr = signer::address_of(account);
        // Check if profile already exists to prevent overwriting
        assert!(!exists<UserProfile>(addr), error::already_exists(E_PROFILE_EXISTS));

        let profile = UserProfile {
            username,
            bio,
            // Initialize event handle using the account standard library
            profile_events: account::new_event_handle<ProfileUpdateEvent>(account),
        };
        
        move_to(account, profile);
    }

    /// Update the bio of an existing profile
    public entry fun update_bio(
        account: &signer,
        new_bio: String
    ) acquires UserProfile {
        let addr = signer::address_of(account);
        // Ensure profile exists before trying to borrow it
        assert!(exists<UserProfile>(addr), error::not_found(E_NO_PROFILE));

        let profile = borrow_global_mut<UserProfile>(addr);
        
        // Emit event for the update
        event::emit_event(&mut profile.profile_events, ProfileUpdateEvent {
            old_bio: profile.bio,
            new_bio: new_bio,
        });

        profile.bio = new_bio;
    }

    /// Send MOVE tokens to another user
    /// This wraps the standard AptosCoin transfer logic used on Movement L1
    public entry fun send_move(
        account: &signer,
        recipient: address,
        amount: u64
    ) {
        coin::transfer<AptosCoin>(account, recipient, amount);
    }

    // View function to fetch profile data
    #[view]
    public fun get_profile(addr: address): (String, String) acquires UserProfile {
        assert!(exists<UserProfile>(addr), error::not_found(E_NO_PROFILE));
        let profile = borrow_global<UserProfile>(addr);
        (profile.username, profile.bio)
    }
}