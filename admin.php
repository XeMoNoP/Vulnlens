<?php
// DMART CyberLab - Administrative Management Control Panel
require_once __DIR__ . '/includes/header.php';

// Authorization Check
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo "<div class='max-w-md mx-auto my-12 bg-red-50 text-red-800 p-6 rounded-xl border border-red-200 text-center'>";
    echo "<i class='fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-3 block'></i>";
    echo "<h2 class='font-bold text-lg mb-1'>Access Denied</h2>";
    echo "<p class='text-xs mb-4'>You do not have administrative permissions to view this page.</p>";
    echo "<a href='login.php' class='bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-900 transition-colors'>Sign In</a>";
    echo "</div>";
    require_once __DIR__ . '/includes/footer.php';
    exit;
}

$error = '';
$success = '';
$active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'products';

// Validate the CSRF token on every state-changing admin request (VULN-005, A01).
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
}

// ----------------------------------------------------
// Action Handler: Products CRUD
// ----------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_product'])) {
    $prod_id = filter_input(INPUT_POST, 'product_id', FILTER_VALIDATE_INT);
    $name = trim($_POST['name'] ?? '');
    $desc = trim($_POST['description'] ?? '');
    $category_id = filter_input(INPUT_POST, 'category_id', FILTER_VALIDATE_INT);
    $mrp = filter_input(INPUT_POST, 'mrp', FILTER_VALIDATE_FLOAT);
    $dmart_price = filter_input(INPUT_POST, 'dmart_price', FILTER_VALIDATE_FLOAT);
    $stock = filter_input(INPUT_POST, 'stock', FILTER_VALIDATE_INT);

    if ($name === '' || !$category_id || $mrp === false || $dmart_price === false || $stock === false) {
        $error = 'All fields are required and must be valid numeric values.';
    } else {
        if ($prod_id) {
            // Update Existing Product
            $upd_stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, category_id = ?, mrp = ?, dmart_price = ? WHERE id = ?");
            $upd_stmt->execute([$name, $desc, $category_id, $mrp, $dmart_price, $prod_id]);

            // Update Stock
            $upd_stock = $pdo->prepare("UPDATE inventory SET stock = ? WHERE product_id = ?");
            $upd_stock->execute([$stock, $prod_id]);

            log_audit_event($_SESSION['user_id'], 'PRODUCT_EDIT', "Updated product properties: $name (ID: $prod_id)");
            $success = 'Product updated successfully.';
        } else {
            // Add New Product
            $ins_stmt = $pdo->prepare("INSERT INTO products (name, description, category_id, mrp, dmart_price) VALUES (?, ?, ?, ?, ?)");
            $ins_stmt->execute([$name, $desc, $category_id, $mrp, $dmart_price]);
            $new_prod_id = $pdo->lastInsertId();

            // Insert stock
            $ins_stock = $pdo->prepare("INSERT INTO inventory (product_id, stock) VALUES (?, ?)");
            $ins_stock->execute([$new_prod_id, $stock]);

            log_audit_event($_SESSION['user_id'], 'PRODUCT_CREATE', "Created new product: $name (ID: $new_prod_id)");
            $success = 'Product created successfully.';
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_product'])) {
    $prod_id = filter_input(INPUT_POST, 'product_id', FILTER_VALIDATE_INT);
    if ($prod_id) {
        $del_stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $del_stmt->execute([$prod_id]);

        log_audit_event($_SESSION['user_id'], 'PRODUCT_DELETE', "Deleted product ID: $prod_id");
        $success = 'Product deleted successfully.';
    }
}

// ----------------------------------------------------
// Action Handler: Orders Update
// ----------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_order_status'])) {
    $order_id = filter_input(INPUT_POST, 'order_id', FILTER_VALIDATE_INT);
    $status = $_POST['status'] ?? '';

    $allowed_statuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

    if ($order_id && in_array($status, $allowed_statuses)) {
        $upd_ord = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $upd_ord->execute([$status, $order_id]);

        log_audit_event($_SESSION['user_id'], 'ORDER_STATUS_UPDATE', "Updated order ID: $order_id status to: $status");
        $success = 'Order status updated successfully.';
    }
}

