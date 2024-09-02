import { POLYMARKET_SUBGRAPH_URL } from "./constants";

export interface Position {
  proxy: string;
  conditionId: string;
  valueBought: number;
  profits: number;
  title?: string;
  src?: string;
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
    }

    const data: GraphQLResponse = await response.json();

    if (data.data?.accounts && data.data.accounts.length > 0) {
      const account = data.data.accounts[0];
      const positionsMap = new Map<string, Position>();

      account.marketProfits.forEach((profit) => {
        positionsMap.set(profit.condition.id, {
          proxy: proxy.toLowerCase(),
          conditionId: profit.condition.id,
          profits: parseFloat(profit.profit),
          valueBought: 0,
        });
      });

      account.marketPositions.forEach((position) => {
        const conditionId = position.market.condition.id;
        if (positionsMap.has(conditionId)) {
          const existingPosition = positionsMap.get(conditionId)!;
          existingPosition.valueBought = parseFloat(position.valueBought);
        } else {
          positionsMap.set(conditionId, {
            proxy: proxy.toLowerCase(),
            conditionId,
            profits: 0,
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
