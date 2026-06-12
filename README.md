# Personal Finance Backend — V1

API مدیریت مالی شخصی | NestJS + SQLite

---

## نصب سریع

```bash
npm install
cp .env.example .env
npx ts-node -r tsconfig-paths/register src/seed.ts
npm run start:dev
```

## حساب Demo

```
Email:    demo@finance.local
Password: demo1234
```

## آدرس‌های مهم

- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs

## دستورات

```bash
npm run start:dev   # اجرا با hot reload
npm run build       # build production
npm run start       # اجرای build شده
npx ts-node -r tsconfig-paths/register src/seed.ts  # seed داده
```

## Endpoints

| ماژول | آدرس |
|-------|------|
| Auth | POST /api/v1/auth/register، /login، GET /me |
| Settings | GET/PATCH /api/v1/settings |
| Accounts | CRUD /api/v1/accounts |
| Categories | CRUD /api/v1/categories |
| Transactions | CRUD + restore /api/v1/transactions |
| Transfers | CRUD /api/v1/transfers |
| Balances | GET /api/v1/balances |
| Dashboard | GET /api/v1/dashboard?month=2026-06 |
| Budgets | CRUD /api/v1/budgets |
| Reports | GET /api/v1/reports/expenses، /monthly، /comparison |
| Goals | CRUD + contributions /api/v1/goals |

## فرمت پاسخ

```json
// موفق تکی
{ "data": { ... } }

// لیست
{ "data": [...], "meta": { "page":1, "limit":20, "total":100, "totalPages":5 } }

// خطا
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

## قوانین
- مقادیر پولی: ریال، عدد صحیح، بدون float
- تاریخ‌ها: UTC + ISO 8601
- IDها: UUID
- حذف حساب/دسته: غیرفعال‌سازی (نه حذف واقعی)
- حذف تراکنش: soft delete با قابلیت restore
