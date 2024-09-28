import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

// In-memory data store
const initialBalance = 100000; // Initial cash balance
let balance = initialBalance;
interface Portfolio {
  [symbol: string]: number;
}
let portfolio: Portfolio = {}; // { symbol: quantity }

interface Transaction {
  type: 'buy' | 'sell';
  symbol: string;
  price: number;
  quantity: number;
  date: Date;
}
let transactionHistory: Transaction[] = []; // Array of transactions

// Endpoint to reset account
app.post('/api/reset', (req, res) => {
  balance = initialBalance;
  portfolio = {};
  transactionHistory = [];
  res.json({ message: 'Account has been reset.' });
});

// Endpoint to get current balance and portfolio
app.get('/api/account', (req, res) => {
  res.json({ balance, portfolio });
});

// Endpoint to get transaction history
app.get('/api/transactions', (req, res) => {
  res.json(transactionHistory);
});

// Endpoint to buy shares
app.post('/api/buy', async (req, res) => {
  const { symbol, quantity } = req.body as {
    symbol: string;
    quantity: number;
  };

  try {
    const quote = await yahooFinance.quote(symbol);
    const price = quote.regularMarketPrice!;

    const cost = price * quantity;
    if (balance >= cost) {
      balance -= cost;
      portfolio[symbol] = (portfolio[symbol] || 0) + quantity;
      transactionHistory.push({
        type: 'buy',
        symbol,
        price,
        quantity,
        date: new Date(),
      });
      res.json({ message: 'Purchase successful.', price });
    } else {
      res.status(400).json({ error: 'Insufficient funds.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching price data.' });
  }
});

// Endpoint to sell shares
app.post('/api/sell', async (req, res) => {
  const { symbol, quantity } = req.body as {
    symbol: string;
    quantity: number;
  };

  try {
    const quote = await yahooFinance.quote(symbol);
    const price = quote.regularMarketPrice!;

    if (portfolio[symbol] && portfolio[symbol] >= quantity) {
      const proceeds = price * quantity;
      balance += proceeds;
      portfolio[symbol] -= quantity;
      if (portfolio[symbol] === 0) {
        delete portfolio[symbol];
      }
      transactionHistory.push({
        type: 'sell',
        symbol,
        price,
        quantity,
        date: new Date(),
      });
      res.json({ message: 'Sale successful.', price });
    } else {
      res.status(400).json({ error: 'Insufficient shares.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching price data.' });
  }
});

// Endpoint to get current price of an instrument
app.get('/api/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const quote = await yahooFinance.quote(symbol);
    res.json({ price: quote.regularMarketPrice });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching price data.' });
  }
});

// Endpoint to get historical data of an instrument
app.get('/api/history/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  const { period1, period2, interval } = req.query as {
    period1?: string;
    period2?: string;
    interval?: string;
  };

  const queryOptions = {
    period1: period1 || '2020-01-01',
    period2: period2 || new Date().toISOString().split('T')[0],
    interval: (interval || '1d') as '1d' | '1wk' | '1mo',
  };

  try {
    const history = await yahooFinance.historical(symbol, queryOptions);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching historical data.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
