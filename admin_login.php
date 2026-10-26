<?php
// DMART CyberLab - Administrative Authentication Module
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config/db.php';

// Redirect if already logged in as admin
if (isset($_SESSION['user_id']) && isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
    header("Location: admin.php");
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_login'])) {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Both username and password are required.';
    } else {
        // Fetch Admin user
        $stmt = $pdo->prepare("SELECT u.*, r.name as role_name 
                               FROM users u 
                               JOIN roles r ON u.role_id = r.id 
                               WHERE u.username = ? AND r.name = 'admin'");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            session_regenerate_id(true);

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role_name'];

            log_audit_event($user['id'], 'ADMIN_LOGIN', "Successful administrator login: " . $username);

            header("Location: admin.php");
            exit;
        } else {
            log_audit_event(null, 'ADMIN_LOGIN_FAILED', "Failed admin login attempt for username: " . $username);
            $error = 'Invalid administrative credentials or insufficient privileges.';
        }
    }
}
require_once __DIR__ . '/includes/header.php';
?>

<div class="max-w-md mx-auto bg-white border border-slate-100 rounded-xl shadow-md p-8 my-10">
    <div class="text-center mb-6">
        <i class="fa-solid fa-user-shield text-indigo-900 text-4xl mb-2"></i>
        <h2 class="text-2xl font-bold text-slate-800">Admin Control Panel</h2>
        <p class="text-xs text-slate-400 mt-1">Authorized Supervisory Staff Access Only</p>
    </div>

    <?php if ($error !== ''): ?>
        <div class="bg-red-50 border-l-4 border-red-500 text-red-800 p-3.5 text-xs font-semibold rounded-md mb-4 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation text-red-500"></i>
            <span><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></span>
        </div>
    <?php endif; ?>

    <form action="" method="POST" class="space-y-4">
        <div>
            <label for="username" class="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Username</label>
            <input type="text" name="username" id="username" required 
                   class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
        </div>

        <div>
            <label for="password" class="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Password</label>
            <input type="password" name="password" id="password" required 
                   class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
        </div>

        <button type="submit" name="admin_login" class="w-full bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs tracking-wider py-3 rounded-lg transition-colors mt-2">
            ACCESS ADMINISTRATIVE CONTROL
        </button>
    </form>

    <div class="text-center mt-6 text-xs">
        <a href="login.php" class="text-slate-500 hover:text-slate-700 font-semibold">&larr; Return to Customer Sign In</a>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
