import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getOrCreateDepositAddress, getAllDepositAddresses } from './keyManager';
import { startListener } from './listener';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * GET /api/deposit-address
 * Returns deposit address for a user's Movement wallet
 */
app.get('/api/deposit-address', (req, res) => {
    const userWallet = req.query.userWallet as string;

    if (!userWallet) {
        res.status(400).json({ error: 'userWallet query parameter is required' });
        return;
    }

    try {
        const record = getOrCreateDepositAddress(userWallet);

        res.json({
            depositAddress: record.depositAddress,
            network: 'BSC Testnet',
            chainId: 97,
            supportedTokens: ['Mock USDC', 'Mock MOVE'],
            createdAt: record.createdAt
        });
    } catch (error) {
        console.error('[API] Error getting deposit address:', error);
        res.status(500).json({ error: 'Failed to get deposit address' });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'bridge-relayer',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/stats
 * Returns relayer statistics
 */
app.get('/api/stats', (_req, res) => {
    const addresses = getAllDepositAddresses();
    res.json({
        totalAddresses: addresses.length,
        trackedAddresses: addresses
    });
});

app.listen(PORT, () => {
    console.log(`[Server] Bridge Relayer running on http://localhost:${PORT}`);
    console.log(`[Server] Endpoints:`);
    console.log(`  - GET /api/deposit-address?userWallet=0x...`);
    console.log(`  - GET /api/health`);
    console.log(`  - GET /api/stats`);

    // Start the blockchain listener
    startListener();
});

export default app;
