<?php
// DMART CyberLab - Secure Header Layout
if (session_status() == PHP_SESSION_NONE) {
    // Session Cookie Settings
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => false, // Set to true if running HTTPS locally
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    session_start();
}

require_once __DIR__ . '/../config/db.php';

// Fetch categories for navbar/sidebar
$cat_stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
$nav_categories = $cat_stmt->fetchAll();

// Count Cart Items
$cart_count = 0;
if (isset($_SESSION['user_id'])) {
    $c_stmt = $pdo->prepare("SELECT SUM(quantity) as total_qty FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE c.user_id = ?");
    $c_stmt->execute([$_SESSION['user_id']]);
    $cart_res = $c_stmt->fetch();
    $cart_count = $cart_res['total_qty'] ?? 0;
} else {
    // If guest, count from session cart
    if (isset($_SESSION['guest_cart'])) {
        foreach ($_SESSION['guest_cart'] as $qty) {
            $cart_count += $qty;
        }
    }
}

// Fetch User Location / Pincode
$display_pincode = 'Select Location';
if (isset($_SESSION['user_id'])) {
    if (isset($_SESSION['current_pincode'])) {
        $display_pincode = $_SESSION['current_pincode'];
    } else {
        $addr_stmt = $pdo->prepare("SELECT pincode, city FROM addresses WHERE user_id = ? AND is_default = 1 LIMIT 1");
        $addr_stmt->execute([$_SESSION['user_id']]);
        $default_addr = $addr_stmt->fetch();
        if ($default_addr) {
            $display_pincode = $default_addr['city'] . ' (' . $default_addr['pincode'] . ')';
            $_SESSION['current_pincode'] = $display_pincode;
        } else {
            $usr_stmt = $pdo->prepare("SELECT pincode FROM users WHERE id = ?");
            $usr_stmt->execute([$_SESSION['user_id']]);
            $usr_data = $usr_stmt->fetch();
            if ($usr_data && !empty($usr_data['pincode'])) {
                $display_pincode = $usr_data['pincode'];
                $_SESSION['current_pincode'] = $display_pincode;
            }
        }
    }
} else if (isset($_SESSION['current_pincode'])) {
    $display_pincode = $_SESSION['current_pincode'];
}

// Handle Location Selector Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['set_location'])) {
    csrf_check();
    $new_pincode = trim($_POST['pincode'] ?? '');
    // The pincode column is 6 digits. Validate before storing so a long or
    // non-numeric value can never overflow or corrupt the stored pincode
    // (A06: Insecure Design / A10: Mishandling of Exceptional Conditions).
    if (preg_match('/^[0-9]{6}$/', $new_pincode)) {
        $_SESSION['current_pincode'] = $new_pincode;
        if (isset($_SESSION['user_id'])) {
            $up_stmt = $pdo->prepare("UPDATE users SET pincode = ? WHERE id = ?");
            $up_stmt->execute([$new_pincode, $_SESSION['user_id']]);
        }
    } else {
        $_SESSION['location_error'] = 'Please enter a valid 6-digit pincode.';
    }
    header("Location: " . $_SERVER['REQUEST_URI']);
    exit;
}

function get_category_icon($slug) {
    switch ($slug) {
        case 'rice-atta-dals':
            return '<div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-3"><i class="fa-solid fa-wheat-awn"></i></div>';
        case 'oils-ghee':
            return '<div class="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center text-xl mb-3"><i class="fa-solid fa-bottle-droplet"></i></div>';
        case 'beverages':
            return '<div class="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl mb-3"><i class="fa-solid fa-mug-hot"></i></div>';
        case 'snacks-biscuits':
            return '<div class="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xl mb-3"><i class="fa-solid fa-cookie"></i></div>';
        case 'dairy-packaged':
            return '<div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3"><i class="fa-solid fa-cheese"></i></div>';
        case 'personal-household':
            return '<div class="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xl mb-3"><i class="fa-solid fa-sparkles"></i></div>';
        default:
            return '<div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-3"><i class="fa-solid fa-leaf"></i></div>';
    }
}

