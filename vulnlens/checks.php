<?php
/**
 * VulnLens - OWASP Top 10:2025 check runners
 *
 * VulnLens is the penetration-testing tool. It is integrated into a host web
 * application (here, the DMART test website) and checks that application for
 * the OWASP Top 10 controls. Each check inspects the host application's own
 * source and data for the expected security control and reports PASS or FAIL
 * with evidence. The checks are read-only and safe: they never send attack
 * payloads, so the tool can be run against the live test site without harm.
 *
 * Each check maps to a finding ID in the vulnerability register so results
 * flow straight into the register, evidence log and report.
 */

if (!defined('VULNLENS_APP_ROOT')) {
    // Host application root (the folder VulnLens is integrated into).
    define('VULNLENS_APP_ROOT', dirname(__DIR__));
}

/** Read a host-application source file, or '' if it is missing. */
function vl_read_source($relative_path) {
    $path = VULNLENS_APP_ROOT . '/' . ltrim($relative_path, '/');
    return is_file($path) ? (string)file_get_contents($path) : '';
}

/**
 * The catalogue of checks. Each returns:
 *   ['vuln_id','name','category','run' => callable($pdo): ['status','evidence']]
 * status is 'PASS' or 'FAIL'; evidence is a short human-readable string.
 */
function vl_checks() {
    return [

    // A01 - Broken Access Control (IDOR on invoice download)
    [
        'vuln_id' => 'VULN-003',
        'name'    => 'Broken Access Control (IDOR)',
        'category'=> 'A01:2025 - Broken Access Control',
        'module'  => 'download_invoice.php',
        'test_id' => 'TEST-IDOR-01',
        'run' => function($pdo) {
            $src = vl_read_source('download_invoice.php');
            $has_owner = (bool)preg_match('/WHERE\s+o\.order_no\s*=\s*\?\s+AND\s+o\.user_id\s*=\s*\?/i', $src);
            $binds_session = strpos($src, "\$_SESSION['user_id']") !== false;
            $ok = $has_owner && $binds_session;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'Invoice query is scoped to the logged-in user (order_no AND user_id).',
                'actual'   => $ok
                    ? 'Ownership clause present: query binds order_no and session user_id.'
                    : 'Ownership clause missing: invoice could be read across accounts.',
            ];
        },
    ],

    // A02 - Security Misconfiguration (uploads directory listing)
    [
        'vuln_id' => 'VULN-008',
        'name'    => 'Security Misconfiguration',
        'category'=> 'A02:2025 - Security Misconfiguration',
        'module'  => '/uploads',
        'test_id' => 'TEST-MISCONF-01',
        'run' => function($pdo) {
            $ht = vl_read_source('uploads/.htaccess');
            $no_index = stripos($ht, 'Options -Indexes') !== false;
            $no_exec  = stripos($ht, 'engine off') !== false || stripos($ht, 'Require all denied') !== false;
            $ok = $no_index && $no_exec;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'uploads/ disables directory listing and blocks script execution.',
                'actual'   => $ok
                    ? 'uploads/.htaccess disables indexing and prevents PHP execution.'
                    : 'uploads/.htaccess missing or incomplete hardening.',
            ];
        },
    ],

    // A04 - Cryptographic Failures (password storage)
    [
        'vuln_id' => 'VULN-004',
        'name'    => 'Weak Password Hashing',
        'category'=> 'A04:2025 - Cryptographic Failures',
        'module'  => 'users table',
        'test_id' => 'TEST-CRYPTO-01',
        'run' => function($pdo) {
            $total = 0; $weak = 0;
            try {
                $rows = $pdo->query("SELECT password_hash FROM users")->fetchAll();
                foreach ($rows as $r) {
                    $total++;
                    $h = $r['password_hash'];
                    // bcrypt hashes start with $2y$ / $2b$ / $2a$ and are 60 chars.
                    if (!preg_match('/^\$2[aby]\$\d{2}\$.{53}$/', $h)) {
                        $weak++;
                    }
                }
            } catch (\Exception $e) {
                return ['status'=>'FAIL','expected'=>'All passwords use BCrypt.','actual'=>'Could not read users table.'];
            }
            $ok = ($total > 0 && $weak === 0);
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'Every stored password is a BCrypt hash.',
                'actual'   => $ok
                    ? "All $total stored password hashes are valid BCrypt."
                    : "$weak of $total password hashes are not BCrypt.",
            ];
        },
    ],

    // A05 - Injection (SQL injection on search)
    [
        'vuln_id' => 'VULN-001',
        'name'    => 'SQL Injection',
        'category'=> 'A05:2025 - Injection',
        'module'  => 'index.php (search)',
        'test_id' => 'TEST-SQLI-01',
        'run' => function($pdo) {
            $src = vl_read_source('index.php');
            $uses_prepare = strpos($src, '$pdo->prepare($query)') !== false;
            $uses_placeholder = strpos($src, 'p.name LIKE ?') !== false;
            // Fail if the search term is concatenated straight into SQL.
            $concat = (bool)preg_match('/"[^"]*LIKE[^"]*"\s*\.\s*\$/i', $src);
            $ok = $uses_prepare && $uses_placeholder && !$concat;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'Search uses a prepared statement with a bound parameter.',
                'actual'   => $ok
                    ? 'Search query is prepared and the term is bound as data (LIKE ?).'
                    : 'Search term may be concatenated into SQL.',
            ];
        },
    ],

    // A05 - Injection (reflected XSS on search echo)
    [
        'vuln_id' => 'VULN-002',
        'name'    => 'Reflected XSS',
        'category'=> 'A05:2025 - Injection',
        'module'  => 'index.php (query echo)',
        'test_id' => 'TEST-XSS-01',
        'run' => function($pdo) {
            $src = vl_read_source('index.php');
            // Inspect every line that echoes the search term; each one must wrap
            // it in htmlspecialchars. A raw echo of the term would be a FAIL.
            $echoes_raw = false; $any_echo = false;
            foreach (preg_split('/\r?\n/', $src) as $line) {
                if (strpos($line, '$search_term') !== false
                    && preg_match('/\b(echo|print)\b/', $line)) {
                    $any_echo = true;
                    if (strpos($line, 'htmlspecialchars') === false) {
                        $echoes_raw = true;
                    }
                }
            }
            $ok = $any_echo && !$echoes_raw;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'The search term is HTML-encoded before being shown.',
                'actual'   => $ok
                    ? 'Search term is output through htmlspecialchars().'
                    : 'Search term may be echoed without encoding.',
            ];
        },
    ],

    // A06 - Insecure Design (cart quantity parameter tampering)
    [
        'vuln_id' => 'VULN-006',
        'name'    => 'Parameter Tampering',
        'category'=> 'A06:2025 - Insecure Design',
        'module'  => 'cart.php (quantity)',
        'test_id' => 'TEST-PARAM-01',
        'run' => function($pdo) {
            $src = vl_read_source('cart.php');
            $validates_int = strpos($src, "filter_input(INPUT_POST, 'quantity', FILTER_VALIDATE_INT)") !== false;
            $rejects_low = (bool)preg_match('/\$qty\s*===\s*false\s*\|\|\s*\$qty\s*<=\s*0/', $src);
            $checks_stock = strpos($src, '<= $item_stock[\'stock\']') !== false;
            $ok = $validates_int && $rejects_low && $checks_stock;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'Quantity is validated as a positive integer within available stock.',
                'actual'   => $ok
                    ? 'Quantity is integer-validated, rejects <= 0, and is capped to stock.'
                    : 'Quantity validation is incomplete.',
            ];
        },
    ],

    // A07 - Authentication Failures (login records failures; bcrypt verify)
    [
        'vuln_id' => 'VULN-004',   // crypto/auth overlap recorded against VULN-004
        'name'    => 'Authentication Handling',
        'category'=> 'A07:2025 - Authentication Failures',
        'module'  => 'login.php',
        'test_id' => 'TEST-AUTH-01',
        'run' => function($pdo) {
            $src = vl_read_source('login.php');
            $verifies = strpos($src, 'password_verify(') !== false;
            $regenerates = strpos($src, 'session_regenerate_id(true)') !== false;
            $ok = $verifies && $regenerates;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'Login verifies the BCrypt hash and regenerates the session on success.',
                'actual'   => $ok
                    ? 'Login uses password_verify() and regenerates the session id.'
                    : 'Login is missing password_verify or session regeneration.',
            ];
        },
    ],

    // A09 - Security Logging & Alerting Failures (failed logins logged)
    [
        'vuln_id' => 'VULN-007',   // logging/visibility recorded against VULN-007 group
        'name'    => 'Security Logging',
        'category'=> 'A09:2025 - Security Logging & Alerting Failures',
        'module'  => 'login.php / audit_logs',
        'test_id' => 'TEST-LOG-01',
        'run' => function($pdo) {
            $src = vl_read_source('login.php');
            $logs_fail = strpos($src, "'LOGIN_FAILED'") !== false;
            $table_ok = false;
            try { $pdo->query("SELECT 1 FROM audit_logs LIMIT 1"); $table_ok = true; } catch (\Exception $e) {}
            $ok = $logs_fail && $table_ok;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'Failed logins are written to the audit log.',
                'actual'   => $ok
                    ? 'login.php records LOGIN_FAILED events and the audit_logs table is present.'
                    : 'Failed-login logging is not in place.',
            ];
        },
    ],

    // A10 - Mishandling of Exceptional Conditions (checkout error handling)
    [
        'vuln_id' => 'VULN-007',
        'name'    => 'Sensitive Information Leakage',
        'category'=> 'A10:2025 - Mishandling of Exceptional Conditions',
        'module'  => 'checkout.php',
        'test_id' => 'TEST-EXC-01',
        'run' => function($pdo) {
            $src = vl_read_source('checkout.php');
            $has_try = strpos($src, 'try {') !== false && strpos($src, 'rollBack()') !== false;
            $clean_secure = (bool)preg_match("/SECURITY_MODE\s*===\s*'SECURE'/", $src);
            $ok = $has_try && $clean_secure;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'Checkout rolls back on error and shows a generic message in SECURE mode.',
                'actual'   => $ok
                    ? 'Checkout uses try/rollback and hides error detail in SECURE mode.'
                    : 'Checkout error handling may leak details.',
            ];
        },
    ],

    // A01 - Broken Access Control (CSRF on state-changing forms)
    [
        'vuln_id' => 'VULN-005',
        'name'    => 'Cross-Site Request Forgery',
        'category'=> 'A01:2025 - Broken Access Control',
        'module'  => 'state-changing forms',
        'test_id' => 'TEST-CSRF-01',
        'run' => function($pdo) {
            $db  = vl_read_source('config/db.php');
            $adm = vl_read_source('admin.php');
            $has_helpers = strpos($db, 'function csrf_check') !== false && strpos($db, 'hash_equals') !== false;
            $enforced = strpos($adm, 'csrf_check()') !== false;
            $ok = $has_helpers && $enforced;
            return [
                'status'   => $ok ? 'PASS' : 'FAIL',
                'expected' => 'State-changing forms carry a CSRF token that is validated server-side.',
                'actual'   => $ok
                    ? 'CSRF helpers exist and admin actions validate the token.'
                    : 'CSRF token validation is missing.',
            ];
        },
    ],

    ];
}

