import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const APTOS_NETWORK = Network.CUSTOM;
export const CONTRACT_ADDRESS = "0xc0a4f49b38e09756f583eee695592d7e000c1027396378deada63746005e4193"; // Deployed address

const config = new AptosConfig({
    network: APTOS_NETWORK,
    fullnode: 'https://testnet.movementnetwork.xyz/v1',
    faucet: 'https://faucet.testnet.movementnetwork.xyz/',
});

export const aptos = new Aptos(config);
