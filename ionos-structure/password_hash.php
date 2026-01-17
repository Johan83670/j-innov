<?php
/**
 * Générateur de hash de mot de passe pour les albums
 * 
 * UTILISATION :
 * 1. Lancez un serveur PHP : php -S localhost:8000
 * 2. Ouvrez http://localhost:8000/password_hash.php
 * 
 * OU en ligne de commande :
 * php password_hash.php "votre_mot_de_passe"
 */

// Mode ligne de commande
if (php_sapi_name() === 'cli') {
    if (isset($argv[1])) {
        $password = $argv[1];
        $hash = password_hash($password, PASSWORD_DEFAULT);
        echo "\n";
        echo "Mot de passe : $password\n";
        echo "Hash généré  : $hash\n";
        echo "\n";
        echo "Copiez ce hash dans private/config/album.private.php\n\n";
    } else {
        echo "\nUsage: php password_hash.php \"votre_mot_de_passe\"\n\n";
    }
    exit;
}

// Mode web (navigateur)
$hash = '';
$password = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['password'])) {
    $password = $_POST['password'];
    $hash = password_hash($password, PASSWORD_DEFAULT);
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Générateur de Hash — Jinnov</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(180deg, #18181a, #1b1a1a);
            color: #e7e7e9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        h1 {
            font-size: 1.8rem;
            margin-bottom: 10px;
            color: #fff;
        }
        .subtitle {
            color: #9aa0a6;
            margin-bottom: 30px;
        }
        label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #eef3f4;
        }
        input[type="text"] {
            width: 100%;
            padding: 14px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.02);
            color: #fff;
            font-size: 1rem;
            margin-bottom: 20px;
        }
        input[type="text"]:focus {
            outline: 2px solid rgba(124, 16, 10, 0.4);
        }
        button {
            background: linear-gradient(90deg, #7c100a, #f8b73e);
            color: #fff;
            border: none;
            padding: 14px 28px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .result {
            margin-top: 30px;
            padding: 20px;
            background: rgba(43, 9, 59, 0.3);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
        }
        .result h3 {
            color: #f8b73e;
            margin-bottom: 15px;
        }
        .hash-box {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            font-family: 'Consolas', monospace;
            font-size: 0.9rem;
            color: #7fff7f;
            margin-bottom: 15px;
        }
        .instructions {
            color: #9aa0a6;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        .instructions code {
            background: rgba(255,255,255,0.1);
            padding: 2px 6px;
            border-radius: 4px;
            color: #fff;
        }
        .warning {
            margin-top: 30px;
            padding: 15px;
            background: rgba(124, 16, 10, 0.2);
            border: 1px solid rgba(124, 16, 10, 0.4);
            border-radius: 8px;
            color: #ff9999;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Générateur de Hash</h1>
        <p class="subtitle">Créez un hash sécurisé pour vos mots de passe d'albums</p>

        <form method="post">
            <label for="password">Mot de passe à hasher</label>
            <input type="text" id="password" name="password" placeholder="Entrez le mot de passe..." value="<?= htmlspecialchars($password) ?>" required>
            <button type="submit">Générer le hash</button>
        </form>

        <?php if ($hash): ?>
        <div class="result">
            <h3>✅ Hash généré</h3>
            <div class="hash-box"><?= htmlspecialchars($hash) ?></div>
            <div class="instructions">
                <p><strong>Comment l'utiliser :</strong></p>
                <p>Copiez ce hash et collez-le dans <code>private/config/album.private.php</code> :</p>
                <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin-top: 10px; overflow-x: auto;">
'VOTRE-CODE' => [
    'password_hash' => '<?= htmlspecialchars($hash) ?>',
    'file' => 'nom-du-fichier.zip',
],</pre>
            </div>
        </div>
        <?php endif; ?>

        <div class="warning">
            ⚠️ <strong>Important :</strong> Supprimez ce fichier du serveur après utilisation, ou placez-le hors du dossier public_html pour éviter tout accès non autorisé.
        </div>
    </div>
</body>
</html>
