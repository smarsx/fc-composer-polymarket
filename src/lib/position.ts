import { POLYMARKET_SUBGRAPH_URL } from "./constants";

export interface Position {
  proxy: string;
  conditionId: string;
  payouts: string[];
  valueBought: number;
  profits: number;
  title?: string;
  src?: string;
  pct?: string;
}

export type PositionsResult = Position[] | null;

interface GraphQLResponse {
  data?: {
    accounts?: Array<{
      marketProfits: Array<{
        profit: string;
        condition: {
          id: string;
          payouts: string[];
        };
      }>;
      marketPositions: Array<{
        valueBought: string;
        market: {
          condition: {
            id: string;
          };
        };
      }>;
    }>;
  };
}

export async function getPositions(proxy: string): Promise<PositionsResult> {
  const query = `
    query GetMarketPositions($proxy: String!) {
      accounts(where: { id: $proxy }) {
        marketProfits {
          profit
          condition {
            id
            payouts
          }
        }
        marketPositions {
          valueBought
          market {
            condition {
              id
            }
          }
        }
      }
    }
  `;
  const variables = { proxy: proxy.toLowerCase() };

  try {
    const response = await fetch(POLYMARKET_SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      // throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GraphQLResponse = await response.json();

    if (data.data?.accounts && data.data.accounts.length > 0) {
      const account = data.data.accounts[0];
      const positionsMap = new Map<string, Position>();

      // Process marketProfits
      account.marketProfits.forEach((profit) => {
        positionsMap.set(profit.condition.id, {
          proxy: proxy.toLowerCase(),
          conditionId: profit.condition.id,
          payouts: profit.condition.payouts,
          profits: parseFloat(profit.profit),
          valueBought: 0, // Will be updated if there's a matching marketPosition
        });
      });

      // Process marketPositions
      account.marketPositions.forEach((position) => {
        const conditionId = position.market.condition.id;
        if (positionsMap.has(conditionId)) {
          const existingPosition = positionsMap.get(conditionId)!;
          existingPosition.valueBought = parseFloat(position.valueBought);
          existingPosition.pct = (
            (existingPosition.profits / existingPosition.valueBought) *
            100
          ).toFixed(2);
        } else {
          positionsMap.set(conditionId, {
            proxy: proxy.toLowerCase(),
            conditionId,
            payouts: [], // Will be empty if there's no matching marketProfit
            profits: 0, // Will be 0 if there's no matching marketProfit
            valueBought: parseFloat(position.valueBought),
          });
        }
      });

      return Array.from(positionsMap.values());
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching market positions:", error);
    throw error;
  }
}
