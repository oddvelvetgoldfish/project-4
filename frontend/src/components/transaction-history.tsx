import React, { useState, useEffect } from 'react';

const TransactionHistory: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          'http://localhost:5001/api/transactions'
        ).then((res) => res.json());
        setTransactions(response);
      } catch (error) {
        console.error(error);
      }
    };
    fetchTransactions();
  }, []);

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
