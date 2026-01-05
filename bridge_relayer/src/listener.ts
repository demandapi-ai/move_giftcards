import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import dotenv from 'dotenv';
import { getAllDepositAddresses, getUserIdFromDepositAddress } from './keyManager';
import { executeBridge } from './bridge';

dotenv.config();

const BSC_RPC = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const MOCK_TOKEN_ADDRESS = process.env.MOCK_TOKEN_ADDRESS || '0x3D40fF7Ff9D5B01Cb5413e7E5C18Aa104A6506a5';

// ERC20 ABI (minimal for balance checks)
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const provider = new JsonRpcProvider(BSC_RPC);
const tokenContract = new Contract(MOCK_TOKEN_ADDRESS, ERC20_ABI, provider);

// Track processed deposits to avoid duplicates
const processedDeposits = new Set<string>();

interface DepositEvent {
    depositAddress: string;
    amount: string;
    txHash: string;
    userId: string;
}

/**
 * Check balances for all tracked deposit addresses
 */
async function checkBalances(): Promise<DepositEvent[]> {
    const addresses = getAllDepositAddresses();
    const deposits: DepositEvent[] = [];

    for (const address of addresses) {
        try {
            const balance = await tokenContract.balanceOf(address);
            const decimals = await tokenContract.decimals();
            const formattedBalance = formatUnits(balance, decimals);

            if (balance > 0n) {
                const depositKey = `${address}-${balance.toString()}`;

                if (!processedDeposits.has(depositKey)) {
                    const userId = getUserIdFromDepositAddress(address);

                    if (userId) {
                        console.log(`[Listener] Detected deposit: ${formattedBalance} tokens at ${address}`);

                        deposits.push({
                            depositAddress: address,
                            amount: balance.toString(),
                            txHash: '', // Will be filled by bridge executor
                            userId
                        });

                        processedDeposits.add(depositKey);
                    }
                }
            }
        } catch (error) {
            console.error(`[Listener] Error checking balance for ${address}:`, error);
        }
    }

    return deposits;
}

/**
 * Main polling loop
 */
export async function startListener(): Promise<void> {
    console.log('[Listener] Starting blockchain listener...');
    console.log(`[Listener] Watching token: ${MOCK_TOKEN_ADDRESS}`);
    console.log(`[Listener] RPC: ${BSC_RPC}`);

    // Poll every 10 seconds
    const POLL_INTERVAL = 10000;

    setInterval(async () => {
        try {
            const deposits = await checkBalances();

            for (const deposit of deposits) {
                console.log(`[Listener] Processing deposit for user ${deposit.userId}...`);

                // Trigger bridge execution
                try {
                    await executeBridge(deposit.depositAddress, deposit.userId, deposit.amount);
                } catch (bridgeError) {
                    console.error(`[Listener] Bridge execution failed:`, bridgeError);
                }
            }
        } catch (error) {
            console.error('[Listener] Polling error:', error);
        }
    }, POLL_INTERVAL);

    console.log(`[Listener] Polling every ${POLL_INTERVAL / 1000} seconds`);
}
