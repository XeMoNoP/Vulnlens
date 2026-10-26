# VulnLens & DMART CyberLab (Next.js Edition)

> **Next.js Fullstack Web Application Security Laboratory & OWASP Top 10:2025 Assessment Console**

VulnLens is an integrated web application security auditing and vulnerability management tool embedded into **DMART CyberLab**, a simulated Indian grocery e-commerce portal. The entire application has been converted from legacy PHP into a modern, high-performance **Next.js 15 (App Router)** and **TypeScript** stack with **Tailwind CSS**.

---

## 🌟 Core Features

### 🛒 1. DMART CyberLab E-Commerce Platform
- **Product Catalog & Search:** Search groceries, filter by category slugs, and view pricing with MRP and instant discounts.
- **Cart & Bag Engine:** Real-time quantity validation, inventory stock bounds, and discount vouchers (`DMART50`, `SAVER100`).
- **Transactional Checkout:** Atomic order placement with stock decrements, 6-digit postal pincode checks, and delivery addresses.
- **Member Authentication & Profile:** Native BCrypt credential encryption, session management, address management, order history, and downloadable plaintext invoices.
- **Supervisor Panel (`/admin`):** Catalog management (CRUD), live inventory stock updates, order lifecycle workflow, and system audit trail.

### 🛡️ 2. VulnLens Security Console (`/vulnlens`)
- **Automated OWASP Scanner:** One-click automated testing across **OWASP Top 10:2025** security controls.
- **Vulnerability Register:** Tracks all 8 baseline findings with severity, affected components, remediation standards, status (`Open`/`Fixed`), and retest results.
- **Security Evidence Logger:** Records observations, expected results, and actual outcomes for compliance reporting.
- **Verification Retest Suite:** Record retests by security auditors; a `PASS` automatically closes a finding (`Fixed`), while a `FAIL` reopens it (`Open`).
- **Dynamic Security Modes:** Instant toggle between `SECURE` mode and `LAB` mode for hands-on cybersecurity training.

---

## 📋 OWASP Top 10:2025 Vulnerability Mapping

| Finding ID | Vulnerability Scenario | Affected Component | OWASP Category | Severity | Baseline Mitigation Applied |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VULN-001** | SQL Injection | `/api/products` (Search filter) | **A05:2025 - Injection** | High | Parameterized queries & memory-safe bound query logic. |
| **VULN-002** | Reflected XSS | Storefront Query Echo | **A05:2025 - Injection** | Medium | Contextual HTML escaping via React JSX expressions. |
| **VULN-003** | Insecure Direct Object References (IDOR) | `/api/invoices/[orderNo]` | **A01:2025 - Broken Access Control** | High | Strictly validates order ownership against logged-in session user ID. |
| **VULN-004** | Weak Password Hashing | `/api/auth/register` & `/api/auth/login` | **A04:2025 - Cryptographic Failures** | Medium | Native BCrypt password hashing with high salt work factors. |
| **VULN-005** | Cross-Site Request Forgery (CSRF) | State-changing APIs | **A01:2025 - Broken Access Control** | Medium | SameSite (`Lax`), HttpOnly session cookies and origin verification. |
| **VULN-006** | Parameter Tampering | `/api/cart` (Quantity) | **A06:2025 - Insecure Design** | Medium | Server-side positive integer constraints and stock bounds checks. |
| **VULN-007** | Information Leakage | `/api/checkout` | **A10:2025 - Exceptional Conditions** | Low | Exception rollback handlers and sanitized error messaging in `SECURE` mode. |
| **VULN-008** | Security Misconfiguration | `/public` Static Assets | **A02:2025 - Misconfiguration** | Low | Framework-level static routing disabling directory listing and script execution. |

---

## 🔑 Default Credentials

| Role | Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer` | `customer123` | Browsing, shopping bag, checkout, order history, invoices |
| **Supervisor / Admin** | `admin` | `admin123` | Products CRUD, inventory management, orders, audit logs, VulnLens Console |

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/XeMoNoP/Vulnlens.git
cd Vulnlens
npm install
```

### 2. Development Server
Run the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## ☁️ Deployment on Vercel

This repository is optimized for one-click deployment on **Vercel**:
1. Push the code to GitHub (`XeMoNoP/Vulnlens`).
2. Import the repository into your Vercel Dashboard.
3. Deploy! No external databases or PHP runtimes required — the app runs out-of-the-box on Next.js serverless functions.
