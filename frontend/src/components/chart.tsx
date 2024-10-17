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
import { getSymbolHistoricalPrices } from '../utils';

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
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const prices = await getSymbolHistoricalPrices(symbol, '2020-01-01');

        setChartData({
          labels: prices.map((quote) => new Date(quote.date)),
          datasets: [
            {
              label: 'Close Price',
              data: prices.map((quote) => quote.close),
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
