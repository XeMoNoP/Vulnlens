<?php
// DMART CyberLab - Secure Invoice Download Module
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/config/db.php';

// Auth Protection
if (!isset($_SESSION['user_id'])) {
    die("Unauthorized Access. Please login first.");
}

$invoice_no = isset($_GET['inv']) ? trim($_GET['inv']) : '';

if ($invoice_no === '') {
    die("Invoice reference required.");
}

// Fetch Order and check user ownership
$stmt = $pdo->prepare("SELECT o.*, u.username FROM orders o 
                       JOIN users u ON o.user_id = u.id 
                       WHERE o.order_no = ? AND o.user_id = ?");
$stmt->execute([$invoice_no, $_SESSION['user_id']]);
$order = $stmt->fetch();

if (!$order) {
    // Audit unauthorized attempt
    log_audit_event($_SESSION['user_id'], 'UNAUTHORIZED_INVOICE_READ', "User attempted to read order: " . $invoice_no);
    die("Access Denied: Invoice not found or unauthorized access.");
}

// Fetch Order Items
$items_stmt = $pdo->prepare("SELECT oi.*, p.name 
                             FROM order_items oi 
                             JOIN products p ON oi.product_id = p.id 
                             WHERE oi.order_id = ?");
$items_stmt->execute([$order['id']]);
$items = $items_stmt->fetchAll();

// Generate Text Invoice
header('Content-Type: text/plain');
header('Content-Disposition: attachment; filename="Invoice_' . $invoice_no . '.txt"');

echo "==================================================\n";
echo "              DMART CyberLab Invoice             \n";
echo "==================================================\n";
echo "Invoice No : " . $order['order_no'] . "\n";
echo "Date       : " . $order['created_at'] . "\n";
echo "Customer   : " . $order['username'] . "\n";
echo "Status     : " . $order['status'] . "\n";
echo "==================================================\n";
echo sprintf("%-30s %-8s %-10s\n", "Item Name", "Qty", "Price");
echo "--------------------------------------------------\n";

foreach ($items as $item) {
    echo sprintf("%-30s %-8d Rs. %-10.2f\n", 
        substr($item['name'], 0, 28), 
        $item['quantity'], 
        $item['price'] * $item['quantity']
    );
}

echo "--------------------------------------------------\n";
if ($order['coupon_applied']) {
    echo "Coupon Code : " . $order['coupon_applied'] . "\n";
}
echo "Total Paid  : Rs. " . number_format($order['total_amount'], 2) . "\n";
echo "==================================================\n";
echo "      Thank you for shopping at DMART CyberLab!    \n";
echo "==================================================\n";
exit;
