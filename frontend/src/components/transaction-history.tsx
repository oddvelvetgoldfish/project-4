import React from 'react';
import { Transaction } from '../types';

const TransactionHistory: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>Transaction History</h2>
      <ul className='space-y-1 flex flex-col-reverse'>
        {transactions.map((tx, index) => (
          <li key={index}>
            {new Date(tx.date).toLocaleString()}: {tx.type.toUpperCase()}{' '}
            {tx.quantity} shares of {tx.symbol} at ${tx.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionHistory;
