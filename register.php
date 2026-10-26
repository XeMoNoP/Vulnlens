<?php
// DMART CyberLab - User Registration Module
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
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register'])) {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    $pincode = trim($_POST['pincode'] ?? '');

    // Server-Side Input Validation
    if ($username === '' || $password === '' || $pincode === '') {
        $error = 'All fields are required.';
    } elseif (strlen($username) < 4) {
        $error = 'Username must be at least 4 characters long.';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters long.';
    } elseif ($password !== $confirm_password) {
        $error = 'Passwords do not match.';
    } elseif (!preg_match('/^[0-9]{6}$/', $pincode)) {
        $error = 'Pincode must be exactly 6 numeric digits.';
    } else {
        // Check if username exists
        $chk_stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $chk_stmt->execute([$username]);
        if ($chk_stmt->fetch()) {
            $error = 'Username is already taken.';
        } else {
            // Hash Password Securely using BCrypt
            $password_hash = password_hash($password, PASSWORD_BCRYPT);
            
            // Insert User
            // role_id 2 corresponds to customer
            $ins_stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role_id, pincode) VALUES (?, ?, 2, ?)");
            $ins_stmt->execute([$username, $password_hash, $pincode]);

            log_audit_event($pdo->lastInsertId(), 'USER_REGISTER', "Registered user account: " . $username);
            $success = 'Registration successful! You can now login.';
        }
    }
}
require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-md mx-auto bg-white border border-slate-100 rounded-xl shadow-sm p-8 my-10">
    <div class="text-center mb-6">
        <i class="fa-solid fa-user-plus text-emerald-600 text-3xl mb-2"></i>
        <h2 class="text-2xl font-bold text-slate-800">Create Account</h2>
        <p class="text-xs text-slate-400 mt-1">Register to start ordering fresh groceries online</p>
    </div>

    <?php if ($error !== ''): ?>
        <div class="bg-red-50 border-l-4 border-red-500 text-red-800 p-3.5 text-xs font-semibold rounded-md mb-4 flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation text-red-500"></i>
            <span><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></span>
        </div>
    <?php endif; ?>

    <?php if ($success !== ''): ?>
        <div class="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-3.5 text-xs font-semibold rounded-md mb-4 flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-emerald-500"></i>
            <span><?php echo htmlspecialchars($success, ENT_QUOTES, 'UTF-8'); ?>. <a href="login.php" class="underline font-bold hover:text-emerald-950">Login here</a></span>
        </div>
    <?php endif; ?>

    <form action="" method="POST" class="space-y-4">
        <div>
            <label for="username" class="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
            <input type="text" name="username" id="username" required minlength="4"
                   class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                   value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username'], ENT_QUOTES, 'UTF-8') : ''; ?>">
        </div>

        <div>
            <label for="pincode" class="block text-xs font-bold text-slate-500 uppercase mb-1">Delivery Pincode</label>
            <input type="text" name="pincode" id="pincode" required pattern="[0-9]{6}" placeholder="e.g. 400001"
                   class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                   value="<?php echo isset($_POST['pincode']) ? htmlspecialchars($_POST['pincode'], ENT_QUOTES, 'UTF-8') : ''; ?>">
        </div>

        <div>
            <label for="password" class="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input type="password" name="password" id="password" required minlength="6"
                   class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors">
        </div>

        <div>
            <label for="confirm_password" class="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
            <input type="password" name="confirm_password" id="confirm_password" required minlength="6"
                   class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors">
        </div>

        <button type="submit" name="register" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider py-3 rounded-lg transition-colors mt-2">
            REGISTER
        </button>
    </form>

    <div class="text-center mt-6 text-xs text-slate-500">
        Already have an account? <a href="login.php" class="text-emerald-600 font-semibold hover:underline">Sign In Now &rarr;</a>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
