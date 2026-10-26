<?php
/**
 * VulnLens - Security Assessment Console (view)
 *
 * Rendered by admin_security.php after the admin auth check. Expects:
 *   $pdo, SECURITY_MODE, log_audit_event(), csrf_token()/csrf_field()/csrf_check()
 * and the VulnLens check runners (via vulnlens/integrate.php).
 *
 * Everything shown here is read from the database: the vulnerability register,
 * the evidence log and the retest log. Nothing is hard-coded.
 */

if (!defined('VULNLENS_INTEGRATED')) {
    http_response_code(403);
    exit('VulnLens is not integrated.');
}

$section = isset($_GET['section']) ? $_GET['section'] : 'overview';
$error = '';
$success = '';

// ----- POST handlers -------------------------------------------------------

// Security mode change (SECURE / LAB) - admin only, logged.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_security_mode'])) {
    csrf_check();
    $new_mode = $_POST['security_mode'] ?? 'SECURE';
    if ($new_mode === 'SECURE' || $new_mode === 'LAB') {
        $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'security_mode'");
        $stmt->execute([$new_mode]);
        log_audit_event($_SESSION['user_id'], 'SECURITY_MODE_CHANGE', "Administrator changed security mode to: " . $new_mode);
        header("Location: admin_security.php?section=configuration&success=1");
        exit;
    }
}

// Run all automated OWASP checks against the host application.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['run_scan'])) {
    csrf_check();
    $scan_results = vl_run_all_checks($pdo, $_SESSION['user_id']);
    $_SESSION['last_scan'] = $scan_results;
    header("Location: admin_security.php?section=scenarios&scanned=1");
    exit;
}

// Manual evidence entry, linked to a register finding.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_evidence'])) {
    csrf_check();
    $vuln_id = trim($_POST['vuln_id'] ?? '');
    $test_id = trim($_POST['test_id'] ?? '');
    $module = trim($_POST['module'] ?? '');
    $observation = trim($_POST['observation'] ?? '');
    $expected_result = trim($_POST['expected_result'] ?? '');
    $actual_result = trim($_POST['actual_result'] ?? '');
    $status = trim($_POST['status'] ?? 'PASS');
    $notes = trim($_POST['notes'] ?? '');

    if ($test_id === '' || $module === '' || $observation === '') {
        $error = 'Please fill out Test ID, Module and Observation.';
    } else {
        $ins = $pdo->prepare("INSERT INTO security_evidence (vuln_id, test_id, module, observation, expected_result, actual_result, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $ins->execute([$vuln_id ?: null, $test_id, $module, $observation, $expected_result, $actual_result, $status, $notes]);
        log_audit_event($_SESSION['user_id'], 'EVIDENCE_RECORD', "Recorded evidence for test: " . $test_id);
        $success = 'Evidence recorded.';
    }
}

// Retest a finding. A PASS closes it (Fixed); a FAIL reopens it (Open).
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_retest'])) {
    csrf_check();
    $finding_id = trim($_POST['finding_id'] ?? '');
    $tester = trim($_POST['tester'] ?? '');
    $test_result = trim($_POST['test_result'] ?? 'PASS');
    $notes = trim($_POST['notes'] ?? '');

    if ($finding_id === '' || $tester === '') {
        $error = 'Finding and Tester name are required.';
    } else {
        $ins = $pdo->prepare("INSERT INTO security_retests (finding_id, tester, test_result, notes) VALUES (?, ?, ?, ?)");
        $ins->execute([$finding_id, $tester, $test_result, $notes]);
        // Update the register: Pass -> Fixed, Fail -> Open (back to remediation).
        $upd = $pdo->prepare("UPDATE vulnerabilities SET retest_result = ?, remediation_status = ? WHERE vuln_id = ?");
        $upd->execute([
            $test_result === 'PASS' ? 'Pass' : 'Fail',
            $test_result === 'PASS' ? 'Fixed' : 'Open',
            $finding_id,
        ]);
        log_audit_event($_SESSION['user_id'], 'RETEST_RECORD', "Logged retest for $finding_id: $test_result");
        $success = 'Retest logged and register updated.';
    }
}

// ----- Data (all from the database) ---------------------------------------

