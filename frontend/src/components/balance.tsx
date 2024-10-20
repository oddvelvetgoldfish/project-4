import React, { useState, useEffect } from 'react';
import { fetchAccount } from '../api';
import { Transaction } from '../types';

const Balance: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
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
  }, [transactions]);

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>Balance</h2>
      <p className='font-medium mb-1'>Cash: ${balance.toFixed(2)}</p>
    </div>
  );
};

export default Balance;
