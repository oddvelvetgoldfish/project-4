import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';

interface HoldingsSnapshot {
  date: Date;
  holdings: { [symbol: string]: number };
}

const TransactionHoldingsList: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [holdingsHistory, setHoldingsHistory] = useState<HoldingsSnapshot[]>(
    []
  );

  useEffect(() => {
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

    setLoading(false);
    setHoldingsHistory(history);
  }, [transactions]);

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>
        Daily Holdings and Portfolio Value
      </h2>
      {loading ? (
        <p>Loading daily holdings...</p>
      ) : (
        <ul className='space-y-2'>
          {holdingsHistory.map((item, index) => (
            <li key={index}>
              <strong>{item.date.toLocaleString()}</strong>
              {Object.keys(item.holdings).length > 0 ? (
                <ul className='ml-4'>
                  {Object.entries(item.holdings).map(([symbol, quantity]) => (
                    <li key={symbol}>
                      {symbol}: {quantity} shares
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No holdings.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHoldingsList;
