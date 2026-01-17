# 🚀 Guide d'Installation et de Test - J-Innov

## 📋 Prérequis à installer

### Étape 1 : Installer Node.js

1. **Télécharger Node.js** : https://nodejs.org/
   - Choisir la version **LTS** (recommandée)
   - Télécharger le fichier `.msi` pour Windows

2. **Installer** :
   - Double-cliquer sur le fichier téléchargé
   - Suivre l'assistant d'installation (garder les options par défaut)
   - ✅ Cocher "Automatically install necessary tools" si proposé

3. **Redémarrer VS Code** après l'installation

4. **Vérifier l'installation** (ouvrir un nouveau terminal) :
   ```powershell
   node --version
   npm --version
   ```
   Vous devriez voir les numéros de version (ex: v20.x.x)

---

## 🔧 Configuration de l'Application

### Étape 2 : Configurer les variables d'environnement

#### Backend (server/.env)

```powershell
# Dans le terminal VS Code, copier le fichier exemple
cd "c:\Users\User\Desktop\Code HMTL\j-innov-main\server"
copy .env.example .env
```

Ouvrir `server/.env` et modifier :

```env
# Configuration minimale pour tester en local
PORT=3001
NODE_ENV=development

# JWT - Changez cette valeur !
JWT_SECRET=ma-cle-secrete-de-test-minimum-32-caracteres
JWT_EXPIRES_IN=24h

# Admin initial
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=Admin123!

# Pour tester SANS S3 (optionnel - voir note ci-dessous)
# Les uploads ne marcheront pas sans S3 configuré

# IONOS S3 (si vous avez un compte)
S3_ENDPOINT=https://s3.eu-central-1.ionoscloud.com
S3_REGION=eu-central-1
S3_ACCESS_KEY=votre-access-key
S3_SECRET_KEY=votre-secret-key
S3_BUCKET=votre-bucket
S3_FORCE_PATH_STYLE=true

CORS_ORIGIN=http://localhost:3000
DOWNLOAD_MODE=presigned
```

#### Frontend (client/.env)

```powershell
cd "c:\Users\User\Desktop\Code HMTL\j-innov-main\client"
copy .env.example .env
```

Le fichier `client/.env` devrait contenir :
```env
VITE_API_URL=http://localhost:3001
```

---

## 🚀 Lancement de l'Application

### Étape 3 : Installer les dépendances et lancer

**⚠️ Ouvrir 2 terminaux dans VS Code** (Terminal > New Terminal)

#### Terminal 1 - Backend :

```powershell
# Aller dans le dossier server
cd "c:\Users\User\Desktop\Code HMTL\j-innov-main\server"

# Installer les dépendances
npm install

# Générer le client Prisma (base de données)
npx prisma generate

# Créer la base de données SQLite
npx prisma db push

# Créer l'utilisateur admin
npx tsx prisma/seed.ts

# Lancer le serveur backend
npm run dev
```

Vous devriez voir :
```
╔════════════════════════════════════════════════════════════╗
║                    J-INNOV BACKEND                         ║
║  Server running on: http://localhost:3001                  ║
╚════════════════════════════════════════════════════════════╝
```

#### Terminal 2 - Frontend :

```powershell
# Aller dans le dossier client
cd "c:\Users\User\Desktop\Code HMTL\j-innov-main\client"

# Installer les dépendances
npm install

# Lancer le serveur frontend
npm run dev
```

Vous devriez voir :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

---

## 🧪 Tester l'Application

### Étape 4 : Accéder à l'application

1. **Ouvrir le navigateur** : http://localhost:3000

2. **Se connecter avec le compte admin** :
   - Email : `admin@test.com` (ou celui dans votre .env)
   - Mot de passe : `Admin123!` (ou celui dans votre .env)

3. **Fonctionnalités à tester** :
   - ✅ Connexion/Déconnexion
   - ✅ Dashboard
   - ✅ Liste des fichiers (vide au début)
   - ✅ Gestion des utilisateurs (créer, reset password)
   - ⚠️ Upload de fichiers (nécessite S3 configuré)

---

## 🔍 Tester l'API directement

### Avec PowerShell :

```powershell
# Test du health check
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Test de connexion
$body = @{
    email = "admin@test.com"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $body -ContentType "application/json"
$response

# Garder le token pour les autres requêtes
$token = $response.token
```

---

## ❓ Résolution des Problèmes

### "npm n'est pas reconnu"
→ Redémarrer VS Code après l'installation de Node.js

### "ENOENT: no such file or directory, open '.env'"
→ Créer le fichier .env (voir Étape 2)

### "Error: P1001: Can't reach database server"
→ Exécuter `npx prisma db push`

### "S3 upload failed"
→ Vérifier les credentials S3 dans .env ou tester sans upload

### Port 3001 déjà utilisé
→ Changer PORT dans server/.env ou arrêter l'autre processus

---

## 📊 Architecture de Test

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Navigateur   │────▶│    Frontend     │────▶│    Backend      │
│  localhost:3000 │     │  (Vite React)   │     │   (Express)     │
└─────────────────┘     │  localhost:3000 │     │  localhost:3001 │
                        └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  SQLite + S3    │
                                                │  (Prisma/IONOS) │
                                                └─────────────────┘
```

---

## ✅ Checklist de Test

- [ ] Node.js installé (`node --version`)
- [ ] Backend : `npm install` réussi
- [ ] Backend : Base de données créée (`npx prisma db push`)
- [ ] Backend : Admin seedé (`npx tsx prisma/seed.ts`)
- [ ] Backend : Serveur lancé sur http://localhost:3001
- [ ] Frontend : `npm install` réussi
- [ ] Frontend : Serveur lancé sur http://localhost:3000
- [ ] Connexion admin fonctionnelle
- [ ] Dashboard visible
