<?php
/**
 * contact.php - Gestionnaire de formulaire de contact sécurisé
 * Configuration SMTP/email stockée HORS du dossier public
 */

// ─────────────────────────────────────────────────────────────────────────────
// Chargement de la configuration (hors du dossier public)
// ─────────────────────────────────────────────────────────────────────────────
require_once dirname(__DIR__) . '/private/config/config.php';

// Charger la configuration email depuis le dossier privé
$emailConfig = require CONFIG_PATH . '/contact.private.php';

$recipient = $emailConfig['recipient'];
$siteName  = $emailConfig['siteName'];
$use_smtp  = $emailConfig['smtp']['use_smtp'];
$smtp      = $emailConfig['smtp'];

// Headers de sécurité
setSecurityHeaders();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: sanitize
// ─────────────────────────────────────────────────────────────────────────────
function clean($s) {
    return trim(filter_var($s, FILTER_SANITIZE_FULL_SPECIAL_CHARS));
}

// ─────────────────────────────────────────────────────────────────────────────
// Read POST
// ─────────────────────────────────────────────────────────────────────────────
$name    = isset($_POST['name'])    ? clean($_POST['name'])    : '';
$email   = isset($_POST['email'])   ? filter_var($_POST['email'], FILTER_VALIDATE_EMAIL) : false;
$phone   = isset($_POST['phone'])   ? clean($_POST['phone'])   : '';
$service = isset($_POST['service']) ? clean($_POST['service']) : '';
$date    = isset($_POST['date'])    ? clean($_POST['date'])    : '';
$message = isset($_POST['message']) ? clean($_POST['message']) : '';

// Basic validation
$errors = [];
if (!$name) {
    $errors[] = 'Nom manquant';
}
if (!$email) {
    $errors[] = 'Email invalide';
}
if (!$service) {
    $service = 'Non précisé';
}

if (!empty($errors)) {
    $qs = 'error=' . urlencode(implode('; ', $errors));
    header('Location: contact.html?' . $qs);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build email
// ─────────────────────────────────────────────────────────────────────────────
$subject = "Demande de contact Jinnov — " . $service;
$body  = "Nouvelle demande de contact\n\n";
$body .= "Nom: $name\n";
$body .= "Email: $email\n";
$body .= "Tél: $phone\n";
$body .= "Service: $service\n";
$body .= "Date événement: $date\n\n";
$body .= "Message:\n$message\n";

// Headers
$headers   = [];
$fromHost  = $_SERVER['SERVER_NAME'] ?? 'localhost';
$headers[] = 'From: ' . $siteName . ' <no-reply@' . $fromHost . '>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

// ─────────────────────────────────────────────────────────────────────────────
// Send mail
// ─────────────────────────────────────────────────────────────────────────────
$ok = false;
try {
    if ($use_smtp) {
        // SMTP AUTH send
        $ctx = stream_context_create();
        $err = null;
        $fp = @stream_socket_client($smtp['host'] . ':' . $smtp['port'], $errno, $err, 15, STREAM_CLIENT_CONNECT, $ctx);
        
        if (!$fp) {
            $ok = false;
        } else {
            stream_set_timeout($fp, 15);
            $res = fgets($fp, 512);
            
            // EHLO
            fwrite($fp, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost') . "\r\n");
            $res = fgets($fp, 512);
            
            // Start TLS if requested
            if (!empty($smtp['secure']) && strtolower($smtp['secure']) === 'tls') {
                fwrite($fp, "STARTTLS\r\n");
                $res = fgets($fp, 512);
                stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                fwrite($fp, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost') . "\r\n");
                $res = fgets($fp, 512);
            }
            
            // Auth LOGIN
            fwrite($fp, "AUTH LOGIN\r\n");
            $res = fgets($fp, 512);
            fwrite($fp, base64_encode($smtp['user']) . "\r\n");
            $res = fgets($fp, 512);
            fwrite($fp, base64_encode($smtp['pass']) . "\r\n");
            $res = fgets($fp, 512);
            
            // MAIL FROM
            fwrite($fp, "MAIL FROM:<no-reply@" . ($_SERVER['SERVER_NAME'] ?? 'localhost') . ">\r\n");
            $res = fgets($fp, 512);
            
            // RCPT TO
            fwrite($fp, "RCPT TO:<" . $recipient . ">\r\n");
            $res = fgets($fp, 512);
            
            // DATA
            fwrite($fp, "DATA\r\n");
            $res = fgets($fp, 512);
            
            // Build raw message
            $raw = "From: " . $siteName . " <no-reply@" . ($_SERVER['SERVER_NAME'] ?? 'localhost') . ">\r\n";
            $raw .= "To: " . $recipient . "\r\n";
            $raw .= "Subject: " . $subject . "\r\n";
            $raw .= "MIME-Version: 1.0\r\n";
            $raw .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $raw .= "\r\n";
            $raw .= $body . "\r\n";
            $raw .= ".\r\n";
            fwrite($fp, $raw);
            $res = fgets($fp, 512);
            
            // QUIT
            fwrite($fp, "QUIT\r\n");
            fclose($fp);
            $ok = true;
        }
    } else {
        // Use mail()
        $ok = mail($recipient, $subject, $body, implode("\r\n", $headers));
    }
} catch (Exception $e) {
    $ok = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logging (dans le dossier privé)
// ─────────────────────────────────────────────────────────────────────────────
if (!is_dir(LOGS_PATH)) {
    @mkdir(LOGS_PATH, 0755, true);
}
$logFile = LOGS_PATH . '/contact.log';
$entry = [
    'time'            => date('c'),
    'remote_addr'     => $_SERVER['REMOTE_ADDR'] ?? 'cli',
    'name'            => $name,
    'email'           => $email,
    'phone'           => $phone,
    'service'         => $service,
    'date'            => $date,
    'message'         => $message,
    'mail_ok'         => $ok ? '1' : '0',
    'mail_last_error' => json_encode(error_get_last(), JSON_UNESCAPED_UNICODE),
];
@file_put_contents(
    $logFile,
    json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n",
    FILE_APPEND | LOCK_EX
);

// Redirect according to result
if ($ok) {
    header('Location: contact_thanks.html');
    exit;
} else {
    $qs = 'error=' . urlencode('Erreur lors de l\'envoi.');
    header('Location: contact.html?' . $qs);
    exit;
}
