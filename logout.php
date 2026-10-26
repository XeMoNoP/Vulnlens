<?php
// DMART CyberLab - Logout handler
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/config/db.php';

if (isset($_SESSION['user_id'])) {
    log_audit_event($_SESSION['user_id'], 'USER_LOGOUT', "User logged out: " . $_SESSION['username']);
}

// Unset all session variables
$_SESSION = array();

// Destroy Session Cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy Session
session_destroy();

header("Location: index.php");
exit;
