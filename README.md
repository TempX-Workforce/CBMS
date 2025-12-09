🏛️ College Budget Management System (CBMS)

A full-stack web application for managing institutional budgets, expenditures, approvals, and financial reporting in colleges and universities.

    


---

📌 Overview

CBMS centralizes budget allocation, departmental spending, multi-level approvals, and reporting into a single secure platform.
Designed to replace manual tracking, Excel sheets, and error-prone approval processes.

✅ Why CBMS?

Role-based financial control

Transparent approval workflows

Real-time budget utilization

Audit-ready transaction history



---

✨ Core Features

🔐 Authentication & Security

JWT-based authentication

Role-based access control (RBAC)

Encrypted passwords (bcrypt)

Secure API middleware


💰 Budget & Expenditure

Financial year–based allocations

Department-wise budgets

Expenditure submission with documents

Multi-level approval workflow


📊 Reports & Analytics

Dashboard insights

Department & year-wise reports

Budget utilization tracking

Export to PDF / Excel


📁 File Management

Secure uploads

Validation (type & size)

Download tracking



---

👤 User Roles

Role	Capabilities

Admin	Full system control
Finance Officer	Budget allocation & approvals
HOD	Department-level approvals
Department User	Submit expenditures
Principal / VP	High-value approvals
Auditor	Read-only audit access



---

🛠️ Tech Stack

Frontend

React 19

React Router

Axios

Chart.js

Context API


Backend

Node.js + Express

MongoDB + Mongoose

JWT Authentication

Multer (File Uploads)


Tools & Security

Helmet

CORS

Rate Limiting

ESLint + Prettier



---

🏗️ Architecture

Client (React)
   ↓
REST API (Node + Express)
   ↓
MongoDB Database


---

🚀 Quick Start

Prerequisites

Node.js ≥ 18

MongoDB ≥ 4.4

Git


Setup

git clone https://github.com/your-username/cbms.git
cd cbms

# Backend
cd server
npm install
npm run dev

# Frontend
cd ../client
npm install
npm start

Frontend: http://localhost:3000

API: http://localhost:5000/api



---

⚙️ Environment Configuration

Server .env

MONGO_URI=mongodb://localhost:27017/cbms
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development

Client .env

REACT_APP_API_URL=http://localhost:5000/api


---

📚 API Overview

Auth

POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile

Budget & Expenditure

GET  /api/budgets
POST /api/expenditures
PUT  /api/expenditures/:id

Reports

GET /api/reports/dashboard
GET /api/reports/audit


---

🐳 Docker Support

docker-compose up --build

Supports:

Backend container

Frontend container

MongoDB service



---

🤝 Contributing

1. Fork the repo


2. Create a feature branch


3. Commit with clear messages


4. Open a Pull Request




---

📄 License

Licensed under the ISC License.


---

🔮 Roadmap

🔔 Real-time notifications

📱 Mobile app

📈 Advanced analytics

🔐 Enhanced security



---

⭐ Support

GitHub Issues

Documentation

Community Discussions



---

CBMS – Built for real institutions, not demo projects.


---
