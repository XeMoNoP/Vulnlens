# Project Structure & Architecture

This document describes the structure of the DMART CyberLab application files.

## Project Structure Diagram

```text
dmart-cyberlab/
├── config/
│   ├── db.php                  # PDO connection manager and audit log helper.
│   └── security_mode.php       # Global security toggle engine (SECURE / VULNERABLE).
│
├── database/
│   └── setup.sql               # Database creation script and seeded dataset.
│
├── includes/
│   ├── header.php              # Global navigation bar, search input, and responsive design headers.
│   └── footer.php              # Disclaimer notices, environment info, and document closure.
│
├── uploads/                    # Stores customer uploaded avatar images.
│
├── admin.php                   # Administrative panel control board (CRUD & audit log views).
├── admin_login.php             # Supervisor authentication login portal.
├── cart.php                    # Product quantity management, coupon applications, and totals.
├── checkout.php                # Database transaction-backed order verification and placement.
├── download_invoice.php        # Secure ownership-verified text invoice builder.
├── index.php                   # Homepage store directory. Catalog search and filtering.
├── login.php                   # Session-authenticated customer sign-in page.
├── logout.php                  # Secure session destruction and audit logger.
├── product.php                 # Details sheet for items, stock level indicators, and review feeds.
├── profile.php                 # Member overview card, address storage, and order logs.
└── register.php                # Account generation module with BCrypt hashing.
```

## Security Best Practices Implemented in the Baseline:
1. **No SQL Injections:** Prepared SQL queries are used everywhere (via PDO). No variable interpolation or raw values are appended to database query statements.
2. **Robust Password Protection:** Client passwords are hashed with standard, salt-embedded `bcrypt` algorithm using PHP's native `password_hash()`.
3. **Session Hardening:** Cookies are constructed with parameters configured for maximum security protection (`httponly` set to protect against script theft, and `samesite` configuration set to strict).
4. **Input Verification:** Quantities are verified using server-side filtering filters to block negative integers or overflow parameters.
5. **Role-Based Authorization:** Access control guards the administrative pages (`admin.php`) from regular customers by checking permissions on the session state.
6. **Exception Handling:** Sensitive SQL warnings are captured. Production users are presented with simplified, clean warning notifications.
