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
  Close: number;
  Date: string; // ISO string
  Dividends: number;
  High: number;
  Low: number;
  Open: number;
  'Stock Splits': number;
  Volume: number;
}
