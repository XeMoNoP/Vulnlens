<?php
// DMART CyberLab - Secure Checkout & Order Execution
require_once __DIR__ . '/includes/header.php';

// Auth Protection
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php?redirect=checkout.php");
    exit;
}

$error = '';
$success = '';

// Check if Cart has items
$stmt = $pdo->prepare("SELECT ci.product_id, ci.quantity, p.name, p.dmart_price, i.stock 
                       FROM cart_items ci 
                       JOIN cart c ON ci.cart_id = c.id 
                       JOIN products p ON ci.product_id = p.id 
                       JOIN inventory i ON p.id = i.product_id 
                       WHERE c.user_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$cart_items = $stmt->fetchAll();

if (empty($cart_items)) {
    header("Location: cart.php");
    exit;
}

// Fetch user addresses
$add_stmt = $pdo->prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC");
$add_stmt->execute([$_SESSION['user_id']]);
$addresses = $add_stmt->fetchAll();

// Handle New Address Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_address'])) {
    $line = trim($_POST['address_line'] ?? '');
    $city = trim($_POST['city'] ?? '');
    $state = trim($_POST['state'] ?? '');
    $pincode = trim($_POST['pincode'] ?? '');

    if ($line === '' || $city === '' || $state === '' || $pincode === '') {
        $error = 'All address fields are required.';
    } elseif (!preg_match('/^[0-9]{6}$/', $pincode)) {
        $error = 'Pincode must be exactly 6 digits.';
    } else {
        // Set all other user addresses is_default = 0
        $pdo->prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?")->execute([$_SESSION['user_id']]);

        // Insert new address as default
        $ins_add = $pdo->prepare("INSERT INTO addresses (user_id, address_line, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, 1)");
        $ins_add->execute([$_SESSION['user_id'], $line, $city, $state, $pincode]);

        header("Location: checkout.php?msg=addr_added");
        exit;
    }
}

// Handle Order Placement
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['place_order'])) {
    $address_id = filter_input(INPUT_POST, 'address_id', FILTER_VALIDATE_INT);

    if (!$address_id) {
        $error = 'Please select a delivery address.';
    } else {
        // Calculate Totals and check inventory again
        $subtotal = 0.00;
        $out_of_stock_items = [];

        foreach ($cart_items as $item) {
            $subtotal += $item['dmart_price'] * $item['quantity'];

            // Double check stock availability
            if ($item['stock'] < $item['quantity']) {
                $out_of_stock_items[] = $item['name'];
            }
        }

        if (!empty($out_of_stock_items)) {
            $error = 'Some items in your cart do not have sufficient stock: ' . implode(', ', $out_of_stock_items);
        } else {
            // Apply Coupon if valid
            $coupon_code = null;
            $discount_amount = 0.00;
            if (isset($_SESSION['applied_coupon'])) {
                $applied = $_SESSION['applied_coupon'];
                if ($subtotal >= $applied['min_spend']) {
                    $coupon_code = $applied['code'];
                    $discount_amount = $subtotal * ($applied['discount_percent'] / 100);
                }
            }
            $final_amount = $subtotal - $discount_amount;

            // Generate unique Order Number
            $order_no = "DMART-" . strtoupper(bin2hex(random_bytes(4)));

            // Begin Transaction securely
            $pdo->beginTransaction();
            try {
                // 1. Create Order
                $order_stmt = $pdo->prepare("INSERT INTO orders (order_no, user_id, total_amount, coupon_applied, status) VALUES (?, ?, ?, ?, 'Pending')");
                $order_stmt->execute([$order_no, $_SESSION['user_id'], $final_amount, $coupon_code]);
                $order_id = $pdo->lastInsertId();

                // 2. Insert Order Items & Deduct Inventory Stock
                $upd_stock = $pdo->prepare("UPDATE inventory SET stock = stock - ? WHERE product_id = ?");
                $ins_item = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");

                foreach ($cart_items as $item) {
                    // Insert details
                    $ins_item->execute([$order_id, $item['product_id'], $item['quantity'], $item['dmart_price']]);
                    // Update stock levels
                    $upd_stock->execute([$item['quantity'], $item['product_id']]);
                }

                // 3. Clear user cart items
                $clear_cart = $pdo->prepare("DELETE ci FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE c.user_id = ?");
                $clear_cart->execute([$_SESSION['user_id']]);

                // Clear applied coupon in session
                unset($_SESSION['applied_coupon']);

                // Commit Transaction
                $pdo->commit();

                // Log audit logs
                log_audit_event($_SESSION['user_id'], 'ORDER_PLACE', "Order placed successfully: " . $order_no . " | Total: ₹" . $final_amount);

                $success = "Order placed successfully! Order No: $order_no";
                
                // Clear cart items local cache
                $cart_items = [];
            } catch (\Exception $e) {
                // Rollback transaction on failure
                $pdo->rollBack();
                if (SECURITY_MODE === 'SECURE') {
                    $error = 'An error occurred while processing your transaction. Please try again.';
                } else {
                    $error = $e->getMessage();
                }
            }
        }
    }
}
?>

