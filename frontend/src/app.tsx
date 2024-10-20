import React, { useEffect, useState } from 'react';
import InstrumentList from './components/instrument-list';
import Portfolio from './components/portfolio';
import TransactionHistory from './components/transaction-history';
import BuySellForm from './components/buy-sell-form';
import Chart from './components/chart';
import { fetchTransactions } from './api';
import { Transaction } from './types';
import PortfolioValueChart from './components/portfolio-value-chart';
import TransactionHoldingsList from './components/transaction-holdings-list';
import Balance from './components/balance';

const App: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>('AAPL');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchTransactionInfo = async () => {
    try {
      const response = await fetchTransactions();
      setTransactions(response);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTransactionInfo();
  }, []);

  const handleInstrumentSelect = (symbol: string) => {
    setSelectedInstrument(symbol);
  };

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Paper Trading Application</h1>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='md:col-span-1'>
          <InstrumentList
            selectedInstrument={selectedInstrument}
            onSelectInstrument={handleInstrumentSelect}
          />
          <Balance />
          <Portfolio />
        </div>
        <div className='md:col-span-2'>
          <Chart symbol={selectedInstrument} />
          <BuySellForm
            symbol={selectedInstrument}
            refetchTransactions={fetchTransactionInfo}
          />
          <PortfolioValueChart transactions={transactions} />
          <TransactionHoldingsList transactions={transactions} />
          <TransactionHistory transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

export default App;
