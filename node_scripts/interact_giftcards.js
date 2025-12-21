require("dotenv").config();
const { Aptos, AptosConfig, Network, Ed25519PrivateKey, Account } = require("@aptos-labs/ts-sdk");

// Configuration
const TESTNET_FULLNODE = "https://testnet.movementnetwork.xyz/v1";
const FAUCET_URL = "https://faucet.testnet.movementnetwork.xyz/";
const MODULE_ADDRESS = "0xc0a4f49b38e09756f583eee695592d7e000c1027396378deada63746005e4193"; // From deployment
const MODULE_NAME = "move_giftcards";

async function main() {
    // 1. Setup Client
    const config = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: TESTNET_FULLNODE,
        faucet: FAUCET_URL,
    });
    const aptos = new Aptos(config);

    // 2. Setup Account
    const privateKey = new Ed25519PrivateKey(process.env.PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });

    console.log(`Using account: ${account.accountAddress}`);

    // Check balance
    try {
        const resources = await aptos.getAccountResources({ accountAddress: account.accountAddress });
        const coinResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
        if (coinResource) {
            console.log(`Balance: ${coinResource.data.coin.value}`);
        } else {
            console.log("No CoinStore resource found.");
        }
    } catch (e) {
        console.log("Account likely new or has no resources:", e.message);
    }

    // 3. Initialize Platform (if needed)
    console.log("\n--- Initializing Platform ---");
    try {
        const payload = {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::initialize`,
            typeArguments: [],
            functionArguments: [],
        };
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: payload,
        });
        const committedTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
        await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        console.log(`Initialization successful: ${committedTxn.hash}`);
    } catch (e) {
        if (e.message.includes("0x2")) { // Assuming E_ALREADY_INITIALIZED = 2
            console.log("Platform already initialized (expected).");
        } else {
            console.log("Initialization failed/skipped (might be already init):", e.message);
        }
    }

    // 4. Create Gift Card
    console.log("\n--- Creating Gift Card ---");
    try {
        const recipientType = 1; // Email
        const recipientIdentifier = "alice@example.com";
        const amount = 10000000; // 0.1 MOVE
        const message = "Here is some MOVE for you!";
        const expiryDays = 30;

        const payload = {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_giftcard_move`,
            typeArguments: [],
            functionArguments: [
                recipientType,
                recipientIdentifier,
                amount,
                message,
                expiryDays
            ],
        };

        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: payload,
        });

        // Sign and submit
        const committedTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
        console.log(`Transaction submitted: ${committedTxn.hash}`);

        const response = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        console.log(`Gift card created successfully! VM Status: ${response.vm_status}`);

    } catch (e) {
        console.error("Failed to create gift card:", e);
    }

    // 5. View Platform Stats
    console.log("\n--- Viewing Platform Stats ---");
    try {
        const result = await aptos.view({
            payload: {
                function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_platform_stats`,
                typeArguments: [],
                functionArguments: [],
            }
        });
        console.log("Platform Stats:", result);
        // Result is [total_created, total_claimed, total_value, total_fees]
        console.log(`Total Created: ${result[0]}`);
    } catch (e) {
        console.error("Failed to view stats:", e);
    }

    // 6. Claim Gift Card (Self-claim for demo)
    console.log("\n--- Claiming Gift Card ---");
    try {
        const giftcardId = 1; // Assuming we just created #1 (or next one if re-run)
        // Note: In a real app, this would be a different account.
        // We use the same account here for simplicity of the node script.

        const payload = {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::claim_giftcard`,
            typeArguments: [],
            functionArguments: [
                giftcardId,
                "alice@example.com" // Must match what we created
            ],
        };

        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: payload,
        });

        const committedTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
        console.log(`Claim Transaction submitted: ${committedTxn.hash}`);
        await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        console.log("Gift card claimed successfully!");

    } catch (e) {
        console.error("Failed to claim (might be already claimed):", e.message);
    }
}

main();
