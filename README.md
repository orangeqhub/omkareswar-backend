# OMKARESWAR REALTORS — Backend

Production-quality Node.js/Express + PostgreSQL backend for the OMKARESWAR REALTORS real-estate platform.

## Stack

Node.js (ES Modules) · Express · PostgreSQL · Sequelize ORM + Sequelize CLI · JWT · bcryptjs · multer · express-validator · ExcelJS · Socket.IO

## 1. Requirements

- Node.js >= 18 (developed and tested on Node 24)
- PostgreSQL >= 13 (developed and tested on PostgreSQL 18)

## 2. PostgreSQL setup

Create the development and test databases:

```bash
psql -U postgres -c "CREATE DATABASE omkareswar_realtors;"
psql -U postgres -c "CREATE DATABASE omkareswar_realtors_test;"
```

(On Windows, if `psql` isn't on your PATH, run it from `<PostgreSQL install dir>\bin\psql.exe`.)

## 3. Environment setup

```bash
cp .env.example .env
```

Edit `.env` and set at least `DB_USER` / `DB_PASSWORD` to match your local PostgreSQL superuser, and change `JWT_SECRET` / `JWT_REFRESH_SECRET` to random strings before deploying anywhere real.

Key variables:

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection |
| `DB_TEST_NAME` | Database used automatically when `NODE_ENV=test` |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Access token signing |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Refresh token signing |
| `OTP_MODE` | `demo` (fixed OTP `DEMO_OTP`, default `1234`) — swap for a real SMS provider integration in production |
| `MAX_IMAGE_SIZE_MB` | Upload size limit enforced by multer |
| `FRONTEND_URL` | Used for CORS + Socket.IO origin |

## 4. Install

```bash
npm install
```

## 5. Migrate & seed

```bash
npm run db:migrate        # creates all tables in DB_NAME
npm run db:seed           # seeds demo users, categories, media rules, cms, sample data
```

To run migrations/seeders against the test database instead:

```bash
NODE_ENV=test npm run db:migrate
NODE_ENV=test npm run db:seed
```

Seeders are idempotent (safe to re-run — they check for existing rows before inserting).

Other useful scripts:

```bash
npm run db:migrate:undo        # roll back the last migration
npm run db:migrate:undo:all    # roll back every migration
npm run db:seed:undo           # undo all seeders
```

## 6. Run

```bash
npm run dev      # node --watch, auto-restarts on file changes
npm start        # production start
```

- API base URL: `http://localhost:5000/api`
- Uploaded file URL: `http://localhost:5000/uploads/<profiles|properties|documents|cms>/<filename>`
- Health check: `GET http://localhost:5000/api/health` → `{success:true,data:{db:"connected",time:"..."}}`

## 7. Demo credentials (seeded)

| Role | Login | Password / OTP |
|---|---|---|
| Admin | `ADMIN001` | `Admin@123` |
| Employee | `EMP-2026-0001` | `Employee@123` |
| Seller | mobile `9000000003` | OTP `1234` (demo mode) |
| Buyer | mobile `9000000004` | OTP `1234` (demo mode) |
| Mediator | mobile `9000000005` | OTP `1234` (demo mode) |

A sixth seeded user (mobile `9000000006`, seller role, status `pending`) demonstrates the registration approval workflow.

## 8. Tests

```bash
npm test
```

Runs the full Supertest suite (`tests/*.test.js`) against the **real** PostgreSQL test database (`DB_TEST_NAME`, migrated + seeded beforehand as in step 5). Covers: health check, OTP request, public OTP login, admin login, employee login, invalid login, pending-account restriction, role authorization, employee permission enforcement, registration submission + approval, property draft + submit + filters + ownership protection, image upload validation, enquiry creation, visit creation, follow-up update, notification read, and Excel report download.

Make sure the test database is migrated/seeded first:

```bash
NODE_ENV=test npm run db:migrate
NODE_ENV=test npm run db:seed
npm test
```

## 9. Postman

Import `docs/OMKARESWAR-REALTORS.postman_collection.json`. It defines collection variables `baseUrl`, `adminToken`, `employeeToken`, `buyerToken`, `sellerToken`, `mediatorToken` — run the relevant login request first and paste the returned `token` into the matching variable (or use a Postman pre-request/test script to automate this), then run any other request in the collection.

## 10. Socket.IO usage

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000', { auth: { token: accessToken } });
socket.on('notification:new', (n) => console.log(n));
```

See `docs/FRONTEND-INTEGRATION.md` for the full event/room reference and the frontend-service → API mapping table.

## 11. Deployment with PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 logs omkareswar-realtors-backend
pm2 restart omkareswar-realtors-backend
```

`ecosystem.config.cjs` runs `src/server.js` in fork mode with `NODE_ENV=production` and writes logs to `./logs/`.

## 12. Nginx reverse proxy example

```nginx
server {
    listen 80;
    server_name api.omkareswarrealtors.com;

    location /uploads/ {
        alias /path/to/backend/uploads/;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 13. Troubleshooting

| Problem | Fix |
|---|---|
| `EADDRINUSE` on start | Another process is already listening on `PORT` (default 5000). Stop it or change `PORT` in `.env`. |
| `ECONNREFUSED` / health check shows `db: unavailable` | PostgreSQL isn't running, or `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD` in `.env` are wrong. |
| `relation "..." does not exist` | Migrations haven't been run — `npm run db:migrate`. |
| Login always returns `ACCOUNT_PENDING` | The account's `status` is still `pending` — approve it via `PATCH /api/admin/registrations/:id/approve` (as admin) first. |
| `403 PERMISSION_DENIED` for an employee | The employee's `permissions` array doesn't include the permission required by that route — grant it via `PUT /api/admin/employees/:id/permissions`. |
| File upload rejected with `INVALID_FILE_TYPE` | Only jpg/jpeg/png/webp are accepted for images (pdf is also accepted for documents/identity proof). |
| `sequelize-cli` can't find config | Run npm scripts from the `backend/` folder — `.sequelizerc` resolves paths relative to the current working directory. |

## 14. Project structure

```
backend/
  src/
    config/       Sequelize database connection
    constants/    roles, permissions, statuses, media rule templates
    models/       Sequelize models + associations (src/models/index.js)
    controllers/  thin HTTP layer, calls services
    services/     business logic, transactions, notifications, audit logging
    routes/       Express routers, grouped by resource
    validators/   express-validator chains
    middleware/   auth, permission checks, upload, error handling, rate limiting
    sockets/      Socket.IO server + emit helpers
    utils/        AppError, asyncHandler, jwt, password hashing, ID generator, pagination, response helpers
    app.js        Express app wiring (no listen())
    server.js     HTTP server + Socket.IO bootstrap
  migrations/     Sequelize CLI migrations (one file per table/table-group)
  seeders/        Idempotent seed data
  uploads/        profiles/ properties/ documents/ cms/ (served at /uploads)
  tests/          Supertest suite
  docs/           FRONTEND-INTEGRATION.md, Postman collection
```
