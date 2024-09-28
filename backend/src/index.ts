import express from 'express';
import cors from 'cors';

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
app.post('/api/buy', (req, res) => {
  const { symbol, price, quantity } = req.body as {
    symbol: string;
    price: number;
    quantity: number;
  };
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
    res.json({ message: 'Purchase successful.' });
  } else {
    res.status(400).json({ error: 'Insufficient funds.' });
  }
});

// Endpoint to sell shares
app.post('/api/sell', (req, res) => {
  const { symbol, price, quantity } = req.body as {
    symbol: string;
    price: number;
    quantity: number;
  };
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
    res.json({ message: 'Sale successful.' });
  } else {
    res.status(400).json({ error: 'Insufficient shares.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
