export interface Transaction {
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  date: string; // ISO string
}

export interface HoldingsSnapshot {
  date: Date;
  holdings: { [symbol: string]: number };
}

export interface HoldingValue {
  quantity: number;
  price: number;
}

export interface HoldingsValueSnapshot {
  date: Date;
  holdings: { [symbol: string]: HoldingValue };
  totalValue: number;
}

// backend api types
export interface Account {
  balance: number;
  portfolio: {
    [symbol: string]: number;
  };
}
export interface YahooFinanceQuote {
  date: string; // ISO string
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  adjclose?: number;
}
