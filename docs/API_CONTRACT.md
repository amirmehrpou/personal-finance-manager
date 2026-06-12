# Personal Finance — API Contract V1

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
همه endpoint ها به جز register و login نیاز به Bearer Token دارند.

```
Authorization: Bearer <accessToken>
```

## Response Format

### موفق — تکی
```json
{ "data": { ... } }
```

### موفق — لیست
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### خطا
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "اطلاعات واردشده معتبر نیست.",
    "fields": {
      "amount": "مبلغ باید بیشتر از صفر باشد."
    }
  }
}
```

## Error Codes
| Code | HTTP | توضیح |
|------|------|-------|
| VALIDATION_ERROR | 400 | ورودی نامعتبر |
| UNAUTHORIZED | 401 | توکن نیست یا منقضی شده |
| FORBIDDEN | 403 | دسترسی ندارد |
| RESOURCE_NOT_FOUND | 404 | منبع پیدا نشد |
| RESOURCE_CONFLICT | 409 | تعارض (مثلاً ایمیل تکراری) |
| ACCOUNT_INACTIVE | 400 | حساب غیرفعال است |
| CATEGORY_TYPE_MISMATCH | 400 | نوع دسته با نوع تراکنش مطابقت ندارد |
| INTERNAL_SERVER_ERROR | 500 | خطای داخلی |

---

## 1. Auth

### POST /auth/register
ثبت‌نام کاربر جدید — پس از ثبت‌نام، settings و default categories به‌صورت خودکار ساخته می‌شوند.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "علی"
}
```
- `email`: string, required, valid email
- `password`: string, required, min 8 chars
- `firstName`: string, required, min 2 / max 50 chars

**Response 201:**
```json
{
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "علی"
    }
  }
}
```

**Errors:** 409 RESOURCE_CONFLICT (ایمیل تکراری)

---

### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "علی"
    }
  }
}
```

**Errors:** 401 UNAUTHORIZED

---

### GET /auth/me
🔒 Auth required

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "علی",
    "createdAt": "2026-06-01T10:00:00.000Z"
  }
}
```

---

## 2. Settings

### GET /settings
🔒 Auth required

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "currencyDisplay": "TOMAN",
    "timezone": "Asia/Tehran",
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z"
  }
}
```

---

### PATCH /settings
🔒 Auth required

**Request:** (همه فیلدها optional)
```json
{
  "currencyDisplay": "TOMAN",
  "timezone": "Asia/Tehran"
}
```
- `currencyDisplay`: enum `RIAL` | `TOMAN`
- `timezone`: string

**Response 200:** همان فرمت GET

---

## 3. Accounts

### POST /accounts
🔒 Auth required

**Request:**
```json
{
  "name": "بانک ملی",
  "type": "BANK_ACCOUNT",
  "initialBalance": 5000000
}
```
- `name`: string, required, max 100 chars
- `type`: enum `CASH` | `BANK_ACCOUNT` | `BANK_CARD` | `DIGITAL_WALLET`
- `initialBalance`: integer >= 0, optional (default: 0)

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "بانک ملی",
    "type": "BANK_ACCOUNT",
    "initialBalance": 5000000,
    "isActive": true,
    "balance": 5000000,
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z"
  }
}
```

> `balance` = موجودی محاسبه‌شده (initialBalance + income - expense + incoming transfers - outgoing transfers)

---

### GET /accounts
🔒 Auth required

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "بانک ملی",
      "type": "BANK_ACCOUNT",
      "initialBalance": 5000000,
      "isActive": true,
      "balance": 12500000,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### GET /accounts/:id
🔒 Auth required

**Response 200:** همان فرمت یک آیتم

**Errors:** 404

---

### PATCH /accounts/:id
🔒 Auth required

**Request:** (همه optional)
```json
{
  "name": "نام جدید",
  "type": "BANK_CARD"
}
```

**Response 200:** آیتم آپدیت‌شده

---

### DELETE /accounts/:id
🔒 Auth required
حساب را غیرفعال می‌کند (soft delete — در تاریخچه باقی می‌ماند)

**Response 200:**
```json
{ "data": { "message": "حساب غیرفعال شد." } }
```

---

