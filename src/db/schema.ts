export const schema = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  isDefault INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount REAL NOT NULL,
  categoryId TEXT NOT NULL,
  note TEXT,
  paymentMode TEXT,
  createdAt TEXT NOT NULL,
  txnDate TEXT NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(txnDate);
CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(categoryId);
`;
