# 🏛️ College Budget Management System (CBMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-blue.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19-cyan.svg)](https://react.dev/)

A professional, enterprise-grade B2B web application designed to streamline institutional financial workflows. **CBMS** replaces archaic spreadsheets and manual tracking with a centralized, secure, and transparent budget management platform.

---

## 📌 Strategic Overview

CBMS is built for colleges and universities that require high-integrity financial control. It manages the entire lifecycle of institutional budgeting—from annual allocations to departmental expenditures and multi-level executive approvals.

### Core Value Propositions
*   **🏢 Institutional Integrity**: Built for the specific hierarchy of educational institutions.
*   **🔐 Audit-Ready Transparency**: Every transaction is timestamped, documented, and traceable.
*   **📊 Real-Time Fiscal Insights**: Dynamic dashboards provide an immediate pulse on budget health.
*   **⚡ Workflow Automation**: Say goodbye to physical files; approvals move through a digital chain of command.

---

## ✨ Features & Capabilities

### 🛡️ Security & Access Control
*   **RBAC (Role-Based Access Control)**: Strictly defined roles for Admins, Finance Officers, HODs, and Principals.
*   **JWT Authentication**: Secure, stateless authentication with protected routes.
*   **Industry Standard Encryption**: Bcrypt hashing for password security.
*   **API Shielding**: Middleware-driven rate limiting and helmet-secured headers.

### 💰 Financial Management
*   **Multi-Financial Year Support**: Manage and archieve data across different academic sessions.
*   **Departmental Allocations**: Granular control over budget distribution across departments.
*   **Expenditure Tracking**: End-to-end lifecycle management of spending requests.
*   **Automated Approval Chain**: Hierarchical approval flow (`User -> HOD -> Finance -> Principal`).

### 📊 Intelligence & Reporting
*   **Analytical Dashboards**: Visualization of budget utilization using **Chart.js**.
*   **Compliance Exports**: Generate ready-to-print PDF and Excel reports for internal and external audits.
*   **Drill-Down Summaries**: Per-department and per-category financial breakdown.

### 📁 Document Management
*   **Verified Proofs**: Expenditure requests require mandatory document uploads for verification.
*   **Secure Storage**: Robust handling of file uploads with type and size validation.

---

## 🛠️ Technical Architecture

### Frontend (Client)
*   **React 19**: Modern UI library with Functional Components and Hooks.
*   **Context API**: Lightweight and efficient state management.
*   **Vanilla CSS**: Premium, responsive, and high-performance styling.
*   **React Router v6**: Dynamic client-side routing.
*   **Axios**: Reliable HTTP client with interceptors for auth handling.

### Backend (Server)
*   **Node.js & Express**: High-performance RESTful API architecture.
*   **MongoDB & Mongoose**: Flexible and scalable NoSQL data modeling.
*   **Multer**: Optimized file upload handling.

---

## 🚀 Deployment & Setup

### 📋 Prerequisites
*   **Node.js**: v18.0 or higher.
*   **MongoDB**: v4.4+, locally installed or via Atlas.
*   **Git**: For version control.

### ⚙️ Local Development Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/cbms.git
    cd cbms
    ```

2.  **Initialize the Backend**
    ```bash
    cd server
    npm install
    cp .env.example .env
    # Add your MONGO_URI, JWT_SECRET, and PORT to .env
    npm run dev
    ```

3.  **Initialize the Frontend**
    ```bash
    cd ../client
    npm install
    cp .env.example .env
    # Ensure REACT_APP_API_URL matches your backend API path
    npm start
    ```

---

## 🐳 Containerization & Production

### Docker Support
The project is fully containerized for consistent deployment.
```bash
docker-compose up --build
```
*   **Port 3000**: Frontend Application
*   **Port 5000**: Backend API
*   **Port 27017**: MongoDB Instance

### Render Deployment
Use the included `render.yaml` blueprint to deploy the full stack to [Render](https://render.com) with a single click.

---

## 🤝 Contributing

We welcome contributions that improve the stability and performance of CBMS. Please read our **[CONTRIBUTING.md](file:///d:/cbms/cbms/CONTRIBUTING.md)** for detailed coding standards, PR processes, and branch naming conventions.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](file:///d:/cbms/cbms/LICENSE) file for details.

---

> **CBMS**: Precision budgeting for educational excellence.
