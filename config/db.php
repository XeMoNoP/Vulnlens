<?php
// DMART CyberLab - Secure Database Connection Module

$host = 'localhost';
$db   = 'dmart_cyberlab';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

require_once __DIR__ . '/security_mode.php';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // In secure mode, do not leak error stack details. Provide a clean error message.
     if (SECURITY_MODE === 'SECURE') {
         die("Database Connection Error. Please verify that MySQL is running in XAMPP and the database is imported.");
     } else {
         // In vulnerable mode (to be implemented later), we can output the raw trace.
         throw new \PDOException($e->getMessage(), (int)$e->getCode());
     }
}

// Log audit events securely
function log_audit_event($user_id, $event_type, $message) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, event_type, message) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $event_type, $message]);
    } catch (\Exception $e) {
        // Fail silently during audit logs so it doesn't break app flow
    }
}

// ---------------------------------------------------------------------------
// CSRF protection helpers (VULN-005, A01).
// A per-session token is issued and must accompany every state-changing POST.
// ---------------------------------------------------------------------------
function csrf_token() {
    if (session_status() === PHP_SESSION_ACTIVE && empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'] ?? '';
}

// Hidden form field markup for templates.
function csrf_field() {
    return '<input type="hidden" name="csrf_token" value="'
         . htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') . '">';
}

// Validate a submitted token. In SECURE mode a mismatch stops the request;
// in LAB mode the attempt is logged but allowed so the weakness can be observed.
function csrf_check() {
    $sent = $_POST['csrf_token'] ?? '';
    $ok = isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $sent);
    if (!$ok) {
        $uid = $_SESSION['user_id'] ?? null;
        log_audit_event($uid, 'CSRF_VALIDATION_FAILED', 'Rejected a request with a missing or invalid CSRF token.');
        if (defined('SECURITY_MODE') && SECURITY_MODE === 'SECURE') {
            http_response_code(400);
            die('Request blocked: CSRF token validation failed.');
        }
    }
    return $ok;
}
