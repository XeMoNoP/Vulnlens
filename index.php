<?php
// DMART CyberLab - Homepage & Product Catalog
require_once __DIR__ . '/includes/header.php';

// Parse query filters securely
$search_term = isset($_GET['q']) ? trim($_GET['q']) : '';
$category_slug = isset($_GET['category']) ? trim($_GET['category']) : '';

// Build Query Securely
$query = "SELECT p.*, c.name as category_name, c.slug as category_slug, i.stock
          FROM products p
          JOIN categories c ON p.category_id = c.id
          JOIN inventory i ON p.id = i.product_id";
$params = [];
$where_clauses = [];

if ($search_term !== '') {
    $where_clauses[] = "p.name LIKE ?";
    $params[] = "%" . $search_term . "%";
}

if ($category_slug !== '') {
    $where_clauses[] = "c.slug = ?";
    $params[] = $category_slug;
}

if (!empty($where_clauses)) {
    $query .= " WHERE " . implode(" AND ", $where_clauses);
}

$query .= " ORDER BY p.id ASC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$products = $stmt->fetchAll();

// Handle add-to-cart directly from catalog
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_to_cart'])) {
    $product_id = filter_input(INPUT_POST, 'product_id', FILTER_VALIDATE_INT);
    $quantity = 1; // Default to 1 from catalog listing

    if ($product_id) {
        // Verify product existence and stock
        $stmt_stock = $pdo->prepare("SELECT stock FROM inventory WHERE product_id = ?");
        $stmt_stock->execute([$product_id]);
        $stock_res = $stmt_stock->fetch();

        if ($stock_res && $stock_res['stock'] >= $quantity) {
            if (isset($_SESSION['user_id'])) {
                // Fetch or Create user cart
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

                    // Check if item already in cart
                    $item_stmt = $pdo->prepare("SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?");
                    $item_stmt->execute([$cart_id, $product_id]);
                    $item = $item_stmt->fetch();

                    if ($item) {
                        // Update quantity securely
                        $new_qty = $item['quantity'] + $quantity;
                        // Confirm stock limits
                        if ($new_qty <= $stock_res['stock']) {
                            $upd_stmt = $pdo->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
                            $upd_stmt->execute([$new_qty, $item['id']]);
                        }
                    } else {
                        $ins_stmt = $pdo->prepare("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)");
                        $ins_stmt->execute([$cart_id, $product_id, $quantity]);
                    }
                    $pdo->commit();
                    header("Location: index.php?msg=added");
                    exit;
                } catch (\Exception $e) {
                    $pdo->rollBack();
                }
            } else {
                // Store in guest session cart
                if (!isset($_SESSION['guest_cart'])) {
                    $_SESSION['guest_cart'] = [];
                }
                if (isset($_SESSION['guest_cart'][$product_id])) {
                    $_SESSION['guest_cart'][$product_id] += $quantity;
                } else {
                    $_SESSION['guest_cart'][$product_id] = $quantity;
                }
                header("Location: index.php?msg=added");
                exit;
            }
        } else {
            header("Location: index.php?error=outofstock");
            exit;
        }
    }
}
?>

<!-- Info Messages -->
<?php if (isset($_GET['msg']) && $_GET['msg'] === 'added'): ?>
    <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-6 rounded-xl shadow-sm transition-all duration-300">
        <div class="flex items-center">
            <div class="bg-emerald-500 text-white p-1 rounded-full mr-3 text-xs">
                <i class="fa-solid fa-check"></i>
            </div>
            <span class="text-sm font-semibold text-emerald-800">Product successfully added to your cart!</span>
        </div>
    </div>
<?php elseif (isset($_GET['error']) && $_GET['error'] === 'outofstock'): ?>
    <div class="bg-rose-50 border-l-4 border-rose-500 p-4 mb-6 rounded-xl shadow-sm transition-all duration-300">
        <div class="flex items-center">
            <div class="bg-rose-500 text-white p-1 rounded-full mr-3 text-xs">
                <i class="fa-solid fa-xmark"></i>
            </div>
            <span class="text-sm font-semibold text-rose-800">Requested item quantity is out of stock!</span>
        </div>
    </div>
<?php endif; ?>

<?php
// Check if user is browsing the default homepage or a catalog subset
$is_catalog_mode = ($search_term !== '' || $category_slug !== '');
?>

