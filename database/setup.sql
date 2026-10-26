-- Database: dmart_cyberlab
-- Target: XAMPP MySQL / MariaDB

CREATE DATABASE IF NOT EXISTS dmart_cyberlab;
USE dmart_cyberlab;

-- Drop tables if they exist to allow a clean reset during development
DROP TABLE IF EXISTS security_retests;
DROP TABLE IF EXISTS security_evidence;
DROP TABLE IF EXISTS vulnerabilities;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- 1. Roles Table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO roles (id, name) VALUES (1, 'admin'), (2, 'customer');

-- 2. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL DEFAULT 2,
    pincode VARCHAR(6) NULL,
    avatar VARCHAR(255) DEFAULT 'default.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Categories Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO categories (id, name, slug) VALUES 
(1, 'Rice, Atta & Dals', 'rice-atta-dals'),
(2, 'Cooking Oils & Ghee', 'oils-ghee'),
(3, 'Beverages', 'beverages'),
(4, 'Snacks & Biscuits', 'snacks-biscuits'),
(5, 'Dairy & Packaged Food', 'dairy-packaged'),
(6, 'Personal Care & Household', 'personal-household');

-- 4. Products Table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,
    dmart_price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255) DEFAULT 'placeholder.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed Products
INSERT INTO products (id, name, description, category_id, mrp, dmart_price, image) VALUES
(1, 'Premium Basmati Rice (5kg)', 'Long-grain premium basmati rice, perfect for biryani and daily meals.', 1, 650.00, 549.00, 'basmati_rice.png'),
(2, 'Chakki Fresh Atta (10kg)', '100% whole wheat flour milled to perfection for soft, delicious rotis.', 1, 460.00, 399.00, 'atta.png'),
(3, 'Refined Sunflower Oil (1L)', 'Healthy cooking oil enriched with vitamins A & D.', 2, 180.00, 149.00, 'sunflower_oil.png'),
(4, 'Pure Cow Ghee (1L)', 'Aromatic and pure cow ghee, traditional taste and rich quality.', 2, 720.00, 649.00, 'ghee.png'),
(5, 'Assam Premium Tea (500g)', 'Strong and aromatic black tea leaves sourced from Assam gardens.', 3, 240.00, 199.00, 'tea.png'),
(6, 'Instant Coffee Powder (100g)', 'Rich and aromatic premium instant coffee blend.', 3, 310.00, 269.00, 'coffee.png'),
(7, 'Chocolate Chip Cookies (150g)', 'Crispy, delicious chocolate chip cookies packed with real chocolate chips.', 4, 60.00, 49.00, 'cookies.png'),
(8, 'Masala Potato Chips (100g)', 'Spicy and crunchy potato chips seasoned with authentic Indian spices.', 4, 30.00, 25.00, 'chips.png'),
(9, 'Organic Honey (500g)', '100% pure and natural wild forest honey.', 5, 299.00, 249.00, 'honey.png'),
(10, 'Herbal Aloe Vera Soap (125g)', 'Refreshing skin care soap enriched with natural Aloe Vera extracts.', 6, 45.00, 38.00, 'soap.png'),
(11, 'Liquid Dishwash Lemon (500ml)', 'Tough on grease, gentle on hands. Power of lemon extract.', 6, 120.00, 99.00, 'dishwash.png');

-- 5. Inventory Table
CREATE TABLE inventory (
    product_id INT PRIMARY KEY,
    stock INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed Inventory
INSERT INTO inventory (product_id, stock) VALUES
(1, 50),
(2, 40),
(3, 100),
(4, 30),
(5, 75),
(6, 60),
(7, 120),
(8, 200),
(9, 35),
(10, 150),
(11, 80);

-- 6. Cart Table
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Cart Items Table
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_product (cart_id, product_id)
) ENGINE=InnoDB;

-- 8. Coupons Table
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    discount_percent INT NOT NULL,
    min_spend DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT DEFAULT 1
) ENGINE=InnoDB;

INSERT INTO coupons (code, discount_percent, min_spend) VALUES 
('WELCOME10', 10, 300.00),
('SUPER20', 20, 1000.00);

-- 9. Orders Table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    coupon_applied VARCHAR(20) NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Shipped, Delivered, Cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Order Items Table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 11. Addresses Table
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_line TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    is_default TINYINT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Reviews Table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Audit Logs Table
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. Settings Table
CREATE TABLE settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

INSERT INTO settings (setting_key, setting_value) VALUES ('security_mode', 'SECURE');

