export interface Transaction {
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  date: string; // ISO string
}