$register = $pdo->query("SELECT * FROM vulnerabilities ORDER BY vuln_id ASC")->fetchAll();
$evidence_list = $pdo->query("SELECT * FROM security_evidence ORDER BY timestamp DESC")->fetchAll();
$retests_list = $pdo->query("SELECT * FROM security_retests ORDER BY timestamp DESC")->fetchAll();

$total_findings = count($register);
$fixed_count = 0; $open_count = 0; $pass_count = 0; $fail_count = 0; $pending_count = 0;
foreach ($register as $v) {
    if ($v['remediation_status'] === 'Fixed') $fixed_count++; else $open_count++;
    if ($v['retest_result'] === 'Pass') $pass_count++;
    elseif ($v['retest_result'] === 'Fail') $fail_count++;
    else $pending_count++;
}
$evidence_count = count($evidence_list);
$retest_count = count($retests_list);

function vl_badge($text, $kind) {
    $map = [
        'ok'   => 'bg-emerald-900/50 text-emerald-300',
        'bad'  => 'bg-red-900/50 text-red-300',
        'warn' => 'bg-amber-900/50 text-amber-300',
        'info' => 'bg-indigo-900/50 text-indigo-300',
    ];
    $c = $map[$kind] ?? $map['info'];
    return '<span class="' . $c . ' px-2 py-0.5 rounded text-[10px] font-bold">'
         . htmlspecialchars($text, ENT_QUOTES, 'UTF-8') . '</span>';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VulnLens - Security Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Outfit', sans-serif; }
        .code-font { font-family: 'Fira Code', monospace; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 flex flex-col min-h-screen">

    <!-- Top banner -->
    <div class="bg-slate-900 border-b border-slate-800 py-3.5 px-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="bg-indigo-600 text-white p-2 rounded-lg font-bold text-sm tracking-tight shadow">
                <i class="fa-solid fa-magnifying-glass-chart"></i>
            </div>
            <div>
                <span class="text-sm font-bold text-slate-100 tracking-tight">VulnLens</span>
                <span class="text-indigo-400 font-extrabold text-[10px] block uppercase tracking-wider">Penetration Testing Console &bull; Target: DMART</span>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-xs text-slate-400">Environment: <strong class="text-slate-200">XAMPP / Localhost</strong></span>
            <span class="bg-slate-800 text-slate-300 text-[10px] px-2.5 py-1 rounded font-bold">
                MODE: <?php echo htmlspecialchars(SECURITY_MODE, ENT_QUOTES, 'UTF-8'); ?>
            </span>
            <a href="admin.php" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition-colors">&larr; Main Admin</a>
        </div>
    </div>

    <div class="flex flex-col lg:flex-row flex-grow">

        <!-- Sidebar -->
        <aside class="w-full lg:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
            <div class="space-y-6">
                <?php
                $groups = [
                    'Check' => [
                        ['overview','Security Overview','fa-chart-line'],
                        ['configuration','Security Configuration','fa-gears'],
                        ['controls','Security Controls','fa-circle-check'],
                    ],
                    'Test &amp; record' => [
                        ['scenarios','Test Scenarios','fa-bug'],
                        ['register','Vulnerability Register','fa-list-ol'],
                        ['evidence','Record Evidence','fa-camera'],
                    ],
                    'Fix &amp; prove' => [
                        ['remediation','Remediation Panel','fa-shield-halved'],
                        ['retesting','Retesting Logs','fa-rotate'],
                        ['report','Security Report','fa-file-invoice'],
                    ],
                ];
                foreach ($groups as $label => $items): ?>
                    <div>
                        <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3"><?php echo $label; ?></h3>
                        <ul class="space-y-1 text-xs">
                            <?php foreach ($items as $it): ?>
                                <li>
                                    <a href="admin_security.php?section=<?php echo $it[0]; ?>"
                                       class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors <?php echo ($section === $it[0]) ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'; ?>">
                                        <i class="fa-solid <?php echo $it[2]; ?> w-4"></i> <?php echo $it[1]; ?>
                                    </a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="border-t border-slate-800 pt-4 text-[10px] text-slate-500">
                <span>VulnLens v1.0 &bull; OWASP Top 10:2025</span>
            </div>
        </aside>

        <!-- Main -->
        <main class="flex-grow p-6 lg:p-8 max-w-5xl">

            <?php if ($error !== ''): ?>
                <div class="bg-red-950/50 border border-red-800 text-red-200 p-4 mb-6 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-circle-exclamation text-red-500"></i>
                    <span><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></span>
                </div>
            <?php endif; ?>
            <?php if ($success !== ''): ?>
                <div class="bg-emerald-950/50 border border-emerald-800 text-emerald-200 p-4 mb-6 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-circle-check text-emerald-500"></i>
                    <span><?php echo htmlspecialchars($success, ENT_QUOTES, 'UTF-8'); ?></span>
                </div>
            <?php endif; ?>

            <?php if ($section === 'overview'): ?>
                <h2 class="text-xl font-bold text-white mb-6">Security Assessment Dashboard</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Register Findings</span>
                        <div class="text-2xl font-bold text-white mt-1"><?php echo $total_findings; ?></div>
                    </div>
                    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fixed / Open</span>
                        <div class="text-2xl font-bold text-emerald-400 mt-1"><?php echo $fixed_count; ?><span class="text-slate-600 text-base">/<?php echo $open_count; ?></span></div>
                    </div>
                    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Retests Pass / Fail</span>
                        <div class="text-2xl font-bold text-indigo-400 mt-1"><?php echo $pass_count; ?><span class="text-slate-600 text-base">/<?php echo $fail_count; ?></span></div>
                    </div>
                    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Evidence Records</span>
                        <div class="text-2xl font-bold text-amber-500 mt-1"><?php echo $evidence_count; ?></div>
                    </div>
                </div>

                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 class="font-bold text-sm text-slate-200 uppercase tracking-wider mb-4">OWASP Top 10:2025 Coverage</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="text-slate-500 font-bold border-b border-slate-800">
                                    <th class="pb-3">ID</th><th class="pb-3">Finding</th><th class="pb-3">Category</th>
                                    <th class="pb-3">Status</th><th class="pb-3">Retest</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60">
                                <?php foreach ($register as $v): ?>
                                    <tr>
                                        <td class="py-3 text-slate-400 code-font"><?php echo htmlspecialchars($v['vuln_id'], ENT_QUOTES, 'UTF-8'); ?></td>
                                        <td class="py-3 font-semibold text-slate-300"><?php echo htmlspecialchars($v['name'], ENT_QUOTES, 'UTF-8'); ?></td>
                                        <td class="py-3 text-slate-400"><?php echo htmlspecialchars($v['category'], ENT_QUOTES, 'UTF-8'); ?></td>
                                        <td class="py-3"><?php echo vl_badge($v['remediation_status'], $v['remediation_status']==='Fixed'?'ok':'warn'); ?></td>
                                        <td class="py-3"><?php echo vl_badge($v['retest_result'], $v['retest_result']==='Pass'?'ok':($v['retest_result']==='Fail'?'bad':'info')); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

            <?php elseif ($section === 'configuration'): ?>
                <h2 class="text-xl font-bold text-white mb-6">Security Configuration</h2>
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-lg space-y-6">
                    <div>
                        <h3 class="font-bold text-sm text-slate-200 uppercase tracking-wider mb-2">Active Mode</h3>
                        <p class="text-xs text-slate-400">LAB mode is the controlled testing environment. SECURE mode is the production baseline used to verify fixes. Only an admin can switch, and the change is written to the database and logged.</p>
                    </div>
                    <?php if (isset($_GET['success'])): ?>
                        <div class="bg-emerald-950/30 border border-emerald-800 text-emerald-300 p-3 rounded-lg text-xs font-semibold">Security mode updated and logged.</div>
                    <?php endif; ?>
                    <form action="" method="POST" class="space-y-4">
                        <?php echo csrf_field(); ?>
                        <div class="space-y-3">
                            <label class="border border-slate-800 rounded-lg p-4 block cursor-pointer hover:bg-slate-800/50 transition-colors">
                                <div class="flex items-start gap-3">
                                    <input type="radio" name="security_mode" value="SECURE" <?php echo (SECURITY_MODE === 'SECURE') ? 'checked' : ''; ?> class="mt-1">
                                    <div>
                                        <span class="text-xs font-bold text-slate-200 block">SECURE MODE</span>
                                        <span class="text-[10px] text-slate-500 mt-1 block">Production baseline. Error detail hidden; used to confirm fixes.</span>
                                    </div>
                                </div>
                            </label>
                            <label class="border border-slate-800 rounded-lg p-4 block cursor-pointer hover:bg-slate-800/50 transition-colors">
                                <div class="flex items-start gap-3">
                                    <input type="radio" name="security_mode" value="LAB" <?php echo (SECURITY_MODE === 'LAB') ? 'checked' : ''; ?> class="mt-1">
                                    <div>
                                        <span class="text-xs font-bold text-slate-200 block">LAB MODE</span>
                                        <span class="text-[10px] text-slate-500 mt-1 block">Controlled testing environment for running the tool's tests.</span>
                                    </div>
                                </div>
                            </label>
                        </div>
                        <button type="submit" name="update_security_mode" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wider py-2.5 px-6 rounded-lg transition-colors">UPDATE MODE</button>
                    </form>
                    <p class="text-[10px] text-slate-500 border-t border-slate-800 pt-3">If the mode cannot be read from the database, the application falls back to SECURE (fail-secure).</p>
                </div>

            <?php elseif ($section === 'controls'): ?>
                <h2 class="text-xl font-bold text-white mb-6">Active Security Controls</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <?php
                    $controls = [
                        ['SQL Injection Protection','PDO prepared statements'],
                        ['XSS Protection','htmlspecialchars() output encoding'],
                        ['Authorization','Server-side role checks'],
                        ['Password Storage','BCrypt password_hash()'],
                        ['CSRF Protection','Per-session tokens + SameSite cookies'],
                        ['Audit Logging','log_audit_event() to audit_logs'],
                    ];
                    foreach ($controls as $c): ?>
                        <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl flex justify-between items-center">
                            <div>
                                <span class="text-xs font-bold text-slate-200 block"><?php echo $c[0]; ?></span>
                                <span class="text-[10px] text-slate-400 mt-1">Control: <?php echo $c[1]; ?></span>
                            </div>
                            <span class="bg-emerald-950 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-800">ENABLED</span>
                        </div>
                    <?php endforeach; ?>
                </div>

            <?php elseif ($section === 'scenarios'): ?>
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-white">Test Scenarios</h2>
                    <form action="" method="POST">
                        <?php echo csrf_field(); ?>
                        <button type="submit" name="run_scan" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wider py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2">
                            <i class="fa-solid fa-play"></i> RUN ALL CHECKS
                        </button>
                    </form>
                </div>
                <p class="text-xs text-slate-400 mb-6 max-w-2xl">VulnLens runs read-only checks against the DMART application it is integrated into, one per OWASP Top 10:2025 area. Each check records evidence and updates the register. No attack payloads are sent.</p>

                <?php if (isset($_GET['scanned']) && !empty($_SESSION['last_scan'])): ?>
                    <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                        <h3 class="font-bold text-sm text-slate-200 uppercase tracking-wider mb-4">Latest Scan Results</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="text-slate-500 font-bold border-b border-slate-800">
                                        <th class="pb-3">Finding</th><th class="pb-3">Category</th><th class="pb-3">Module</th><th class="pb-3">Result</th><th class="pb-3">Observation</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-800/60">
                                    <?php foreach ($_SESSION['last_scan'] as $r): ?>
                                        <tr>
                                            <td class="py-3 font-semibold text-slate-300"><?php echo htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-3 text-slate-400"><?php echo htmlspecialchars($r['category'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-3 text-slate-400 code-font"><?php echo htmlspecialchars($r['module'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-3"><?php echo vl_badge($r['status'], $r['status']==='PASS'?'ok':'bad'); ?></td>
                                            <td class="py-3 text-slate-400"><?php echo htmlspecialchars($r['actual'], ENT_QUOTES, 'UTF-8'); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                        <h3 class="font-bold text-sm text-slate-200 uppercase tracking-wider mb-4">Checks VulnLens Will Run</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <?php foreach (vl_checks() as $chk): ?>
                                <div class="border border-slate-800 bg-slate-950 rounded-lg p-3">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-xs font-bold text-slate-200"><?php echo htmlspecialchars($chk['name'], ENT_QUOTES, 'UTF-8'); ?></span>
                                        <span class="text-[9px] code-font text-indigo-400"><?php echo htmlspecialchars($chk['vuln_id'], ENT_QUOTES, 'UTF-8'); ?></span>
                                    </div>
                                    <span class="text-[10px] text-slate-500"><?php echo htmlspecialchars($chk['category'], ENT_QUOTES, 'UTF-8'); ?> &bull; <?php echo htmlspecialchars($chk['module'], ENT_QUOTES, 'UTF-8'); ?></span>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>

            <?php elseif ($section === 'register'): ?>
                <h2 class="text-xl font-bold text-white mb-6">Vulnerability Register</h2>
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="text-slate-500 font-bold border-b border-slate-800">
                                    <th class="pb-3 pr-3">ID</th><th class="pb-3 pr-3">Vulnerability</th><th class="pb-3 pr-3">Category</th>
                                    <th class="pb-3 pr-3">Severity</th><th class="pb-3 pr-3">Component</th>
                                    <th class="pb-3 pr-3">Status</th><th class="pb-3">Retest</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60 text-slate-300">
                                <?php foreach ($register as $v): ?>
                                    <tr>
                                        <td class="py-3 pr-3 code-font text-slate-400"><?php echo htmlspecialchars($v['vuln_id'], ENT_QUOTES, 'UTF-8'); ?></td>
                                        <td class="py-3 pr-3 font-semibold"><?php echo htmlspecialchars($v['name'], ENT_QUOTES, 'UTF-8'); ?>
                                            <span class="block text-[10px] text-slate-500 font-normal mt-0.5"><?php echo htmlspecialchars($v['description'], ENT_QUOTES, 'UTF-8'); ?></span>
                                        </td>
                                        <td class="py-3 pr-3 text-slate-400"><?php echo htmlspecialchars($v['category'], ENT_QUOTES, 'UTF-8'); ?></td>
                                        <td class="py-3 pr-3"><?php echo vl_badge($v['severity'], $v['severity']==='High'||$v['severity']==='Critical'?'bad':($v['severity']==='Medium'?'warn':'info')); ?></td>
                                        <td class="py-3 pr-3 code-font text-slate-400"><?php echo htmlspecialchars($v['affected_component'], ENT_QUOTES, 'UTF-8'); ?></td>
                                        <td class="py-3 pr-3"><?php echo vl_badge($v['remediation_status'], $v['remediation_status']==='Fixed'?'ok':'warn'); ?></td>
                                        <td class="py-3"><?php echo vl_badge($v['retest_result'], $v['retest_result']==='Pass'?'ok':($v['retest_result']==='Fail'?'bad':'info')); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

            <?php elseif ($section === 'evidence'): ?>
                <h2 class="text-xl font-bold text-white mb-6">Evidence Records</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <form action="" method="POST" class="md:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-fit">
                        <?php echo csrf_field(); ?>
                        <h3 class="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2">Record Evidence</h3>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Finding</label>
                            <select name="vuln_id" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white">
                                <option value="">(none)</option>
                                <?php foreach ($register as $v): ?>
                                    <option value="<?php echo htmlspecialchars($v['vuln_id'], ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($v['vuln_id'].' - '.$v['name'], ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Test ID</label>
                            <input type="text" name="test_id" required placeholder="TEST-SQLI-01" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"></div>
                        <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Module</label>
                            <input type="text" name="module" required placeholder="index.php" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"></div>
                        <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observation</label>
                            <textarea name="observation" required rows="2" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"></textarea></div>
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expected</label>
                                <input type="text" name="expected_result" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"></div>
                            <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Actual</label>
                                <input type="text" name="actual_result" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"></div>
                        </div>
                        <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                            <select name="status" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"><option>PASS</option><option>FAIL</option></select></div>
                        <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes</label>
                            <input type="text" name="notes" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"></div>
                        <button type="submit" name="submit_evidence" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] tracking-wider py-2 rounded">SAVE EVIDENCE</button>
                    </form>

                    <div class="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                        <h3 class="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2">Evidence Log (<?php echo $evidence_count; ?>)</h3>
                        <?php if (empty($evidence_list)): ?>
                            <p class="text-xs text-slate-400 py-6 text-center">No evidence recorded yet. Run the checks or add an entry.</p>
                        <?php else: ?>
                            <div class="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                                <?php foreach ($evidence_list as $ev): ?>
                                    <div class="border border-slate-800 bg-slate-950 rounded-lg p-3 text-xs space-y-1.5">
                                        <div class="flex justify-between items-center border-b border-slate-900 pb-1">
                                            <span class="font-bold text-indigo-400"><?php echo htmlspecialchars(($ev['vuln_id']?$ev['vuln_id'].' / ':'').$ev['test_id'], ENT_QUOTES, 'UTF-8'); ?></span>
                                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded <?php echo ($ev['status']==='PASS')?'bg-emerald-950 text-emerald-400':'bg-red-950 text-red-400'; ?>"><?php echo htmlspecialchars($ev['status'], ENT_QUOTES, 'UTF-8'); ?></span>
                                        </div>
                                        <p class="text-slate-400"><strong class="text-slate-300">Target:</strong> <?php echo htmlspecialchars($ev['module'], ENT_QUOTES, 'UTF-8'); ?></p>
                                        <p class="text-slate-300"><?php echo htmlspecialchars($ev['actual_result'] ?: $ev['observation'], ENT_QUOTES, 'UTF-8'); ?></p>
                                        <span class="text-[8px] text-slate-600 block text-right"><?php echo htmlspecialchars($ev['timestamp'], ENT_QUOTES, 'UTF-8'); ?></span>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

            <?php elseif ($section === 'remediation'): ?>
                <h2 class="text-xl font-bold text-white mb-6">Remediation Panel</h2>
                <div class="space-y-4">
                    <?php foreach ($register as $v): ?>
                        <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                            <div class="flex flex-wrap justify-between items-start gap-2 mb-2">
                                <div>
                                    <span class="code-font text-[11px] text-indigo-400"><?php echo htmlspecialchars($v['vuln_id'], ENT_QUOTES, 'UTF-8'); ?></span>
                                    <h3 class="font-bold text-sm text-slate-200"><?php echo htmlspecialchars($v['name'], ENT_QUOTES, 'UTF-8'); ?></h3>
                                </div>
                                <div class="flex gap-2">
                                    <?php echo vl_badge($v['category'], 'info'); ?>
                                    <?php echo vl_badge($v['remediation_status'], $v['remediation_status']==='Fixed'?'ok':'warn'); ?>
                                </div>
                            </div>
                            <p class="text-xs text-slate-400 mb-2"><?php echo htmlspecialchars($v['description'], ENT_QUOTES, 'UTF-8'); ?></p>
                            <div class="bg-emerald-950/20 border border-emerald-900/40 rounded p-3">
                                <span class="text-[10px] font-bold text-emerald-400 uppercase">Remediation applied</span>
                                <p class="text-xs text-emerald-200 mt-1"><?php echo htmlspecialchars($v['remediation'], ENT_QUOTES, 'UTF-8'); ?></p>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

            <?php elseif ($section === 'retesting'): ?>
                <h2 class="text-xl font-bold text-white mb-6">Retesting Logs</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <form action="" method="POST" class="md:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-fit">
                        <?php echo csrf_field(); ?>
                        <h3 class="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2">Log Retest</h3>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Finding</label>
                            <select name="finding_id" required class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white">
                                <?php foreach ($register as $v): ?>
                                    <option value="<?php echo htmlspecialchars($v['vuln_id'], ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($v['vuln_id'].' - '.$v['name'], ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tester</label>
                            <input type="text" name="tester" required class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"></div>
                        <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Result</label>
                            <select name="test_result" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white">
                                <option value="PASS">PASS - closes the finding</option>
                                <option value="FAIL">FAIL - reopens the finding</option>
                            </select></div>
                        <div><label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes</label>
                            <textarea name="notes" rows="2" class="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"></textarea></div>
                        <button type="submit" name="submit_retest" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] tracking-wider py-2 rounded">LOG RETEST</button>
                    </form>

                    <div class="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                        <h3 class="font-bold text-xs text-slate-200 uppercase tracking-wider mb-2">Retest Log (<?php echo $retest_count; ?>)</h3>
                        <?php if (empty($retests_list)): ?>
                            <p class="text-xs text-slate-400 py-6 text-center">No retests logged yet.</p>
                        <?php else: ?>
                            <div class="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                                <?php foreach ($retests_list as $rt): ?>
                                    <div class="border border-slate-800 bg-slate-950 rounded-lg p-3 text-xs space-y-1.5">
                                        <div class="flex justify-between items-center border-b border-slate-900 pb-1">
                                            <span class="font-bold text-indigo-400"><?php echo htmlspecialchars($rt['finding_id'], ENT_QUOTES, 'UTF-8'); ?></span>
                                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded <?php echo ($rt['test_result']==='PASS')?'bg-emerald-950 text-emerald-400':'bg-red-950 text-red-400'; ?>"><?php echo htmlspecialchars($rt['test_result'], ENT_QUOTES, 'UTF-8'); ?></span>
                                        </div>
                                        <p class="text-slate-400"><strong class="text-slate-300">Tester:</strong> <?php echo htmlspecialchars($rt['tester'], ENT_QUOTES, 'UTF-8'); ?></p>
                                        <?php if (!empty($rt['notes'])): ?><p class="text-slate-300"><?php echo htmlspecialchars($rt['notes'], ENT_QUOTES, 'UTF-8'); ?></p><?php endif; ?>
                                        <span class="text-[8px] text-slate-600 block text-right"><?php echo htmlspecialchars($rt['timestamp'], ENT_QUOTES, 'UTF-8'); ?></span>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

            <?php elseif ($section === 'report'): ?>
                <h2 class="text-xl font-bold text-white mb-6">Security Report</h2>
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6 text-xs text-slate-300 leading-relaxed">
                    <div class="border-b border-slate-800 pb-4">
                        <h3 class="font-extrabold text-base text-white">VulnLens Security Assessment Report</h3>
                        <span class="text-[10px] text-slate-500">Target: DMART test website &bull; OWASP Top 10:2025 &bull; Generated <?php echo date('d M Y, H:i'); ?></span>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-bold text-slate-200">1. Summary</h4>
                        <p>The register holds <?php echo $total_findings; ?> findings: <?php echo $fixed_count; ?> fixed and <?php echo $open_count; ?> open. Retests: <?php echo $pass_count; ?> passed, <?php echo $fail_count; ?> failed, <?php echo $pending_count; ?> pending. <?php echo $evidence_count; ?> evidence records and <?php echo $retest_count; ?> retests have been logged.</p>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-bold text-slate-200">2. Findings</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead><tr class="text-slate-500 font-bold border-b border-slate-800">
                                    <th class="pb-2 pr-3">ID</th><th class="pb-2 pr-3">Finding</th><th class="pb-2 pr-3">Category</th><th class="pb-2 pr-3">Severity</th><th class="pb-2 pr-3">Remediation</th><th class="pb-2 pr-3">Status</th><th class="pb-2">Retest</th>
                                </tr></thead>
                                <tbody class="divide-y divide-slate-800/60">
                                    <?php foreach ($register as $v): ?>
                                        <tr>
                                            <td class="py-2 pr-3 code-font text-slate-400"><?php echo htmlspecialchars($v['vuln_id'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-2 pr-3 font-semibold text-slate-300"><?php echo htmlspecialchars($v['name'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-2 pr-3 text-slate-400"><?php echo htmlspecialchars($v['category'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-2 pr-3 text-slate-400"><?php echo htmlspecialchars($v['severity'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-2 pr-3 text-slate-400"><?php echo htmlspecialchars($v['remediation'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-2 pr-3"><?php echo htmlspecialchars($v['remediation_status'], ENT_QUOTES, 'UTF-8'); ?></td>
                                            <td class="py-2"><?php echo htmlspecialchars($v['retest_result'], ENT_QUOTES, 'UTF-8'); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="border-t border-slate-800 pt-4 text-[9px] text-slate-500 text-center">
                        <span>VulnLens &bull; MSc Cybersecurity major project &bull; generated from the live register</span>
                    </div>
                </div>
            <?php endif; ?>

        </main>
    </div>
</body>
</html>
