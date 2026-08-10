# Technical Design Specification: "Split" Expense Manager (Serverless Edge Architecture)

## 1. Overview

This document outlines the architecture, data models, and core logic for a peer-to-peer expense splitting application. The system is designed to operate with near-zero hosting costs using a fully serverless edge infrastructure. Group functionality is out of scope.

**New Requirement:** The system operates on a gated-access model. All newly registered users must be explicitly approved by an administrator before they can successfully log in and interact with the application.

## 2. System Architecture

The application utilizes a globally distributed edge computing model.

- **Frontend (Static UI):** Next.js configured as a Static Site Generator (`output: 'export'`). Hosted on **Cloudflare Pages**.
- **Backend (API):** **Cloudflare Workers** utilizing the **Hono.js** framework for high-performance edge routing.
- **Database:** **Cloudflare D1** (Serverless SQLite).
- **Authentication:** JWT-based stateless sessions stored in secure HTTP-only cookies.

---

## 3. Data Design (Cloudflare D1 SQLite Schema)

### Core Tables

| Table             | Column          | Type           | Description                                     |
| :---------------- | :-------------- | :------------- | :---------------------------------------------- |
| **Users**         | `id`            | TEXT (UUID PK) | Unique identifier                               |
|                   | `email`         | TEXT (UNIQUE)  | User login                                      |
|                   | `password_hash` | TEXT           | Hashed credentials                              |
|                   | `name`          | TEXT           | Display name                                    |
|                   | `is_approved`   | INTEGER        | **Default `0` (False). Must be `1` to log in.** |
|                   | `is_admin`      | INTEGER        | Default `0`. `1` designates the system admin.   |
| **Friends**       | `user_id_1`     | TEXT (FK)      | References Users.id                             |
|                   | `user_id_2`     | TEXT (FK)      | References Users.id                             |
| **Expenses**      | `id`            | TEXT (UUID PK) | Unique identifier                               |
|                   | `payer_id`      | TEXT (FK)      | Who paid the initial bill (References Users)    |
|                   | `amount`        | REAL           | Total cost of the expense                       |
|                   | `name`          | TEXT           | Title (e.g., "Dinner at Cyber Pearl")           |
|                   | `description`   | TEXT           | Optional details                                |
|                   | `created_at`    | INTEGER        | Unix timestamp                                  |
| **ExpenseSplits** | `id`            | TEXT (UUID PK) | Unique identifier                               |
|                   | `expense_id`    | TEXT (FK)      | References Expenses.id                          |
|                   | `user_id`       | TEXT (FK)      | The person who owes a share                     |
|                   | `amount_owed`   | REAL           | The calculated monetary share                   |
|                   | `is_paid`       | INTEGER        | Default `0` (false). `1` (true) when settled.   |

### Tagging System

| Table           | Column       | Type           | Description                                |
| :-------------- | :----------- | :------------- | :----------------------------------------- |
| **Tags**        | `id`         | TEXT (UUID PK) | Unique identifier                          |
|                 | `name`       | TEXT           | Tag label (e.g., "Groceries", "Utilities") |
| **ExpenseTags** | `expense_id` | TEXT (FK)      | References Expenses.id                     |
|                 | `tag_id`     | TEXT (FK)      | References Tags.id                         |

---

## 4. Core Business Logic (Worker Execution)

### A. Authentication & Admin Approval Workflow

1.  **Registration:** A user submits their details. The Worker inserts the record into the `Users` table with `is_approved = 0`.
2.  **Login Attempt:** If an unapproved user attempts to log in, the backend verifies the password but checks the `is_approved` flag. If it is `0`, the API rejects the login with a `403 Forbidden` status and a message indicating the account is pending admin approval.
3.  **Approval:** The administrator (identified by `is_admin = 1`) fetches a list of pending users and toggles their `is_approved` status to `1` via a protected admin endpoint. Once approved, the user receives a JWT on their next login attempt.

### B. Expense Creation & Splitting

1.  **Validation:** The Worker ensures the sum of all calculated splits equals the exact `amount` in the payload.
2.  **D1 Batch Insertion:** Executed in a single transaction array:
    - `INSERT` into `Expenses`.
    - Multiple `INSERT` statements into `ExpenseSplits` (payer defaults to `is_paid = 1`, others `is_paid = 0`).
    - Multiple `INSERT` statements into `ExpenseTags`.

### C. Settlement (Marking as Paid)

- The Worker executes an `UPDATE ExpenseSplits SET is_paid = 1 WHERE expense_id = ? AND user_id = ?`.

---

## 5. Aggregation Queries (D1 Views)

Mathematical reductions are executed directly inside D1 SQL queries by the Worker.

- **Total Cash Out (Total Spent):**
  `SELECT SUM(amount_owed) FROM ExpenseSplits WHERE user_id = ?`
- **Total IOUs (What I Owe):**
  `SELECT SUM(s.amount_owed) FROM ExpenseSplits s JOIN Expenses e ON s.expense_id = e.id WHERE s.user_id = ? AND s.is_paid = 0 AND e.payer_id != ?`
- **Total Money Lent (What Others Owe Me):**
  `SELECT SUM(s.amount_owed) FROM ExpenseSplits s JOIN Expenses e ON s.expense_id = e.id WHERE e.payer_id = ? AND s.is_paid = 0 AND s.user_id != ?`
- **Tag-Based Analytics:**
  `SELECT t.name, SUM(s.amount_owed) FROM ExpenseSplits s JOIN ExpenseTags et ON s.expense_id = et.expense_id JOIN Tags t ON et.tag_id = t.id WHERE s.user_id = ? GROUP BY t.name`

---

## 6. API Endpoints (Hono.js Router)

| Endpoint                       | Method | Action                                              |
| :----------------------------- | :----- | :-------------------------------------------------- |
| `/api/auth/register`           | POST   | Creates user with `is_approved = 0`.                |
| `/api/auth/login`              | POST   | Rejects if `is_approved == 0`. Returns JWT if `1`.  |
| `/api/admin/users/pending`     | GET    | **(Admin Only)** Lists users awaiting approval.     |
| `/api/admin/users/:id/approve` | PATCH  | **(Admin Only)** Sets `is_approved = 1` for a user. |
| `/api/friends`                 | POST   | Adds a bidirectional record in `Friends`.           |
| `/api/expenses`                | POST   | Accepts expense payload, executes D1 batch insert.  |
| `/api/expenses/:id/settle`     | PATCH  | Updates `ExpenseSplits.is_paid` to `1`.             |
| `/api/users/me/dashboard`      | GET    | Returns aggregated JSON (Cash Out, Lent, IOUs).     |
| `/api/users/me/tags`           | GET    | Returns D1 aggregated spend grouped by Tag.         |

---

## 7. Deployment & Cost Strategy

- **Next.js Frontend:** Run `next build` (`output: 'export'`). Push the `/out` directory to **Cloudflare Pages**.
- **API & Database:** Deploy the Hono.js routing logic via Wrangler CLI to **Cloudflare Workers**, bound to a **D1 Database**.
- **CORS Management:** The Worker will inject strict `Access-Control-Allow-Origin` headers into responses to accept cross-origin requests exclusively from your Pages frontend domain.
