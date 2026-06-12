/**
 * Seed Script — Personal Finance V1
 * Run: npx ts-node src/seed.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import initSqlJs from 'sql.js';

const DB_PATH = path.resolve('./data/finance.db');

const now = () => new Date().toISOString();
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

async function seed() {
  const SQL = await initSqlJs();
  let db: any;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  const save = () => {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  };

  const run = (sql: string, params: any[] = []) => { db.run(sql, params); };
  const get = (sql: string, params: any[] = []) => {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) { const r = stmt.getAsObject({}); stmt.free(); return r; }
    stmt.free(); return null;
  };

  console.log('🌱 Starting seed...');

  // ── Demo User ────────────────────────────────────────────
  const userId = uuidv4();
  const email = 'demo@finance.local';
  const existing = get(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing) {
    console.log('⚠️  Demo user already exists. Skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash('demo1234', 12);
  const t = now();

  run(`INSERT INTO users VALUES (?,?,?,?,?,?)`,
    [userId, email, passwordHash, 'دمو', t, t]);
  run(`INSERT INTO user_settings VALUES (?,?,?,?,?,?)`,
    [uuidv4(), userId, 'TOMAN', 'Asia/Tehran', t, t]);

  console.log('✅ User created');

  // ── Categories ───────────────────────────────────────────
  const expenseCats = [
    { name: 'خوراک', icon: '🍔' },
    { name: 'حمل‌ونقل', icon: '🚗' },
    { name: 'مسکن', icon: '🏠' },
    { name: 'قبوض', icon: '📄' },
    { name: 'خرید', icon: '🛍️' },
    { name: 'سلامت', icon: '💊' },
    { name: 'آموزش', icon: '📚' },
    { name: 'تفریح', icon: '🎮' },
    { name: 'سایر', icon: '📦' },
  ];
  const incomeCats = [
    { name: 'حقوق', icon: '💼' },
    { name: 'فریلنس', icon: '💻' },
    { name: 'هدیه', icon: '🎁' },
    { name: 'فروش', icon: '🏷️' },
    { name: 'سرمایه‌گذاری', icon: '📈' },
    { name: 'سایر', icon: '📦' },
  ];

  const catIds: Record<string, string> = {};
  for (const c of expenseCats) {
    const id = uuidv4();
    catIds[c.name] = id;
    run(`INSERT INTO categories VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, userId, c.name, 'EXPENSE', c.icon, 1, 1, t, t]);
  }
  for (const c of incomeCats) {
    const id = uuidv4();
    catIds[c.name] = id;
    run(`INSERT INTO categories VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, userId, c.name, 'INCOME', c.icon, 1, 1, t, t]);
  }
  console.log('✅ Categories created');

  // ── Accounts ─────────────────────────────────────────────
  const acc: Record<string, string> = {
    cash: uuidv4(),
    meli: uuidv4(),
    mellat: uuidv4(),
    digipay: uuidv4(),
  };

  run(`INSERT INTO accounts VALUES (?,?,?,?,?,?,?,?)`,
    [acc.cash, userId, 'کیف پول نقد', 'CASH', 2000000, 1, t, t]);
  run(`INSERT INTO accounts VALUES (?,?,?,?,?,?,?,?)`,
    [acc.meli, userId, 'بانک ملی', 'BANK_ACCOUNT', 15000000, 1, t, t]);
  run(`INSERT INTO accounts VALUES (?,?,?,?,?,?,?,?)`,
    [acc.mellat, userId, 'بانک ملت', 'BANK_CARD', 8000000, 1, t, t]);
  run(`INSERT INTO accounts VALUES (?,?,?,?,?,?,?,?)`,
    [acc.digipay, userId, 'دیجی‌پی', 'DIGITAL_WALLET', 500000, 1, t, t]);

  console.log('✅ Accounts created');

  // ── Transactions (2 months) ───────────────────────────────
  const tx = [
    // Month -1
    { type: 'INCOME', title: 'حقوق ماه قبل', amount: 25000000, acc: acc.meli, cat: catIds['حقوق'], date: daysAgo(45) },
    { type: 'EXPENSE', title: 'اجاره', amount: 8000000, acc: acc.meli, cat: catIds['مسکن'], date: daysAgo(44) },
    { type: 'EXPENSE', title: 'خرید مواد غذایی', amount: 1200000, acc: acc.cash, cat: catIds['خوراک'], date: daysAgo(42) },
    { type: 'EXPENSE', title: 'بنزین', amount: 500000, acc: acc.mellat, cat: catIds['حمل‌ونقل'], date: daysAgo(40) },
    { type: 'EXPENSE', title: 'قبض برق', amount: 350000, acc: acc.meli, cat: catIds['قبوض'], date: daysAgo(38) },
    { type: 'EXPENSE', title: 'رستوران', amount: 800000, acc: acc.cash, cat: catIds['خوراک'], date: daysAgo(36) },
    { type: 'EXPENSE', title: 'داروخانه', amount: 450000, acc: acc.mellat, cat: catIds['سلامت'], date: daysAgo(35) },
    { type: 'INCOME', title: 'پروژه فریلنس', amount: 5000000, acc: acc.mellat, cat: catIds['فریلنس'], date: daysAgo(33) },
    { type: 'EXPENSE', title: 'خرید لباس', amount: 1800000, acc: acc.mellat, cat: catIds['خرید'], date: daysAgo(30) },
    { type: 'EXPENSE', title: 'کافه', amount: 320000, acc: acc.cash, cat: catIds['تفریح'], date: daysAgo(28) },
    { type: 'EXPENSE', title: 'اشتراک اینترنت', amount: 280000, acc: acc.meli, cat: catIds['قبوض'], date: daysAgo(27) },
    { type: 'EXPENSE', title: 'میوه و سبزیجات', amount: 650000, acc: acc.cash, cat: catIds['خوراک'], date: daysAgo(25) },
    // Month current
    { type: 'INCOME', title: 'حقوق این ماه', amount: 25000000, acc: acc.meli, cat: catIds['حقوق'], date: daysAgo(15) },
    { type: 'EXPENSE', title: 'اجاره این ماه', amount: 8000000, acc: acc.meli, cat: catIds['مسکن'], date: daysAgo(14) },
    { type: 'EXPENSE', title: 'سوپرمارکت', amount: 1500000, acc: acc.cash, cat: catIds['خوراک'], date: daysAgo(12) },
    { type: 'EXPENSE', title: 'تاکسی', amount: 200000, acc: acc.digipay, cat: catIds['حمل‌ونقل'], date: daysAgo(10) },
    { type: 'EXPENSE', title: 'کتاب', amount: 350000, acc: acc.mellat, cat: catIds['آموزش'], date: daysAgo(9) },
    { type: 'INCOME', title: 'فروش وسایل قدیمی', amount: 2000000, acc: acc.cash, cat: catIds['فروش'], date: daysAgo(8) },
    { type: 'EXPENSE', title: 'دکتر', amount: 600000, acc: acc.meli, cat: catIds['سلامت'], date: daysAgo(7) },
    { type: 'EXPENSE', title: 'پیتزا', amount: 480000, acc: acc.cash, cat: catIds['خوراک'], date: daysAgo(6) },
    { type: 'EXPENSE', title: 'قبض گاز', amount: 220000, acc: acc.meli, cat: catIds['قبوض'], date: daysAgo(5) },
    { type: 'EXPENSE', title: 'کفش ورزشی', amount: 2200000, acc: acc.mellat, cat: catIds['خرید'], date: daysAgo(4) },
    { type: 'EXPENSE', title: 'سینما', amount: 300000, acc: acc.digipay, cat: catIds['تفریح'], date: daysAgo(3) },
    { type: 'EXPENSE', title: 'میوه', amount: 400000, acc: acc.cash, cat: catIds['خوراک'], date: daysAgo(2) },
    { type: 'INCOME', title: 'هدیه تولد', amount: 1000000, acc: acc.cash, cat: catIds['هدیه'], date: daysAgo(1) },
    // Extra for variety
    { type: 'EXPENSE', title: 'نان و لبنیات', amount: 280000, acc: acc.cash, cat: catIds['خوراک'], date: daysAgo(11) },
    { type: 'EXPENSE', title: 'مترو', amount: 80000, acc: acc.digipay, cat: catIds['حمل‌ونقل'], date: daysAgo(13) },
    { type: 'EXPENSE', title: 'دوره آنلاین', amount: 1200000, acc: acc.mellat, cat: catIds['آموزش'], date: daysAgo(20) },
    { type: 'EXPENSE', title: 'قهوه', amount: 160000, acc: acc.cash, cat: catIds['تفریح'], date: daysAgo(22) },
    { type: 'EXPENSE', title: 'لوازم خانگی', amount: 950000, acc: acc.meli, cat: catIds['خرید'], date: daysAgo(18) },
  ];

  for (const item of tx) {
    run(`INSERT INTO transactions (id,user_id,type,title,amount,account_id,category_id,transaction_date,note,deleted_at,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,NULL,NULL,?,?)`,
      [uuidv4(), userId, item.type, item.title, item.amount, item.acc, item.cat, item.date, t, t]);
  }
  console.log('✅ Transactions created (30+)');

  // ── Transfers ────────────────────────────────────────────
  run(`INSERT INTO transfers (id,user_id,source_account_id,destination_account_id,amount,transfer_date,note,deleted_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,NULL,?,?)`,
    [uuidv4(), userId, acc.meli, acc.cash, 2000000, daysAgo(20), 'برداشت نقد', t, t]);
  run(`INSERT INTO transfers (id,user_id,source_account_id,destination_account_id,amount,transfer_date,note,deleted_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,NULL,?,?)`,
    [uuidv4(), userId, acc.mellat, acc.digipay, 500000, daysAgo(8), 'شارژ دیجی‌پی', t, t]);

  console.log('✅ Transfers created');

  // ── Budgets ──────────────────────────────────────────────
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const budgets = [
    { cat: catIds['خوراک'], limit: 5000000 },
    { cat: catIds['حمل‌ونقل'], limit: 1500000 },
    { cat: catIds['مسکن'], limit: 8500000 },
    { cat: catIds['قبوض'], limit: 1000000 },
    { cat: catIds['تفریح'], limit: 1000000 },
  ];
  for (const b of budgets) {
    run(`INSERT INTO budgets (id,user_id,category_id,year,month,limit_amount,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      [uuidv4(), userId, b.cat, year, month, b.limit, t, t]);
  }
  console.log('✅ Budgets created');

  // ── Goals ────────────────────────────────────────────────
  const goal1Id = uuidv4();
  const goal2Id = uuidv4();

  run(`INSERT INTO goals (id,user_id,title,category,target_amount,target_date,note,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [goal1Id, userId, 'صندوق اضطراری', 'پس‌انداز', 30000000, null, 'سه ماه هزینه‌های جاری', 'ACTIVE', t, t]);
  run(`INSERT INTO goals (id,user_id,title,category,target_amount,target_date,note,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [goal2Id, userId, 'خرید لپ‌تاپ', 'خرید', 40000000, daysAgo(-180), 'لپ‌تاپ برای کار', 'ACTIVE', t, t]);

  // Contributions
  const contributions = [
    { goalId: goal1Id, amount: 5000000, date: daysAgo(40) },
    { goalId: goal1Id, amount: 3000000, date: daysAgo(10) },
    { goalId: goal2Id, amount: 8000000, date: daysAgo(35) },
    { goalId: goal2Id, amount: 5000000, date: daysAgo(20) },
    { goalId: goal2Id, amount: 2000000, date: daysAgo(5) },
  ];
  for (const c of contributions) {
    run(`INSERT INTO goal_contributions (id,user_id,goal_id,amount,contribution_date,note,created_at,updated_at)
         VALUES (?,?,?,?,?,NULL,?,?)`,
      [uuidv4(), userId, c.goalId, c.amount, c.date, t, t]);
  }
  console.log('✅ Goals & contributions created');

  save();
  console.log('\n✅ Seed completed successfully!');
  console.log('─────────────────────────────');
  console.log('📧 Email:    demo@finance.local');
  console.log('🔑 Password: demo1234');
  console.log(`💾 DB Path:  ${DB_PATH}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
