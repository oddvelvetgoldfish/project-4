import React, { useState, useEffect } from 'react';
import { fetchAccount, fetchMultipleSymbolPrices } from '../api';

const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<{ [key: string]: number }>({});
  const [currentPrices, setCurrentPrices] = useState<{ [key: string]: number }>(
    {}
  );

  const fetchAccountData = async () => {
    try {
      const account = await fetchAccount();
      setPortfolio(account.portfolio);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCurrentPrices = async () => {
    try {
      const prices = await fetchMultipleSymbolPrices(Object.keys(portfolio));
      setCurrentPrices(prices);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  useEffect(() => {
    fetchCurrentPrices();
  }, [portfolio]);

  // Update when transactions happen
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAccountData();
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>Portfolio</h2>
      <p className='font-medium mb-1'>
        Total Value: $
        {Object.entries(portfolio)
          .reduce(
            (total, [symbol, quantity]) =>
              total + (currentPrices[symbol] || 0) * quantity,
            0
          )
          .toFixed(2)}
      </p>
      <ul className='space-y-1'>
        {Object.entries(portfolio).map(([symbol, quantity]) => (
          <li key={symbol}>
            {symbol}: {quantity} shares @ ${currentPrices[symbol]?.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Portfolio;
