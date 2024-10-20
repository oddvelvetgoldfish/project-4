import React, { useState, useEffect } from 'react';
import { fetchAccount } from '../api';

const Balance: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);

  const fetchAccountData = async () => {
    try {
      const account = await fetchAccount();
      setBalance(account.balance);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  // Update when transactions happen
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAccountData();
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>Balance</h2>
      <p className='font-medium mb-1'>Cash: ${balance.toFixed(2)}</p>
    </div>
  );
};

export default Balance;
