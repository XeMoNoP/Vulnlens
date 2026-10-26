<?php
// DMART CyberLab - Product Details and Reviews Page
require_once __DIR__ . '/includes/header.php';

$product_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$product_id) {
    header("Location: index.php");
    exit;
}

// Fetch Product Details
$stmt = $pdo->prepare("SELECT p.*, c.name as category_name, c.slug as category_slug, i.stock 
                       FROM products p 
                       JOIN categories c ON p.category_id = c.id 
                       JOIN inventory i ON p.id = i.product_id 
                       WHERE p.id = ?");
$stmt->execute([$product_id]);
$product = $stmt->fetch();

if (!$product) {
    header("Location: index.php");
    exit;
}
// ... [rest of reviews and cart handling code remains unchanged] ...
// Handle review submit
$review_msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_review'])) {
    if (!isset($_SESSION['user_id'])) {
        header("Location: login.php?redirect=product.php?id=" . $product_id);
        exit;
    }

    $rating = filter_input(INPUT_POST, 'rating', FILTER_VALIDATE_INT);
    $comment = trim($_POST['comment'] ?? '');

    if ($rating >= 1 && $rating <= 5) {
        $ins_stmt = $pdo->prepare("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)");
        $ins_stmt->execute([$product_id, $_SESSION['user_id'], $rating, $comment]);
        log_audit_event($_SESSION['user_id'], 'ADD_REVIEW', "Added review for product: " . $product['name']);
        $review_msg = 'Review submitted successfully!';
    } else {
        $review_msg = 'Please select a rating between 1 and 5.';
    }
}

// Handle Add to Cart
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_to_cart_detail'])) {
    $qty = filter_input(INPUT_POST, 'qty', FILTER_VALIDATE_INT);
    if (!$qty || $qty <= 0) {
        $qty = 1;
    }

    if ($product['stock'] >= $qty) {
        if (isset($_SESSION['user_id'])) {
            $pdo->beginTransaction();
            try {
                $cart_stmt = $pdo->prepare("SELECT id FROM cart WHERE user_id = ?");
                $cart_stmt->execute([$_SESSION['user_id']]);
                $cart = $cart_stmt->fetch();

                if (!$cart) {
                    $new_cart_stmt = $pdo->prepare("INSERT INTO cart (user_id) VALUES (?)");
                    $new_cart_stmt->execute([$_SESSION['user_id']]);
                    $cart_id = $pdo->lastInsertId();
                } else {
                    $cart_id = $cart['id'];
                }

                $item_stmt = $pdo->prepare("SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?");
                $item_stmt->execute([$cart_id, $product_id]);
                $item = $item_stmt->fetch();

                if ($item) {
                    $new_qty = $item['quantity'] + $qty;
                    if ($new_qty <= $product['stock']) {
                        $upd_stmt = $pdo->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
                        $upd_stmt->execute([$new_qty, $item['id']]);
                    }
                } else {
                    $ins_stmt = $pdo->prepare("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)");
                    $ins_stmt->execute([$cart_id, $product_id, $qty]);
                }
                $pdo->commit();
                header("Location: cart.php");
                exit;
            } catch (\Exception $e) {
                $pdo->rollBack();
            }
        } else {
            if (!isset($_SESSION['guest_cart'])) {
                $_SESSION['guest_cart'] = [];
            }
            if (isset($_SESSION['guest_cart'][$product_id])) {
                $_SESSION['guest_cart'][$product_id] += $qty;
            } else {
                $_SESSION['guest_cart'][$product_id] = $qty;
            }
            header("Location: cart.php");
            exit;
        }
    } else {
        $review_msg = 'Not enough stock available!';
    }
}

// Fetch Reviews
$rev_stmt = $pdo->prepare("SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC");
$rev_stmt->execute([$product_id]);
$reviews = $rev_stmt->fetchAll();
?>

