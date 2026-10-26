<?php
// DMART CyberLab - Customer Profile, Addresses and Orders
require_once __DIR__ . '/includes/header.php';

// Auth Protection
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php?redirect=profile.php");
    exit;
}

$user_id = $_SESSION['user_id'];
$error = '';
$success = '';

// Handle Avatar upload securely
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['upload_avatar'])) {
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $file_tmp = $_FILES['avatar']['tmp_name'];
        $file_name = $_FILES['avatar']['name'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        // Security check: Only allow specific images
        $allowed_exts = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (in_array($file_ext, $allowed_exts)) {
            // Generate safe filename to prevent Path Traversal or execution
            $new_filename = "avatar_" . $user_id . "_" . time() . "." . $file_ext;
            
            // Create uploads folder if missing
            $upload_dir = __DIR__ . '/uploads/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }

            if (move_uploaded_file($file_tmp, $upload_dir . $new_filename)) {
                // Update DB
                $up_stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                $up_stmt->execute([$new_filename, $user_id]);
                log_audit_event($user_id, 'AVATAR_CHANGE', "Updated avatar image to: " . $new_filename);
                $success = 'Profile avatar updated successfully!';
            } else {
                $error = 'Failed to save uploaded file.';
            }
        } else {
            $error = 'Invalid file extension. Only PNG, JPG, JPEG, and GIF are allowed.';
        }
    } else {
        $error = 'Please select a valid image file to upload.';
    }
}

// Handle Address Removal
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_address'])) {
    $address_id = filter_input(INPUT_POST, 'address_id', FILTER_VALIDATE_INT);
    if ($address_id) {
        $del_stmt = $pdo->prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?");
        $del_stmt->execute([$address_id, $user_id]);
        $success = 'Address deleted successfully.';
    }
}

// Fetch user data
$usr_stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$usr_stmt->execute([$user_id]);
$user_profile = $usr_stmt->fetch();

// Fetch orders history
$ord_stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
$ord_stmt->execute([$user_id]);
$orders_history = $ord_stmt->fetchAll();

// Fetch addresses
$addr_stmt = $pdo->prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC");
$addr_stmt->execute([$user_id]);
$user_addresses = $addr_stmt->fetchAll();
?>