### GET /accounts/:id/balance
🔒 Auth required

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "بانک ملی",
    "balance": 12500000
  }
}
```

---

## 4. Categories

### POST /categories
🔒 Auth required

**Request:**
```json
{
  "name": "رستوران",
  "type": "EXPENSE",
  "icon": "🍽️"
}
```
- `name`: string, required, max 100
- `type`: enum `INCOME` | `EXPENSE`
- `icon`: string, optional (default: 📦)

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "رستوران",
    "type": "EXPENSE",
    "icon": "🍽️",
    "isDefault": false,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### GET /categories
🔒 Auth required

**Query Params:**
- `type`: `INCOME` | `EXPENSE` (optional)

```
GET /categories
GET /categories?type=EXPENSE
GET /categories?type=INCOME
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "خوراک",
      "type": "EXPENSE",
      "icon": "🍔",
      "isDefault": true,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

> دسته‌های پیش‌فرض در ابتدای لیست برمی‌گردند (`isDefault: true`)

**Default EXPENSE categories:** خوراک، حمل‌ونقل، مسکن، قبوض، خرید، سلامت، آموزش، تفریح، سایر

**Default INCOME categories:** حقوق، فریلنس، هدیه، فروش، سرمایه‌گذاری، سایر

---

### GET /categories/:id
🔒 Auth required

**Response 200:** یک آیتم | **Errors:** 404

---

### PATCH /categories/:id
🔒 Auth required

**Request:** (همه optional)
```json
{
  "name": "غذا",
  "icon": "🥗"
}
```

**Response 200:** آیتم آپدیت‌شده

---

### DELETE /categories/:id
🔒 Auth required — غیرفعال‌سازی

**Response 200:**
```json
{ "data": { "message": "دسته‌بندی غیرفعال شد." } }
```

---

## 5. Transactions

### POST /transactions
🔒 Auth required

**Request:**
```json
{
  "type": "EXPENSE",
  "title": "خرید نان",
  "amount": 200000,
  "accountId": "uuid",
  "categoryId": "uuid",
  "transactionDate": "2026-06-12",
  "note": "توضیحات اختیاری"
}
```
- `type`: enum `INCOME` | `EXPENSE`
- `title`: string, required, max 200
- `amount`: integer > 0
- `accountId`: uuid — باید به کاربر تعلق داشته باشد و فعال باشد
- `categoryId`: uuid — باید به کاربر تعلق داشته باشد و نوعش با type مطابقت داشته باشد
- `transactionDate`: ISO date string `YYYY-MM-DD`
- `note`: string, optional, max 500

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "type": "EXPENSE",
    "title": "خرید نان",
    "amount": 200000,
    "accountId": "uuid",
    "categoryId": "uuid",
    "transactionDate": "2026-06-12",
    "note": null,
    "deletedAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** 400 ACCOUNT_INACTIVE | 400 CATEGORY_TYPE_MISMATCH | 404

---

### GET /transactions
🔒 Auth required

**Query Params:**
| Param | Type | توضیح |
|-------|------|-------|
| page | number | صفحه (default: 1) |
| limit | number | تعداد (default: 20, max: 100) |
| search | string | جستجو در عنوان |
| type | INCOME\|EXPENSE | فیلتر نوع |
| categoryId | uuid | فیلتر دسته |
| accountId | uuid | فیلتر حساب |
| dateFrom | YYYY-MM-DD | از تاریخ |
| dateTo | YYYY-MM-DD | تا تاریخ |
| minAmount | number | حداقل مبلغ |
| maxAmount | number | حداکثر مبلغ |
| sortBy | transactionDate\|amount\|createdAt | مرتب‌سازی |
| sortOrder | asc\|desc | ترتیب (default: desc) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "EXPENSE",
      "title": "خرید نان",
      "amount": 200000,
      "accountId": "uuid",
      "categoryId": "uuid",
      "categoryName": "خوراک",
      "categoryIcon": "🍔",
      "accountName": "بانک ملی",
      "transactionDate": "2026-06-12",
      "note": null,
      "deletedAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

---

### GET /transactions/:id
🔒 Auth required

**Response 200:** یک آیتم با `categoryName` و `accountName` | **Errors:** 404

---

