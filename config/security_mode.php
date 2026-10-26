<?php
// DMART CyberLab - Dynamic Security Mode Settings

function get_security_mode() {
    static $mode = null;
    if ($mode !== null) {
        return $mode;
    }
    
    try {
        global $host, $db, $user, $pass;
        $db_host = $host ?? 'localhost';
        $db_name = $db ?? 'dmart_cyberlab';
        $db_user = $user ?? 'root';
        $db_pass = $pass ?? '';
        
        $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_SILENT,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        $temp_pdo = new PDO($dsn, $db_user, $db_pass, $options);
        $stmt = $temp_pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'security_mode'");
        if ($stmt) {
            $row = $stmt->fetch();
            if ($row) {
                $mode = $row['setting_value'];
                return $mode;
            }
        }
    } catch (\Exception $e) {
        // Fallback to SECURE
    }
    
    $mode = 'SECURE';
    return $mode;
}

if (!defined('SECURITY_MODE')) {
    define('SECURITY_MODE', get_security_mode());
}
?>
