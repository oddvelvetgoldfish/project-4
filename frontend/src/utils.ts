import { HoldingsSnapshot, Transaction } from './types';

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
