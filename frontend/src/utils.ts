import { fetchMultiSymbolHistoricalPrices } from './api';
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

const getPriceAtDate = (
  historicalPrices: { [dateStr: string]: number },
  date: Date
) => {
  const closestDate = closestDateBeforeOrEqual(
    date,
    Object.keys(historicalPrices).map((dateStr) => new Date(dateStr))
  );
  if (!closestDate) {
    return undefined;
  }
  return historicalPrices[closestDate.toISOString()];
};
function closestDateBeforeOrEqual(
  targetDate: Date,
  rangeDates: Date[]
): Date | null {
  // Filter out dates that are greater than the target date
  const validDates = rangeDates.filter((date) => date <= targetDate);

  // If there are no valid dates, return null
  if (validDates.length === 0) {
    return null;
  }

  // Find the closest date by finding the maximum date in the valid dates
  return validDates.reduce((prev, curr) => (curr > prev ? curr : prev));
}

export const buildPortfolioChangeHistory = async (
  transactions: Transaction[]
) => {
  // build each holdings snapshot
  const holdingsHistory = buildHoldingsHistory(transactions);
  if (!holdingsHistory.length) {
    return [];
  }

  // get price history for each symbol
  const symbols = getUniqueSymbols(transactions);
  const startDate = new Date(holdingsHistory[0].date.getDate() - 1); // use first date but subtract a day
  const endDate = new Date(); // use current date
  const historicalPrices = await fetchMultiSymbolHistoricalPrices(
    symbols,
    startDate,
    endDate,
    '1d'
  );

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

export const buildPortfolioValueHistory = async (
  transactions: Transaction[]
) => {
  const holdingsHistory = buildHoldingsHistory(transactions);

  if (!holdingsHistory.length) {
    return [];
  }

  // ensure there is at least 1 snapshot for each day
  const startDate = holdingsHistory[0].date;
  const endDate = new Date();
  const dateRange = [];
  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    dateRange.push(new Date(date));
  }

  // if there is no snapshot for a day, fill it with the previous snapshot
  // & add it to the history
  const filledHistory = [...holdingsHistory];
  dateRange.forEach((date) => {
    const dateStr = date.toISOString();
    if (
      !filledHistory.find((snapshot) => snapshot.date.toISOString() === dateStr)
    ) {
      // find the snapshot with the closest date before the current date
      const closestDate = closestDateBeforeOrEqual(
        date,
        filledHistory.map((snapshot) => snapshot.date)
      );
      if (!closestDate) {
        console.error(`No previous snapshot found for ${dateStr}`);
        return;
      }
      const closestSnapshot = filledHistory.find(
        (snapshot) => snapshot.date.toISOString() === closestDate.toISOString()
      );
      if (!closestSnapshot) {
        console.error(`No previous snapshot found for ${dateStr}`);
        return;
      }
      filledHistory.push({
        date,
        holdings: closestSnapshot.holdings,
      });
    }
  });
  // sort filled history by date
  filledHistory.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // get price history for each symbol
  const symbols = getUniqueSymbols(transactions);
  const historicalPrices = await fetchMultiSymbolHistoricalPrices(
    symbols,
    new Date(startDate.getDate() - 7), // use first date but subtract a week to ensure we have prices
    endDate,
    '1d'
  );

  // start building portfolio history
  const portfolioHistory: HoldingsValueSnapshot[] = [];

  // build each portfolio snapshot
  filledHistory.forEach((snapshot) => {
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
