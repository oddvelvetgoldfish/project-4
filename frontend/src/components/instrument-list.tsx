import React from 'react';

interface InstrumentListProps {
  selectedInstrument: string;
  onSelectInstrument: (symbol: string) => void;
}

const instruments = ['AAPL', 'GOOGL', 'MSFT', 'BTC-USD'];

const InstrumentList: React.FC<InstrumentListProps> = ({
  selectedInstrument,
  onSelectInstrument,
}) => {
  return (
    <div>
      <h2 className='text-xl font-semibold mb-2'>Instruments</h2>
      <ul className='space-y-1'>
        {instruments.map((symbol) => (
          <li key={symbol}>
            <button
              className={`text-blue-500 hover:underline ${
                selectedInstrument === symbol ? 'font-semibold' : ''
              }`}
              onClick={() => onSelectInstrument(symbol)}
            >
              {symbol}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InstrumentList;