/**
 * Run every check, record evidence, and update the register so a passing
 * retest closes the finding and a failing one reopens it.
 * Returns an array of result rows for display.
 */
function vl_run_all_checks($pdo, $actor_user_id = null) {
    $results = [];
    $upd_vuln = $pdo->prepare(
        "UPDATE vulnerabilities
            SET retest_result = ?, remediation_status = ?
          WHERE vuln_id = ?"
    );
    $ins_ev = $pdo->prepare(
        "INSERT INTO security_evidence
            (vuln_id, test_id, module, observation, expected_result, actual_result, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    foreach (vl_checks() as $chk) {
        $r = $chk['run']($pdo);
        $status = $r['status'];

        $ins_ev->execute([
            $chk['vuln_id'], $chk['test_id'], $chk['module'],
            $chk['name'] . ' check',
            $r['expected'], $r['actual'], $status,
            'Automated VulnLens check',
        ]);

        // A finding is Fixed only when its check passes; a failure reopens it.
        $upd_vuln->execute([
            $status === 'PASS' ? 'Pass' : 'Fail',
            $status === 'PASS' ? 'Fixed' : 'Open',
            $chk['vuln_id'],
        ]);

        $results[] = [
            'vuln_id'  => $chk['vuln_id'],
            'name'     => $chk['name'],
            'category' => $chk['category'],
            'module'   => $chk['module'],
            'status'   => $status,
            'actual'   => $r['actual'],
        ];
    }

    if (function_exists('log_audit_event')) {
        $pass = count(array_filter($results, fn($x) => $x['status'] === 'PASS'));
        log_audit_event($actor_user_id, 'SCAN_RUN',
            'VulnLens ran ' . count($results) . ' OWASP checks; ' . $pass . ' passed.');
    }
    return $results;
}
