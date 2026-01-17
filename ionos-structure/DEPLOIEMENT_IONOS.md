# 📦 Structure sécurisée pour hébergement IONOS

Cette structure est conçue pour un déploiement sécurisé sur IONOS (ou tout hébergeur classique).

## 🏗️ Architecture des dossiers

```
/                           ← Racine de votre espace IONOS
├── public_html/            ← SEUL dossier accessible depuis le web
│   ├── .htaccess           ← Sécurité Apache
│   ├── index.html          ← Page d'accueil
│   ├── style.css
│   ├── script.js
│   ├── animation.js
│   ├── album.php           ← API téléchargement (accède aux fichiers privés)
│   ├── album.view.php      ← Formulaire de téléchargement
│   ├── contact.php         ← API formulaire de contact
│   ├── contact.html
│   ├── contact_thanks.html
│   ├── evenementiel.html
│   ├── evenementiel_*.html
│   ├── mentionLegale.html
│   └── images/             ← Images publiques
│       ├── logo-jinnov.jpg
│       ├── banniere-jinnov.jpg
│       └── ...
│
└── private/                ← HORS du web - Fichiers sensibles
    ├── .htaccess           ← Bloque tout accès (sécurité supplémentaire)
    ├── config/
    │   ├── config.php          ← Configuration globale
    │   ├── album.private.php   ← 🔐 Codes et mots de passe des albums
    │   └── contact.private.php ← 🔐 Config SMTP / email
    ├── albums/
    │   ├── .htaccess           ← Bloque l'accès direct
    │   └── *.zip               ← Fichiers ZIP des photos
    └── logs/
        ├── .htaccess           ← Bloque l'accès direct
        ├── contact.log
        ├── download_logs.txt
        └── php_errors.log
```

## 🚀 Instructions de déploiement sur IONOS

### 1. Préparer les fichiers

1. **Renommer le dossier d'images** : 
   - Renommez `photo ju/logo et bannière/` en `images/`
   - Mettez à jour les références dans les fichiers HTML

2. **Configurer les fichiers privés** :
   - Éditez `private/config/album.private.php` avec vos codes d'albums
   - Éditez `private/config/contact.private.php` avec vos infos SMTP

### 2. Upload via FTP

Connectez-vous à votre espace IONOS via FTP (FileZilla par exemple) :

```
Hôte: ftp.votre-domaine.fr (ou access.ionos.fr)
Utilisateur: votre-login
Mot de passe: votre-mot-de-passe
Port: 21
```

### 3. Structure sur le serveur IONOS

```
/                           ← Racine FTP
├── public_html/            ← Uploadez le contenu de public_html/ ici
│   └── (tous les fichiers publics)
│
└── private/                ← Créez ce dossier AU MÊME NIVEAU que public_html
    └── (tous les fichiers privés)
```

**⚠️ IMPORTANT** : Le dossier `private/` doit être AU MÊME NIVEAU que `public_html/`, PAS à l'intérieur !

### 4. Vérifier les permissions

```
Fichiers : 644 (rw-r--r--)
Dossiers : 755 (rwxr-xr-x)
```

### 5. Tester le site

1. Accédez à `https://votre-domaine.fr/`
2. Testez le formulaire de contact
3. Testez le téléchargement d'album avec un code valide

## 🔐 Sécurité

### Ce qui est protégé :

| Élément | Emplacement | Accessible depuis le web |
|---------|-------------|-------------------------|
| Pages HTML/CSS/JS | `public_html/` | ✅ Oui |
| Images | `public_html/images/` | ✅ Oui |
| Config emails | `private/config/contact.private.php` | ❌ Non |
| Codes albums | `private/config/album.private.php` | ❌ Non |
| Fichiers ZIP | `private/albums/` | ❌ Non |
| Logs | `private/logs/` | ❌ Non |

### Génération de mots de passe hashés

Pour ajouter un nouvel album, générez un hash de mot de passe :

```bash
php -r "echo password_hash('votre_mot_de_passe', PASSWORD_DEFAULT) . PHP_EOL;"
```

Puis ajoutez-le dans `private/config/album.private.php` :

```php
'MARIAGE-2025-06-15' => [
    'password_hash' => '$2y$10$...hash_généré...',
    'file' => 'mariage-2025-06-15.zip',
    'description' => 'Mariage de Jean et Marie'
],
```

## 📝 Configuration IONOS spécifique

### PHP Version

Assurez-vous d'utiliser PHP 8.0+ dans votre panneau IONOS.

### SSL/HTTPS

1. Activez le certificat SSL gratuit dans votre panneau IONOS
2. Décommentez la section HTTPS dans `public_html/.htaccess`

### Emails SMTP (recommandé)

Pour un envoi fiable des emails, configurez SMTP dans `private/config/contact.private.php` :

```php
'smtp' => [
    'use_smtp' => true,
    'host' => 'smtp.ionos.fr',
    'port' => 587,
    'secure' => 'tls',
    'user' => 'contact@votre-domaine.fr',
    'pass' => 'votre_mot_de_passe_email',
],
```

## ❓ Dépannage

### Erreur 500

- Vérifiez les permissions des fichiers
- Consultez `private/logs/php_errors.log`

### Formulaire de contact ne fonctionne pas

- Vérifiez la configuration SMTP
- Consultez `private/logs/contact.log`

### Téléchargement d'album échoue

- Vérifiez que le fichier ZIP existe dans `private/albums/`
- Vérifiez le hash du mot de passe
- Consultez `private/logs/download_logs.txt`
