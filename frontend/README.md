# Warehouse Management System - Frontend

This is the React web application for the Warehouse Management System.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Backend API running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

### Default Login Credentials

After backend setup:
- Email: admin@test.com
- Password: password123

Or register a new account!

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner

## Features

- ✅ User Authentication (Login/Register)
- ✅ Dashboard with Statistics
- ✅ Orders Management
- ✅ Inventory Tracking
- ✅ Responsive Design
- ✅ Modern UI with smooth animations

## Technology Stack

- React 18
- React Router v6
- Axios for API calls
- CSS3 for styling
- Context API for state management

## Project Structure

```
src/
├── api/              # API client and endpoints
├── context/          # React Context (Auth)
├── utils/            # Utility functions
├── pages/            # Page components
│   ├── auth/         # Login, Register
│   ├── dashboard/    # Dashboard
│   ├── orders/       # Orders pages
│   └── inventory/    # Inventory pages
├── App.js            # Main app component
└── index.js          # Entry point
```

## API Integration

The frontend connects to the backend API at `http://localhost:3000/api`.

All API calls are authenticated using JWT tokens stored in localStorage.