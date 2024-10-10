import React from 'react';

const TransactionHistory: React.FC<{ transactions: any[] }> = ({
  transactions,
}) => {
  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>Transaction History</h2>
      <ul className='space-y-1'>
        {transactions.map((tx, index) => (
          <li key={index}>
            {new Date(tx.date).toLocaleString()}: {tx.type.toUpperCase()}{' '}
            {tx.quantity} shares of {tx.symbol} at ${tx.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionHistory;
