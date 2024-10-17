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
