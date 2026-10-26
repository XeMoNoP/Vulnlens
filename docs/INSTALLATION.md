# Installation & Deployment Guide

This guide describes how to deploy the DMART CyberLab application locally using XAMPP.

## Prerequisites
1. **XAMPP** (PHP 8.x, Apache, and MySQL/MariaDB).
2. Administration privileges on your operating system.

## Setup Steps

### 1. Copy Project Files
Place the `dmart-cyberlab` folder into the XAMPP web root directory:
```text
C:\xampp\htdocs\dmart-cyberlab\
```

### 2. Initialize Database
1. Launch XAMPP Control Panel.
2. Start **Apache** and **MySQL**.
3. Open your browser and navigate to: `http://localhost/phpmyadmin/`
4. Click **New** on the left menu sidebar and create a database named:
   `dmart_cyberlab`
5. Select the database `dmart_cyberlab` and click on the **Import** tab.
6. Choose the SQL setup script located at:
   `database/setup.sql`
7. Click **Import** at the bottom to build all tables and seed default products.

### 3. Verify Database Credentials
By default, the database connection configuration is stored in `config/db.php`:
* **Host:** `localhost`
* **User:** `root`
* **Password:** `""` (Empty string)

If your local XAMPP MySQL setup uses custom login details, edit `config/db.php` accordingly.

### 4. Running the Application
Access the supermarket web application by typing the following address in your browser:
```text
http://localhost/dmart-cyberlab/index.php
```

### 5. Default Login Accounts
* **Default Customer:**
  * **Username:** `customer`
  * **Password:** `customer123`
* **Default Administrator:**
  * **Username:** `admin`
  * **Password:** `admin123`
