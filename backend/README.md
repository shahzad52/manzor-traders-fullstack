# Manzor Traders — Backend (Node.js + Express + PostgreSQL)

Ye backend saara app data (products, sales, invoices, customers, settings) **PostgreSQL**
mein store karta hai. **Firebase sirf authentication (login/signup) ke liye use hota hai** —
har request ke saath frontend Firebase ID token bhejta hai, backend usay verify karta hai
(Firebase Admin SDK se) aur phir Postgres se data read/write karta hai.

## 1. PostgreSQL setup

Apna Postgres database bana lein (local ya koi hosted service jaise Supabase, Neon, Railway, etc):

```sql
CREATE DATABASE manzor_traders;
```

## 2. Environment variables

`.env.example` ko copy karein:

```bash
cp .env.example .env
```

`.env` mein ye set karein:

- `DATABASE_URL` — apna Postgres connection string, e.g.
  `postgres://user:password@localhost:5432/manzor_traders`
- `CORS_ORIGIN` — frontend ka URL (dev mein `http://localhost:5173`)
- `PORT` — backend port (default `4000`)

## 3. Firebase Admin service account (authentication verify karne ke liye)

1. Firebase Console → Project Settings → Service Accounts → **Generate new private key**
2. Downloaded JSON file ko `backend/service-account.json` naam se save karein
   (ya `.env` mein `FIREBASE_SERVICE_ACCOUNT_JSON` mein poora JSON ek line mein paste karein)

> Note: `service-account.json` ko kabhi git mein commit na karein — ye secret hai.

## 4. Install & migrate

```bash
npm install
npm run migrate     # schema.sql ko database par apply karta hai
```

## 5. Run

```bash
npm run dev          # development (auto-restart)
npm start             # production
```

Backend `http://localhost:4000` par chalega. Health check: `GET /health`

## API overview

Har `/api/*` route ko `Authorization: Bearer <firebase-id-token>` header chahiye.

| Route | Description |
|---|---|
| `GET /api/bootstrap` | Login ke baad ek hi call mein products, customers, sales, manualInvoices, settings |
| `GET/POST/PUT/DELETE /api/products` | Products CRUD |
| `POST /api/products/:id/stock-in` \| `stock-out` | Stock adjust |
| `GET/POST/PUT/DELETE /api/customers` | Customers CRUD |
| `POST /api/customers/:id/adjustments` | Balance adjustment |
| `GET /api/invoices` | Sab sales + manual invoices |
| `POST /api/invoices/sales` | POS sale record karna |
| `POST /api/invoices/manual` | Manual invoice banana |
| `PUT/DELETE /api/invoices/:id?source=pos\|manual` | Invoice update/delete (stock & customer stats auto-adjust) |
| `POST /api/invoices/receive-payment` | Customer se payment receive karna |
| `POST /api/invoices/complete-sale` | Stock deduct karna (checkout) |
| `GET/PUT /api/settings/*` | App settings, invoice settings, categories |
| `POST /api/backup/restore` | JSON backup restore |

## Deploy

Kahin bhi Node.js host kiya ja sakta hai (Railway, Render, Fly.io, VPS, etc). Bas
`DATABASE_URL` aur Firebase service account env vars set karna na bhoolein, aur
frontend ke `VITE_API_URL` ko deployed backend URL par point karein.
