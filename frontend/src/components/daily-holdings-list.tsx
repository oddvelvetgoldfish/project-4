import React, { useState, useEffect } from 'react';

interface Transaction {
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  date: string; // ISO string
}

interface DailyHolding {
  date: Date;
  holdings: { [symbol: string]: number };
  portfolioValue: number;
}

const DailyHoldingsList: React.FC = () => {
  const [dailyHoldings, setDailyHoldings] = useState<DailyHolding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDailyHoldings = async () => {
      try {
        // Fetch transaction history
        const transactions: Transaction[] = await fetch(
          'http://localhost:5001/api/transactions'
        ).then((res) => res.json());

        if (!transactions.length) {
          setDailyHoldings([]);
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
        const latestDate = new Date(); // Use current date

        // Generate all dates between earliestDate and latestDate
        const dateArray: Date[] = [];
        let currentDate = new Date(earliestDate);
        currentDate.setHours(0, 0, 0, 0);
        latestDate.setHours(0, 0, 0, 0);
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

        // Initialize holdings
        const holdings: { [symbol: string]: number } = {};
        let transactionIndex = 0;
        const totalTransactions = transactions.length;
        const dailyHoldingsArray: DailyHolding[] = [];

        // Compute holdings and portfolio value for each date
        for (const date of dateArray) {
          const dateStr = date.toISOString().split('T')[0];

          // Process transactions up to current date
          while (
            transactionIndex < totalTransactions &&
            new Date(transactions[transactionIndex].date).setHours(
              0,
              0,
              0,
              0
            ) <= date.getTime()
          ) {
            const tx = transactions[transactionIndex];
            if (tx.type === 'buy') {
              holdings[tx.symbol] = (holdings[tx.symbol] || 0) + tx.quantity;
            } else if (tx.type === 'sell') {
              holdings[tx.symbol] = (holdings[tx.symbol] || 0) - tx.quantity;
            }
            transactionIndex++;
          }

          // Make a copy of current holdings
          const holdingsCopy = { ...holdings };

          // Remove symbols with zero quantity
          Object.keys(holdingsCopy).forEach((symbol) => {
            if (holdingsCopy[symbol] === 0) {
              delete holdingsCopy[symbol];
            }
          });

          // Calculate portfolio value
          let portfolioValue = 0;
          for (const symbol of Object.keys(holdingsCopy)) {
            const quantity = holdingsCopy[symbol];
            const price = historicalPrices[symbol][dateStr];
            if (price !== undefined) {
              portfolioValue += quantity * price;
            } else {
              // Handle missing price data (e.g., weekends)
              // Use last known price if available
              let lastKnownPrice = null;
              let backDate = new Date(date);
              while (lastKnownPrice === null) {
                backDate.setDate(backDate.getDate() - 1);
                const backDateStr = backDate.toISOString().split('T')[0];
                lastKnownPrice = historicalPrices[symbol][backDateStr];
                if (backDate < earliestDate) break; // No price data available
              }
              if (lastKnownPrice !== null) {
                portfolioValue += quantity * lastKnownPrice;
              }
            }
          }

          dailyHoldingsArray.push({
            date: new Date(date),
            holdings: holdingsCopy,
            portfolioValue,
          });
        }

        setDailyHoldings(dailyHoldingsArray);
        console.log('Daily holdings:', dailyHoldingsArray);
        setLoading(false);
      } catch (error) {
        console.error('Error calculating daily holdings:', error);
        setLoading(false);
      }
    };

    fetchDailyHoldings();
  }, []);

  return (
    <div className='mt-4'>
      <h2 className='text-xl font-semibold mb-2'>
        Daily Holdings and Portfolio Value
      </h2>
      {loading ? (
        <p>Loading daily holdings...</p>
      ) : (
        <ul className='space-y-2'>
          {dailyHoldings.map((item, index) => (
            <li key={index}>
              <strong>{item.date.toDateString()}</strong> - Portfolio Value: $
              {item.portfolioValue.toFixed(2)}
              {Object.keys(item.holdings).length > 0 ? (
                <ul className='ml-4'>
                  {Object.entries(item.holdings).map(([symbol, quantity]) => (
                    <li key={symbol}>
                      {symbol}: {quantity} shares
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No holdings.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DailyHoldingsList;
