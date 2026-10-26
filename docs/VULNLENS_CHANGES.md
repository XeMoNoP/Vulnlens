# Changes made to align the code with the synopsis, report and presentation

## VulnLens as the product (new `vulnlens/` module)
- `vulnlens/integrate.php` — one-line module include. A host app wires VulnLens
  in with `require_once __DIR__.'/vulnlens/integrate.php';`. This is how the
  tool is "integrated into a website" (the integration point the synopsis and
  report left as a placeholder). DMART loads it from `admin_security.php`.
- `vulnlens/checks.php` — read-only OWASP Top 10:2025 check runners, one per
  area (A01, A02, A04, A05 x2, A06, A07, A09, A10, plus CSRF/A01). Each inspects
  the host application's own code and data for the expected control and records
  PASS/FAIL. No attack payloads are sent, so it is safe to run on the live site.
- `vulnlens/console.php` — the security console, rebranded VulnLens, target
  DMART. Everything is read from the database (no hard-coded tables):
  dashboard counts, OWASP coverage, register, evidence, remediation, retests,
  report. "Run all checks" writes evidence and updates the register.
- `admin_security.php` — now a thin entry point: boots the app, integrates
  VulnLens, enforces admin-only access, renders the console.

## Database (`database/setup.sql`)
- Fixed the two seeded password hashes. The old hashes did not match
  `admin123` / `customer123`, so default logins failed on a fresh import.
  New hashes are verified with PHP `password_verify()`.
- Added the `vulnerabilities` register table with every field the report lists
  (id, name, category, severity, description, affected component, remediation,
  remediation status Open/Fixed, retest result Pending/Pass/Fail). Seeded with
  the 8 findings from VULNERABILITY_REGISTER.md.
- Linked `security_evidence` to the register (`vuln_id`). Retests already
  reference a finding; a PASS closes it, a FAIL reopens it.

## Vulnerability lifecycle
- A finding is marked Fixed only when its latest retest/check passes; a failing
  retest sets it back to Open. Proven end to end (a failed retest reopened a
  finding, a passing scan closed it).

## Genuine fixes found in the code
- `login.php`: `?redirect=` only allows local relative paths now (open-redirect
  fixed); failed logins are written to the audit log (A09).
- `admin_login.php`: failed admin logins are logged.
- `includes/header.php`: the "Deliver to" pincode box validated to 6 digits
  before storing (it previously wrote up to 25 chars into a VARCHAR(6) column);
  LAB-mode banner restored; CSRF token added.
- `config/db.php`: added `csrf_token()`, `csrf_field()`, `csrf_check()`.
  State-changing admin and console forms now carry and validate a token (A01).
  In SECURE mode a bad token is blocked (400) and logged; in LAB mode it is
  logged but allowed, so the weakness can be observed.
- `uploads/.htaccess`: disables directory listing and script execution (A02).
- `includes/footer.php`: removed a duplicate `</main>`.
- `index.php`: added `c.slug` to the catalog query so product images resolve.

## Assets
- Product images added to `images/` (basmati_rice, ghee, sunflower_oil).
  The atta image was left out pending a branding decision (it showed a real
  brand); that product falls back to the category icon.

## Not changed
- The store is still called DMART (the test target); VulnLens is the product.
- The source documents were left as-is and moved into `docs/`.
