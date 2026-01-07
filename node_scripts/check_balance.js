const { Aptos, AptosConfig, Network, Ed25519PrivateKey, Account } = require("@aptos-labs/ts-sdk");
require("dotenv").config();

// Configuration
const TESTNET_FULLNODE = "https://testnet.movementnetwork.xyz/v1";
// Fallback if the above fails
// const TESTNET_FULLNODE = "https://aptos.testnet.bardock.movementnetwork.xyz/v1"; 

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xc0a4f49b38e09756f583eee695592d7e000c1027396378deada63746005e4193";

async function main() {
    const config = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: TESTNET_FULLNODE
    });
    const aptos = new Aptos(config);

    console.log(`Using RPC: ${TESTNET_FULLNODE}`);

    // 1. Check Contract Balance (Escrow)
    console.log(`\n--- Contract Balance (${CONTRACT_ADDRESS}) ---`);
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACT_ADDRESS}::move_giftcards::get_move_balance`,
                functionArguments: [],
            },
        });

        const balanceOctas = result[0];
        const balanceMove = balanceOctas / 100000000;
        console.log(`Escrow Balance: ${balanceMove} MOVE (${balanceOctas} Octas)`);

    } catch (error) {
        console.error("Error fetching contract balance:", error.message);
    }

    // 2. Check Local Account Balance
    if (process.env.PRIVATE_KEY) {
        try {
            const privateKey = new Ed25519PrivateKey(process.env.PRIVATE_KEY);
            const account = Account.fromPrivateKey({ privateKey });

            console.log(`\n--- Local Account Balance (${account.accountAddress}) ---`);

            const resource = await aptos.getAccountCoinAmount({
                accountAddress: account.accountAddress,
                coinType: "0x1::aptos_coin::AptosCoin",
            });

            const balanceMove = resource / 100000000;
            console.log(`Wallet Balance: ${balanceMove} MOVE (${resource} Octas)`);
        } catch (e) {
            console.error("Error fetching local account balance:", e.message);
        }
    } else {
        console.log("\nNo PRIVATE_KEY in .env, skipping local account check.");
    }
}

main();
