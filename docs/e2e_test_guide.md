# E2E Bridge Test Guide

## Overview
This guide walks through testing the complete bridge flow from BSC Testnet to Movement Bardock.

## Prerequisites Checklist

### 1. Hot Wallet Setup
You need a wallet with **BNB** on BSC Testnet to fuel deposit addresses.

**Get BNB from BSC Testnet Faucet:**
- Visit: https://testnet.bnbchain.org/faucet-smart
- Request 0.5 BNB (enough for ~50 bridge transactions)

**Create or Import Wallet:**
```bash
# Option A: Generate new wallet (recommended for testing)
node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"

# Option B: Use existing wallet private key
```

### 2. Configure .env File
Copy `.env.example` to `.env` and fill in:
```bash
cd /home/antony/movedapp/bridge_relayer
cp .env.example .env
```

Edit `.env`:
```env
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
HOT_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE  # ⚠️ Keep this secret!
MOCK_TOKEN_ADDRESS=0x3D40fF7Ff9D5B01Cb5413e7E5C18Aa104A6506a5
LZ_ENDPOINT_ID=40102
PORT=3001
```

### 3. Get Mock Tokens
You need Mock tokens to test bridging.

**Option A: Request from Movement Bridge Faucet**
- Visit official Movement testnet faucet
- Request Mock USDC/MOVE tokens

**Option B: Mint directly (if contract allows)**
- Check if `0x3D40fF7Ff9D5B01Cb5413e7E5C18Aa104A6506a5` has a public `mint()` function

---

## E2E Test Flow

### Step 1: Start the Relayer
```bash
cd /home/antony/movedapp/bridge_relayer
npm run dev
```

Expected output:
```
[Server] Bridge Relayer running on http://localhost:3001
[Listener] Starting blockchain listener...
[Listener] Polling every 10 seconds
```

### Step 2: Get a Deposit Address
```bash
# Request a deposit address for your Movement wallet
curl "http://localhost:3001/api/deposit-address?userWallet=YOUR_MOVEMENT_ADDRESS"
```

Response:
```json
{
  "depositAddress": "0x...",
  "network": "BSC Testnet",
  "chainId": 97,
  "supportedTokens": ["Mock USDC", "Mock MOVE"]
}
```

### Step 3: Send Mock Tokens to Deposit Address
Using Metamask or a script:
1. Connect to BSC Testnet
2. Send Mock tokens to the `depositAddress` from Step 2
3. Wait for transaction confirmation

### Step 4: Watch the Relayer Logs
You should see:
```
[Listener] Detected deposit: X tokens at 0x...
[Bridge] Starting bridge execution...
[Bridge] Fueling 0x... with 0.01 BNB
[Bridge] Fuel tx confirmed: 0x...
[Bridge] Executing LayerZero send...
[Bridge] Send tx submitted: 0x...
[Bridge] Bridge completed successfully!
```

### Step 5: Verify on Movement Bardock
Check your Movement wallet balance:
- Movement Explorer: https://explorer.movementnetwork.xyz/
- Or use Movement CLI to check balance

---

## Troubleshooting

### Hot Wallet has no BNB
```
Error: insufficient funds for intrinsic transaction cost
```
**Solution:** Get BNB from https://testnet.bnbchain.org/faucet-smart

### No Mock Tokens
**Solution:** Contact Movement team or check official docs for testnet token faucet

### LayerZero Endpoint ID Wrong
```
Error: execution reverted
```
**Solution:** Verify `BARDOCK_EID` in `bridge.ts` - currently set to `40325` (placeholder)

---

## Next Steps After Successful Test
1. Document the verified LayerZero Endpoint ID for Bardock
2. Add retry logic for failed bridges
3. Implement frontend integration (Phase 6)
