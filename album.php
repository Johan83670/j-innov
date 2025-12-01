<?php
// photos.php

// On charge la config des albums (fichier privé non versionné)
$albums = require __DIR__ . '/album.private.php';

// Fonction pour rediriger avec une erreur
function redirectWithError($msg, $code = '', $email = '') {
    $query = http_build_query([
        'error' => $msg,
        'code' => $code,
        'email' => $email
    ]);
    header("Location: album.html?$query");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $code     = trim($_POST['code']     ?? '');
    $password = trim($_POST['password'] ?? '');
    $email    = trim($_POST['email']    ?? '');

    if ($code === '' || $password === '') {
        redirectWithError("Merci de remplir le code et le mot de passe.", $code, $email);
    } elseif (!isset($albums[$code])) {
        redirectWithError("Code d'événement inconnu. Vérifiez l'orthographe.", $code, $email);
    } else {
        $album = $albums[$code];

        // Vérification du mot de passe
        if (!password_verify($password, $album['password_hash'])) {
            redirectWithError("Mot de passe incorrect.", $code, $email);
        } else {
            // Optionnel : logger l'email et la date
            if ($email !== '') {
                $logLine = sprintf(
                    "[%s] Code: %s | Email: %s | IP: %s\n",
                    date('Y-m-d H:i:s'),
                    $code,
                    $email,
                    $_SERVER['REMOTE_ADDR'] ?? 'unknown'
                );
                // On écrit le log dans le même dossier pour l'instant
                file_put_contents(__DIR__ . '/download_logs.txt', $logLine, FILE_APPEND);
            }

            // Chemin vers le zip (dossier privé)
            // ATTENTION: Assurez-vous que le dossier 'private_albums' existe au bon endroit.
            // Ici: un niveau au-dessus de ce fichier.
            $filePath = __DIR__ . '/private_albums/' . $album['file'];

            if (!is_file($filePath)) {
                redirectWithError("Le fichier de photos est momentanément indisponible. Contactez-nous.", $code, $email);
            } else {
                // Envoi direct du ZIP au client
                header('Content-Type: application/zip');
                header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
                header('Content-Length: ' . filesize($filePath));
                // Désactive le cache pour éviter les problèmes de téléchargement
                header("Cache-Control: no-cache, must-revalidate");
                header("Expires: 0");
                readfile($filePath);
                exit;
            }
        }
    }
} else {
    // Si quelqu'un accède directement au fichier sans POST, on le renvoie vers le formulaire
    header("Location: album.html");
    exit;
}