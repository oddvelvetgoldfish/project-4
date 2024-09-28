import React, { useState, useEffect } from 'react';

const Portfolio: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<{ [key: string]: number }>({});

  const fetchAccount = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/account').then(
        (res) => res.json()
      );
      setBalance(response.balance);
      setPortfolio(response.portfolio);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  // Update when transactions happen
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAccount();
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>Portfolio</h2>
      <p>Balance: ${balance.toFixed(2)}</p>
      <ul className='space-y-1'>
        {Object.entries(portfolio).map(([symbol, quantity]) => (
          <li key={symbol}>
            {symbol}: {quantity} shares
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Portfolio;