### PATCH /transactions/:id
🔒 Auth required — فقط تراکنش‌های حذف‌نشده

**Request:** (همه optional)
```json
{
  "title": "عنوان جدید",
  "amount": 300000,
  "accountId": "uuid",
  "categoryId": "uuid",
  "transactionDate": "2026-06-13",
  "note": "توضیح جدید"
}
```

**Response 200:** آیتم آپدیت‌شده | **Errors:** 404 | 400 CATEGORY_TYPE_MISMATCH

---

### DELETE /transactions/:id
🔒 Auth required — soft delete (قابل بازیابی)

**Response 200:**
```json
{ "data": { "message": "تراکنش حذف شد." } }
```

---

### POST /transactions/:id/restore
🔒 Auth required — فقط تراکنش‌های حذف‌شده

**Response 200:** آیتم بازیابی‌شده | **Errors:** 404

---

## 6. Transfers

### POST /transfers
🔒 Auth required

**Request:**
```json
{
  "sourceAccountId": "uuid",
  "destinationAccountId": "uuid",
  "amount": 1000000,
  "transferDate": "2026-06-12",
  "note": "شارژ دیجی‌پی"
}
```
- مبدا و مقصد نمی‌توانند یکسان باشند
- هر دو حساب باید فعال باشند
- هر دو باید به کاربر تعلق داشته باشند

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "sourceAccountId": "uuid",
    "destinationAccountId": "uuid",
    "amount": 1000000,
    "transferDate": "2026-06-12",
    "note": "شارژ دیجی‌پی",
    "deletedAt": null,
    "sourceAccountName": "بانک ملی",
    "destinationAccountName": "دیجی‌پی",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### GET /transfers
🔒 Auth required

**Query Params:** `page`, `limit`

**Response 200:** paginated list

---

### GET /transfers/:id
**Response 200:** یک آیتم | **Errors:** 404

---

### PATCH /transfers/:id
**Request:** (همه optional)
```json
{
  "amount": 2000000,
  "transferDate": "2026-06-13",
  "note": "توضیح جدید"
}
```

---

### DELETE /transfers/:id
Soft delete

**Response 200:**
```json
{ "data": { "message": "انتقال حذف شد." } }
```

---

## 7. Balances

### GET /balances
🔒 Auth required

**Query Params:**
- `includeInactive`: `true` | `false` (default: true)

**Response 200:**
```json
{
  "data": {
    "totalBalance": 25500000,
    "accounts": [
      {
        "id": "uuid",
        "name": "بانک ملی",
        "type": "BANK_ACCOUNT",
        "isActive": true,
        "balance": 20000000
      },
      {
        "id": "uuid",
        "name": "کیف پول نقد",
        "type": "CASH",
        "isActive": true,
        "balance": 5500000
      }
    ]
  }
}
```

---

