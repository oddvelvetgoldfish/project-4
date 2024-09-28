import React, { useState } from 'react';
import InstrumentList from './components/instrument-list';
import Portfolio from './components/portfolio';
import TransactionHistory from './components/transaction-history';
import BuySellForm from './components/buy-sell-form';
import Chart from './components/chart';

const App: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>('AAPL');

  const handleInstrumentSelect = (symbol: string) => {
    setSelectedInstrument(symbol);
  };

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Paper Trading Application</h1>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='md:col-span-1'>
          <InstrumentList onSelectInstrument={handleInstrumentSelect} />
          <Portfolio />
        </div>
        <div className='md:col-span-2'>
          <Chart symbol={selectedInstrument} />
          <BuySellForm symbol={selectedInstrument} />
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
};

export default App;