import React, { useState, useEffect } from 'react';
import { HoldingsValueSnapshot, Transaction } from '../types';
import { buildPortfolioChangeHistory } from '../utils';

const TransactionHoldingsList: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const [holdingsHistory, setHoldingsHistory] = useState<
    HoldingsValueSnapshot[]
  >([]);

  useEffect(() => {
    buildPortfolioChangeHistory(transactions).then((res) => {
      setHoldingsHistory(res);
    });
  }, [transactions]);

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>
        Portfolio Changes Over Time
      </h2>
      <ul className='space-y-2'>
        {holdingsHistory.map((holdings, index) => (
          <li key={index}>
            <strong>{holdings.date.toLocaleString()}</strong> - $
            {holdings.totalValue.toFixed(2)}
            {Object.keys(holdings.holdings).length > 0 ? (
              <ul className='ml-4'>
                {Object.entries(holdings.holdings).map(
                  ([symbol, { quantity, price }]) => (
                    <li key={symbol}>
                      {symbol}: {quantity} shares at ${price.toFixed(2)}
                    </li>
                  )
                )}
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
