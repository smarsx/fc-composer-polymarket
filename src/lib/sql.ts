import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { Account } from "./types";

let db: Database | null = null;

async function openDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: "./mydb.sqlite",
      driver: sqlite3.Database,
    });
    await initializeTables(db);
  }
  return db;
}

async function initializeTables(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proxy TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS market_profits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      scaled_profit TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS conditions (
      id TEXT PRIMARY KEY,
      market_profit_id INTEGER,
      title TEXT,
      FOREIGN KEY (market_profit_id) REFERENCES market_profits(id)
    );

    CREATE TABLE IF NOT EXISTS payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condition_id TEXT,
      payout TEXT NOT NULL,
      FOREIGN KEY (condition_id) REFERENCES conditions(id)
    );
  `);
}

export async function insertAccounts(accounts: Account[]) {
  const db = await openDb();

  await db.run("BEGIN TRANSACTION");

  try {
    for (const account of accounts) {
      // Insert account
      const { lastID: accountId } = await db.run(
        "INSERT OR IGNORE INTO accounts (proxy) VALUES (?)",
        account.proxy
      );

      for (const marketProfit of account.marketProfits) {
        // Insert market profit
        const { lastID: marketProfitId } = await db.run(
          "INSERT INTO market_profits (account_id, scaled_profit) VALUES (?, ?)",
          accountId,
          marketProfit.scaledProfit
        );

        // Insert condition
        await db.run(
          "INSERT INTO conditions (id, market_profit_id, title) VALUES (?, ?, ?)",
          marketProfit.condition.id,
          marketProfitId,
          marketProfit.condition.title || null
        );

        // Insert payouts
        for (const payout of marketProfit.condition.payouts) {
          await db.run(
            "INSERT INTO payouts (condition_id, payout) VALUES (?, ?)",
            marketProfit.condition.id,
            payout
          );
        }
      }
    }

    await db.run("COMMIT");
  } catch (error) {
    await db.run("ROLLBACK");
    throw error;
  }
}

export async function getAccountsByProxy(
  proxyAddresses: string[]
): Promise<Account[]> {
  const db = await openDb();

  const placeholders = proxyAddresses.map(() => "?").join(",");
  const query = `
      SELECT 
        a.proxy,
        mp.scaled_profit,
        c.id AS condition_id,
        c.title AS condition_title,
        p.payout
      FROM accounts a
      LEFT JOIN market_profits mp ON a.id = mp.account_id
      LEFT JOIN conditions c ON mp.id = c.market_profit_id
      LEFT JOIN payouts p ON c.id = p.condition_id
      WHERE a.proxy IN (${placeholders})
      ORDER BY a.proxy, mp.id, c.id, p.id
    `;

  const rows = await db.all(query, proxyAddresses);

  const accountMap = new Map<string, Account>();

  for (const row of rows) {
    if (!accountMap.has(row.proxy)) {
      accountMap.set(row.proxy, { proxy: row.proxy, marketProfits: [] });
    }

    const account = accountMap.get(row.proxy)!;

    if (row.scaled_profit) {
      let marketProfit = account.marketProfits.find(
        (mp) => mp.condition.id === row.condition_id
      );

      if (!marketProfit) {
        marketProfit = {
          scaledProfit: row.scaled_profit,
          condition: {
            id: row.condition_id,
            payouts: [],
            title: row.condition_title || undefined,
          },
        };
        account.marketProfits.push(marketProfit);
      }

      if (row.payout && !marketProfit.condition.payouts.includes(row.payout)) {
        marketProfit.condition.payouts.push(row.payout);
      }
    }
  }

  return Array.from(accountMap.values());
}
