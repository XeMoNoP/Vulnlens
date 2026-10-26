<?php
// Vercel front controller: runs the requested PHP page from the project root.
$root = realpath(__DIR__ . '/..');
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$path = ltrim($path, '/');

if ($path === '' || substr($path, -1) === '/') {
    $path .= 'index.php';
} elseif (substr($path, -4) !== '.php' && is_file($root . '/' . $path . '.php')) {
    $path .= '.php';
}

$file = realpath($root . '/' . $path);
$blocked = preg_match('#^(config|includes|database|api)/#', $path);

if ($file === false || $blocked || strpos($file, $root . DIRECTORY_SEPARATOR) !== 0 || substr($file, -4) !== '.php') {
    http_response_code(404);
    echo 'Not found';
    exit;
}

// Sessions need a writable folder on Vercel.
session_save_path('/tmp');

$_SERVER['SCRIPT_FILENAME'] = $file;
$_SERVER['SCRIPT_NAME'] = $_SERVER['PHP_SELF'] = '/' . $path;
chdir(dirname($file));
require $file;
