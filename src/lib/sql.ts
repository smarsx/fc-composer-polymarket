import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { Position } from "./position";

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
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condition_id TEXT NOT NULL,
      proxy TEXT NOT NULL,
      profit TEXT NOT NULL,
      valueBought TEXT NOT NULL,
      title TEXT NOT NULL,
      src TEXT NOT NULL,
      payoutNumerator INTEGER NOT NULL,
      payoutDenominator INTEGER NOT NULL
    );
  `);
}

export async function insertPositions(positions: Position[]) {
  const db = await openDb();
  await db.run("BEGIN TRANSACTION");
  try {
    const stmt = await db.prepare(`
      INSERT INTO positions (condition_id, proxy, profit, valueBought, title, src, payoutNumerator, payoutDenominator)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const position of positions) {
      await stmt.run(
        position.conditionId,
        position.proxy,
        position.profits.toString(),
        position.valueBought.toString(),
        position.title || "",
        position.src || "",
        position.payouts[0],
        position.payouts[1]
      );
    }

    await stmt.finalize();
    await db.run("COMMIT");
  } catch (error) {
    await db.run("ROLLBACK");
    throw error;
  }
}

export async function getPositionsByProxy(
  proxyAddresses: string[]
): Promise<Position[]> {
  const db = await openDb();
  const placeholders = proxyAddresses.map(() => "?").join(",");

  const rows = await db.all(
    `
    SELECT * FROM positions WHERE proxy IN (${placeholders})
  `,
    proxyAddresses
  );

  return rows.map((row) => ({
    proxy: row.proxy,
    conditionId: row.condition_id,
    payouts: [`${row.payoutNumerator}/${row.payoutDenominator}`],
    valueBought: parseInt(row.valueBought),
    profits: parseInt(row.profit),
    title: row.title,
    src: row.src,
  }));
}
