# DMART CyberLab: Security Laboratory Reference Manual
## Academic Guide for OWASP Vulnerability Analysis and Remediation

This document serves as an academic guide for analyzing, identifying, and remediating common web application vulnerabilities as categorized by the OWASP Top 10. 

---

## Vulnerability Scenarios & Remediation Analysis

### VULN-001: SQL Injection (SQLi)
* **OWASP Category:** A03:2021-Injection / A05:2025-Injection
* **Conceptual Vulnerability:** SQL injection occurs when user-supplied input is directly concatenated into a SQL command string without sanitization or parameterization. This allows the database interpreter to mistake data for SQL commands.
* **Theoretical Vulnerable Pattern (PHP):**
  ```php
  // Conceptual representation of vulnerable pattern
  $query = "SELECT * FROM products WHERE name LIKE '%" . $_GET['q'] . "%'";
  $result = $pdo->query($query);
  ```
* **Impact:** Unauthorized data exposure, access control bypass, or database modification/destruction.
* **Remediation & Secure Pattern:** Always utilize prepared statements with parameterized inputs. This ensures that user input is treated strictly as data, never as executable code.
  ```php
  $stmt = $pdo->prepare("SELECT * FROM products WHERE name LIKE ?");
  $stmt->execute(["%" . $search_term . "%"]);
  ```

---

### VULN-002: Reflected Cross-Site Scripting (XSS)
* **OWASP Category:** A03:2021-Injection / A05:2025-Injection
* **Conceptual Vulnerability:** Reflected XSS arises when an application includes unsanitized user input from a request directly in the immediate response page, allowing execution of malicious scripts in the victim's browser context.
* **Theoretical Vulnerable Pattern (PHP):**
  ```php
  // Unescaped output directly in HTML context
  echo "Search results for: " . $_GET['q'];
  ```
* **Impact:** Session hijacking, cookie theft, or unauthorized actions on behalf of the user.
* **Remediation & Secure Pattern:** Sanitize and escape all user input before rendering it in the DOM using functions like `htmlspecialchars()` with appropriate flags and character encoding.
  ```php
  echo "Search results for: " . htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8');
  ```

---

### VULN-003: Insecure Direct Object Reference (IDOR)
* **OWASP Category:** A01:2021-Broken Access Control / A01:2025-Broken Access Control
* **Conceptual Vulnerability:** IDOR is a type of access control vulnerability that occurs when an application refers to objects using user-supplied keys without verification of authorization.
* **Theoretical Vulnerable Pattern (PHP):**
  ```php
  // Relying solely on the GET parameter value without user validation
  $invoice_id = $_GET['inv'];
  $query = "SELECT * FROM orders WHERE order_no = '$invoice_id'";
  ```
* **Impact:** Horizontal privilege escalation, exposing sensitive customer information (e.g., invoices, transaction details) to unauthorized users.
* **Remediation & Secure Pattern:** Implement authorization checks to ensure the object owner matches the authenticated session identity.
  ```php
  $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_no = ? AND user_id = ?");
  $stmt->execute([$invoice_no, $_SESSION['user_id']]);
  ```

---

### VULN-004: Insecure Cryptographic Storage
* **OWASP Category:** A02:2021-Cryptographic Failures / A04:2025-Cryptographic Failures
* **Conceptual Vulnerability:** Storing sensitive information, such as passwords or session tokens, using outdated, weak, or un-salted hashing algorithms (e.g., MD5, SHA1).
* **Theoretical Vulnerable Pattern:**
  ```php
  // Weak hashing method prone to fast rainbow table lookups
  $hash = md5($password);
  ```
* **Impact:** Fast retrieval of plain-text passwords in the event of database disclosure.
* **Remediation & Secure Pattern:** Hash sensitive credentials using robust, salt-embedded hashing functions like BCrypt or Argon2 via native PHP functions.
  ```php
  $hash = password_hash($password, PASSWORD_BCRYPT);
  ```

---

### VULN-005: Cross-Site Request Forgery (CSRF)
* **OWASP Category:** A01:2021-Broken Access Control / A01:2025-Broken Access Control
* **Conceptual Vulnerability:** CSRF occurs when a malicious site causes a user's web browser to perform an unwanted action on a trusted site where the user is currently authenticated.
* **Impact:** Unauthorized state-changing operations, such as changing account credentials or placing unauthorized orders.
* **Remediation & Secure Pattern:** Use unique, cryptographically secure anti-CSRF tokens for each session. Validate these tokens on every state-changing POST request.
  ```php
  // Token generation
  $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

  // Token validation
  if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
      die("CSRF validation failed.");
  }
  ```
