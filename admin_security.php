<?php
/**
 * VulnLens console entry point (served from the DMART host application).
 *
 * This page boots the host application, integrates VulnLens with a single
 * require, enforces the admin-only guard, and then renders the console.
 */
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/config/db.php';

// Integrate VulnLens into the host application (one-line module include).
require_once __DIR__ . '/vulnlens/integrate.php';

// Access control: the security console is for administrators only.
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header("HTTP/1.1 403 Forbidden");
    echo "<div style='font-family: sans-serif; text-align: center; padding: 50px;'>";
    echo "<h1>403 Forbidden</h1>";
    echo "<p>Access Denied: administrator sign-in is required for the VulnLens console.</p>";
    echo "<a href='index.php'>Return to Storefront</a>";
    echo "</div>";
    exit;
}

require __DIR__ . '/vulnlens/console.php';
