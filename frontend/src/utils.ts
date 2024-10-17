import {
  HoldingsSnapshot,
  HoldingsValueSnapshot,
  HoldingValue,
  Transaction,
} from './types';

export const buildHoldingsHistory = (transactions: Transaction[]) => {
  // build holdings history
  const holdings: { [symbol: string]: number } = {};
  const history: HoldingsSnapshot[] = [];
  // ensure transactions are non-destructively sorted by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // iterate through transactions to build holdings history
  sortedTransactions.forEach((tx) => {
    if (tx.type === 'buy') {
      if (holdings[tx.symbol]) {
        holdings[tx.symbol] += tx.quantity;
      } else {
        holdings[tx.symbol] = tx.quantity;
      }
    } else if (tx.type === 'sell') {
      holdings[tx.symbol] -= tx.quantity;
      if (holdings[tx.symbol] === 0) {
        delete holdings[tx.symbol];
      }
    }

    // create a new snapshot of holdings for each transaction
    history.push({
      date: new Date(tx.date),
      holdings: { ...holdings },
    });
  });

  return history;
};

export const getUniqueSymbols = (transactions: Transaction[]) => {
  const symbols = new Set<string>();
  transactions.forEach((tx) => symbols.add(tx.symbol));
  return Array.from(symbols);
};

export const getMultiSymbolHistoricalPrices = async (
  symbols: string[],
  startDate: Date,
  endDate: Date
) => {
  const period1 = startDate.toISOString().split('T')[0];
  const period2 = endDate.toISOString().split('T')[0];

  const historicalPrices: {
    [symbol: string]: { [dateStr: string]: number };
  } = {};

  await Promise.all(
    symbols.map(async (symbol) => {
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

  return historicalPrices;
};

const getPriceAtDate = (
  historicalPrices: { [dateStr: string]: number },
  date: Date
) => {
  const dateStr = date.toISOString().split('T')[0];
  // find the most recent price on or before the given date
  let price = historicalPrices[dateStr];
  while (!price && dateStr !== '1970-01-01') {
    date.setDate(date.getDate() - 1);
    price = historicalPrices[date.toISOString().split('T')[0]];
  }
  return price;
};

export const buildPortfolioHistory = async (transactions: Transaction[]) => {
  // build each holdings snapshot
  const holdingsHistory = buildHoldingsHistory(transactions);
  if (!holdingsHistory.length) {
    return [];
  }

  // get price history for each symbol
  const symbols = getUniqueSymbols(transactions);
  const startDate = holdingsHistory[0].date;
  const endDate = new Date(); // use current date
  const historicalPrices = await getMultiSymbolHistoricalPrices(
    symbols,
    startDate,
    endDate
  );
  console.log(historicalPrices);

  // start building portfolio history
  const portfolioHistory: HoldingsValueSnapshot[] = [];

  // build each portfolio snapshot
  holdingsHistory.forEach((snapshot) => {
    const portfolioSnapshot = {
      date: snapshot.date,
      holdings: <{ [symbol: string]: HoldingValue }>{},
      totalValue: 0,
    };

    Object.keys(snapshot.holdings).forEach((symbol) => {
      const dateStr = snapshot.date.toISOString();
      if (historicalPrices[symbol]) {
        const price = getPriceAtDate(historicalPrices[symbol], snapshot.date);
        if (price !== undefined) {
          portfolioSnapshot.holdings[symbol] = {
            quantity: snapshot.holdings[symbol],
            price,
          };
        } else {
          console.error(`No price found for ${symbol} on ${dateStr}`);
        }
      }
    });

    // calculate total portfolio value
    portfolioSnapshot.totalValue = Object.values(
      portfolioSnapshot.holdings
    ).reduce((total, { quantity, price }) => total + quantity * price, 0);

    portfolioHistory.push(portfolioSnapshot);
  });

  return portfolioHistory;
};