// ----------------------------------------------------
// Action Handler: Stock Update
// ----------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_stock_only'])) {
    $prod_id = filter_input(INPUT_POST, 'product_id', FILTER_VALIDATE_INT);
    $stock = filter_input(INPUT_POST, 'stock', FILTER_VALIDATE_INT);

    if ($prod_id && $stock !== false && $stock >= 0) {
        $upd_stock = $pdo->prepare("UPDATE inventory SET stock = ? WHERE product_id = ?");
        $upd_stock->execute([$stock, $prod_id]);

        log_audit_event($_SESSION['user_id'], 'STOCK_LEVEL_UPDATE', "Updated stock for product ID: $prod_id to level: $stock");
        $success = 'Stock levels updated successfully.';
    }
}

// Fetch categories for product forms
$cats_stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
$all_categories = $cats_stmt->fetchAll();
?>

<div class="max-w-6xl mx-auto">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
            <h2 class="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-user-shield text-indigo-900"></i> Administrative Portal
            </h2>
            <p class="text-xs text-slate-400 mt-1">Supervise inventory, products, orders, and review system audit records.</p>
        </div>
        <span class="bg-indigo-900 text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
            Admin Profile: <?php echo htmlspecialchars($_SESSION['username'], ENT_QUOTES, 'UTF-8'); ?>
        </span>
    </div>

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

    <!-- Horizontal Tabbed navigation -->
    <div class="flex flex-wrap gap-2 mb-6 border-b border-slate-200">
        <a href="admin.php?tab=products" class="px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-colors <?php echo ($active_tab === 'products') ? 'bg-indigo-900 text-white' : 'text-slate-500 hover:text-indigo-900 bg-slate-50'; ?>">
            <i class="fa-solid fa-box-archive mr-1.5"></i> Products List
        </a>
        <a href="admin.php?tab=add_product" class="px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-colors <?php echo ($active_tab === 'add_product') ? 'bg-indigo-900 text-white' : 'text-slate-500 hover:text-indigo-900 bg-slate-50'; ?>">
            <i class="fa-solid fa-plus mr-1.5"></i> Add Product
        </a>
        <a href="admin.php?tab=inventory" class="px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-colors <?php echo ($active_tab === 'inventory') ? 'bg-indigo-900 text-white' : 'text-slate-500 hover:text-indigo-900 bg-slate-50'; ?>">
            <i class="fa-solid fa-warehouse mr-1.5"></i> Inventory Levels
        </a>
        <a href="admin.php?tab=orders" class="px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-colors <?php echo ($active_tab === 'orders') ? 'bg-indigo-900 text-white' : 'text-slate-500 hover:text-indigo-900 bg-slate-50'; ?>">
            <i class="fa-solid fa-truck-ramp-box mr-1.5"></i> Customer Orders
        </a>
        <a href="admin.php?tab=users" class="px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-colors <?php echo ($active_tab === 'users') ? 'bg-indigo-900 text-white' : 'text-slate-500 hover:text-indigo-900 bg-slate-50'; ?>">
            <i class="fa-solid fa-users mr-1.5"></i> Registered Users
        </a>
        <a href="admin.php?tab=logs" class="px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-colors <?php echo ($active_tab === 'logs') ? 'bg-indigo-900 text-white' : 'text-slate-500 hover:text-indigo-900 bg-slate-50'; ?>">
            <i class="fa-solid fa-list-check mr-1.5"></i> Audit Logs
        </a>
    </div>

    <!-- Tab Contents -->
    <div class="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
        
        <!-- Tab 1: Products List -->
        <?php if ($active_tab === 'products'): 
            $prod_list = $pdo->query("SELECT p.*, c.name as category_name, i.stock 
                                      FROM products p 
                                      JOIN categories c ON p.category_id = c.id 
                                      JOIN inventory i ON p.id = i.product_id 
                                      ORDER BY p.id DESC")->fetchAll();
        ?>
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Manage Products</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th class="p-3">ID</th>
                            <th class="p-3">Product Name</th>
                            <th class="p-3">Category</th>
                            <th class="p-3">MRP (Rs)</th>
                            <th class="p-3">DMart Price (Rs)</th>
                            <th class="p-3">Stock</th>
                            <th class="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php foreach ($prod_list as $prod): ?>
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="p-3"><?php echo $prod['id']; ?></td>
                                <td class="p-3 font-semibold text-slate-700"><?php echo htmlspecialchars($prod['name'], ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="p-3 text-slate-500"><?php echo htmlspecialchars($prod['category_name'], ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="p-3">₹<?php echo number_format($prod['mrp'], 2); ?></td>
                                <td class="p-3 font-bold">₹<?php echo number_format($prod['dmart_price'], 2); ?></td>
                                <td class="p-3">
                                    <span class="font-bold <?php echo ($prod['stock'] < 10) ? 'text-red-500' : 'text-slate-600'; ?>">
                                        <?php echo (int)$prod['stock']; ?>
                                    </span>
                                </td>
                                <td class="p-3 text-right flex justify-end gap-3">
                                    <a href="admin.php?tab=add_product&edit_id=<?php echo $prod['id']; ?>" class="text-indigo-600 hover:text-indigo-800 font-bold">Edit</a>
                                    <form action="" method="POST" onsubmit="return confirm('Are you sure you want to delete this product?');">
                                        <?php echo csrf_field(); ?>
                                        <input type="hidden" name="product_id" value="<?php echo $prod['id']; ?>">
                                        <button type="submit" name="delete_product" class="text-red-500 hover:text-red-700 font-bold">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

        <!-- Tab 2: Add/Edit Product -->
        <?php elseif ($active_tab === 'add_product'): 
            $edit_id = filter_input(INPUT_GET, 'edit_id', FILTER_VALIDATE_INT);
            $form_name = '';
            $form_desc = '';
            $form_cat = '';
            $form_mrp = '';
            $form_price = '';
            $form_stock = 0;

            if ($edit_id) {
                $e_stmt = $pdo->prepare("SELECT p.*, i.stock FROM products p JOIN inventory i ON p.id = i.product_id WHERE p.id = ?");
                $e_stmt->execute([$edit_id]);
                $edit_prod = $e_stmt->fetch();

                if ($edit_prod) {
                    $form_name = $edit_prod['name'];
                    $form_desc = $edit_prod['description'];
                    $form_cat = $edit_prod['category_id'];
                    $form_mrp = $edit_prod['mrp'];
                    $form_price = $edit_prod['dmart_price'];
                    $form_stock = $edit_prod['stock'];
                }
            }
        ?>
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">
                <?php echo $edit_id ? 'Modify Product Properties' : 'Create New Catalog Product'; ?>
            </h3>
            <form action="admin.php?tab=products" method="POST" class="space-y-4 max-w-xl">
                <?php echo csrf_field(); ?>
                <?php if ($edit_id): ?>
                    <input type="hidden" name="product_id" value="<?php echo $edit_id; ?>">
                <?php endif; ?>

                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                    <input type="text" name="name" required value="<?php echo htmlspecialchars($form_name, ENT_QUOTES, 'UTF-8'); ?>"
                           class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500">
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                    <textarea name="description" rows="3" class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500"><?php echo htmlspecialchars($form_desc, ENT_QUOTES, 'UTF-8'); ?></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                        <select name="category_id" required class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500">
                            <option value="">Select Category</option>
                            <?php foreach ($all_categories as $cat): ?>
                                <option value="<?php echo $cat['id']; ?>" <?php echo ($form_cat == $cat['id']) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8'); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Stock Level</label>
                        <input type="number" name="stock" required min="0" value="<?php echo (int)$form_stock; ?>"
                               class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">MRP Price (Rs)</label>
                        <input type="number" name="mrp" step="0.01" required value="<?php echo htmlspecialchars($form_mrp, ENT_QUOTES, 'UTF-8'); ?>"
                               class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">DMart Special Price (Rs)</label>
                        <input type="number" name="dmart_price" step="0.01" required value="<?php echo htmlspecialchars($form_price, ENT_QUOTES, 'UTF-8'); ?>"
                               class="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500">
                    </div>
                </div>

                <button type="submit" name="save_product" class="bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs tracking-wider py-2.5 px-6 rounded-lg transition-colors">
                    SAVE PRODUCT
                </button>
            </form>

        <!-- Tab 3: Inventory Levels -->
        <?php elseif ($active_tab === 'inventory'): 
            $inv_list = $pdo->query("SELECT p.id, p.name, i.stock, i.last_updated 
                                     FROM products p 
                                     JOIN inventory i ON p.id = i.product_id 
                                     ORDER BY i.stock ASC")->fetchAll();
        ?>
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Stock Control Board</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th class="p-3">Product ID</th>
                            <th class="p-3">Product Name</th>
                            <th class="p-3">Stock Count</th>
                            <th class="p-3">Last Updated</th>
                            <th class="p-3 text-right">Update Stock</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php foreach ($inv_list as $item): ?>
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="p-3"><?php echo $item['id']; ?></td>
                                <td class="p-3 font-semibold text-slate-700"><?php echo htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="p-3">
                                    <span class="font-bold <?php echo ($item['stock'] < 10) ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'; ?> px-2 py-0.5 rounded">
                                        <?php echo (int)$item['stock']; ?>
                                    </span>
                                </td>
                                <td class="p-3 text-slate-400"><?php echo $item['last_updated']; ?></td>
                                <td class="p-3 text-right">
                                    <form action="" method="POST" class="inline-flex gap-2 justify-end">
                                        <?php echo csrf_field(); ?>
                                        <input type="hidden" name="product_id" value="<?php echo $item['id']; ?>">
                                        <input type="number" name="stock" min="0" required value="<?php echo (int)$item['stock']; ?>"
                                               class="w-16 border border-slate-200 rounded p-1 text-center text-xs">
                                        <button type="submit" name="update_stock_only" class="bg-slate-900 hover:bg-slate-800 text-white text-[10px] px-3 rounded font-bold">
                                            Update
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

        <!-- Tab 4: Customer Orders -->
        <?php elseif ($active_tab === 'orders'): 
            $orders_list = $pdo->query("SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC")->fetchAll();
        ?>
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Manage Orders</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th class="p-3">Order No</th>
                            <th class="p-3">Date</th>
                            <th class="p-3">Customer</th>
                            <th class="p-3">Total Amount</th>
                            <th class="p-3">Status</th>
                            <th class="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php foreach ($orders_list as $ord): ?>
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="p-3 font-semibold text-slate-700"><?php echo htmlspecialchars($ord['order_no'], ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="p-3 text-slate-400"><?php echo date("d M Y, H:i", strtotime($ord['created_at'])); ?></td>
                                <td class="p-3 text-slate-600 font-medium"><?php echo htmlspecialchars($ord['username'], ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="p-3 font-bold text-slate-800">₹<?php echo number_format($ord['total_amount'], 2); ?></td>
                                <td class="p-3">
                                    <span class="px-2 py-0.5 rounded font-bold text-[9px] <?php 
                                        if ($ord['status'] === 'Pending') echo 'bg-amber-100 text-amber-800';
                                        elseif ($ord['status'] === 'Shipped') echo 'bg-indigo-100 text-indigo-800';
                                        elseif ($ord['status'] === 'Delivered') echo 'bg-emerald-100 text-emerald-800';
                                        else echo 'bg-red-100 text-red-800';
                                    ?>">
                                        <?php echo htmlspecialchars($ord['status'], ENT_QUOTES, 'UTF-8'); ?>
                                    </span>
                                </td>
                                <td class="p-3 text-right">
                                    <form action="" method="POST" class="inline-flex gap-2 justify-end">
                                        <?php echo csrf_field(); ?>
                                        <input type="hidden" name="order_id" value="<?php echo $ord['id']; ?>">
                                        <select name="status" class="border border-slate-200 rounded p-1 text-[10px]">
                                            <option value="Pending" <?php echo ($ord['status'] === 'Pending') ? 'selected' : ''; ?>>Pending</option>
                                            <option value="Shipped" <?php echo ($ord['status'] === 'Shipped') ? 'selected' : ''; ?>>Shipped</option>
                                            <option value="Delivered" <?php echo ($ord['status'] === 'Delivered') ? 'selected' : ''; ?>>Delivered</option>
                                            <option value="Cancelled" <?php echo ($ord['status'] === 'Cancelled') ? 'selected' : ''; ?>>Cancelled</option>
                                        </select>
                                        <button type="submit" name="update_order_status" class="bg-indigo-900 hover:bg-indigo-950 text-white text-[10px] px-2.5 rounded font-bold">
                                            Apply
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

        <!-- Tab 5: Users List -->
        <?php elseif ($active_tab === 'users'): 
            $users_list = $pdo->query("SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.role_id ASC, u.id ASC")->fetchAll();
        ?>
            <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Registered Accounts</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th class="p-3">ID</th>
                            <th class="p-3">Username</th>
                            <th class="p-3">Role</th>
                            <th class="p-3">Pincode</th>
                            <th class="p-3">Avatar Link</th>
                            <th class="p-3">Created At</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php foreach ($users_list as $usr): ?>
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="p-3"><?php echo $usr['id']; ?></td>
                                <td class="p-3 font-semibold text-slate-700"><?php echo htmlspecialchars($usr['username'], ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="p-3">
                                    <span class="px-2 py-0.5 rounded text-[9px] font-bold <?php echo ($usr['role_name'] === 'admin') ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'; ?>">
                                        <?php echo htmlspecialchars($usr['role_name'], ENT_QUOTES, 'UTF-8'); ?>
                                    </span>
                                </td>
                                <td class="p-3 text-slate-500"><?php echo htmlspecialchars($usr['pincode'] ?? 'N/A', ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="p-3 text-slate-400"><?php echo htmlspecialchars($usr['avatar'], ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="p-3 text-slate-400"><?php echo $usr['created_at']; ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

        <!-- Tab 6: Audit Logs -->
        <?php elseif ($active_tab === 'logs'): 
            $logs_list = $pdo->query("SELECT l.*, u.username FROM audit_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.timestamp DESC LIMIT 100")->fetchAll();
        ?>
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">System Audit Record Log (Last 100 Logs)</h3>
                <span class="text-[10px] bg-slate-100 px-2 py-1 rounded font-mono font-bold text-slate-500">A09 Logging Demonstration Point</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th class="p-3">ID</th>
                            <th class="p-3">Timestamp</th>
                            <th class="p-3">Operator</th>
                            <th class="p-3">Event Type</th>
                            <th class="p-3">Message</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
                        <?php if (empty($logs_list)): ?>
                            <tr>
                                <td colspan="5" class="p-3 text-center text-slate-400">No logs found in database.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($logs_list as $log): ?>
                                <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="p-3 text-slate-400"><?php echo $log['id']; ?></td>
                                    <td class="p-3 text-slate-500"><?php echo $log['timestamp']; ?></td>
                                    <td class="p-3 font-semibold text-slate-700"><?php echo htmlspecialchars($log['username'] ?? 'SYSTEM', ENT_QUOTES, 'UTF-8'); ?></td>
                                    <td class="p-3">
                                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                                            <?php echo htmlspecialchars($log['event_type'], ENT_QUOTES, 'UTF-8'); ?>
                                        </span>
                                    </td>
                                    <td class="p-3 text-slate-600"><?php echo htmlspecialchars($log['message'], ENT_QUOTES, 'UTF-8'); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>

    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
