import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Transaction } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend
);

const PortfolioValueChart: React.FC = () => {
  const [portfolioValues, setPortfolioValues] = useState<
    { date: Date; value: number }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPortfolioValues = async () => {
      try {
        // Fetch transaction history
        const transactions: Transaction[] = await fetch(
          'http://localhost:5001/api/transactions'
        ).then((res) => res.json());

        if (!transactions.length) {
          setPortfolioValues([]);
          setLoading(false);
          return;
        }

        // Extract unique symbols
        const symbols = Array.from(
          new Set(transactions.map((tx) => tx.symbol))
        );

        // Sort transactions by date
        transactions.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Determine date range based on transactions
        const earliestDate = new Date(transactions[0].date);
        const latestDate = new Date(); // Use current date and time

        // Generate all dates between earliestDate and latestDate
        const dateArray: Date[] = [];
        let currentDate = new Date(earliestDate);
        while (currentDate <= latestDate) {
          dateArray.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Fetch historical prices for each symbol over the date range
        const historicalPrices: {
          [symbol: string]: { [dateStr: string]: number };
        } = {};

        await Promise.all(
          symbols.map(async (symbol) => {
            const period1 = earliestDate.toISOString().split('T')[0];
            const period2 = latestDate.toISOString().split('T')[0];

            const history = await fetch(
              `http://localhost:5001/api/history/${symbol}?period1=${period1}&period2=${period2}&interval=1d`
            ).then((res) => res.json());

            const symbolPrices: { [dateStr: string]: number } = {};
            for (const quote of history.quotes) {
              const dateStr = new Date(quote.date).toISOString().split('T')[0];
              symbolPrices[dateStr] = quote.close;
            }
            historicalPrices[symbol] = symbolPrices;
          })
        );

        // Initialize holdings and portfolio values
        const holdings: { [symbol: string]: number } = {};
        let transactionIndex = 0;
        const totalTransactions = transactions.length;
        const portfolioValuesArray: { date: Date; value: number }[] = [];

        // Initialize last known prices
        const lastKnownPrices: { [symbol: string]: number } = {};

        // Compute holdings and portfolio value for each date
        for (const date of dateArray) {
          const dateStr = date.toISOString().split('T')[0];

          // Process transactions up to current date
          while (
            transactionIndex < totalTransactions &&
            new Date(transactions[transactionIndex].date).getTime() <=
              date.getTime()
          ) {
            const tx = transactions[transactionIndex];
            if (tx.type === 'buy') {
              holdings[tx.symbol] = (holdings[tx.symbol] || 0) + tx.quantity;
            } else if (tx.type === 'sell') {
              holdings[tx.symbol] = (holdings[tx.symbol] || 0) - tx.quantity;
            }
            transactionIndex++;
          }

          // Update last known prices
          for (const symbol of symbols) {
            const price = historicalPrices[symbol][dateStr];
            if (price !== undefined) {
              lastKnownPrices[symbol] = price;
            }
          }

          // Compute total value
          let totalValue = 0;
          for (const symbol of symbols) {
            const quantity = holdings[symbol] || 0;
            const price = lastKnownPrices[symbol];
            if (price !== undefined) {
              totalValue += quantity * price;
            }
          }

          portfolioValuesArray.push({
            date: new Date(date),
            value: totalValue,
          });
        }

        // Fetch current prices and compute current portfolio value
        const currentHoldingsSymbols = Object.keys(holdings).filter(
          (symbol) => holdings[symbol] !== 0
        );

        const currentPrices: { [symbol: string]: number } = {};

        await Promise.all(
          currentHoldingsSymbols.map(async (symbol) => {
            const data = await fetch(
              `http://localhost:5001/api/price/${symbol}`
            ).then((res) => res.json());
            currentPrices[symbol] = data.price;
          })
        );

        let currentTotalValue = 0;
        for (const symbol of currentHoldingsSymbols) {
          const quantity = holdings[symbol] || 0;
          const price = currentPrices[symbol];
          if (price !== undefined) {
            currentTotalValue += quantity * price;
          }
        }

        // Add current portfolio value as the last data point
        portfolioValuesArray.push({
          date: latestDate,
          value: currentTotalValue,
        });

        setPortfolioValues(portfolioValuesArray);
        console.log('Portfolio values:', portfolioValuesArray);
        setLoading(false);
      } catch (error) {
        console.error('Error calculating portfolio values:', error);
        setLoading(false);
      }
    };

    fetchPortfolioValues();
  }, []);

  // Prepare data for chart
  const chartData = {
    labels: portfolioValues.map((item) => item.date),
    datasets: [
      {
        label: 'Portfolio Value',
        data: portfolioValues.map((item) => item.value),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
        },
      },
      y: {
        ticks: {
          callback: function (value: number) {
            return '$' + value.toFixed(2);
          },
        },
      },
    },
  };

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>Portfolio Value Over Time</h2>
      {loading ? (
        <p>Loading portfolio value chart...</p>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default PortfolioValueChart;
