<?php
// album.php — sécurisé (logs protégés, rate-limit, CSRF, headers)
session_start();

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────
$albums = require __DIR__ . '/album.private.php';

// Répertoire de logs protégé (doit être interdit via .htaccess / Nginx)
define('LOG_DIR', __DIR__ . '/logs');
if (!is_dir(LOG_DIR)) {
    @mkdir(LOG_DIR, 0750, true);
}

// Rate-limit : max 5 essais par IP sur 10 minutes
define('RATE_LIMIT_MAX', 5);
define('RATE_LIMIT_WINDOW', 600); // secondes
$rateLimitFile = LOG_DIR . '/rate_limit.json';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redirige vers album.html avec un message d'erreur.
 */
function redirectWithError(string $msg, string $code = '', string $email = ''): void {
    $query = http_build_query([
        'error' => $msg,
        'code'  => $code,
        'email' => $email
    ]);
    header("Location: album.view.php?$query");
    exit;
}

/**
 * Génère ou retourne le token CSRF stocké en session.
 */
function csrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Vérifie le token CSRF soumis.
 */
function csrfVerify(string $token): bool {
    return hash_equals($_SESSION['csrf_token'] ?? '', $token);
}

/**
 * Rate-limit simple basé sur l'adresse IP.
 * Retourne true si la limite est dépassée.
 */
function isRateLimited(string $ip, string $file): bool {
    $data = [];
    if (is_file($file)) {
        $data = json_decode(file_get_contents($file), true) ?: [];
    }
    $now = time();
    // Nettoyer les anciennes entrées
    foreach ($data as $key => $info) {
        if ($info['expires'] < $now) {
            unset($data[$key]);
        }
    }
    // Vérifier / incrémenter
    if (!isset($data[$ip])) {
        $data[$ip] = ['count' => 1, 'expires' => $now + RATE_LIMIT_WINDOW];
    } else {
        $data[$ip]['count']++;
    }
    file_put_contents($file, json_encode($data), LOCK_EX);
    return $data[$ip]['count'] > RATE_LIMIT_MAX;
}

/**
 * Écrit un log de téléchargement.
 */
function logDownload(string $code, string $email, string $ip): void {
    $logFile = LOG_DIR . '/download_logs.txt';
    $logLine = sprintf(
        "[%s] Code: %s | Email: %s | IP: %s\n",
        date('Y-m-d H:i:s'),
        $code,
        $email,
        $ip
    );
    @file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi de headers de sécurité
// ─────────────────────────────────────────────────────────────────────────────
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer-when-downgrade');

// ─────────────────────────────────────────────────────────────────────────────
// Traitement
// ─────────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    // Rate-limit check
    if (isRateLimited($ip, $rateLimitFile)) {
        redirectWithError("Trop de tentatives. Réessayez dans quelques minutes.");
    }

    // CSRF check
    $csrfPosted = $_POST['csrf_token'] ?? '';
    if (!csrfVerify($csrfPosted)) {
        redirectWithError("Session invalide. Veuillez recharger la page et réessayer.");
    }

    $code     = trim($_POST['code']     ?? '');
    $password = trim($_POST['password'] ?? '');
    $email    = trim($_POST['email']    ?? '');

    if ($code === '' || $password === '') {
        redirectWithError("Merci de remplir le code et le mot de passe.", $code, $email);
    }

    if (!isset($albums[$code])) {
        redirectWithError("Code d'événement inconnu. Vérifiez l'orthographe.", $code, $email);
    }

    $album = $albums[$code];

    // Vérification du mot de passe
    if (!password_verify($password, $album['password_hash'])) {
        redirectWithError("Mot de passe incorrect.", $code, $email);
    }

    // Logger le téléchargement (optionnel, si email fourni)
    if ($email !== '') {
        logDownload($code, $email, $ip);
    }

    // Chemin vers le zip (dossier privé protégé)
    $filePath = __DIR__ . '/private_albums/' . basename($album['file']);

    if (!is_file($filePath)) {
        redirectWithError("Le fichier de photos est momentanément indisponible. Contactez-nous.", $code, $email);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Option A : Envoi direct via readfile() (par défaut)
    // ─────────────────────────────────────────────────────────────────────────
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    readfile($filePath);
    exit;

    // ─────────────────────────────────────────────────────────────────────────
    // Option B : X-Accel-Redirect (Nginx) — décommentez et adaptez si besoin
    // ─────────────────────────────────────────────────────────────────────────
    // header('Content-Type: application/zip');
    // header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
    // header('X-Accel-Redirect: /protected-albums/' . basename($album['file']));
    // exit;

} else {
    // Accès GET : générer un token CSRF et rediriger vers le formulaire
    csrfToken();
    header("Location: album.view.php");
    exit;
}