<div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i class="fa-solid fa-credit-card text-emerald-600"></i> Checkout Order
    </h2>

    <?php if ($error !== ''): ?>
        <div class="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded text-xs font-semibold">
            <?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?>
        </div>
    <?php endif; ?>

    <?php if ($success !== ''): ?>
        <div class="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-5 mb-6 rounded-xl shadow-sm">
            <i class="fa-solid fa-circle-check text-emerald-500 mr-2 text-lg"></i>
            <span class="text-sm font-bold text-emerald-850"><?php echo htmlspecialchars($success, ENT_QUOTES, 'UTF-8'); ?></span>
            <div class="mt-3">
                <a href="profile.php" class="text-xs bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg inline-block hover:bg-emerald-700">Track Order in Profile &rarr;</a>
            </div>
        </div>
    <?php endif; ?>

    <?php if (!empty($cart_items)): ?>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <!-- Address Setup Column -->
            <div class="md:col-span-2 space-y-6">
                
                <!-- Address Selector -->
                <form action="" method="POST" class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Select Delivery Address</h3>
                    
                    <?php if (empty($addresses)): ?>
                        <div class="text-center py-4 bg-slate-50 border border-dashed rounded-lg border-slate-200">
                            <p class="text-xs text-slate-400">No delivery address found. Please add a address below.</p>
                        </div>
                    <?php else: ?>
                        <div class="space-y-3">
                            <?php foreach ($addresses as $addr): ?>
                                <label class="border border-slate-200 rounded-lg p-4 block cursor-pointer hover:border-emerald-300 transition-all">
                                    <div class="flex items-start gap-3">
                                        <input type="radio" name="address_id" value="<?php echo $addr['id']; ?>" 
                                               class="mt-1 text-emerald-600 focus:ring-emerald-500" <?php echo ($addr['is_default']) ? 'checked' : ''; ?>>
                                        <div class="text-xs">
                                            <span class="font-bold text-slate-700 block mb-1">
                                                <?php echo htmlspecialchars($addr['city'] . ", " . $addr['state'], ENT_QUOTES, 'UTF-8'); ?>
                                                <?php if ($addr['is_default']): ?>
                                                    <span class="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold text-[9px] ml-1">DEFAULT</span>
                                                <?php endif; ?>
                                            </span>
                                            <span class="text-slate-500 block"><?php echo htmlspecialchars($addr['address_line'], ENT_QUOTES, 'UTF-8'); ?></span>
                                            <span class="text-slate-400 block mt-1">Pincode: <?php echo htmlspecialchars($addr['pincode'], ENT_QUOTES, 'UTF-8'); ?></span>
                                        </div>
                                    </div>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <!-- Order placing button -->
                    <?php if (!empty($addresses)): ?>
                        <button type="submit" name="place_order" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider py-3 rounded-lg transition-colors mt-4">
                            CONFIRM & PLACE ORDER
                        </button>
                    <?php endif; ?>
                </form>

                <!-- Add Address Form -->
                <div class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Add New Address</h3>
                    <form action="" method="POST" class="space-y-4">
                        <div>
                            <label for="address_line" class="block text-xs font-bold text-slate-500 uppercase mb-1">Address Details</label>
                            <input type="text" name="address_line" id="address_line" required placeholder="Apartment, Street name, Area details"
                                   class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500">
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="city" class="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                                <input type="text" name="city" id="city" required placeholder="Mumbai"
                                       class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500">
                            </div>
                            <div>
                                <label for="state" class="block text-xs font-bold text-slate-500 uppercase mb-1">State</label>
                                <input type="text" name="state" id="state" required placeholder="Maharashtra"
                                       class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500">
                            </div>
                            <div>
                                <label for="pincode" class="block text-xs font-bold text-slate-500 uppercase mb-1">Pincode</label>
                                <input type="text" name="pincode" id="pincode" required pattern="[0-9]{6}" placeholder="400001"
                                       class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500">
                            </div>
                        </div>
                        <button type="submit" name="add_address" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider py-2 px-6 rounded-lg transition-colors mt-2">
                            SAVE ADDRESS
                        </button>
                    </form>
                </div>

            </div>

            <!-- Items Review Sidebar -->
            <div class="md:col-span-1 bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 h-fit">
                <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Order Items</h3>
                <div class="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                    <?php 
                    $subtotal = 0.00;
                    foreach ($cart_items as $item): 
                        $subtotal += $item['dmart_price'] * $item['quantity'];
                    ?>
                        <div class="py-2.5 flex justify-between items-center text-xs">
                            <div>
                                <span class="font-semibold text-slate-700 block"><?php echo htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8'); ?></span>
                                <span class="text-slate-400"><?php echo (int)$item['quantity']; ?> x ₹<?php echo htmlspecialchars($item['dmart_price'], ENT_QUOTES, 'UTF-8'); ?></span>
                            </div>
                            <span class="font-bold text-slate-800">₹<?php echo number_format($item['dmart_price'] * $item['quantity'], 2); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>

                <hr class="border-slate-100">

                <div class="space-y-1.5 text-xs">
                    <div class="flex justify-between text-slate-500">
                        <span>Cart Total:</span>
                        <span>₹<?php echo number_format($subtotal, 2); ?></span>
                    </div>

                    <?php 
                    $discount_amount = 0.00;
                    if (isset($_SESSION['applied_coupon'])): 
                        $applied = $_SESSION['applied_coupon'];
                        if ($subtotal >= $applied['min_spend']):
                            $discount_amount = $subtotal * ($applied['discount_percent'] / 100);
                    ?>
                            <div class="flex justify-between text-indigo-600 font-semibold">
                                <span>Coupon (<?php echo htmlspecialchars($applied['code'], ENT_QUOTES, 'UTF-8'); ?>):</span>
                                <span>-₹<?php echo number_format($discount_amount, 2); ?></span>
                            </div>
                        <?php endif; ?>
                    <?php endif; ?>

                    <div class="flex justify-between text-slate-500">
                        <span>Delivery Charges:</span>
                        <span class="text-emerald-600 font-bold">FREE</span>
                    </div>
                </div>

                <hr class="border-slate-100">

                <div class="flex justify-between text-sm font-extrabold text-slate-800">
                    <span>Payable Amount:</span>
                    <span>₹<?php echo number_format($subtotal - $discount_amount, 2); ?></span>
                </div>
            </div>

        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