<?php if (!$is_catalog_mode): ?>
    <!-- ==================================================
         DEFAULT HOMEPAGE MODE
         ================================================== -->
    
    <!-- 1. HERO SECTION -->
    <section class="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl text-white overflow-hidden shadow-lg mb-12 relative">
        <div class="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>
        <div class="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -left-20 -top-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        
        <div class="px-8 py-16 md:p-20 max-w-2xl relative z-10">
            <span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6 inline-block">
                <i class="fa-solid fa-tags mr-1"></i> Lowest Prices Guaranteed
            </span>
            <h1 class="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6">
                Everything you need, <br><span class="text-emerald-400">at great prices.</span>
            </h1>
            <p class="text-slate-300 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                Shop groceries, household essentials, personal care and more. Guaranteed fresh quality delivered daily to your doorstep.
            </p>
            <div class="flex flex-wrap gap-4">
                <a href="#deals" class="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 text-sm">
                    Shop Now <i class="fa-solid fa-arrow-right ml-1"></i>
                </a>
                <a href="#deals" class="bg-slate-800/80 hover:bg-slate-800 text-white font-semibold border border-slate-700 px-8 py-3.5 rounded-xl transition-all duration-200 text-sm">
                    Explore Deals
                </a>
            </div>
        </div>
    </section>

    <!-- 2. CATEGORY SECTION -->
    <section class="mb-12">
        <div class="flex justify-between items-end mb-6">
            <div>
                <span class="text-emerald-600 font-bold text-xs uppercase tracking-wider block mb-1">Browse our store</span>
                <h2 class="text-2xl font-black text-slate-800">Shop by Category</h2>
            </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <?php foreach ($nav_categories as $cat): ?>
                <a href="index.php?category=<?php echo htmlspecialchars($cat['slug'], ENT_QUOTES, 'UTF-8'); ?>" 
                   class="bg-white border border-slate-100 hover:border-emerald-100 p-5 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-200 group">
                    <?php echo get_category_icon($cat['slug']); ?>
                    <span class="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors leading-tight">
                        <?php echo htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8'); ?>
                    </span>
                </a>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- 3. DEALS SECTION -->
    <section id="deals" class="mb-12">
        <div class="flex justify-between items-end mb-6">
            <div>
                <span class="text-red-600 font-bold text-xs uppercase tracking-wider block mb-1">Limited Time Offers</span>
                <h2 class="text-2xl font-black text-slate-800">Today's Best Deals</h2>
            </div>
            <a href="index.php" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                View All <i class="fa-solid fa-angle-right"></i>
            </a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <?php 
            // Display top 4 deals based on highest saving percentage
            $deals_products = $products;
            usort($deals_products, function($a, $b) {
                $save_a = ($a['mrp'] - $a['dmart_price']) / $a['mrp'];
                $save_b = ($b['mrp'] - $b['dmart_price']) / $b['mrp'];
                return $save_b <=> $save_a;
            });
            $deals_subset = array_slice($deals_products, 0, 4);
            foreach ($deals_subset as $prod): 
                $save_pct = round((($prod['mrp'] - $prod['dmart_price']) / $prod['mrp']) * 100);
            ?>
                <div class="bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                    <div>
                        <!-- E-commerce Product Image Box -->
                        <div class="bg-slate-50 h-48 flex items-center justify-center relative overflow-hidden">
                            <span class="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full absolute top-3 left-3 shadow-sm uppercase tracking-wider z-20">
                                <?php echo $save_pct; ?>% OFF
                            </span>
                            <span class="bg-slate-200/50 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded absolute top-3 right-3 uppercase z-20">
                                <?php echo htmlspecialchars($prod['category_name'], ENT_QUOTES, 'UTF-8'); ?>
                            </span>
                            
                            <?php echo get_product_image_html($prod['image'], $prod['name'], $prod['category_slug'] ?? '', "w-full h-full object-contain p-4 transform group-hover:scale-105 transition-transform duration-300"); ?>
                        </div>

                        <div class="p-4">
                            <div class="flex items-center gap-1 text-amber-400 text-[10px] mb-1.5">
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star-half-stroke"></i>
                                <span class="text-slate-400 font-medium ml-1">(4.5)</span>
                            </div>
                            <a href="product.php?id=<?php echo (int)$prod['id']; ?>" class="block font-bold text-slate-800 hover:text-emerald-600 transition-colors text-sm mb-1 leading-snug">
                                <?php echo htmlspecialchars($prod['name'], ENT_QUOTES, 'UTF-8'); ?>
                            </a>
                            <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                <?php echo htmlspecialchars($prod['description'] ?? 'Fresh grocery items hand-selected for quality.', ENT_QUOTES, 'UTF-8'); ?>
                            </p>
                        </div>
                    </div>

                    <div class="p-4 pt-0">
                        <div class="flex items-baseline justify-between mb-4">
                            <div>
                                <span class="text-slate-800 font-extrabold text-lg">&#8377;<?php echo htmlspecialchars($prod['dmart_price'], ENT_QUOTES, 'UTF-8'); ?></span>
                                <span class="text-xs text-slate-400 line-through ml-1.5">&#8377;<?php echo htmlspecialchars($prod['mrp'], ENT_QUOTES, 'UTF-8'); ?></span>
                            </div>
                            <span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                                Save &#8377;<?php echo htmlspecialchars($prod['mrp'] - $prod['dmart_price'], ENT_QUOTES, 'UTF-8'); ?>
                            </span>
                        </div>

                        <form action="" method="POST">
                            <input type="hidden" name="product_id" value="<?php echo (int)$prod['id']; ?>">
                            <?php if ($prod['stock'] > 0): ?>
                                <button type="submit" name="add_to_cart" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm">
                                    <i class="fa-solid fa-cart-plus"></i> ADD TO CART
                                </button>
                            <?php else: ?>
                                <button disabled class="w-full bg-slate-100 text-slate-400 py-2.5 rounded-xl font-bold text-xs tracking-wide cursor-not-allowed flex items-center justify-center gap-2">
                                    OUT OF STOCK
                                </button>
                            <?php endif; ?>
                        </form>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- 4. PROMOTIONAL BANNERS -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div class="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white relative overflow-hidden shadow-sm group">
            <div class="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
            <div class="max-w-md relative z-10">
                <span class="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Daily Staples</span>
                <h3 class="text-2xl font-black mb-2">Fresh groceries at everyday prices</h3>
                <p class="text-orange-50 text-xs mb-5">Premium quality flour, grains, and dals hand-picked for your family.</p>
                <a href="index.php?category=rice-atta-dals" class="bg-white text-orange-600 hover:bg-orange-50 transition-colors font-bold px-5 py-2 rounded-lg text-xs inline-block">Explore Staples &rarr;</a>
            </div>
        </div>
        <div class="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-sm group">
            <div class="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
            <div class="max-w-md relative z-10">
                <span class="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Household Essentials</span>
                <h3 class="text-2xl font-black mb-2">Clean home, healthy living</h3>
                <p class="text-teal-50 text-xs mb-5">Stock up on premium soaps, dishwashes, and bathroom hygiene products.</p>
                <a href="index.php?category=personal-household" class="bg-white text-teal-700 hover:bg-teal-50 transition-colors font-bold px-5 py-2 rounded-lg text-xs inline-block">Explore Cleaners &rarr;</a>
            </div>
        </div>
    </section>

    <!-- 5. POPULAR PRODUCTS -->
    <section class="mb-12">
        <div class="flex justify-between items-end mb-6">
            <div>
                <span class="text-emerald-600 font-bold text-xs uppercase tracking-wider block mb-1">Customer Favorites</span>
                <h2 class="text-2xl font-black text-slate-800">Popular Products</h2>
            </div>
            <a href="index.php" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
                View All <i class="fa-solid fa-angle-right"></i>
            </a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <?php 
            // Display 8 popular products (order by ID or custom sequence)
            $popular_subset = array_slice($products, 0, 8);
            foreach ($popular_subset as $prod): 
                $save_pct = round((($prod['mrp'] - $prod['dmart_price']) / $prod['mrp']) * 100);
            ?>
                <div class="bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                    <div>
                        <!-- E-commerce Product Image Box -->
                        <div class="bg-slate-50 h-44 flex items-center justify-center relative overflow-hidden">
                            <span class="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded absolute top-3 left-3 uppercase z-20">
                                <?php echo htmlspecialchars($prod['category_name'], ENT_QUOTES, 'UTF-8'); ?>
                            </span>
                            
                            <?php echo get_product_image_html($prod['image'], $prod['name'], $prod['category_slug'] ?? '', "w-full h-full object-contain p-4 transform group-hover:scale-105 transition-transform duration-300"); ?>
                        </div>

                        <div class="p-4">
                            <div class="flex items-center gap-1 text-amber-400 text-[10px] mb-1.5">
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <span class="text-slate-400 font-medium ml-1">(5.0)</span>
                            </div>
                            <a href="product.php?id=<?php echo (int)$prod['id']; ?>" class="block font-bold text-slate-800 hover:text-emerald-600 transition-colors text-sm mb-1 leading-snug">
                                <?php echo htmlspecialchars($prod['name'], ENT_QUOTES, 'UTF-8'); ?>
                            </a>
                            <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                <?php echo htmlspecialchars($prod['description'] ?? 'Fresh grocery items hand-selected for quality.', ENT_QUOTES, 'UTF-8'); ?>
                            </p>
                        </div>
                    </div>

                    <div class="p-4 pt-0">
                        <div class="flex items-baseline justify-between mb-4">
                            <div>
                                <span class="text-slate-800 font-extrabold text-lg">&#8377;<?php echo htmlspecialchars($prod['dmart_price'], ENT_QUOTES, 'UTF-8'); ?></span>
                                <span class="text-xs text-slate-400 line-through ml-1.5">&#8377;<?php echo htmlspecialchars($prod['mrp'], ENT_QUOTES, 'UTF-8'); ?></span>
                            </div>
                            <span class="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                                <?php echo $save_pct; ?>% OFF
                            </span>
                        </div>

                        <form action="" method="POST">
                            <input type="hidden" name="product_id" value="<?php echo (int)$prod['id']; ?>">
                            <?php if ($prod['stock'] > 0): ?>
                                <button type="submit" name="add_to_cart" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm">
                                    <i class="fa-solid fa-cart-plus"></i> ADD TO CART
                                </button>
                            <?php else: ?>
                                <button disabled class="w-full bg-slate-100 text-slate-400 py-2.5 rounded-xl font-bold text-xs tracking-wide cursor-not-allowed flex items-center justify-center gap-2">
                                    OUT OF STOCK
                                </button>
                            <?php endif; ?>
                        </form>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- 6. WHY SHOP WITH US SECTION -->
    <section class="bg-slate-100 rounded-3xl p-8 md:p-12 mb-4">
        <div class="text-center max-w-lg mx-auto mb-10">
            <span class="text-emerald-600 font-bold text-xs uppercase tracking-wider block mb-1">Our Commitment</span>
            <h2 class="text-2xl font-black text-slate-800">Why Shop With Us?</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            
            <div class="bg-white p-6 rounded-2xl border border-slate-200/60 flex flex-col items-center text-center shadow-sm">
                <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-base mb-3.5"><i class="fa-solid fa-indian-rupee-sign"></i></div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">Great Prices</h4>
                <p class="text-[11px] text-slate-400 leading-relaxed">Guaranteed lowest rates and special offers every single day.</p>
            </div>
            
            <div class="bg-white p-6 rounded-2xl border border-slate-200/60 flex flex-col items-center text-center shadow-sm">
                <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-base mb-3.5"><i class="fa-solid fa-award"></i></div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">Quality Products</h4>
                <p class="text-[11px] text-slate-400 leading-relaxed">Hand-selected groceries and standard household items.</p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/60 flex flex-col items-center text-center shadow-sm">
                <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-base mb-3.5"><i class="fa-solid fa-lock"></i></div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">Secure Checkout</h4>
                <p class="text-[11px] text-slate-400 leading-relaxed">Ensured security compliance and protected transactions.</p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/60 flex flex-col items-center text-center shadow-sm">
                <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-base mb-3.5"><i class="fa-solid fa-mobile-screen"></i></div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">Easy Shopping</h4>
                <p class="text-[11px] text-slate-400 leading-relaxed">Intuitive interface design making grocery ordering seamless.</p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200/60 flex flex-col items-center text-center shadow-sm">
                <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-base mb-3.5"><i class="fa-solid fa-truck-fast"></i></div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">Fast Delivery</h4>
                <p class="text-[11px] text-slate-400 leading-relaxed">On-time and careful shipping right to your home.</p>
            </div>
            
        </div>
    </section>

