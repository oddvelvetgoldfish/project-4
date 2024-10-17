import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';
import sqlite3 from 'sqlite3';
import { open, Database as SQLiteDatabase } from 'sqlite'; // Renamed Database to SQLiteDatabase
import path from 'path';

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

// Define interfaces for database rows
interface BalanceRow {
  amount: number;
}

interface PortfolioRow {
  symbol: string;
  quantity: number;
}

interface TransactionRow {
  type: 'buy' | 'sell';
  symbol: string;
  price: number;
  quantity: number;
  date: string; // Stored as ISO string
}

// Initialize and open the SQLite database
const initializeDB = async (): Promise<SQLiteDatabase> => {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database,
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS balance (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      amount REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      symbol TEXT PRIMARY KEY,
      quantity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK (type IN ('buy', 'sell')) NOT NULL,
      symbol TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL
    );
  `);

  // Initialize balance if not present
  const balance = await db.get<BalanceRow>(
    'SELECT * FROM balance WHERE id = 1'
  );
  if (!balance) {
    await db.run('INSERT INTO balance (id, amount) VALUES (1, ?)', 100000);
  }

  return db;
};

let db: SQLiteDatabase;

// Initialize the database and start the server
initializeDB()
  .then((database) => {
    db = database;
    app.listen(port, () => {
      console.log(`Backend server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize the database:', error);
    process.exit(1);
  });

// Endpoint to reset account
app.post('/api/reset', async (req, res) => {
  try {
    await db.run('BEGIN TRANSACTION');

    // Reset balance
    await db.run('UPDATE balance SET amount = ? WHERE id = 1', 100000);

    // Clear portfolio
    await db.run('DELETE FROM portfolio');

    // Clear transactions
    await db.run('DELETE FROM transactions');

    await db.run('COMMIT');

    res.json({ message: 'Account has been reset.' });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error resetting account:', error);
    res.status(500).json({ error: 'Failed to reset account.' });
  }
});

// Endpoint to get current balance and portfolio
app.get('/api/account', async (req, res) => {
  try {
    const balanceRow = await db.get<BalanceRow>(
      'SELECT amount FROM balance WHERE id = 1'
    );
    if (!balanceRow) {
      res.status(500).json({ error: 'Balance not found.' });
      return;
    }

    const portfolioRows = await db.all<PortfolioRow[]>(
      'SELECT symbol, quantity FROM portfolio'
    );

    const portfolio: { [symbol: string]: number } = {};
    portfolioRows.forEach((row) => {
      portfolio[row.symbol] = row.quantity;
    });

    const result = { balance: balanceRow.amount, portfolio };
    res.json(result);
  } catch (error) {
    console.error('Error fetching account data:', error);
    res.status(500).json({ error: 'Failed to fetch account data.' });
  }
});

// Endpoint to get transaction history
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await db.all<TransactionRow>(`
      SELECT type, symbol, price, quantity, date 
      FROM transactions 
      ORDER BY date DESC, id DESC
    `);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// Endpoint to buy shares
