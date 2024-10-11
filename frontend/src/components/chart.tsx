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
        const response = await fetch(
          `http://localhost:5001/api/history/${symbol}?period1=2020-01-01&interval=1d`
        ).then((res) => res.json());
        const prices = response.quotes; // Array of price data

        setChartData({
          labels: prices.map((item: any) => new Date(item.date)),
          datasets: [
            {
              label: 'Close Price',
              data: prices.map((item: any) => item.close),
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
