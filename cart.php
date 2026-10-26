<?php
// DMART CyberLab - Shopping Cart Page
require_once __DIR__ . '/includes/header.php';

$error = '';
$success = '';

// Handle Quantity Updates / Deletions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_qty'])) {
        $product_id = filter_input(INPUT_POST, 'product_id', FILTER_VALIDATE_INT);
        $qty = filter_input(INPUT_POST, 'quantity', FILTER_VALIDATE_INT);

        // Security check: Quantity must be positive integer
        if ($qty === false || $qty <= 0) {
            $error = 'Invalid quantity. Value must be at least 1.';
        } else {
            // Verify stock limit
            $st_stmt = $pdo->prepare("SELECT stock FROM inventory WHERE product_id = ?");
            $st_stmt->execute([$product_id]);
            $item_stock = $st_stmt->fetch();

            if ($item_stock && $qty <= $item_stock['stock']) {
                if (isset($_SESSION['user_id'])) {
                    // Update user cart items
                    $up_stmt = $pdo->prepare("UPDATE cart_items ci 
                                              JOIN cart c ON ci.cart_id = c.id 
                                              SET ci.quantity = ? 
                                              WHERE c.user_id = ? AND ci.product_id = ?");
                    $up_stmt->execute([$qty, $_SESSION['user_id'], $product_id]);
                } else {
                    // Update guest session cart
                    $_SESSION['guest_cart'][$product_id] = $qty;
                }
                $success = 'Cart updated successfully.';
            } else {
                $error = 'Selected quantity exceeds available stock!';
            }
        }
    }

    if (isset($_POST['remove_item'])) {
        $product_id = filter_input(INPUT_POST, 'product_id', FILTER_VALIDATE_INT);

        if ($product_id) {
            if (isset($_SESSION['user_id'])) {
                $del_stmt = $pdo->prepare("DELETE ci FROM cart_items ci 
                                           JOIN cart c ON ci.cart_id = c.id 
                                           WHERE c.user_id = ? AND ci.product_id = ?");
                $del_stmt->execute([$_SESSION['user_id'], $product_id]);
            } else {
                unset($_SESSION['guest_cart'][$product_id]);
            }
            $success = 'Item removed from cart.';
        }
    }

    // Coupon System
    if (isset($_POST['apply_coupon'])) {
        $coupon_code = trim($_POST['coupon_code'] ?? '');

        if ($coupon_code !== '') {
            $cop_stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1");
            $cop_stmt->execute([$coupon_code]);
            $coupon = $cop_stmt->fetch();

            if ($coupon) {
                $_SESSION['applied_coupon'] = [
                    'code' => $coupon['code'],
                    'discount_percent' => $coupon['discount_percent'],
                    'min_spend' => $coupon['min_spend']
                ];
                $success = 'Coupon code applied!';
            } else {
                $error = 'Invalid or inactive coupon code.';
            }
        }
    }

    if (isset($_POST['remove_coupon'])) {
        unset($_SESSION['applied_coupon']);
        $success = 'Coupon code removed.';
    }
}

// Fetch Cart Data
$cart_items = [];
$total_mrp = 0.00;
$total_price = 0.00;

