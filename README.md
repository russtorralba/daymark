# DayMark

DayMark is a simple, browser-only deadline planner built with React and Vite. It gives you a focused view of what is due today, coming up, overdue, and complete—without accounts, servers, or external services.

## Features

- Add, edit, and delete tasks
- Capture a task title, optional project, due date, priority, and status
- View dashboard counts for tasks due today, upcoming, overdue, and completed
- Search by task or project name
- Filter by status and priority, then sort by due date
- Clearly highlight deadlines that are due today or overdue
- Use responsive layouts on desktop and mobile
- Start with clearly labeled fictional sample tasks

## Local development

Prerequisite: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local address in the terminal (usually `http://localhost:5173`).

To create a production build or run the code-quality check:

```bash
npm run lint
npm run build
```

## Data storage

DayMark stores tasks in the browser's `localStorage` only. Tasks remain available after refresh in that browser and profile, but are not synced to a database, user account, or external service. Clearing the browser's site data will remove them.

## Scope

This first version intentionally has no login, database, notifications, payments, or external integrations.