-- 15. Vulnerability Register Table
-- Each finding stored with every field the project report lists:
-- ID, name, OWASP category, severity, description, affected component,
-- remediation status (Open / Fixed) and retest result (Pass / Fail / Pending).
CREATE TABLE vulnerabilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vuln_id VARCHAR(20) NOT NULL UNIQUE,          -- e.g. VULN-001
    name VARCHAR(100) NOT NULL,
    category VARCHAR(60) NOT NULL,                -- OWASP Top 10:2025 category
    severity VARCHAR(20) NOT NULL,                -- Low / Medium / High / Critical
    description TEXT NOT NULL,
    affected_component VARCHAR(100) NOT NULL,
    remediation VARCHAR(255) NOT NULL,            -- remediation standard applied
    remediation_status VARCHAR(20) NOT NULL DEFAULT 'Open',  -- Open / Fixed
    retest_result VARCHAR(20) NOT NULL DEFAULT 'Pending',    -- Pending / Pass / Fail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed the register from the project's documented OWASP Top 10:2025 findings.
INSERT INTO vulnerabilities
 (vuln_id, name, category, severity, description, affected_component, remediation, remediation_status, retest_result) VALUES
('VULN-001','SQL Injection','A05:2025 - Injection','High',
 'User-supplied search input could reach the SQL interpreter as code if concatenated into the query string.',
 'index.php (search field)','Prepared statements (PDO)','Fixed','Pass'),
('VULN-002','Reflected XSS','A05:2025 - Injection','Medium',
 'Echoing the search term back into the page without encoding could let a crafted value run as script in the browser.',
 'index.php (query echo)','htmlspecialchars() output encoding','Fixed','Pass'),
('VULN-003','IDOR','A01:2025 - Broken Access Control','High',
 'An invoice could be read by changing the order reference in the URL if ownership were not checked.',
 'download_invoice.php','Session ownership validation on the order','Fixed','Pass'),
('VULN-004','Weak Password Hashing','A04:2025 - Cryptographic Failures','Medium',
 'Storing passwords with a fast or unsalted hash would allow rapid cracking if the database were disclosed.',
 'register.php / login.php','BCrypt password_hash()','Fixed','Pass'),
('VULN-005','CSRF','A01:2025 - Broken Access Control','Medium',
 'A state-changing form submitted from another site could act as the logged-in user without a token check.',
 'State-changing forms','SameSite cookies and per-session CSRF tokens','Fixed','Pass'),
('VULN-006','Parameter Tampering','A06:2025 - Insecure Design','Medium',
 'A negative or oversized cart quantity submitted directly could corrupt totals if not range-checked.',
 'cart.php (quantity input)','Server-side positive-integer validation','Fixed','Pass'),
('VULN-007','Sensitive Information Leakage','A10:2025 - Mishandling of Exceptional Conditions','Low',
 'A database exception shown to the user could leak internal details. SECURE mode must show a clean message.',
 'checkout.php','Try-catch handling with a generic message in SECURE mode','Fixed','Pass'),
('VULN-008','Security Misconfiguration','A02:2025 - Security Misconfiguration','Low',
 'Directory listing of the uploads folder could expose stored files if the index were not disabled.',
 '/uploads directory','Disable directory listing via .htaccess','Fixed','Pass');

-- 16. Security Evidence Table
CREATE TABLE security_evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vuln_id VARCHAR(20) NULL,                     -- links evidence to a register finding
    test_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    module VARCHAR(100) NOT NULL,
    observation TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    actual_result TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT NULL
) ENGINE=InnoDB;

-- 17. Security Retests Table
-- finding_id references vulnerabilities.vuln_id; a PASS closes the finding, a FAIL reopens it.
CREATE TABLE security_retests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    finding_id VARCHAR(50) NOT NULL,
    tester VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_result VARCHAR(20) NOT NULL,
    notes TEXT NULL
) ENGINE=InnoDB;

-- Seed default Administrator
-- Password hash is bcrypt for 'admin123' (verified with PHP password_verify)
INSERT INTO users (id, username, password_hash, role_id) VALUES
(1, 'admin', '$2y$10$KIpKx2Bl4ejwITA2b8ausufr2JKWbpiQEyJia8CFkZgtNS2KOyfgW', 1);

-- Seed default Customer
-- Password hash is bcrypt for 'customer123' (verified with PHP password_verify)
INSERT INTO users (id, username, password_hash, role_id) VALUES
(2, 'customer', '$2y$10$YIwz3cMlZXLtszQeZnJ8e.a/OoVrUH4ZxA/DVfPt.yPF9LKmMj7Jq', 2);
