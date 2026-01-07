import { Wallet, JsonRpcProvider } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '..', 'db.json');

export interface DepositAddressRecord {
    userId: string;           // User's Movement wallet address
    depositAddress: string;   // Generated BSC address
    privateKey: string;       // Private key (stored locally for MVP)
    createdAt: number;        // Timestamp
}

interface Database {
    addresses: DepositAddressRecord[];
}

function readDatabase(): Database {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { addresses: [] };
    }
}

function writeDatabase(db: Database): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/**
 * Get existing deposit address for a user, or generate a new one
 */
export function getOrCreateDepositAddress(userId: string): DepositAddressRecord {
    const db = readDatabase();

    // Check if user already has a deposit address
    const existing = db.addresses.find(a => a.userId === userId);
    if (existing) {
        return existing;
    }

    // Generate new keypair
    const wallet = Wallet.createRandom();

    const record: DepositAddressRecord = {
        userId,
        depositAddress: wallet.address,
        privateKey: wallet.privateKey,
        createdAt: Date.now()
    };

    db.addresses.push(record);
    writeDatabase(db);

    console.log(`[KeyManager] Created new deposit address for user ${userId}: ${wallet.address}`);

    return record;
}

/**
 * Get private key for a deposit address (needed for signing bridge tx)
 */
export function getPrivateKey(depositAddress: string): string | null {
    const db = readDatabase();
    const record = db.addresses.find(a => a.depositAddress.toLowerCase() === depositAddress.toLowerCase());
    return record?.privateKey ?? null;
}

/**
 * Get all tracked deposit addresses
 */
export function getAllDepositAddresses(): string[] {
    const db = readDatabase();
    return db.addresses.map(a => a.depositAddress);
}

/**
 * Get user's Movement address from deposit address
 */
export function getUserIdFromDepositAddress(depositAddress: string): string | null {
    const db = readDatabase();
    const record = db.addresses.find(a => a.depositAddress.toLowerCase() === depositAddress.toLowerCase());
    return record?.userId ?? null;
}