function get_product_image_html($image_filename, $category_name, $category_slug, $class = "w-full h-full object-cover") {
    $local_path = __DIR__ . '/../images/' . $image_filename;
    if (!file_exists($local_path)) {
        $local_path = __DIR__ . '/images/' . $image_filename;
    }
    
    if (!empty($image_filename) && file_exists($local_path)) {
        return '<img src="images/' . htmlspecialchars($image_filename, ENT_QUOTES, 'UTF-8') . '" class="' . $class . '" alt="' . htmlspecialchars($category_name, ENT_QUOTES, 'UTF-8') . '">';
    } else {
        $icon = get_category_icon($category_slug);
        $icon_clean = str_replace('mb-3', 'text-5xl', $icon);
        return '<div class="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4">
                  <div class="text-slate-300 transform group-hover:scale-110 transition-transform duration-300">' . 
                  $icon_clean . 
                 '</div>
                </div>';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DMART CyberLab - Supermarket Store</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #f8fafc;
        }
    </style>
</head>
<body class="flex flex-col min-h-screen">

    <?php if (SECURITY_MODE === 'LAB'): ?>
    <!-- LAB mode banner: only the admin can switch modes. Shown so it is always
         clear which mode the test site is running in. -->
    <div class="bg-amber-500 text-slate-900 text-center py-2.5 px-4 text-xs font-bold shadow-md flex flex-col sm:flex-row items-center justify-center gap-1.5 z-40 relative">
        <span class="bg-slate-950 text-amber-500 text-[10px] px-3 py-1 rounded-full font-extrabold flex items-center gap-1 uppercase tracking-wider">
            <i class="fa-solid fa-triangle-exclamation"></i> LAB MODE
        </span>
        <span>Controlled testing environment is active. Switch to SECURE mode to verify fixes.</span>
    </div>
    <?php endif; ?>

    <!-- Main Navigation Bar -->
    <header class="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div class="container mx-auto px-4 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <!-- Logo / Brand -->
            <a href="index.php" class="flex items-center gap-2 group">
                <div class="bg-emerald-600 text-white p-2.5 rounded-xl font-bold text-xl tracking-tight shadow-sm group-hover:bg-emerald-700 transition-all duration-200">
                    <i class="fa-solid fa-basket-shopping"></i>
                </div>
                <div>
                    <span class="text-2xl font-black text-slate-800 tracking-tight block">DMART</span>
                    <span class="text-emerald-600 font-bold text-xs block -mt-1 tracking-wider uppercase">CyberLab</span>
                </div>
            </a>

            <!-- Search Form -->
            <form action="index.php" method="GET" class="w-full md:w-1/2 max-w-2xl flex items-center">
                <div class="relative w-full">
                    <input type="text" name="q" placeholder="Search for products, brands and categories" 
                           class="w-full pl-5 pr-12 py-2.5 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200 bg-slate-50 focus:bg-white"
                           value="<?php echo isset($_GET['q']) ? htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8') : ''; ?>">
                    <button type="submit" class="absolute right-4 top-3 text-slate-400 hover:text-emerald-600 transition-colors">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </form>

            <!-- Quick Navigation Controls -->
            <div class="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <!-- Location Indicator -->
                <div class="relative group">
                    <div class="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer py-2">
                        <div class="bg-emerald-50 text-emerald-600 p-2 rounded-full">
                            <i class="fa-solid fa-location-dot text-sm"></i>
                        </div>
                        <div class="text-left leading-tight">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Deliver to</span>
                            <span class="text-xs font-semibold block text-slate-700 group-hover:text-emerald-600 transition-colors"><?php echo htmlspecialchars($display_pincode, ENT_QUOTES, 'UTF-8'); ?></span>
                        </div>
                        <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-emerald-600 transition-colors ml-0.5"></i>
                    </div>
                    <div class="absolute right-0 w-72 bg-white border border-slate-100 rounded-xl shadow-xl p-4 hidden group-hover:block z-50 mt-1">
                        <h4 class="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Select Delivery Location</h4>
                        <p class="text-[11px] text-slate-400 mb-3">Enter your pincode or city name to check product availability.</p>
                        <form action="" method="POST" class="space-y-2">
                            <?php echo csrf_field(); ?>
                            <div class="flex gap-2">
                                <input type="text" name="pincode" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="6-digit pincode (e.g. 400001)"
                                       class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                       required>
                                <button type="submit" name="set_location" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm">
                                    Apply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- User Profile / Session Control -->
                <?php if (isset($_SESSION['user_id'])): ?>
                    <div class="relative group">
                        <div class="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition-colors py-2 cursor-pointer">
                            <div class="bg-slate-100 text-slate-600 p-2 rounded-full">
                                <i class="fa-regular fa-user text-sm"></i>
                            </div>
                            <div class="text-left leading-tight hidden sm:block">
                                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">My Account</span>
                                <span class="text-xs font-semibold block text-slate-700"><?php echo htmlspecialchars($_SESSION['username'], ENT_QUOTES, 'UTF-8'); ?></span>
                            </div>
                            <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-emerald-600 transition-colors ml-0.5 hidden sm:inline"></i>
                        </div>
                        <div class="absolute right-0 w-52 bg-white border border-slate-100 rounded-xl shadow-xl py-2 hidden group-hover:block z-50 mt-1">
                            <div class="px-4 py-2 border-b border-slate-100">
                                <p class="text-xs text-slate-400">Signed in as</p>
                                <p class="text-sm font-semibold text-slate-700 truncate"><?php echo htmlspecialchars($_SESSION['username'], ENT_QUOTES, 'UTF-8'); ?></p>
                            </div>
                            <a href="profile.php" class="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"><i class="fa-regular fa-id-card mr-3 text-slate-400 text-base"></i> My Profile</a>
                            <?php if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin'): ?>
                                <a href="admin.php" class="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"><i class="fa-solid fa-user-shield mr-3 text-slate-400 text-base"></i> Admin Panel</a>
                                <a href="admin_security.php" class="flex items-center px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-semibold"><i class="fa-solid fa-magnifying-glass-chart mr-3 text-indigo-500 text-base"></i> VulnLens Console</a>
                            <?php endif; ?>
                            <hr class="border-slate-100 my-1">
                            <a href="logout.php" class="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold"><i class="fa-solid fa-arrow-right-from-bracket mr-3 text-red-400 text-base"></i> Sign Out</a>
                        </div>
                    </div>
                <?php else: ?>
                    <a href="login.php" class="text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors flex items-center gap-2">
                        <div class="bg-slate-100 text-slate-600 p-2 rounded-full">
                            <i class="fa-solid fa-arrow-right-to-bracket text-sm"></i>
                        </div>
                        <span class="hidden sm:inline">Sign In</span>
                    </a>
                <?php endif; ?>

                <!-- Cart Button -->
                <a href="cart.php" class="relative text-slate-700 hover:text-emerald-600 transition-colors py-2 flex items-center gap-2 group">
                    <div class="bg-emerald-50 text-emerald-600 p-2.5 rounded-full group-hover:bg-emerald-100 transition-colors relative">
                        <i class="fa-solid fa-cart-shopping text-sm"></i>
                        <?php if ($cart_count > 0): ?>
                            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-extrabold shadow-sm border border-white">
                                <?php echo (int)$cart_count; ?>
                            </span>
                        <?php endif; ?>
                    </div>
                    <div class="text-left leading-tight hidden lg:block">
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">My Cart</span>
                        <span class="text-xs font-semibold block text-slate-700 group-hover:text-emerald-600 transition-colors">Bag Details</span>
                    </div>
                </a>
            </div>
        </div>
    </header>

    <!-- Sub Header for Category List -->
    <nav class="bg-slate-100 border-b border-slate-200 py-2.5 hidden md:block">
        <div class="container mx-auto px-4 flex gap-6 text-sm">
            <a href="index.php" class="text-slate-700 font-semibold hover:text-emerald-600">All Products</a>
            <?php foreach ($nav_categories as $cat): ?>
                <a href="index.php?category=<?php echo htmlspecialchars($cat['slug'], ENT_QUOTES, 'UTF-8'); ?>" 
                   class="text-slate-600 hover:text-emerald-600 transition-colors font-medium">
                    <?php echo htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8'); ?>
                </a>
            <?php endforeach; ?>
        </div>
    </nav>

    <!-- Main Content Container -->
    <main class="flex-grow container mx-auto px-4 py-6">
