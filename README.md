# DMART CyberLab - Base E-Commerce Application

DMART CyberLab is a simulated supermarket online ordering platform designed specifically for local cybersecurity penetration-testing training and educational laboratory practices.

## Project Background & Objective
This application serves as a standard, realistic e-commerce baseline that matches the typical design system and usability workflows of Indian grocery portals (such as D-Mart) without copying proprietary assets, code, or trademarked material.

In this first development phase, the application has been built with **strict security principles** (prepared PDO statements, secure BCrypt password hashing, session validation, stock management, and full administrative audit logging) to represent a robust baseline before security testing.

## Core Features
1. **Catalog & Search:** Browsing products by category slugs and prepared search queries.
2. **Cart System:** Complete bag tracking, safe quantity validation, and coupon code reductions.
3. **Checkout Module:** Transactional safety with try-catch rollback handlers, saved address checks, and direct inventory stock reduction.
4. **Member Panel:** Secure registration, user logins, avatar uploads, and text invoice downloads.
5. **Supervisor Panel:** Dashboard to manage products list (CRUD), inventory stocks, customer orders, and read system audit logs.

## Setup Requirements
* XAMPP (Apache web server and MariaDB/MySQL)
* PHP 8.x
* Modern browser
