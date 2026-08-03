import * as SQLite from 'expo-sqlite';
import { Job, JobStep, RepairItem, PaymentDetails, JobStatus, Expense } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('workshop.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      bike_model TEXT NOT NULL,
      vehicle_number TEXT DEFAULT '',
      issue_description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'received',
      total_charges REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      delivered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS job_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      note TEXT DEFAULT '',
      timestamp TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      issue TEXT NOT NULL,
      parts_cost REAL NOT NULL DEFAULT 0,
      labour_cost REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL UNIQUE,
      mode TEXT NOT NULL,
      gpay_amount REAL NOT NULL DEFAULT 0,
      cash_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export async function createJob(data: {
  customer_name: string;
  customer_phone: string;
  bike_model: string;
  vehicle_number: string;
  issue_description: string;
}): Promise<Job> {
  const database = getDb();

  const issues = data.issue_description.replace(/\n/g, ', ');
  const result = await database.runAsync(
    `INSERT INTO jobs (customer_name, customer_phone, bike_model, vehicle_number, issue_description, status)
     VALUES (?, ?, ?, ?, ?, 'received')`,
    [data.customer_name, data.customer_phone, data.bike_model, data.vehicle_number, issues]
  );
  const jobId = result.lastInsertRowId;

  await database.runAsync(
    `INSERT INTO job_steps (job_id, label, note) VALUES (?, 'received', 'Job created and vehicle received.')`,
    [jobId]
  );

  return getJobById(Number(jobId)) as Promise<Job>;
}

export async function getAllJobs(): Promise<Job[]> {
  const database = getDb();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs ORDER BY created_at DESC`
  );

  const jobs: Job[] = [];
  for (const row of rows) {
    const job = await enrichJob(row);
    jobs.push(job);
  }
  return jobs;
}

export async function getJobById(id: number): Promise<Job | null> {
  const database = getDb();
  const row = await database.getFirstAsync<any>(
    `SELECT * FROM jobs WHERE id = ?`,
    [id]
  );
  if (!row) return null;
  return enrichJob(row);
}

async function enrichJob(row: any): Promise<Job> {
  const database = getDb();

  const steps = await database.getAllAsync<any>(
    `SELECT * FROM job_steps WHERE job_id = ? ORDER BY timestamp ASC`,
    [row.id]
  );

  const repairs = await database.getAllAsync<any>(
    `SELECT * FROM job_repairs WHERE job_id = ?`,
    [row.id]
  );

  const payment = await database.getFirstAsync<any>(
    `SELECT * FROM payments WHERE job_id = ?`,
    [row.id]
  );

  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    bike_model: row.bike_model,
    vehicle_number: row.vehicle_number || '',
    issue_description: row.issue_description,
    status: row.status as JobStatus,
    total_charges: row.total_charges,
    created_at: row.created_at,
    delivered_at: row.delivered_at,
    steps: steps.map((s: any) => ({
      id: s.id,
      job_id: s.job_id,
      label: s.label,
      note: s.note || '',
      timestamp: s.timestamp,
    })),
    repairs: repairs.map((r: any) => ({
      id: r.id,
      job_id: r.job_id,
      issue: r.issue,
      parts_cost: r.parts_cost,
      labour_cost: r.labour_cost,
    })),
    payment: payment ? {
      id: payment.id,
      job_id: payment.job_id,
      mode: payment.mode,
      gpay_amount: payment.gpay_amount,
      cash_amount: payment.cash_amount,
      total_amount: payment.total_amount,
    } : null,
  };
}

export async function updateJobStatus(
  id: number,
  data: {
    status?: JobStatus;
    note?: string;
    totalCharges?: number;
    repairs?: Array<{ issue: string; partsCost: number; labourCost: number }>;
    payment?: {
      mode: 'gpay' | 'cash' | 'split';
      gpayAmount: number;
      cashAmount: number;
      totalAmount: number;
    };
  }
): Promise<Job | null> {
  const database = getDb();
  const job = await getJobById(id);
  if (!job) return null;

  if (data.repairs && !data.payment) {
    const total = data.repairs.reduce(
      (acc, r) => acc + (Number(r.partsCost) || 0) + (Number(r.labourCost) || 0),
      0
    );

    await database.runAsync(
      `UPDATE jobs SET status = 'ready', total_charges = ? WHERE id = ?`,
      [total, id]
    );

    await database.runAsync(`DELETE FROM job_repairs WHERE job_id = ?`, [id]);
    for (const r of data.repairs) {
      await database.runAsync(
        `INSERT INTO job_repairs (job_id, issue, parts_cost, labour_cost) VALUES (?, ?, ?, ?)`,
        [id, r.issue, r.partsCost, r.labourCost]
      );
    }

    await database.runAsync(
      `INSERT INTO job_steps (job_id, label, note) VALUES (?, 'Repair Completed', 'Repair finished and costs updated.')`,
      [id]
    );
  } else if (data.payment) {
    await database.runAsync(
      `UPDATE jobs SET status = 'delivered', total_charges = ?, delivered_at = datetime('now','localtime') WHERE id = ?`,
      [data.payment.totalAmount, id]
    );

    await database.runAsync(`DELETE FROM payments WHERE job_id = ?`, [id]);
    await database.runAsync(
      `INSERT INTO payments (job_id, mode, gpay_amount, cash_amount, total_amount) VALUES (?, ?, ?, ?, ?)`,
      [id, data.payment.mode, data.payment.gpayAmount, data.payment.cashAmount, data.payment.totalAmount]
    );

    await database.runAsync(
      `INSERT INTO job_steps (job_id, label, note) VALUES (?, 'Delivered', 'Vehicle delivered and payment received.')`,
      [id]
    );
  } else {
    const newStatus = data.status || job.status;
    await database.runAsync(
      `UPDATE jobs SET status = ?, total_charges = COALESCE(?, total_charges) WHERE id = ?`,
      [newStatus, data.totalCharges || null, id]
    );

    if (data.status) {
      await database.runAsync(
        `INSERT INTO job_steps (job_id, label, note) VALUES (?, ?, ?)`,
        [id, data.status, data.note || '']
      );
    }
  }

  return getJobById(id);
}

export async function searchJobs(query: string): Promise<Job[]> {
  const database = getDb();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM jobs WHERE vehicle_number LIKE ? ORDER BY created_at DESC`,
    [`%${query}%`]
  );

  const jobs: Job[] = [];
  for (const row of rows) {
    const job = await enrichJob(row);
    jobs.push(job);
  }
  return jobs;
}

export async function deleteJobById(id: number): Promise<void> {
  const database = getDb();
  await database.runAsync(`DELETE FROM jobs WHERE id = ?`, [id]);
}

export async function deleteAllJobs(): Promise<void> {
  const database = getDb();
  await database.execAsync(`DELETE FROM jobs`);
}

export async function addExpense(description: string, amount: number): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO expenses (description, amount) VALUES (?, ?)`,
    [description, amount]
  );
}

export async function getAllExpenses(): Promise<Expense[]> {
  const database = getDb();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM expenses ORDER BY created_at DESC`
  );
  return rows.map(r => ({
    id: r.id,
    description: r.description,
    amount: r.amount,
    created_at: r.created_at,
  }));
}

export async function deleteExpenseById(id: number): Promise<void> {
  const database = getDb();
  await database.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
}

export async function getSetting(key: string): Promise<string | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{value: string}>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  );
  return row ? row.value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`,
    [key, value, value]
  );
}