<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
    
    <!-- User Avatar & Profile Summary Card -->
    <div class="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center h-fit space-y-6">
        
        <!-- Avatar Box -->
        <div class="space-y-3">
            <div class="relative w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center border-4 border-slate-50 overflow-hidden shadow-inner">
                <?php if ($user_profile['avatar'] !== 'default.png'): ?>
                    <img src="uploads/<?php echo htmlspecialchars($user_profile['avatar'], ENT_QUOTES, 'UTF-8'); ?>" 
                         alt="Avatar" class="w-full h-full object-cover">
                <?php else: ?>
                    <i class="fa-regular fa-user text-4xl text-slate-300"></i>
                <?php endif; ?>
            </div>
            <div>
                <h3 class="font-bold text-slate-800 text-sm leading-tight"><?php echo htmlspecialchars($user_profile['username'], ENT_QUOTES, 'UTF-8'); ?></h3>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider"><?php echo htmlspecialchars($_SESSION['role'], ENT_QUOTES, 'UTF-8'); ?> account</span>
            </div>
        </div>

        <hr class="border-slate-100">

        <!-- Upload Avatar Form -->
        <form action="" method="POST" enctype="multipart/form-data" class="space-y-3">
            <h4 class="text-xs font-bold text-slate-500 uppercase text-left">Update Avatar</h4>
            <input type="file" name="avatar" accept="image/*" required 
                   class="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer">
            <button type="submit" name="upload_avatar" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] tracking-wide py-2 rounded transition-colors">
                UPLOAD
            </button>
        </form>

        <hr class="border-slate-100">

        <div class="text-left space-y-1.5 text-xs text-slate-500">
            <div><i class="fa-solid fa-map-pin mr-2 text-slate-400"></i> Pincode: <?php echo htmlspecialchars($user_profile['pincode'] ?? 'Not set', ENT_QUOTES, 'UTF-8'); ?></div>
            <div><i class="fa-regular fa-calendar-days mr-2 text-slate-400"></i> Member since: <?php echo date("M Y", strtotime($user_profile['created_at'])); ?></div>
        </div>
    </div>

    <!-- Details Column (Addresses & Order History) -->
    <div class="lg:col-span-3 space-y-8">
        
        <?php if ($error !== ''): ?>
            <div class="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded text-xs font-semibold">
                <?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?>
            </div>
        <?php endif; ?>

        <?php if ($success !== ''): ?>
            <div class="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded text-xs font-semibold">
                <?php echo htmlspecialchars($success, ENT_QUOTES, 'UTF-8'); ?>
            </div>
        <?php endif; ?>

        <!-- Delivery Addresses -->
        <section class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 class="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <i class="fa-solid fa-map-location-dot text-emerald-600"></i> Saved Delivery Addresses
            </h3>
            
            <?php if (empty($user_addresses)): ?>
                <p class="text-xs text-slate-400">You haven't saved any addresses yet. Add one during checkout.</p>
            <?php else: ?>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <?php foreach ($user_addresses as $addr): ?>
                        <div class="border border-slate-100 rounded-lg p-4 flex justify-between items-start">
                            <div class="text-xs">
                                <span class="font-bold text-slate-700 block mb-1">
                                    <?php echo htmlspecialchars($addr['city'] . ", " . $addr['state'], ENT_QUOTES, 'UTF-8'); ?>
                                    <?php if ($addr['is_default']): ?>
                                        <span class="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold text-[9px] ml-1">DEFAULT</span>
                                    <?php endif; ?>
                                </span>
                                <span class="text-slate-500 block mb-1"><?php echo htmlspecialchars($addr['address_line'], ENT_QUOTES, 'UTF-8'); ?></span>
                                <span class="text-slate-400">Pincode: <?php echo htmlspecialchars($addr['pincode'], ENT_QUOTES, 'UTF-8'); ?></span>
                            </div>
                            <form action="" method="POST">
                                <input type="hidden" name="address_id" value="<?php echo $addr['id']; ?>">
                                <button type="submit" name="delete_address" class="text-slate-400 hover:text-red-500 transition-colors">
                                    <i class="fa-regular fa-trash-can"></i>
                                </button>
                            </form>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </section>

        <!-- Order History -->
        <section class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 class="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-emerald-600"></i> My Order History
            </h3>
            
            <?php if (empty($orders_history)): ?>
                <div class="text-center py-6">
                    <p class="text-xs text-slate-400">You haven't placed any orders yet.</p>
                </div>
            <?php else: ?>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                                <th class="p-3">Order No</th>
                                <th class="p-3">Date</th>
                                <th class="p-3">Total Amount</th>
                                <th class="p-3">Status</th>
                                <th class="p-3 text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <?php foreach ($orders_history as $order): ?>
                                <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="p-3 font-semibold text-slate-700"><?php echo htmlspecialchars($order['order_no'], ENT_QUOTES, 'UTF-8'); ?></td>
                                    <td class="p-3 text-slate-400"><?php echo date("d M Y, H:i", strtotime($order['created_at'])); ?></td>
                                    <td class="p-3 font-bold text-slate-800">₹<?php echo number_format($order['total_amount'], 2); ?></td>
                                    <td class="p-3">
                                        <?php 
                                        $status = $order['status'];
                                        $badge_class = 'bg-slate-100 text-slate-700';
                                        if ($status === 'Pending') $badge_class = 'bg-amber-100 text-amber-800';
                                        if ($status === 'Shipped') $badge_class = 'bg-indigo-100 text-indigo-800';
                                        if ($status === 'Delivered') $badge_class = 'bg-emerald-100 text-emerald-800';
                                        if ($status === 'Cancelled') $badge_class = 'bg-red-100 text-red-800';
                                        ?>
                                        <span class="px-2 py-0.5 rounded font-bold text-[9px] <?php echo $badge_class; ?>">
                                            <?php echo htmlspecialchars($status, ENT_QUOTES, 'UTF-8'); ?>
                                        </span>
                                    </td>
                                    <td class="p-3 text-right">
                                        <!-- Safe invoice download path (A01 testing point later) -->
                                        <a href="download_invoice.php?inv=<?php echo htmlspecialchars($order['order_no'], ENT_QUOTES, 'UTF-8'); ?>" 
                                           class="text-emerald-600 hover:text-emerald-800 font-bold hover:underline">
                                            <i class="fa-solid fa-download mr-1"></i> PDF
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </section>

    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