<?php else: ?>
    <!-- ==================================================
         CATALOG / SEARCH RESULTS MODE
         ================================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Sidebar / Filters -->
        <aside class="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4"><i class="fa-solid fa-filter mr-1.5 text-emerald-600"></i> Categories</h3>
            <ul class="space-y-1.5 text-sm">
                <li>
                    <a href="index.php" class="block py-2 px-3 rounded-xl transition-all duration-200 <?php echo ($category_slug === '') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'; ?>">
                        All Categories
                    </a>
                </li>
                <?php foreach ($nav_categories as $cat): ?>
                    <li>
                        <a href="index.php?category=<?php echo htmlspecialchars($cat['slug'], ENT_QUOTES, 'UTF-8'); ?>" 
                           class="block py-2 px-3 rounded-xl transition-all duration-200 <?php echo ($category_slug === $cat['slug']) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'; ?>">
                            <?php echo htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8'); ?>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </aside>

        <!-- Catalog Grid -->
        <section class="lg:col-span-3">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-slate-800">
                    <?php 
                    if ($search_term !== '') {
                        echo "Search Results for '" . htmlspecialchars($search_term, ENT_QUOTES, 'UTF-8') . "'";
                    } else if ($category_slug !== '') {
                        $c_meta = $pdo->prepare("SELECT name FROM categories WHERE slug = ?");
                        $c_meta->execute([$category_slug]);
                        $cat_data = $c_meta->fetch();
                        echo htmlspecialchars($cat_data['name'] ?? 'Category', ENT_QUOTES, 'UTF-8');
                    } else {
                        echo "All Grocery Items";
                    }
                    ?>
                </h2>
                <span class="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full"><?php echo count($products); ?> items found</span>
            </div>

            <?php if (empty($products)): ?>
                <div class="bg-white p-16 rounded-2xl text-center border border-slate-100 shadow-sm">
                    <div class="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center text-3xl mx-auto mb-4">
                        <i class="fa-solid fa-basket-shopping"></i>
                    </div>
                    <h3 class="text-base font-bold text-slate-700 mb-1">No Products Found</h3>
                    <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">We couldn't find matches for your selection. Try adjusting filters or searching other products.</p>
                    <a href="index.php" class="mt-6 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm">Reset All Filters</a>
                </div>
            <?php else: ?>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <?php foreach ($products as $prod): 
                        $save_pct = round((($prod['mrp'] - $prod['dmart_price']) / $prod['mrp']) * 100);
                    ?>
                        <div class="bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                            
                            <!-- Product Info -->
                            <div>
                                <div class="bg-slate-50 h-44 flex items-center justify-center relative overflow-hidden">
                                    <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full absolute top-3 left-3 z-20">
                                        <?php echo htmlspecialchars($prod['category_name'], ENT_QUOTES, 'UTF-8'); ?>
                                    </span>
                                    
                                    <?php echo get_product_image_html($prod['image'], $prod['name'], $prod['category_slug'] ?? '', "w-full h-full object-contain p-4 transform group-hover:scale-105 transition-transform duration-300"); ?>
                                </div>

                                <div class="p-4">
                                    <a href="product.php?id=<?php echo (int)$prod['id']; ?>" class="block font-bold text-slate-800 hover:text-emerald-600 transition-colors text-sm mb-1 leading-snug">
                                        <?php echo htmlspecialchars($prod['name'], ENT_QUOTES, 'UTF-8'); ?>
                                    </a>
                                    <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                        <?php echo htmlspecialchars($prod['description'] ?? 'Fresh grocery items hand-selected for quality.', ENT_QUOTES, 'UTF-8'); ?>
                                    </p>
                                </div>
                            </div>

                            <!-- Price / Action Footer -->
                            <div class="p-4 pt-0">
                                <div class="flex items-baseline justify-between mb-4">
                                    <div>
                                        <span class="text-slate-800 font-extrabold text-lg">&#8377;<?php echo htmlspecialchars($prod['dmart_price'], ENT_QUOTES, 'UTF-8'); ?></span>
                                        <span class="text-xs text-slate-400 line-through ml-1.5">&#8377;<?php echo htmlspecialchars($prod['mrp'], ENT_QUOTES, 'UTF-8'); ?></span>
                                    </div>
                                    <span class="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-md">
                                        SAVE <?php echo $save_pct; ?>%
                                    </span>
                                </div>

                                <form action="" method="POST">
                                    <input type="hidden" name="product_id" value="<?php echo (int)$prod['id']; ?>">
                                    <?php if ($prod['stock'] > 0): ?>
                                        <button type="submit" name="add_to_cart" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm">
                                            <i class="fa-solid fa-cart-plus"></i> ADD TO CART
                                        </button>
                                    <?php else: ?>
                                        <button disabled class="w-full bg-slate-100 text-slate-400 py-2.5 rounded-xl font-bold text-xs tracking-wide cursor-not-allowed flex items-center justify-center gap-2">
                                            OUT OF STOCK
                                        </button>
                                    <?php endif; ?>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </section>

    </div>
<?php endif; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
