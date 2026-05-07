# Supply Chain Management System

A comprehensive web-based Supply Chain Management System designed to handle logistics, inventory, and warehouse operations efficiently. The system provides secure user authentication, product management, and communication features.

## 🚀 Features

- **User Authentication & Authorization**: Secure login and role-based access control using JWT.
- **Dashboard**: Overview of operations, long positions held, and quick actions.
- **Product Management**: View detailed product information and register long positions.
- **Marketplace**: Browse and manage available products and resources.
- **Real-time Communication**: Integrated ChatInbox.
- **Reporting**: Generate PDF reports and invoices.

## 🛠️ Technology Stack

**Frontend**
- React 18
- React Router DOM
- Axios for API communication
- Tailwind CSS / PostCSS

**Backend**
- Node.js & Express.js
- PostgreSQL (pg)
- JSON Web Tokens (JWT) & bcryptjs for security
- express-validator for robust data validation
- PDFKit for report generation

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and configure your database connection, JWT secret, and other environment variables.
4. (Optional) Run database seeders:
   ```bash
   npm run seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend application will run on `http://localhost:3000`.

## 👥 Contributors

This project is developed and maintained by:

- **S.M. Fahim Abrar**
- **Mohammad Sadman Saad**
- **Saibul Haque Jessan**
