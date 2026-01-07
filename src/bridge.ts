import { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits } from 'ethers';
import dotenv from 'dotenv';
import { getPrivateKey } from './keyManager';

dotenv.config();

const BSC_RPC = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const HOT_WALLET_KEY = process.env.HOT_WALLET_PRIVATE_KEY || '';
const MOCK_TOKEN_ADDRESS = process.env.MOCK_TOKEN_ADDRESS || '0x3D40fF7Ff9D5B01Cb5413e7E5C18Aa104A6506a5';

// Bardock destination endpoint (Movement Testnet)
// Note: This needs to be verified from LayerZero docs
const BARDOCK_EID = 40325; // Placeholder - verify from Movement docs

const provider = new JsonRpcProvider(BSC_RPC);
const hotWallet = HOT_WALLET_KEY ? new Wallet(HOT_WALLET_KEY, provider) : null;

// OFT ABI (LayerZero Omnichain Fungible Token)
const OFT_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function quoteSend((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd), bool payInLzToken) view returns ((uint256 nativeFee, uint256 lzTokenFee), (uint256 amountSentLD, uint256 amountReceivedLD))',
    'function send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd), (uint256 nativeFee, uint256 lzTokenFee), address refundAddress) payable returns ((bytes32 guid, uint64 nonce, (uint256 nativeFee, uint256 lzTokenFee)))'
];

/**
 * Convert address to bytes32 format for LayerZero
 */
function addressToBytes32(address: string): string {
    // Pad address to 32 bytes (64 hex chars)
    return '0x' + address.slice(2).toLowerCase().padStart(64, '0');
}

/**
 * Send BNB to deposit address for gas
 */
async function fuelAddress(depositAddress: string, amountBNB: string): Promise<string> {
    if (!hotWallet) {
        throw new Error('Hot wallet not configured');
    }

    console.log(`[Bridge] Fueling ${depositAddress} with ${amountBNB} BNB`);

    const tx = await hotWallet.sendTransaction({
        to: depositAddress,
        value: parseUnits(amountBNB, 18)
    });

    await tx.wait();
    console.log(`[Bridge] Fuel tx confirmed: ${tx.hash}`);

    return tx.hash;
}

/**
 * Execute the bridge transaction
 */
export async function executeBridge(
    depositAddress: string,
    userBardockAddress: string,
    amount: string
): Promise<void> {
    console.log(`[Bridge] Starting bridge execution...`);
    console.log(`[Bridge] From: ${depositAddress}`);
    console.log(`[Bridge] To: ${userBardockAddress}`);
    console.log(`[Bridge] Amount: ${amount}`);

    // Get private key for the deposit address
    const privateKey = getPrivateKey(depositAddress);
    if (!privateKey) {
        throw new Error(`No private key found for ${depositAddress}`);
    }

    const depositWallet = new Wallet(privateKey, provider);
    const tokenContract = new Contract(MOCK_TOKEN_ADDRESS, OFT_ABI, depositWallet);

    // Step 1: Fuel the deposit address with BNB for gas
    try {
        // Estimate: 0.01 BNB should be enough for approve + send
        await fuelAddress(depositAddress, '0.01');
    } catch (error) {
        console.error('[Bridge] Failed to fuel address:', error);
        throw error;
    }

    // Step 2: Build SendParam struct
    const sendParam = {
        dstEid: BARDOCK_EID,
        to: addressToBytes32(userBardockAddress),
        amountLD: BigInt(amount),
        minAmountLD: BigInt(amount), // No slippage for testnet
        extraOptions: '0x', // Default options
        composeMsg: '0x',
        oftCmd: '0x'
    };

    // Step 3: Quote the send to get native fee
    console.log('[Bridge] Quoting LayerZero fee...');
    let nativeFee: bigint;

    try {
        const [messagingFee] = await tokenContract.quoteSend(sendParam, false);
        nativeFee = messagingFee.nativeFee;
        console.log(`[Bridge] LayerZero fee: ${formatUnits(nativeFee, 18)} BNB`);
    } catch (error) {
        console.error('[Bridge] Failed to quote send:', error);
        // Use fallback fee for testing
        nativeFee = parseUnits('0.005', 18);
        console.log('[Bridge] Using fallback fee');
    }

    // Step 4: Execute the send
    console.log('[Bridge] Executing LayerZero send...');

    try {
        const tx = await tokenContract.send(
            sendParam,
            { nativeFee, lzTokenFee: 0n },
            depositAddress, // Refund address
            { value: nativeFee }
        );

        console.log(`[Bridge] Send tx submitted: ${tx.hash}`);
        await tx.wait();
        console.log(`[Bridge] Bridge completed successfully!`);
    } catch (error) {
        console.error('[Bridge] Send transaction failed:', error);
        throw error;
    }
}
