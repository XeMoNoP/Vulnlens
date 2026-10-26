<?php
/**
 * VulnLens - integration entry point
 *
 * This is how VulnLens is "integrated into a website". A host PHP application
 * wires the tool in with a single line, after its own database connection is
 * available:
 *
 *     require_once __DIR__ . '/vulnlens/integrate.php';
 *
 * That makes the OWASP check runners available to the host and exposes the
 * security console at vulnlens/console.php (admin-only). VulnLens then tests
 * the host application it is embedded in.
 *
 * Requirements of the host application:
 *   - a PDO handle in $pdo
 *   - a log_audit_event($user_id, $event_type, $message) function
 *   - a SECURITY_MODE constant (SECURE or LAB)
 * DMART provides all three via config/db.php.
 */

if (!defined('VULNLENS_APP_ROOT')) {
    define('VULNLENS_APP_ROOT', dirname(__DIR__));
}
define('VULNLENS_INTEGRATED', true);

require_once __DIR__ . '/checks.php';
