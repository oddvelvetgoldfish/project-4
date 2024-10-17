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
import { HoldingsValueSnapshot, Transaction } from '../types';
import { buildPortfolioValueHistory } from '../utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend
);

const PortfolioValueChart: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const [portfolioValues, setPortfolioValues] = useState<
    HoldingsValueSnapshot[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPortfolioValues = async () => {
      try {
        // Fetch portfolio history
        const history = await buildPortfolioValueHistory(transactions);
        setPortfolioValues(history);

        if (!transactions.length) {
          setPortfolioValues([]);
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error calculating portfolio values:', error);
        setLoading(false);
      }
    };

    fetchPortfolioValues();
  }, [transactions]);

  // Prepare data for chart
  const chartData = {
    labels: portfolioValues.map((snapshot) => snapshot.date),
    datasets: [
      {
        label: 'Portfolio Value',
        data: portfolioValues.map((snapshot) => snapshot.totalValue),
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
          callback: function (tickValue: string | number) {
            if (typeof tickValue === 'number') {
              return '$' + tickValue.toFixed(2);
            }
            return tickValue;
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
