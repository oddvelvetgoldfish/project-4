import { Account, Transaction, YahooFinanceQuote } from './types';

export const fetchAccount = async () => {
  const response = await fetch('http://localhost:5001/api/account').then(
    (res) => res.json()
  );
  return response as Account;
};

export const fetchTransactions = async () => {
  const response = await fetch('http://localhost:5001/api/transactions').then(
    (res) => res.json()
  );
  return response as Transaction[];
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
    `http://localhost:5001/api/history/${symbol}?${startStr}${endStr}${intervalStr}`
  ).then((res) => res.json());
  return response.quotes as YahooFinanceQuote[];
};

export const fetchMultiSymbolHistoricalPrices = async (
  symbols: string[],
  startDate: Date,
  endDate: Date,
  interval = '1d'
) => {
  const period1 = startDate.toISOString().split('T')[0];
  const period2 = endDate.toISOString().split('T')[0];
  const intervalStr = `&interval=${interval}`;

  const historicalPrices: {
    [symbol: string]: { [dateStr: string]: number };
  } = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      const history = await fetch(
        `http://localhost:5001/api/history/${symbol}?period1=${period1}&period2=${period2}${intervalStr}`
      ).then((res) => res.json());

      const symbolPrices: { [dateStr: string]: number } = {};
      for (const quote of history.quotes) {
        const dateStr = new Date(quote.date).toISOString();
        symbolPrices[dateStr] = quote.close;
      }
      historicalPrices[symbol] = symbolPrices;
    })
  );

  return historicalPrices;
};
