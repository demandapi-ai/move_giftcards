import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrivyClient } from '@privy-io/node';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Initialize Privy Client
const privy = new PrivyClient({
    appId: process.env.VITE_PRIVY_APP_ID,
    appSecret: process.env.PRIVY_APP_SECRET,
});

console.log("Privy client initialized");

app.post('/api/sign-movement-tx', async (req, res) => {
    try {
        const { walletId, messageHash } = req.body;
        console.log(`Signing request for wallet ${walletId}, hash ${messageHash?.slice(0, 20)}...`);

        if (!walletId || !messageHash) {
            return res.status(400).json({ error: 'Missing walletId or messageHash' });
        }

        // Clean the authorization key (remove 'wallet-auth:' prefix if present)
        const rawKey = process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY || '';
        const authKey = rawKey.replace('wallet-auth:', '');

        // Sign the transaction hash using Privy's wallets.rawSign API
        // Pass authorization key in authorization_context
        const signatureResponse = await privy.wallets().rawSign(walletId, {
            params: {
                hash: messageHash
            },
            authorization_context: {
                authorization_private_keys: [authKey]
            }
        });

        console.log("Privy Response received");

        // Handle response structure
        // rawSign returns { data: { signature: string, encoding: 'hex' }, method: 'raw_sign' }
        let signature;
        if (typeof signatureResponse === 'object' && signatureResponse !== null) {
            signature = signatureResponse.data?.signature || signatureResponse.signature; // Check data.signature first based on d.ts
        } else {
            signature = signatureResponse;
        }

        res.json({ signature });

    } catch (error) {
        console.error('Signing error:', error);
        res.status(500).json({ error: error.message || 'Signing failed' });
    }
});

app.listen(port, () => {
    console.log(`Signing server running at http://localhost:${port}`);
});
