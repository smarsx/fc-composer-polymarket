import { sql, QueryResultRow } from "@vercel/postgres";
import { Position } from "./position";

async function initializeTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      condition_id TEXT NOT NULL,
      proxy TEXT NOT NULL,
      profit TEXT NOT NULL,
      value_bought TEXT NOT NULL,
      title TEXT NOT NULL,
      src TEXT NOT NULL,
      payout_numerator INTEGER NOT NULL,
      payout_denominator INTEGER NOT NULL,
      UNIQUE(condition_id, proxy)
    );
  `;
}

export async function insertPositions(positions: Position[]) {
  await initializeTables();

  for (const position of positions) {
    try {
      await sql`
        INSERT INTO positions (
          condition_id, proxy, profit, value_bought, title, src, payout_numerator, payout_denominator
        ) VALUES (
          ${position.conditionId},
          ${position.proxy},
          ${position.profits.toString()},
          ${position.valueBought.toString()},
          ${position.title || ""},
          ${position.src || ""},
          ${position.payouts[0]},
          ${position.payouts[1]}
        )
        ON CONFLICT (condition_id, proxy) DO NOTHING;
      `;
    } catch (error) {
      console.error(
        `Error inserting position: ${position.conditionId}, ${position.proxy}`,
        error
      );
    }
  }
}

export async function getPositionsByProxy(
  proxyAddresses: string[]
): Promise<Position[]> {
  proxyAddresses = proxyAddresses.map((a) => a.toLowerCase());
  const placeholders = proxyAddresses.map((_, i) => `$${i + 1}`).join(",");
  const query = `SELECT * FROM positions WHERE proxy IN (${placeholders})`;

  const { rows } = await sql.query(query, proxyAddresses);

  return rows.map((row: QueryResultRow) => ({
    proxy: row.proxy,
    conditionId: row.condition_id,
    payouts: [`${row.payout_numerator}/${row.payout_denominator}`],
    valueBought: parseInt(row.value_bought),
    profits: parseInt(row.profit),
    title: row.title,
    src: row.src,
  }));
}
