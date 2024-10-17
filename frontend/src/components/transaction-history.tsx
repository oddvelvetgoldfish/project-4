import React from 'react';
import TransactionHoldingsList from './transaction-holdings-list';
import PortfolioValueChart from './portfolio-value-chart';

const TransactionHistory: React.FC<{ transactions: any[] }> = ({
  transactions,
}) => {
  return (
    <div className='mt-4'>
      <PortfolioValueChart transactions={transactions} />
      <h2 className='text-xl font-semibold mb-2'>Transaction History</h2>
      <TransactionHoldingsList transactions={transactions} />
      <ul className='space-y-1 flex flex-col-reverse'>
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
