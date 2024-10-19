import React, { useEffect, useState } from 'react';
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
import { fetchSymbolHistoricalPrices } from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend
);

interface ChartProps {
  symbol: string;
}

const Chart: React.FC<ChartProps> = ({ symbol }) => {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const prices = await fetchSymbolHistoricalPrices(symbol, '2020-01-01');
        if (!prices) return;

        setChartData({
          labels: prices.map((quote) => new Date(quote.Date)),
          datasets: [
            {
              label: 'Close Price',
              data: prices.map((quote) => quote.Close),
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchPriceData();
  }, [symbol]);

  const options = {
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'month' as const,
        },
      },
    },
  };

  return (
    <div>
      <h2 className='text-xl font-semibold mb-2'>Price Chart for {symbol}</h2>
      {chartData ? (
        <Line data={chartData} options={options} />
      ) : (
        <p>Loading chart data...</p>
      )}
    </div>
  );
};

export default Chart;
