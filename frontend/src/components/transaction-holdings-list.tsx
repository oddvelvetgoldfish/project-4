import React, { useState, useEffect } from 'react';
import { HoldingsSnapshot, Transaction } from '../types';
import { buildHoldingsHistory } from '../utils';

const TransactionHoldingsList: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const [holdingsHistory, setHoldingsHistory] = useState<HoldingsSnapshot[]>(
    []
  );

  useEffect(() => {
    const history = buildHoldingsHistory(transactions);
    setHoldingsHistory(history);
  }, [transactions]);

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>
        Daily Holdings and Portfolio Value
      </h2>

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
    </div>
  );
};

export default TransactionHoldingsList;
