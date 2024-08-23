export interface Condition {
  id: string;
  payouts: string[];
  title?: string;
}

export interface MarketProfit {
  scaledProfit: string;
  condition: Condition;
}

export interface Account {
  proxy: string;
  marketProfits: MarketProfit[];
}

export interface QueryResponse {
  accounts: Account[];
}

export interface GraphQLResponse {
  data: QueryResponse;
}

export type MarketPositionsResult = Account | null;
