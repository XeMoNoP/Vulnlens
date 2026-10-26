# Security Test Plan

This document establishes the testing specifications to verify security controls in DMART CyberLab.

---

## Test Specifications

### Test ID: TEST-SQLI-01
* **Objective:** Verify database queries are immune to SQL injection payloads via the search interface.
* **Preconditions:** Active database connection with test products.
* **Test Procedure:**
  1. Access the catalog homepage at `index.php`.
  2. Input test character payloads (e.g. `' OR '1'='1` or `' UNION SELECT...`) into the search input form.
  3. Submit the form.
* **Expected Result:** The input is treated strictly as a search string; no query logic modification occurs. Database returns zero search matches. No SQL syntax errors are returned.
* **Actual Result:** Passed (PDO prepared statements prevent logic manipulation).

---

### Test ID: TEST-XSS-01
* **Objective:** Verify that characters used for scripting (e.g., `<script>`) are properly handled.
* **Preconditions:** Search page accessible.
* **Test Procedure:**
  1. Input `<script>alert(1)</script>` into the query parameter.
  2. Submit query.
  3. Inspect page source.
* **Expected Result:** HTML tags are safely encoded (rendered as plain text). No javascript executes.
* **Actual Result:** Passed (`htmlspecialchars` output sanitization applied).

---

### Test ID: TEST-IDOR-01
* **Objective:** Verify that users cannot access invoices belonging to other customer accounts by changing URL parameters.
* **Preconditions:** Two distinct customer accounts created.
* **Test Procedure:**
  1. Authenticate under Account A.
  2. Create an order and note the invoice parameter (e.g., `inv=DMART-ABC1`).
  3. Log out and authenticate under Account B.
  4. Attempt to access `download_invoice.php?inv=DMART-ABC1`.
* **Expected Result:** Access denied. Request is rejected since ownership validation fails.
* **Actual Result:** Passed.

---

### Test ID: TEST-PARAM-01
* **Objective:** Verify that shopping cart quantity modifications block negative integers.
* **Preconditions:** Items added to shopping cart.
* **Test Procedure:**
  1. Open the shopping cart page (`cart.php`).
  2. Intercept or submit a POST request setting the item quantity value to a negative number (e.g., `-5`).
  3. Submit the change.
* **Expected Result:** The request is rejected by server validation filters. Cart totals remain unchanged.
* **Actual Result:** Passed.
