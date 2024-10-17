import { Account, YahooFinanceQuote } from './types';

export const fetchAccount = async () => {
  const response = await fetch('http://localhost:5001/api/account').then(
    (res) => res.json()
  );
  return response as Account;
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
