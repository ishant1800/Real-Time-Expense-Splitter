# Real-Time Expense Splitter

A modern, secure web application for splitting expenses among groups in real-time. Features automated debt simplification, email notifications, token-based authentication, and instant UI updates.

---

## Tech Stack

* **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.io, Nodemailer
* **Frontend:** React, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query (React Query), Socket.io Client

---

## Architecture Overview

The backend uses a modular, decoupled architecture following clean design patterns:
* **Repository Pattern:** Isolates database operations (Mongoose queries) from business logic.
* **Service Layer:** Houses the core business rules (e.g., balance calculation, transactions, email dispatches).
* **Controller Layer:** Coordinates requests, parses payloads, and returns normalized JSON wrappers.
* **Real-Time Sockets:** Operates on isolated middleware bindings. Service layer CRUD operations trigger room emissions (`emitToGroup`) to keep active client views synchronized.

---

## Local Setup

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed.

### 2. Installation
Clone the repository and install dependencies in both the backend root and the frontend folder:
```bash
# Install backend dependencies (in workspace root)
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 3. Environment Variables Setup
Copy the example environment file at the root level and configure it:
```bash
# In workspace root
cp .env.example .env
```

### 4. Running Dev Servers
Start both servers in separate terminals:
```bash
# Start Backend Server (runs on http://localhost:5000)
# From workspace root
npm run dev

# Start Frontend Dev Server (runs on http://localhost:5173)
# From frontend folder
npm run dev
```

---

## Environment Variables Configuration

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port number on which the Express server listens. | `5000` |
| `NODE_ENV` | Mode of the server (`development`, `production`, `test`). | `development` |
| `CORS_ORIGIN` | Authorized origins for Cross-Origin Resource Sharing. Supports comma-delimited strings. | `http://localhost:5173,http://localhost:3000` |
| `MONGODB_URI` | Connection URI for the MongoDB Database instance. | `mongodb+srv://...` |
| `JWT_ACCESS_SECRET` | Secret key used for signing access JWT tokens. | `your_access_token_secret_here` |
| `JWT_REFRESH_SECRET` | Secret key used for signing refresh JWT tokens. | `your_refresh_token_secret_here` |
| `JWT_ACCESS_EXPIRES_IN` | Validity duration of access JWTs. | `15m` |
| `JWT_REFRESH_EXPIRES_IN`| Validity duration of refresh JWTs. | `7d` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for verifying Google authentication. | `your_google_client_id_here` |
| `MOCK_GOOGLE_AUTH` | Bypasses real Google validation and allows simulated profiles in development. | `false` |
| `SMTP_HOST` | Hostname of the SMTP server for sending reset emails. | `smtp.mailtrap.io` |
| `SMTP_PORT` | Port number of the SMTP server. | `2525` |
| `SMTP_USER` | Username credential for the SMTP service. | `your_smtp_username_here` |
| `SMTP_PASS` | Password credential for the SMTP service. | `your_smtp_password_here` |
| `SMTP_FROM` | Default sender email address in transaction mail headers. | `no-reply@expensesplitter.com` |

---

## REST API Endpoints Summary

### Authentication (`/api/auth`)
* `POST /register` - Register a local user account.
* `POST /login` - Log in with email and password.
* `POST /google` - Log in / register via Google ID token.
* `POST /refresh` - Request a rotated pair of JWT credentials using a valid refresh token.
* `POST /logout` - Invalidate a refresh token.
* `POST /forgot-password` - Request a password reset link.
* `POST /reset-password` - Reset password using validation token.
* `GET /me` - Retrieve current user profile (requires Bearer token).

### Groups (`/api/groups`)
* `POST /` - Create a group.
* `POST /join` - Join a group using an invite code.
* `GET /` - List all groups for the authenticated user.
* `PATCH/:groupId` - Rename group name (owner only).
* `DELETE/:groupId` - Delete group (owner only).
* `DELETE/:groupId/members/:memberId` - Remove member from group (owner only).
* `GET/:groupId/balances` - Retrieve calculated net balances for all members.
* `GET/:groupId/settlement-path` - Retrieve recommended debt-simplification transactions.
* `POST/:groupId/settlements` - Record a manual transaction between two users.

### Expenses (`/api/expenses`)
* `POST /` - Create an expense (supports equal, exact, percentage, shares splits).
* `PUT/:expenseId` - Update an expense details.
* `DELETE/:expenseId` - Delete an expense.
* `GET/group/:groupId` - List all expenses logged inside a group.

### System
* `GET /api/health` - Check backend system health and database connections status.

---

## Socket.io Event Bindings

All clients connect via `socket.handshake.auth.token`. Secure rooms are managed on a per-group level.

### Client-to-Server
* `join-group` (`groupId`) - Requests to enter a group room. Server validates membership before granting room join.
* `leave-group` (`groupId`) - Leaves a group room.

### Server-to-Client
* `expense-added` (`populatedExpense`) - Emitted inside a group room when a new expense is successfully created.
* `balance-updated` (`balances`) - Emitted inside a group room containing recalculated net balances after any group transaction.
* `settlement-completed` (`populatedSettlement`) - Emitted inside a group room when a member records a settlement payment.

---

## Debt Simplification Algorithm

The system resolves group balances using a **Greedy Matching Algorithm**. It matches the group's largest debtor (who owes the most) with the largest creditor (who is owed the most), schedules a transaction for the maximum possible intersection, updates their accounts, and repeats. Re-sorting the remaining participants is kept efficient at $O(\log n)$ using binary search insertion, yielding an overall computational complexity of **$O(n \log n)$** with the minimum number of payments.

---

## Deployment Notes

* **Backend:** Deploy the Node.js Express server to services like **Render**, **Railway**, or **Heroku**.
* **Frontend:** Deploy the Vite static bundle to **Vercel**, **Netlify**, or **GitHub Pages**.
* **Database:** Provision a managed cluster on **MongoDB Atlas** and configure its connection string in your production environment variables.