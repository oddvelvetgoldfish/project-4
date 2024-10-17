import { HoldingsSnapshot, Transaction, YahooFinanceQuote } from './types';

export const buildHoldingsHistory = (transactions: Transaction[]) => {
  // build holdings history
  const holdings: { [symbol: string]: number } = {};
  const history: HoldingsSnapshot[] = [];
  // ensure transactions are non-destructively sorted by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // iterate through transactions to build holdings history
  sortedTransactions.forEach((tx) => {
    if (tx.type === 'buy') {
      if (holdings[tx.symbol]) {
        holdings[tx.symbol] += tx.quantity;
      } else {
        holdings[tx.symbol] = tx.quantity;
      }
    } else if (tx.type === 'sell') {
      holdings[tx.symbol] -= tx.quantity;
      if (holdings[tx.symbol] === 0) {
        delete holdings[tx.symbol];
      }
    }

    // create a new snapshot of holdings for each transaction
    history.push({
      date: new Date(tx.date),
      holdings: { ...holdings },
    });
  });

  return history;
};

export const getUniqueSymbols = (transactions: Transaction[]) => {
  const symbols = new Set<string>();
  transactions.forEach((tx) => symbols.add(tx.symbol));
  return Array.from(symbols);
};

export const getMultiSymbolHistoricalPrices = async (
  symbols: string[],
  start: string,
  end?: string
) => {
  const startStr = `period1=${start}`;
  const endStr = end ? `&period2=${end}` : '';
  const intervalStr = '&interval=1d';
  const symbolStr = symbols.map((symbol) => `symbol=${symbol}`).join('&');
  const response = await fetch(
    `http://localhost:5001/api/history?${symbolStr}&${startStr}${endStr}${intervalStr}`
  );

  const history = await response.json();
  console.log(history);
  return history as { [symbol: string]: YahooFinanceQuote[] };
};