<div class="bg-white rounded-xl border border-slate-100 p-6 md:p-10 shadow-sm mb-10">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        <!-- Product Image Placeholder Panel -->
        <div class="bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden min-h-[300px] relative">
            <?php echo get_product_image_html($product['image'], $product['name'], $product['category_slug'], "w-full h-full object-contain p-6 max-h-[350px]"); ?>
        </div>

        <!-- Product Summary Details -->
        <div class="flex flex-col justify-between">
            <div>
                <span class="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <?php echo htmlspecialchars($product['category_name'], ENT_QUOTES, 'UTF-8'); ?>
                </span>
                
                <h1 class="text-2xl md:text-3xl font-extrabold text-slate-800 mt-4 mb-2">
                    <?php echo htmlspecialchars($product['name'], ENT_QUOTES, 'UTF-8'); ?>
                </h1>

                <div class="flex items-baseline gap-4 mb-6">
                    <span class="text-3xl font-black text-slate-900">&#8377;<?php echo htmlspecialchars($product['dmart_price'], ENT_QUOTES, 'UTF-8'); ?></span>
                    <span class="text-sm text-slate-400 line-through">&#8377;<?php echo htmlspecialchars($product['mrp'], ENT_QUOTES, 'UTF-8'); ?></span>
                    <span class="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded">
                        SAVE &#8377;<?php echo htmlspecialchars($product['mrp'] - $product['dmart_price'], ENT_QUOTES, 'UTF-8'); ?>
                    </span>
                </div>

                <div class="border-t border-slate-100 py-4 mb-6">
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                    <p class="text-slate-600 text-sm leading-relaxed">
                        <?php echo htmlspecialchars($product['description'] ?? 'No description provided.', ENT_QUOTES, 'UTF-8'); ?>
                    </p>
                </div>
            </div>

            <div>
                <div class="flex items-center gap-4 mb-4">
                    <span class="text-sm font-semibold text-slate-700">Availability:</span>
                    <?php if ($product['stock'] > 0): ?>
                        <span class="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span> In Stock (<?php echo (int)$product['stock']; ?> items left)
                        </span>
                    <?php else: ?>
                        <span class="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full">
                            Out of Stock
                        </span>
                    <?php endif; ?>
                </div>

                <?php if ($product['stock'] > 0): ?>
                    <form action="" method="POST" class="flex gap-4 items-center">
                        <div class="w-24">
                            <label for="qty" class="sr-only">Quantity</label>
                            <input type="number" id="qty" name="qty" min="1" max="<?php echo (int)$product['stock']; ?>" value="1" 
                                   class="w-full border border-slate-200 rounded-lg p-2.5 text-center text-sm focus:outline-none focus:border-emerald-500">
                        </div>
                        <button type="submit" name="add_to_cart_detail" class="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm tracking-wide py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <i class="fa-solid fa-cart-plus"></i> ADD TO SHOPPING BAG
                        </button>
                    </form>
                <?php endif; ?>
            </div>

        </div>
    </div>
</div>

<!-- Product Reviews Section -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    
    <!-- Add Review Form -->
    <div class="md:col-span-1 bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-fit">
        <h3 class="font-bold text-slate-800 text-base mb-4">Add a Review</h3>
        
        <?php if ($review_msg !== ''): ?>
            <div class="bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 p-3 text-xs font-semibold rounded mb-4">
                <?php echo htmlspecialchars($review_msg, ENT_QUOTES, 'UTF-8'); ?>
            </div>
        <?php endif; ?>

        <?php if (isset($_SESSION['user_id'])): ?>
            <form action="" method="POST" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Rating</label>
                    <select name="rating" required class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500">
                        <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                        <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                        <option value="3">⭐⭐⭐ (3 - Good)</option>
                        <option value="2">⭐⭐ (2 - Average)</option>
                        <option value="1">⭐ (1 - Poor)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Comments</label>
                    <textarea name="comment" required rows="4" placeholder="Share your experience with this grocery item..." 
                              class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"></textarea>
                </div>
                <button type="submit" name="submit_review" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide py-2.5 rounded-lg transition-colors">
                    SUBMIT REVIEW
                </button>
            </form>
        <?php else: ?>
            <div class="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <i class="fa-regular fa-comments text-slate-400 text-2xl mb-2 block"></i>
                <p class="text-xs text-slate-500 mb-3">Please sign in to write reviews.</p>
                <a href="login.php?redirect=product.php?id=<?php echo $product_id; ?>" class="inline-block text-xs font-bold text-emerald-600 hover:underline">Sign In Now &rarr;</a>
            </div>
        <?php endif; ?>
    </div>

    <!-- Review Feed -->
    <div class="md:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 class="font-bold text-slate-800 text-base mb-6">Customer Reviews (<?php echo count($reviews); ?>)</h3>

        <?php if (empty($reviews)): ?>
            <div class="text-center py-10">
                <i class="fa-regular fa-comment-dots text-slate-300 text-3xl mb-2 block"></i>
                <p class="text-xs text-slate-400">Be the first to review this product!</p>
            </div>
        <?php else: ?>
            <div class="space-y-6">
                <?php foreach ($reviews as $rev): ?>
                    <div class="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                        <div class="flex justify-between items-center mb-1.5">
                            <span class="text-sm font-semibold text-slate-800"><?php echo htmlspecialchars($rev['username'], ENT_QUOTES, 'UTF-8'); ?></span>
                            <span class="text-[10px] text-slate-400 font-medium"><?php echo date("d M Y, H:i", strtotime($rev['created_at'])); ?></span>
                        </div>
                        <div class="flex text-amber-400 text-xs mb-2">
                            <?php for ($i = 1; $i <= 5; $i++): ?>
                                <i class="<?php echo ($i <= $rev['rating']) ? 'fa-solid' : 'fa-regular'; ?> fa-star"></i>
                            <?php endfor; ?>
                        </div>
                        <p class="text-slate-600 text-sm leading-relaxed">
                            <?php echo nl2br(htmlspecialchars($rev['comment'], ENT_QUOTES, 'UTF-8')); ?>
                        </p>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
