import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Change this to switch networks
export const CURRENT_NETWORK: 'testnet' | 'mainnet' = 'testnet';

export const MOVEMENT_CONFIGS = {
    mainnet: {
        chainId: 126,
        name: "Movement Mainnet",
        fullnode: "https://full.mainnet.movementinfra.xyz/v1",
        explorer: "mainnet"
    },
    testnet: {
        chainId: 250,
        name: "Movement Testnet",
        fullnode: "https://testnet.movementnetwork.xyz/v1",
        explorer: "testnet"
    }
};

export const CONTRACT_ADDRESS = "0xc0a4f49b38e09756f583eee695592d7e000c1027396378deada63746005e4193"; // Deployed address

const selectedConfig = MOVEMENT_CONFIGS[CURRENT_NETWORK];

const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: selectedConfig.fullnode,
});

export const aptos = new Aptos(config);
