import React, { useState, useEffect } from 'react';

interface BuySellFormProps {
  symbol: string;
}

const BuySellForm: React.FC<BuySellFormProps> = ({ symbol }) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchCurrentPrice = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/price/${symbol}`
        ).then((res) => res.json());
        setPrice(response.price);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCurrentPrice();
  }, [symbol]);

  const handleBuy = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, quantity }),
      }).then((res) => res.json());
      alert(`Purchase successful at $${response.price}.`);
      setQuantity(0);
    } catch (error: any) {
      alert(error.response.error);
    }
  };

  const handleSell = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, quantity }),
      }).then((res) => res.json());
      alert(`Sale successful at $${response.price}.`);
      setQuantity(0);
    } catch (error: any) {
      alert(error.response.error);
    }
  };

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>Trade {symbol}</h2>
      <div className='space-y-2'>
        <div>
          <label className='block'>Current Price:</label>
          {price !== null ? (
            <p>${price.toFixed(2)}</p>
          ) : (
            <p>Loading price...</p>
          )}
        </div>
        <div>
          <label className='block'>Quantity:</label>
          <input
            type='number'
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className='border p-1 w-full'
          />
        </div>
        <div className='space-x-2'>
          <button
            onClick={handleBuy}
            className='bg-green-500 text-white px-4 py-2 rounded'
          >
            Buy
          </button>
          <button
            onClick={handleSell}
            className='bg-red-500 text-white px-4 py-2 rounded'
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuySellForm;
