# Project Architecture & Codebase Documentation

This document provides a comprehensive, verbose explanation of the entire codebase, its purpose, and how all components work interactively. It is designed to be processed by natural language LLMs and human developers who need to understand the system at a deep level.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Backend Data Model (Supabase)](#backend-data-model-supabase)
3. [Frontend Architecture](#frontend-architecture)
4. [Auth Flow and Role Mapping](#auth-flow-and-role-mapping)
5. [Layout, Navigation & Localization](#layout-navigation--localization)
6. [Keyboard Shortcuts Infrastructure](#keyboard-shortcuts-infrastructure)
7. [Localization (i18n)](#localization-i18n)
8. [Login Flow and Role Experiences](#login-flow-and-role-experiences)
9. [Tasks Page: Core Workflow Hub](#tasks-page-core-workflow-hub)
10. [Dashboard: Role-Aware Summary](#dashboard-role-aware-summary)
11. [Customers & Employees Management](#customers--employees-management)
12. [Reports Page: Execution Logs & Approval](#reports-page-execution-logs--approval)
13. [Invoices Page: Financial Tracking](#invoices-page-financial-tracking)
14. [Notifications Concept (Derived, Not Stored)](#notifications-concept-derived-not-stored)
15. [PHP API Folder](#php-api-folder)
16. [Summary of the Interactive Experience (Per Role)](#summary-of-the-interactive-experience-per-role)
17. [UI Feedback & Reloading](#ui-feedback--reloading)

---

## Project Overview

This project is a **role-based service management web application** built with:

- **React** (Vite-based SPA, not Next.js despite some documentation references)
- **React Router** (client-side routing with App shell + nested routes)
- **Supabase** (PostgreSQL database + Authentication + Row Level Security)
- **React Query** (data fetching, caching, and synchronization)
- A small **PHP API** folder (legacy/auxiliary; main app talks directly to Supabase)

The purpose of this application is to support a **linear but multi-role workflow**:

1. **ADMIN** creates tasks and handles invoicing/payment tracking
2. **EMPLOYEE (WORKER)** sees *only their tasks* and completes them
3. **MANAGER** validates and approves completed work
4. **ADMIN** invoices approved tasks and tracks payment status

The frontend is intentionally **explicit and state-driven**, meaning a user can see what is happening at each step without guessing. Most logic is concentrated in:

- `frontend/src/lib/*` (Supabase client, roles, translations, keybinds)
- `frontend/src/contexts/AuthContext.jsx` (authentication + role mapping)
- `frontend/src/components/layout/*` (shell, header, sidebar, route protection)
- `frontend/src/pages/*` (Dashboard, Tasks, Customers, Employees, Reports, Invoices)
- `sql/*.sql` (schema, migrations, mock/demo data)

Below is a structured explanation of the entire codebase and how everything works together.

---

## Backend Data Model (Supabase)

### Core Tables

The Supabase database (see `sql/schema.sql` and `sql/migrations.sql`) defines the main domain:

#### `employee` Table

- **Fields:**
  - `id SERIAL PRIMARY KEY`
  - `first_name VARCHAR(50) NOT NULL`
  - `last_name VARCHAR(50) NOT NULL`
  - `role employee_role NOT NULL` (enum: `GL`, `ADMIN`, `BL`, `MA`)

- **Conceptual roles:**
  - `GL` or `ADMIN` → ADMIN (spec role)
  - `BL` → MANAGER (spec role)
  - `MA` → WORKER (spec role)

#### `customer` Table

- Basic customer contact data: `id`, `first_name`, `last_name`, `address`, `phone`, `email`

#### `task` Table

- **Fields:**
  - `id SERIAL PRIMARY KEY`
  - `created_at DATE NOT NULL DEFAULT CURRENT_DATE`
  - `scheduled_date DATE`
  - `description TEXT`
  - `status task_status NOT NULL DEFAULT 'CREATED'` (enum: `CREATED`, `ASSIGNED`, `COMPLETED`, `APPROVED`, `INVOICED`)
  - `contact_customer_id INT NOT NULL` (FK to `customer`)
  - `billing_customer_id INT NOT NULL` (FK to `customer`)
  - `employee_id INT` (FK to `employee`, nullable until assigned)

- **Extended by migrations:**
  - `priority VARCHAR(20) DEFAULT 'normal'` (values: `low`, `normal`, `high`)
  - `location_address VARCHAR(200)`
  - `notes TEXT`
  - `created_by_id INT` (FK to `employee`)
  - `completed_at TIMESTAMP`
  - `approved_at TIMESTAMP`
  - `approved_by_id INT` (FK to `employee`)

#### `report` Table

- **Fields:**
  - `id SERIAL PRIMARY KEY`
  - `report_date DATE NOT NULL DEFAULT CURRENT_DATE`
  - `description TEXT`
  - `task_id INT NOT NULL` (FK to `task`)

- **Extended by migrations:**
  - `work_performed TEXT`
  - `hours_worked NUMERIC(5,2)`
  - `materials_used TEXT`
  - `work_start_time TIMESTAMP`
  - `work_end_time TIMESTAMP`

Each report is tied to a specific task and documents work done.

#### `invoice` Table

- **Fields:**
  - `id SERIAL PRIMARY KEY`
  - `invoice_date DATE NOT NULL DEFAULT CURRENT_DATE`
  - `amount NUMERIC(10,2) NOT NULL`
  - `task_id INT NOT NULL` (FK to `task`)

- **Extended by migrations:**
  - `subtotal NUMERIC(10,2)`
  - `tax_rate NUMERIC(5,2) DEFAULT 8.1`
  - `tax_amount NUMERIC(10,2)`
  - `total_amount NUMERIC(10,2)`
  - `payment_status VARCHAR(20) DEFAULT 'unpaid'` (conceptually `UNPAID` or `PAID`)
  - `payment_date DATE`
  - `invoice_notes TEXT`

#### `user_account` Table

- **Purpose:** Links **Supabase Auth users** to **employee** rows
- **Fields:**
  - `id SERIAL PRIMARY KEY`
  - `employee_id INT REFERENCES employee(id) UNIQUE`
  - `email VARCHAR(100) UNIQUE NOT NULL`
  - `supabase_user_id UUID UNIQUE` (links to Supabase Auth user UUID)
  - `is_active BOOLEAN DEFAULT TRUE`
  - `created_at TIMESTAMP DEFAULT NOW()`

- **RLS:** Configured so authenticated users can read/update their own `user_account` row

### Row Level Security (RLS)

Migrations enable RLS and then apply a simple, permissive policy:

- For `customer`, `employee`, `task`, `report`, `invoice`:
  - Policy: **"Allow all for authenticated"**
  - Effect: any authenticated user (i.e. logged-in user) can `SELECT/INSERT/UPDATE/DELETE`
  - The app still enforces **role-based behavior** in the UI; RLS is deliberately simple to reduce friction for this exercise

---

## Frontend Architecture

### Entry Point & Routing

- **`src/main.jsx`** bootstraps React with:
  - React Router
  - React Query client
  - `AuthProvider` (auth context)
  - `LanguageProvider` (i18n)

- **`src/App.jsx`** defines the route tree:

  - `/login` → `Login` page
  - `/` → wrapped by:
    - `ProtectedRoute` (auth + employee link + per-route role checks)
    - `AppLayout` (sidebar + header + outlet)
  - Nested under `/`:
    - `/dashboard` → `Dashboard`
    - `/tasks` → `Tasks` (always accessible if logged in and has employee)
    - `/customers` → `Customers` (ADMIN/MANAGER only)
    - `/employees` → `Employees` (ADMIN/MANAGER only)
    - `/reports` → `Reports`
    - `/invoices` → `Invoices` (ADMIN only)

**Key design point:**  
The **Tasks page is never role-blocked** by route guards. All three roles can reach `/tasks` and see a view adapted to their role.

---

## Auth Flow and Role Mapping

### Supabase Client & Current User

- **`lib/supabase.js`**:

  - Creates the Supabase client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  - Exposes:

    ```js
    export async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userAccount } = await supabase
        .from('user_account')
        .select('*, employee(*)')
        .eq('supabase_user_id', user.id)
        .maybeSingle();

      if (!userAccount) return { ...user, employee: null, role: null };

      return {
        ...user,
        employee: userAccount.employee ?? null,
        role: userAccount.employee?.role ?? null, // backend role (GL/ADMIN/BL/MA)
      };
    }
    ```

  - Also exports `signIn` and `signOut` wrappers for email/password login and logout

### Role Model Conversion

- **`lib/roles.js`**:

  ```js
  const BACKEND_TO_SPEC = {
    GL: 'ADMIN',
    ADMIN: 'ADMIN',
    BL: 'MANAGER',
    MA: 'WORKER',
  };

  export function toSpecRole(backendRole) {
    if (!backendRole) return 'WORKER';
    return BACKEND_TO_SPEC[backendRole] ?? 'WORKER';
  }

  export const SPEC_ROLES = ['ADMIN', 'MANAGER', 'WORKER'];
  ```

- Backend `employee.role` stays as-is (`GL`, `ADMIN`, `BL`, `MA`), but **the UI only ever uses** spec roles: `'ADMIN' | 'MANAGER' | 'WORKER'`

### Auth Context

- **`contexts/AuthContext.jsx`**:

  - Holds `user`, `loading`, `role`, `hasLinkedEmployee`
  - On mount:
    - Calls `getCurrentUser()`
    - Subscribes to `supabase.auth.onAuthStateChange` and updates `user` on login/logout
  - Derives:
    - `role = toSpecRole(user?.role)` (spec role)
    - `hasLinkedEmployee = !!user?.employee`
  - Exposes `signOut()` that clears state and navigates to `/login`

### Route Protection & Blocking State

- **`components/layout/ProtectedRoute.jsx`**:

  - If `loading`: shows full-screen spinner
  - If `!user`: redirects to `/login`
  - If **user exists but `employee === null`**:
    - Shows blocking screen with explicit text:

      > "No employee account linked. Contact your administrator."

    - A "Back to login" button that calls `signOut()`

  - If `allowedRoles` is provided and `role` is not in it:
    - Shows full-screen "Access denied" message

  - Otherwise: renders `children`

This ensures there is **no silent fallback user** and no ambiguous blank screen when the employee link is missing.

---

## Layout, Navigation & Localization

### Sidebar (Navigation & Role Adaptation)

- **`components/layout/Sidebar.jsx`**:

  - Defines navigation sections (`overview`, `work`, `data`, `finance`) with items and allowed roles
  - Uses `useAuth()` to get `role` and `user`
  - Uses `useLanguage()` to translate labels
  - Key behavior:

    - **ADMIN:**
      - Dashboard, Tasks, Customers, Employees, Reports, Invoices
    - **MANAGER:**
      - Dashboard, Tasks, Customers, Employees, Reports (no Invoices)
    - **WORKER:**
      - Dashboard, `myTasks` label for `/tasks`, Reports

  - Shows current user's name and spec role in footer

### Header (Breadcrumbs, Language, Bell, Logout)

- **`components/layout/Header.jsx`**:

  - Computes breadcrumb from current path:
    - `Service / Dashboard`
    - `Service / Tasks`
    - etc.
  - Shows route-specific description (subtitle) when defined
  - Contains:
    - **Language switcher** (EN/DE) using `useLanguage()`; language is stored in `localStorage`
    - **Notification bell** (currently visual; planned to be wired with derived notifications)
    - **User avatar** (initials from `employee` name) and Logout button

### App Layout & Global Shortcut Help

- **`components/layout/AppLayout.jsx`**:

  - Provides fixed sidebar + header + main content layout
  - Integrates **global keyboard listener** (`useKeybindListener`) from `lib/keybinds.js`
  - Maintains `showHelp` state and shows **Keyboard Shortcuts Help** modal:

    - Lists currently implemented keybindings (initially Ctrl-based; to be converted to Super/META pattern)
    - Explains what each shortcut does
    - Closes via Esc or "Cancel" button

  - This component is where global keyboard events are turned into **custom DOM events** (`keybind:*`) that pages can listen to without knowing about raw keyboard events

---

## Keyboard Shortcuts Infrastructure

### Keybind Normalization

- **`lib/keybinds.js`**:

  - Defines normalized key constants:

    ```js
    export const KEY = {
      CLOSE_MODAL: 'Escape',
      FOCUS_SEARCH: 'Ctrl+K',
      CREATE_TASK: 'Ctrl+N',
      HELP: 'Ctrl+/',
    };
    ```

  - `normalizeKey(e)`:
    - Returns `'Escape'` if `e.key === 'Escape'`
    - Returns `'Ctrl+K'`, `'Ctrl+N'`, `'Ctrl+/'` when Ctrl (or Meta) + respective key are pressed
    - Returns `null` otherwise

  - `isInputTarget(e)`: returns true if target is an `input`, `textarea`, or `contenteditable` element

  - `useKeybindListener(callback)`:
    - Adds `keydown` listener on `document`
    - Determines normalized key
    - **Important behavior:**
      - For non-Escape keys, it **skips** when focus is in an editable input (so it doesn't hijack typing)
      - Calls `e.preventDefault()` and then `callback(key)`

### App-Level Routing of Key Events

- In `AppLayout`:

  - `handleKey(key)`:

    - `Escape` → closes help modal, dispatches `keybind:close-modal`
    - `Ctrl+K` → dispatches `keybind:focus-search` (Tasks page uses this)
    - `Ctrl+N` → dispatches `keybind:create-task` (Tasks page responds for ADMIN)
    - `Ctrl+/` → opens Shortcut Help modal

  - This creates a **decoupling**:
    - Key events → normalized KEY string → `AppLayout` decides what semantic events to emit
    - Pages (Tasks, etc.) listen for semantic events (`keybind:create-task`, `keybind:close-modal`, `keybind:focus-search`) and act accordingly

This infrastructure is ready to be extended to the **Super/META** keybinding scheme you described (e.g. `Super+D`, `Super+T`), without changing every page.

---

## Localization (i18n)

- **`lib/translations.js`**:
  - Simple EN/DE dictionaries for:
    - Sidebar labels
    - Page titles & subtitles
    - Primary buttons
    - Shortcut labels
  - `getStoredLang()` / `setStoredLang()` store language in `localStorage`
  - `t(lang, key)` returns translated string, falling back to English

- **`hooks/useLanguage.jsx`**:
  - Provides `LanguageContext` with `{ lang, setLang, t }`
  - `LanguageProvider`:
    - Initializes `lang` from `localStorage`
    - Persists `lang` when changed
    - `t(key)` is a memoized wrapper around `translations`

Throughout the app, any text capable of being localized goes through `t('key')`.

---

## Login Flow and Role Experiences

### Login Page

- **`pages/Login.jsx`** (not shown here in full, but conceptually):
  - Uses Supabase Auth's `signInWithPassword`
  - On success, Supabase's auth listener in `AuthContext` updates `user` and triggers navigation into the protected app
  - On failure, shows error messages

### After Login

- **Auth initialization:**
  - `AuthProvider` calls `getCurrentUser()`
  - `user` is decorated with:
    - `employee` (joined employee record)
    - `role` (backend role, further mapped to spec role by `toSpecRole`)

- **If no `user_account` row or employee link:**
  - `ProtectedRoute` shows the **blocking message** and forces logout to `/login`

- **Role mapping:**
  - `GL` or `ADMIN` → `role = 'ADMIN'`
  - `BL` → `role = 'MANAGER'`
  - `MA` → `role = 'WORKER'`

From there, the **Sidebar**, **Header**, and all pages adapt behavior and labels based on `role`.

---

## Tasks Page: Core Workflow Hub

- **`pages/Tasks.jsx`** is the central UI for the operational workflow.

### Data Loading & Normalization

- Loads tasks via React Query:

  ```js
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', role, user?.employee?.id],
    queryFn: async () => {
      let query = supabase
        .from('task')
        .select(
          '*, customer:contact_customer_id(first_name, last_name), employee(first_name, last_name)'
        );

      if (role === 'WORKER' && user?.employee?.id != null) {
        const eid = Number(user.employee.id);
        if (!Number.isNaN(eid)) query = query.eq('employee_id', eid);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data ?? [];
    },
  });
  ```

- **Important:** EMPLOYEE filtering uses a **numeric** employee id, preventing string/number mismatches

- Customers and Employees (for selects) are loaded via separate `useQuery` hooks

### Role-Based Titles & Actions

- Page heading:

  - ADMIN/MANAGER: `t('tasksPage')` ("Tasks")
  - WORKER: `t('myTasks')` ("My Tasks")

- Subtitle:

  - Describes overall purpose (manage or see tasks). Can be role-differentiated using `tasksSubtitle` and role context

- **Create Task button:**
  - Visible **only for ADMIN**
  - Opens Create Task modal

### Task Table

Each row shows:

- **Status badge** with status class (e.g. `status-created`, `status-assigned`, etc.)
- **Description**
- **Customer** (contact customer)
- **Worker (employee)** or "Unassigned"
- **Priority** (Low/Normal/High)
- **Actions** column based on role and status:

  - `canAssign(role)`:
    - Returns true for **MANAGER or ADMIN**
    - When status is `CREATED`, shows "Assign" button (translated label)
  - `canComplete(role, task, userId)`:
    - Returns true when:
      - role is `'WORKER'`
      - task status is `'ASSIGNED'`
      - `Number(task.employee_id) === Number(userId)`
    - Shows "Complete" button
  - `canInvoice(role, task)`:
    - True when role is `'ADMIN'` and status is `'APPROVED'`
    - Shows "Invoice" button that opens Invoice modal

> Note: Task **approval** (COMPLETED → APPROVED) is intentionally managed on the **Reports** page by MANAGERs, per the workflow spec.

### Empty, Loading, and Filtered States

- While loading: spinner with loading wrapper
- In table body:

  - If **no tasks at all** (`tasks?.length === 0`):
    - Shows "No tasks found."
  - If tasks exist but `filteredTasks.length === 0` due to filters/search:
    - Shows "No tasks match the filter."

This prevents situations where "No tasks found" displays despite tasks existing in the database.

(An additional error state with Retry/Reload is straightforward to add by checking `isError` from React Query and showing a Reload button that invalidates `['tasks']`.)

### Modals

#### Create Task Modal (ADMIN)

- Opens from "Create Task" button or keyboard shortcut
- Fields:
  - Description (required)
  - Customer (required select)
  - Priority (low/normal/high)
  - Location (optional)
  - Notes (optional)
- On submit:
  - Validates locally (simple checks)
  - Inserts into `task` with:
    - `status = 'CREATED'`
    - `contact_customer_id`, `billing_customer_id`
    - `priority`, `location_address`, `notes` if provided
    - `created_by_id` = current employee id (if present)
  - On success:
    - Closes modal
    - Clears form
    - Invalidates `['tasks']`, `['dashboard-task-count']`, `['dashboard-recent-tasks']` caches

#### Assign Task Modal (ADMIN/MANAGER)

- Opens when clicking "Assign" in Actions column
- Fields:
  - Employee select (required)
- On submit:
  - Validates employee choice
  - Updates `task`:
    - `employee_id = selected employee id`
    - `status = 'ASSIGNED'`
  - On success:
    - Closes modal
    - Invalidates task-related queries

This is the point where a task becomes visible in the target EMPLOYEE's "My Tasks" view.

#### Invoice Modal (ADMIN)

- Opens from "Invoice" button for APPROVED tasks
- Fields:
  - Amount (CHF) – required numeric
  - Note – optional
- On submit:
  - Inserts into `invoice` with `task_id`, `amount`, `invoice_notes` (if present)
  - Updates task:
    - `status = 'INVOICED'`
    - May set `completed_at` and `approved_at` timestamps if missing (so that lifecycle is complete)
  - Invalidates `['tasks']`, `['dashboard-task-count']`, `['dashboard-recent-tasks']`, `['invoices']`

### Keyboard Interaction on Tasks

- A `useEffect` in `Tasks.jsx` listens for:

  - `keybind:close-modal` → closes Create, Assign, Invoice modals
  - `keybind:create-task` → opens Create modal when `role === 'ADMIN'`
  - `keybind:focus-search` → focuses search input

This allows the app-level keyboard infrastructure to control page behavior without coupling to actual DOM keys.

---

## Dashboard: Role-Aware Summary

- **`pages/Dashboard.jsx`**:

  - Uses `useAuth()` to get `user` and `role`
  - Shows greeting with user's first name
  - Uses React Query to:

    - Count tasks:
      - **EMPLOYEE:** only tasks where `employee_id == normalized employee id`
      - ADMIN/MANAGER: all tasks
    - Count employees, customers, invoices
    - Show recent tasks (similarly filtered for EMPLOYEEs)

These queries reuse the same **numeric filtering** pattern to avoid string/number mismatches and to ensure EMPLOYEEs see a consistent subset of the data.

---

## Customers & Employees Management

- **`pages/Customers.jsx`** and **`hooks/useCustomers.js`**:

  - Provide list, create, update, delete operations for customers via Supabase
  - Only accessible to ADMIN and MANAGER

- **`pages/Employees.jsx`**:

  - Lists employees
  - Allows adding employees (depending on implementation)
  - Also protected to ADMIN/MANAGER

These pages are relatively straightforward CRUD wrappers over the `customer` and `employee` tables.

---

## Reports Page: Execution Logs & Approval

- **`pages/Reports.jsx`**:

  - Fetches **all reports** with joined task info:

    ```js
    supabase
      .from('report')
      .select('*, task(id, description, status, contact_customer_id, employee_id)')
      .order('report_date', { ascending: false });
    ```

  - EMPLOYEE-facing behavior:

    - A **"Submit report"** form is shown if:
      - `role === 'WORKER'`
      - Worker has ASSIGNED tasks (from a separate query filtering on employee_id and status = 'ASSIGNED')
    - The form:
      - Lets worker pick one of their ASSIGNED tasks
      - Enter work description, hours, materials
      - On submit:
        - Inserts into `report`
        - Updates task to `status = 'COMPLETED'`
        - Invalidates `['reports']`, `['my-assigned-tasks']`, `['tasks']`, `['dashboard-recent-tasks']`

    - This gives EMPLOYEEs a concrete place to "close out" work

  - MANAGER-facing behavior:

    - The reports table lists all reports
    - For each report, if the associated task has `status === 'COMPLETED'`, MANAGER sees:
      - **Approve** button:
        - Updates task to `status = 'APPROVED'`
      - **Reject** button:
        - Updates task back to `status = 'ASSIGNED'`
    - Only MANAGERs see these actions; ADMIN and EMPLOYEE do not

  - ADMIN-facing behavior:

    - ADMIN also sees the full list of reports, but **without approve/reject buttons**
    - Approved tasks (status = APPROVED) then feed into the **Tasks → Invoice** flow for ADMIN

This cleanly enforces the "EMPLOYEE completes, MANAGER approves, ADMIN invoices" split.

---

## Invoices Page: Financial Tracking

- **`pages/Invoices.jsx`**:

  - Lists invoices with:

    ```js
    supabase
      .from('invoice')
      .select('*, task(id, description, status)')
      .order('invoice_date', { ascending: false });
    ```

  - Shows:
    - Invoice date
    - Task description (or fallback to `Task #id`)
    - Amount
    - `payment_status` (from DB; can be UNPAID/PAID conceptually)
  - Empty state: "No invoices yet. Create one from an approved task on the Tasks page."

This page is the natural place to add:

- ADMIN-only **"Mark as paid"** actions
- Visual differentiation between PAID/UNPAID via CSS classes
- Subtle completion feedback (e.g. green outline/animation) when an invoice is marked as paid

---

## Notifications Concept (Derived, Not Stored)

While a dedicated notification feature is not yet fully implemented, the design is clear and compatible with the current codebase:

- Implementable via a `useNotifications` hook that:
  - Uses Supabase queries to derive "urgent" items based on role
  - Polls every 30s via React Query
  - Stores read/unread state in localStorage keyed by user id

- Roles:

  - EMPLOYEE:
    - New ASSIGNED tasks where `employee_id == their id`
  - MANAGER:
    - Tasks with `status = COMPLETED` (awaiting approval)
    - Tasks with `status = CREATED` and `employee_id IS NULL` (unassigned)
  - ADMIN:
    - Tasks with `status = APPROVED` (ready for invoicing)
    - Invoices with `payment_status = 'PAID'` (if linked to tasks they care about)

- UI:
  - Bell icon in `Header`:
    - Badge showing unread count
    - Dropdown listing notifications; clicking navigates to Tasks/Invoices and marks notification as read

This can be layered on top of existing pages without changing schema.

---

## PHP API Folder

- **`api/*.php`** (e.g. `assign_task.php`, `create_task.php`, etc.):

  - Legacy/simple PHP endpoints that operate directly on the PostgreSQL database using PDO
  - Implement basic JSON REST semantics with CORS headers
  - In the current frontend, the app does **not** rely on these; instead, it uses the Supabase client directly
  - They provide an alternate way to interact with the DB (e.g. from an external tool or alternate frontend)

---

## Summary of the Interactive Experience (Per Role)

### ADMIN

1. Logs in via Supabase Auth
2. Sidebar shows Dashboard, Tasks, Customers, Employees, Reports, Invoices
3. On **Dashboard:**
   - Sees counts of tasks/employees/customers/invoices and recent tasks
4. On **Tasks:**
   - Sees all tasks
   - Creates new tasks via "Create Task"
   - Assigns tasks to employees via Assign modal
   - After MANAGER approves a completed task, sees it as APPROVED and can invoice it
5. On **Reports:**
   - Sees all reports as informational context (no approve/reject)
6. On **Invoices:**
   - Sees all invoices and (with a small extension) can mark them as paid

### MANAGER

1. Logs in, mapped to role `'MANAGER'` from backend `BL`
2. Sidebar shows Dashboard, Tasks, Customers, Employees, Reports
3. On **Tasks:**
   - Sees all tasks
   - Assigns CREATED tasks to employees
   - Monitors statuses
4. On **Reports:**
   - Sees all reports
   - Uses Approve/Reject to move tasks between COMPLETED and APPROVED or back to ASSIGNED
5. On **Invoices:**
   - Has no direct access (Invoices page is ADMIN-only)

### EMPLOYEE (WORKER)

1. Logs in, mapped to `'WORKER'` from backend `MA`
2. Sidebar shows Dashboard, **My Tasks**, Reports
3. On **Tasks** ("My Tasks"):
   - Sees only tasks where `Number(task.employee_id) === Number(user.employee.id)`
   - If no tasks, sees a clear message explaining that no tasks are currently assigned
   - Completes ASSIGNED tasks via Complete button
4. On **Reports:**
   - Submits reports for ASSIGNED tasks
   - Sees their report history (potentially filterable to their own tasks)

---

## UI Feedback & Reloading

- React Query handles caching and refetching; manual reloads can be implemented by:

  - Adding a "Reload" button that calls:
    ```js
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    ```
    (and similar for other resource keys)
  - Displaying a small message like "Data refreshed" when `isFetching` transitions to false again

- Throughout, the design aim is:
  - **No silent failures**
  - Clear distinctions between:
    - Loading
    - Error (with retry)
    - True empty state (no data)
    - Filtered empty state (data exists but not matching current filters)

---

## Conclusion

This document should give an LLM (or any developer) enough context to:

- Understand the **business workflow** (ADMIN → EMPLOYEE → MANAGER → ADMIN)
- See how **roles** are derived and enforced
- Trace how **data flows** from Supabase into React components via React Query
- Understand each main page's purpose and interactions
- Safely extend the app with:
  - Super/META keyboard shortcuts 
  - A derived notifications system
  - Invoice payment actions and visual feedback
  - More explicit empty/error/reload states

The codebase is intentionally explicit and state-driven, making it easier to reason about behavior and debug issues by inspection.
