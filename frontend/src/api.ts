import { Account, Transaction, YahooFinanceQuote } from './types';

// Get the API base URL from environment variables, default to empty string
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const fetchAccount = async () => {
  const response = await fetch(`${API_BASE_URL}/api/account`).then((res) =>
    res.json()
  );
  return response as Account;
};

export const fetchTransactions = async () => {
  const response = await fetch(`${API_BASE_URL}/api/transactions`).then((res) =>
    res.json()
  );
  return response as Transaction[];
};

export const fetchCurrentSymbolPrice = async (symbol: string) => {
  const response = await fetch(`${API_BASE_URL}/api/price/${symbol}`).then(
    (res) => res.json()
  );
  if (!response.price) throw new Error('Price not found');
  return response.price as number;
};

export const fetchMultipleSymbolPrices = async (symbols: string[]) => {
  // Fetch in parallel
  const prices = await Promise.all(
    symbols.map((symbol) => fetchCurrentSymbolPrice(symbol))
  );
  return Object.fromEntries(symbols.map((symbol, i) => [symbol, prices[i]]));
};

export const fetchSymbolHistoricalPrices = async (
  symbol: string,
  start: string,
  end?: string
) => {
  const startStr = `period1=${start}`;
  const endStr = end ? `&period2=${end}` : '';
  const intervalStr = '&interval=1d';
  const response = await fetch(
    `${API_BASE_URL}/api/history/${symbol}?${startStr}${endStr}${intervalStr}`
  ).then((res) => res.json());
  return response as YahooFinanceQuote[];
};

export const fetchMultiSymbolHistoricalPrices = async (
  symbols: string[],
  startDate: Date,
  endDate: Date,
  interval = '1d'
) => {
  const period1 = new Date(startDate.getDate() - 1).toISOString().split('T')[0];
  const period2 = endDate.toISOString().split('T')[0];
  const intervalStr = `&interval=${interval}`;

  const historicalPrices: {
    [symbol: string]: { [dateStr: string]: number };
  } = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      const history = (await fetch(
        `${API_BASE_URL}/api/history/${symbol}?period1=${period1}&period2=${period2}${intervalStr}`
      ).then((res) => res.json())) as YahooFinanceQuote[];

      const symbolPrices: { [dateStr: string]: number } = {};
      for (const quote of history) {
        const dateStr = new Date(quote.Date).toISOString();
        symbolPrices[dateStr] = quote.Close;
      }
      historicalPrices[symbol] = symbolPrices;
    })
  );

  return historicalPrices;
};

export const resetAccount = async () => {
  const response = await fetch(`${API_BASE_URL}/api/reset`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to reset account');
  }
  return response.json();
};

export const buyStock = async (symbol: string, quantity: number) => {
  const response = await fetch(`${API_BASE_URL}/api/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbol, quantity }),
  }).then((res) => res.json());
  if (response.error) {
    throw new Error(response.error);
  }
  return response;
};

export const sellStock = async (symbol: string, quantity: number) => {
  const response = await fetch(`${API_BASE_URL}/api/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbol, quantity }),
  }).then((res) => res.json());
  if (response.error) {
    throw new Error(response.error);
  }
  return response;
};