if (isset($_SESSION['user_id'])) {
    $stmt = $pdo->prepare("SELECT ci.product_id, ci.quantity, p.name, p.mrp, p.dmart_price, p.image, cat.slug as category_slug, i.stock 
                           FROM cart_items ci 
                           JOIN cart c ON ci.cart_id = c.id 
                           JOIN products p ON ci.product_id = p.id 
                           JOIN categories cat ON p.category_id = cat.id
                           JOIN inventory i ON p.id = i.product_id 
                           WHERE c.user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $cart_items = $stmt->fetchAll();
} else {
    if (isset($_SESSION['guest_cart']) && !empty($_SESSION['guest_cart'])) {
        $placeholders = implode(',', array_fill(0, count($_SESSION['guest_cart']), '?'));
        $stmt = $pdo->prepare("SELECT p.id as product_id, p.name, p.mrp, p.dmart_price, p.image, cat.slug as category_slug, i.stock 
                               FROM products p 
                               JOIN categories cat ON p.category_id = cat.id
                               JOIN inventory i ON p.id = i.product_id 
                               WHERE p.id IN ($placeholders)");
        $stmt->execute(array_keys($_SESSION['guest_cart']));
        $raw_items = $stmt->fetchAll();

        foreach ($raw_items as $item) {
            $qty = $_SESSION['guest_cart'][$item['product_id']];
            $item['quantity'] = $qty;
            $cart_items[] = $item;
        }
    }
}

// Calculate totals
foreach ($cart_items as $item) {
    $total_mrp += $item['mrp'] * $item['quantity'];
    $total_price += $item['dmart_price'] * $item['quantity'];
}

// Coupon validation
$discount_amount = 0.00;
if (isset($_SESSION['applied_coupon'])) {
    $applied = $_SESSION['applied_coupon'];
    if ($total_price >= $applied['min_spend']) {
        $discount_amount = $total_price * ($applied['discount_percent'] / 100);
    } else {
        $error = "Min spend for coupon '{$applied['code']}' is ₹{$applied['min_spend']}. Coupon discount is temporarily suspended.";
    }
}
$final_total = $total_price - $discount_amount;
?>

<div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i class="fa-solid fa-cart-shopping text-emerald-600"></i> Shopping Cart
    </h2>

    <?php if ($error !== ''): ?>
        <div class="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded text-xs font-semibold">
            <?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?>
        </div>
    <?php endif; ?>

    <?php if ($success !== ''): ?>
        <div class="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 mb-6 rounded text-xs font-semibold">
            <?php echo htmlspecialchars($success, ENT_QUOTES, 'UTF-8'); ?>
        </div>
    <?php endif; ?>

    <?php if (empty($cart_items)): ?>
        <div class="bg-white p-12 rounded-xl text-center border border-slate-100 shadow-sm">
            <i class="fa-solid fa-cart-plus text-5xl text-slate-200 mb-4 block"></i>
            <h3 class="text-base font-semibold text-slate-700 mb-2">Your Cart is Empty</h3>
            <p class="text-xs text-slate-400 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <a href="index.php" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider py-2.5 px-6 rounded-lg transition-colors inline-block">SHOP NOW</a>
        </div>
    <?php else: ?>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Items Column -->
            <div class="lg:col-span-2 space-y-4">
                <?php foreach ($cart_items as $item): ?>
                    <div class="bg-white rounded-xl border border-slate-100 p-4 flex gap-4 items-center justify-between shadow-sm">
                        
                        <!-- Details -->
                        <div class="flex items-center gap-3">
                            <div class="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden relative shadow-sm flex-shrink-0">
                                <?php echo get_product_image_html($item['image'], $item['name'], $item['category_slug'], "w-full h-full object-contain p-1"); ?>
                            </div>
                            <div>
                                <h4 class="text-sm font-semibold text-slate-800 leading-tight">
                                    <?php echo htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8'); ?>
                                </h4>
                                <div class="text-xs text-slate-400 mt-1">
                                    Price: ₹<?php echo htmlspecialchars($item['dmart_price'], ENT_QUOTES, 'UTF-8'); ?> 
                                    <span class="line-through text-[10px] ml-1">₹<?php echo htmlspecialchars($item['mrp'], ENT_QUOTES, 'UTF-8'); ?></span>
                                </div>
                            </div>
                        </div>

                        <!-- Quantity Actions & Delete -->
                        <div class="flex items-center gap-4">
                            <form action="" method="POST" class="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                <input type="hidden" name="product_id" value="<?php echo $item['product_id']; ?>">
                                <input type="number" name="quantity" min="1" max="<?php echo $item['stock']; ?>" 
                                       value="<?php echo $item['quantity']; ?>" 
                                       class="w-12 text-center text-xs p-1 focus:outline-none border-r border-slate-200">
                                <button type="submit" name="update_qty" class="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                    SET
                                </button>
                            </form>

                            <form action="" method="POST">
                                <input type="hidden" name="product_id" value="<?php echo $item['product_id']; ?>">
                                <button type="submit" name="remove_item" class="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-all">
                                    <i class="fa-regular fa-trash-can text-sm"></i>
                                </button>
                            </form>
                        </div>

                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Summary Column -->
            <div class="lg:col-span-1 space-y-6">
                
                <!-- Coupon Apply Box -->
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Have a Coupon?</h3>
                    <?php if (isset($_SESSION['applied_coupon'])): ?>
                        <div class="flex justify-between items-center bg-indigo-50 border border-indigo-100 rounded-lg p-2.5">
                            <div>
                                <span class="text-xs font-bold text-indigo-700"><?php echo htmlspecialchars($_SESSION['applied_coupon']['code'], ENT_QUOTES, 'UTF-8'); ?></span>
                                <span class="text-[10px] text-indigo-500 block">Applied - <?php echo (int)$_SESSION['applied_coupon']['discount_percent']; ?>% Off</span>
                            </div>
                            <form action="" method="POST">
                                <button type="submit" name="remove_coupon" class="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                            </form>
                        </div>
                    <?php else: ?>
                        <form action="" method="POST" class="flex gap-2">
                            <input type="text" name="coupon_code" placeholder="e.g. WELCOME10" required 
                                   class="border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 flex-grow uppercase">
                            <button type="submit" name="apply_coupon" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] tracking-wide px-4 rounded-lg transition-colors">
                                APPLY
                            </button>
                        </form>
                    <?php endif; ?>
                </div>

                <!-- Totals Box -->
                <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Order Summary</h3>
                    
                    <div class="flex justify-between text-xs text-slate-500">
                        <span>Bag MRP Total:</span>
                        <span>₹<?php echo number_format($total_mrp, 2); ?></span>
                    </div>

                    <div class="flex justify-between text-xs text-slate-500">
                        <span>Bag DMART Price:</span>
                        <span>₹<?php echo number_format($total_price, 2); ?></span>
                    </div>

                    <div class="flex justify-between text-xs text-emerald-600 font-bold">
                        <span>Total Savings:</span>
                        <span>-₹<?php echo number_format($total_mrp - $total_price, 2); ?></span>
                    </div>

                    <?php if ($discount_amount > 0): ?>
                        <div class="flex justify-between text-xs text-indigo-600 font-bold">
                            <span>Coupon Discount (<?php echo $_SESSION['applied_coupon']['discount_percent']; ?>%):</span>
                            <span>-₹<?php echo number_format($discount_amount, 2); ?></span>
                        </div>
                    <?php endif; ?>

                    <hr class="border-slate-100">

                    <div class="flex justify-between text-sm font-extrabold text-slate-800">
                        <span>Final Payable:</span>
                        <span>₹<?php echo number_format($final_total, 2); ?></span>
                    </div>

                    <a href="checkout.php" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
                        PROCEED TO CHECKOUT <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>

            </div>

        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
