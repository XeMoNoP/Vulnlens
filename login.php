<?php
// DMART CyberLab - User Authentication Module
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config/db.php';

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$error = '';

// Only allow redirects to a local relative path (prevents open-redirect to an
// external site). Anything with a scheme, host, or leading slashes is rejected.
$redirect = 'index.php';
if (isset($_GET['redirect'])) {
    $candidate = $_GET['redirect'];
    if (!preg_match('#^(?:[a-z][a-z0-9+.\-]*:|//)#i', $candidate) && $candidate[0] !== '/') {
        $redirect = $candidate;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Both username and password are required.';
    } else {
        // Fetch User and Role
        $stmt = $pdo->prepare("SELECT u.*, r.name as role_name 
                               FROM users u 
                               JOIN roles r ON u.role_id = r.id 
                               WHERE u.username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            // Regeneration of session ID to mitigate Session Fixation
            session_regenerate_id(true);

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role_name'];

            // Log authentication success
            log_audit_event($user['id'], 'USER_LOGIN', "Successful login event for user: " . $username);

            // Merge guest session cart with database cart
            if (isset($_SESSION['guest_cart']) && !empty($_SESSION['guest_cart'])) {
                $pdo->beginTransaction();
                try {
                    // Check if DB cart exists
                    $c_stmt = $pdo->prepare("SELECT id FROM cart WHERE user_id = ?");
                    $c_stmt->execute([$user['id']]);
                    $cart = $c_stmt->fetch();

                    if (!$cart) {
                        $new_c_stmt = $pdo->prepare("INSERT INTO cart (user_id) VALUES (?)");
                        $new_c_stmt->execute([$user['id']]);
                        $cart_id = $pdo->lastInsertId();
                    } else {
                        $cart_id = $cart['id'];
                    }

                    foreach ($_SESSION['guest_cart'] as $prod_id => $qty) {
                        // Check if item exists in DB cart
                        $it_stmt = $pdo->prepare("SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?");
                        $it_stmt->execute([$cart_id, $prod_id]);
                        $item = $it_stmt->fetch();

                        if ($item) {
                            $new_qty = $item['quantity'] + $qty;
                            $up_stmt = $pdo->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
                            $up_stmt->execute([$new_qty, $item['id']]);
                        } else {
                            $ins_stmt = $pdo->prepare("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)");
                            $ins_stmt->execute([$cart_id, $prod_id, $qty]);
                        }
                    }
                    unset($_SESSION['guest_cart']);
                    $pdo->commit();
                } catch (\Exception $e) {
                    $pdo->rollBack();
                }
            }

            header("Location: " . $redirect);
            exit;
        } else {
            // Log the failed attempt so authentication failures are visible in
            // the audit trail (A09: Security Logging & Alerting Failures).
            log_audit_event(null, 'LOGIN_FAILED', "Failed login attempt for username: " . $username);
            $error = 'Invalid username or password.';
        }
    }
}
require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-md mx-auto bg-white border border-slate-100 rounded-xl shadow-sm p-8 my-10">
    <div class="text-center mb-6">
        <i class="fa-solid fa-lock text-emerald-600 text-3xl mb-2"></i>
        <h2 class="text-2xl font-bold text-slate-800">Sign In</h2>
        <p class="text-xs text-slate-400 mt-1">Access your DMART CyberLab account</p>
    </div>

    <?php if ($error !== ''): ?>
        <div class="bg-red-50 border-l-4 border-red-500 text-red-800 p-3.5 text-xs font-semibold rounded-md mb-4 flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation text-red-500"></i>
            <span><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></span>
        </div>
    <?php endif; ?>

    <form action="" method="POST" class="space-y-4">
        <div>
            <label for="username" class="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
            <input type="text" name="username" id="username" required 
                   class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                   value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username'], ENT_QUOTES, 'UTF-8') : ''; ?>">
        </div>

        <div>
            <label for="password" class="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input type="password" name="password" id="password" required 
                   class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors">
        </div>

        <button type="submit" name="login" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider py-3 rounded-lg transition-colors mt-2">
            SIGN IN
        </button>
    </form>

    <div class="text-center mt-6 text-xs text-slate-500 space-y-2">
        <div>Don't have an account? <a href="register.php" class="text-emerald-600 font-semibold hover:underline">Register Now &rarr;</a></div>
        <div>Are you a supervisor? <a href="admin_login.php" class="text-indigo-600 font-semibold hover:underline">Admin Login &rarr;</a></div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