app.post('/api/buy', async (req, res) => {
  const { symbol, quantity } = req.body as {
    symbol: string;
    quantity: number;
  };

  if (!symbol || typeof symbol !== 'string') {
    res.status(400).json({ error: 'Invalid symbol.' });
    return;
  }

  if (!quantity || typeof quantity !== 'number' || quantity < 1) {
    res.status(400).json({ error: 'Invalid quantity.' });
    return;
  }

  try {
    const quote = await yahooFinance.quote(symbol);
    const price = quote.regularMarketPrice;

    if (price === undefined || price === null) {
      res.status(400).json({ error: 'Invalid price data.' });
      return;
    }

    const cost = price * quantity;

    await db.run('BEGIN TRANSACTION');

    // Get current balance
    const balanceRow = await db.get<BalanceRow>(
      'SELECT amount FROM balance WHERE id = 1'
    );
    if (!balanceRow) throw new Error('Balance not found.');

    if (balanceRow.amount < cost) {
      await db.run('ROLLBACK');
      res.status(400).json({ error: 'Insufficient funds.' });
      return;
    }

    // Update balance
    await db.run('UPDATE balance SET amount = amount - ? WHERE id = 1', cost);

    // Update portfolio
    const existing = await db.get<PortfolioRow>(
      'SELECT quantity FROM portfolio WHERE symbol = ?',
      symbol
    );
    if (existing) {
      await db.run(
        'UPDATE portfolio SET quantity = quantity + ? WHERE symbol = ?',
        quantity,
        symbol
      );
    } else {
      await db.run(
        'INSERT INTO portfolio (symbol, quantity) VALUES (?, ?)',
        symbol,
        quantity
      );
    }

    // Insert transaction
    await db.run(
      `
      INSERT INTO transactions (type, symbol, price, quantity, date)
      VALUES (?, ?, ?, ?, ?)
    `,
      'buy',
      symbol,
      price,
      quantity,
      new Date().toISOString()
    );

    await db.run('COMMIT');

    res.json({ message: 'Purchase successful.', price });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error buying shares:', error);
    res.status(500).json({ error: 'Failed to complete purchase.' });
  }
});

// Endpoint to sell shares
app.post('/api/sell', async (req, res) => {
  const { symbol, quantity } = req.body as {
    symbol: string;
    quantity: number;
  };

  if (!symbol || typeof symbol !== 'string') {
    res.status(400).json({ error: 'Invalid symbol.' });
    return;
  }

  if (!quantity || typeof quantity !== 'number' || quantity < 1) {
    res.status(400).json({ error: 'Invalid quantity.' });
    return;
  }

  try {
    const quote = await yahooFinance.quote(symbol);
    const price = quote.regularMarketPrice;

    if (price === undefined || price === null) {
      res.status(400).json({ error: 'Invalid price data.' });
      return;
    }

    await db.run('BEGIN TRANSACTION');

    // Check portfolio
    const portfolioRow = await db.get<PortfolioRow>(
      'SELECT quantity FROM portfolio WHERE symbol = ?',
      symbol
    );

    if (!portfolioRow || portfolioRow.quantity < quantity) {
      await db.run('ROLLBACK');
      res.status(400).json({ error: 'Insufficient shares.' });
      return;
    }

    const proceeds = price * quantity;

    // Update balance
    await db.run(
      'UPDATE balance SET amount = amount + ? WHERE id = 1',
      proceeds
    );

    // Update portfolio
    if (portfolioRow.quantity === quantity) {
      await db.run('DELETE FROM portfolio WHERE symbol = ?', symbol);
    } else {
      await db.run(
        'UPDATE portfolio SET quantity = quantity - ? WHERE symbol = ?',
        quantity,
        symbol
      );
    }

    // Insert transaction
    await db.run(
      `
      INSERT INTO transactions (type, symbol, price, quantity, date)
      VALUES (?, ?, ?, ?, ?)
    `,
      'sell',
      symbol,
      price,
      quantity,
      new Date().toISOString()
    );

    await db.run('COMMIT');

    res.json({ message: 'Sale successful.', price });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error selling shares:', error);
    res.status(500).json({ error: 'Failed to complete sale.' });
  }
});

// Endpoint to get current price of an instrument
app.get('/api/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  try {
    const quote = await yahooFinance.quote(symbol);
    const price = quote.regularMarketPrice;
    if (price === undefined || price === null) {
      res.status(400).json({ error: 'Invalid price data.' });
      return;
    }
    res.json({ price });
  } catch (error) {
    console.error('Error fetching price data:', error);
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
    interval: (interval || '1d') as
      | '1m'
      | '2m'
      | '5m'
      | '15m'
      | '30m'
      | '60m'
      | '90m'
      | '1h'
      | '1d'
      | '5d'
      | '1wk'
      | '1mo'
      | '3mo',
  };

  try {
    const history = await yahooFinance.chart(symbol, queryOptions);
    res.json(history);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Error fetching historical data.' });
  }
});