### GET /accounts/:id/balance
🔒 Auth required

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "بانک ملی",
    "balance": 20000000
  }
}
```

---

## 8. Dashboard

### GET /dashboard
🔒 Auth required

**Query Params:**
- `month`: `YYYY-MM` (default: ماه جاری)

```
GET /dashboard?month=2026-06
```

**Response 200:**
```json
{
  "data": {
    "totalBalance": 25500000,
    "monthlyIncome": 30000000,
    "monthlyExpense": 12000000,
    "monthlyNet": 18000000,
    "topExpenseCategory": {
      "id": "uuid",
      "name": "خوراک",
      "total": 4500000
    },
    "budgetSummary": [
      {
        "id": "uuid",
        "categoryName": "خوراک",
        "limitAmount": 5000000,
        "spentAmount": 4500000,
        "percentage": 90,
        "status": "WARNING"
      }
    ],
    "recentActivities": [
      {
        "id": "uuid",
        "kind": "TRANSACTION",
        "type": "EXPENSE",
        "title": "خرید نان",
        "amount": 200000,
        "date": "2026-06-12",
        "category_name": "خوراک",
        "category_icon": "🍔"
      },
      {
        "id": "uuid",
        "kind": "TRANSFER",
        "type": "TRANSFER",
        "title": "انتقال وجه",
        "amount": 1000000,
        "date": "2026-06-11",
        "source_name": "بانک ملی",
        "dest_name": "دیجی‌پی"
      }
    ],
    "activeGoalSummary": [
      {
        "id": "uuid",
        "title": "خرید لپ‌تاپ",
        "targetAmount": 40000000,
        "savedAmount": 15000000,
        "targetDate": "2026-12-01",
        "percentage": 37
      }
    ]
  }
}
```

> `status` بودجه: `SAFE` (< 80%) | `WARNING` (80-100%) | `EXCEEDED` (> 100%)

---

## 9. Budgets

### POST /budgets
🔒 Auth required — فقط برای دسته‌های EXPENSE

**Request:**
```json
{
  "categoryId": "uuid",
  "year": 2026,
  "month": 6,
  "limitAmount": 5000000
}
```
- `year`: integer 2000-2100
- `month`: integer 1-12
- `limitAmount`: integer > 0
- هر دسته در هر ماه فقط یک بودجه می‌تواند داشته باشد

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "categoryName": "خوراک",
    "categoryIcon": "🍔",
    "year": 2026,
    "month": 6,
    "limitAmount": 5000000,
    "spentAmount": 3200000,
    "remainingAmount": 1800000,
    "exceededAmount": 0,
    "percentage": 64,
    "status": "SAFE",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** 409 RESOURCE_CONFLICT (بودجه تکراری) | 400 (دسته INCOME)

---

### GET /budgets
🔒 Auth required

**Query Params:**
- `year`: number (optional)
- `month`: number (optional)

```
GET /budgets?year=2026&month=6
```

**Response 200:** لیست بودجه‌ها با `spentAmount`، `percentage`، `status`

---

### GET /budgets/:id
**Response 200:** یک بودجه | **Errors:** 404

---

### PATCH /budgets/:id
**Request:**
```json
{ "limitAmount": 6000000 }
```

---

### DELETE /budgets/:id
**Response 200:**
```json
{ "data": { "message": "بودجه حذف شد." } }
```

---

## 10. Reports

### GET /reports/expenses
🔒 Auth required — گزارش هزینه‌ها بر اساس دسته

**Query Params:**
- `dateFrom`: YYYY-MM-DD (required)
- `dateTo`: YYYY-MM-DD (required)

**Response 200:**
```json
{
  "data": {
    "dateFrom": "2026-06-01",
    "dateTo": "2026-06-30",
    "totalExpense": 12000000,
    "byCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "خوراک",
        "categoryIcon": "🍔",
        "total": 4500000,
        "percentage": 37
      },
      {
        "categoryId": "uuid",
        "categoryName": "حمل‌ونقل",
        "categoryIcon": "🚗",
        "total": 2000000,
        "percentage": 17
      }
    ]
  }
}
```

---

### GET /reports/monthly
🔒 Auth required

**Query Params:**
- `year`: number (required)
- `month`: number (required)

**Response 200:**
```json
{
  "data": {
    "year": 2026,
    "month": 6,
    "totalIncome": 30000000,
    "totalExpense": 12000000,
    "netAmount": 18000000,
    "highestExpense": {
      "title": "اجاره",
      "amount": 8000000
    },
    "topExpenseCategory": {
      "categoryId": "uuid",
      "categoryName": "مسکن",
      "total": 8000000
    },
    "expensesByCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "مسکن",
        "categoryIcon": "🏠",
        "total": 8000000,
        "percentage": 67
      }
    ],
    "budgets": [
      {
        "id": "uuid",
        "categoryId": "uuid",
        "categoryName": "خوراک",
        "limitAmount": 5000000,
        "spentAmount": 4500000,
        "percentage": 90,
        "status": "WARNING"
      }
    ]
  }
}
```

---

### GET /reports/comparison
🔒 Auth required — مقایسه ماه جاری با ماه قبل

**Query Params:**
- `year`: number (required)
- `month`: number (required)

**Response 200:**
```json
{
  "data": {
    "currentPeriod": {
      "year": 2026,
      "month": 6,
      "totalIncome": 30000000,
      "totalExpense": 12000000,
      "netAmount": 18000000
    },
    "previousPeriod": {
      "year": 2026,
      "month": 5,
      "totalIncome": 28000000,
      "totalExpense": 14000000,
      "netAmount": 14000000
    },
    "incomeDifference": 2000000,
    "expenseDifference": -2000000,
    "netDifference": 4000000,
    "categoryDifferences": [
      {
        "categoryId": "uuid",
        "categoryName": "خوراک",
        "currentAmount": 4500000,
        "previousAmount": 5000000,
        "difference": -500000
      }
    ]
  }
}
```

---

## 11. Goals

### POST /goals
🔒 Auth required

**Request:**
```json
{
  "title": "خرید لپ‌تاپ",
  "category": "خرید",
  "targetAmount": 40000000,
  "targetDate": "2026-12-01",
  "note": "لپ‌تاپ برای کار"
}
```
- `title`: string, max 200
- `category`: string, max 100 (label آزاد — دسته‌بندی سیستم نیست)
- `targetAmount`: integer > 0
- `targetDate`: ISO date, optional
- `note`: string, optional

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "title": "خرید لپ‌تاپ",
    "category": "خرید",
    "targetAmount": 40000000,
    "savedAmount": 0,
    "remainingAmount": 40000000,
    "percentage": 0,
    "targetDate": "2026-12-01",
    "note": "لپ‌تاپ برای کار",
    "status": "ACTIVE",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### GET /goals
🔒 Auth required

**Query Params:**
- `status`: `ACTIVE` | `COMPLETED` | `PAUSED` | `CANCELLED` (optional)

**Response 200:** لیست اهداف با `savedAmount`، `percentage`، `status`

---

### GET /goals/:id
**Response 200:** یک هدف | **Errors:** 404

---

### PATCH /goals/:id
**Request:** (همه optional)
```json
{
  "title": "عنوان جدید",
  "targetAmount": 50000000,
  "targetDate": "2027-01-01",
  "note": "توضیح جدید",
  "status": "PAUSED"
}
```
- `status`: `ACTIVE` | `COMPLETED` | `PAUSED` | `CANCELLED`

---

### DELETE /goals/:id
هدف و همه واریزهایش حذف می‌شوند.

**Response 200:**
```json
{ "data": { "message": "هدف حذف شد." } }
```

---

### GET /goals/:id/progress
🔒 Auth required

**Response 200:**
```json
{
  "data": {
    "targetAmount": 40000000,
    "savedAmount": 15000000,
    "remainingAmount": 25000000,
    "percentage": 37,
    "status": "ACTIVE"
  }
}
```

---

## 12. Goal Contributions

### POST /goals/:id/contributions
🔒 Auth required

**Request:**
```json
{
  "amount": 5000000,
  "contributionDate": "2026-06-12",
  "note": "پس‌انداز این ماه"
}
```
- وقتی مجموع واریزها به targetAmount رسید، status هدف به `COMPLETED` تغییر می‌کند

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "goalId": "uuid",
    "amount": 5000000,
    "contributionDate": "2026-06-12",
    "note": "پس‌انداز این ماه",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### GET /goals/:id/contributions
**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "goalId": "uuid",
      "amount": 5000000,
      "contributionDate": "2026-06-12",
      "note": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### PATCH /goals/:id/contributions/:contributionId
**Request:** (همه optional)
```json
{
  "amount": 6000000,
  "contributionDate": "2026-06-13",
  "note": "اصلاح شد"
}
```

---

### DELETE /goals/:id/contributions/:contributionId
**Response 200:**
```json
{ "data": { "message": "واریز حذف شد." } }
```

---

## Notes for Frontend

### مقادیر پولی
- همه مبالغ به **ریال** و **عدد صحیح** هستند
- برای نمایش به تومان: `Math.floor(amount / 10)`
- برای نمایش با جداکننده هزار: `amount.toLocaleString('fa-IR')`

### تاریخ‌ها
- همه timestamps به UTC و ISO 8601 هستند
- `transactionDate` و `contributionDate` به فرمت `YYYY-MM-DD`
- تبدیل به تاریخ شمسی بر عهده Frontend است

### RTL
- زبان فارسی، جهت RTL
- خطاهای API به فارسی برمی‌گردند

### Demo Account (بعد از seed)
```
Email:    demo@finance.local
Password: demo1234
```

### Swagger UI
```
http://localhost:3000/api/docs
```
