<?php
/**
 * Configuration globale du site
 * Ce fichier centralise tous les chemins et paramètres sensibles
 */

// Chemin vers le dossier private (hors public_html)
define('PRIVATE_PATH', dirname(__DIR__));

// Chemins vers les sous-dossiers privés
define('CONFIG_PATH', PRIVATE_PATH . '/config');
define('ALBUMS_PATH', PRIVATE_PATH . '/albums');
define('LOGS_PATH', PRIVATE_PATH . '/logs');

// Mode debug (désactiver en production)
define('DEBUG_MODE', false);

// Configuration des erreurs
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', LOGS_PATH . '/php_errors.log');
}

// Timezone
date_default_timezone_set('Europe/Paris');

// Headers de sécurité communs
function setSecurityHeaders() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer-when-downgrade');
    header('X-XSS-Protection: 1; mode=block');
}
