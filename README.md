# J-Innov - Système de Gestion de Fichiers Sécurisé

Application full-stack pour la gestion sécurisée de fichiers ZIP avec stockage IONOS S3, authentification JWT et contrôle d'accès basé sur les rôles.

## 🎯 Fonctionnalités

- ✅ **Authentification sécurisée** - JWT avec bcrypt pour le hachage des mots de passe
- ✅ **Upload de fichiers ZIP** - Drag & drop avec validation et stockage S3
- ✅ **Gestion des utilisateurs** - CRUD complet avec rôles ADMIN/USER
- ✅ **Contrôle d'accès** - Attribution de fichiers aux utilisateurs
- ✅ **Téléchargement sécurisé** - URL pré-signées ou proxy streaming
- ✅ **Protection anti-iframe** - Headers X-Frame-Options et CSP
- ✅ **Journalisation** - Audit de toutes les actions utilisateur
- ✅ **Déploiement Docker** - docker-compose prêt à l'emploi

## 📁 Structure du Projet

```
j-innov-main/
├── server/                 # Backend Express + TypeScript
│   ├── src/
│   │   ├── index.ts       # Point d'entrée
│   │   ├── routes/        # Routes API
│   │   ├── middleware/    # Auth, validation, rate limiting
│   │   └── services/      # S3, hashing, audit
│   ├── prisma/
│   │   ├── schema.prisma  # Schéma base de données
│   │   └── seed.ts        # Création admin initial
│   └── Dockerfile
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── pages/         # Pages de l'application
│   │   ├── components/    # Composants UI réutilisables
│   │   ├── context/       # Contexte d'authentification
│   │   └── lib/           # Utilitaires et API client
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Installation et Lancement

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Docker et Docker Compose (pour déploiement)
- Compte IONOS avec bucket S3 configuré

### 1. Cloner et configurer

```bash
# Cloner le projet
cd j-innov-main

# Copier les fichiers d'environnement
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 2. Configuration IONOS S3

Éditez le fichier `.env` avec vos credentials IONOS :

```env
S3_ENDPOINT=https://s3.eu-central-1.ionoscloud.com
S3_REGION=eu-central-1
S3_ACCESS_KEY=votre-access-key
S3_SECRET_KEY=votre-secret-key
S3_BUCKET=votre-bucket-name
S3_FORCE_PATH_STYLE=true
```

### 3. Configuration Admin

Définissez les credentials de l'admin initial :

```env
ADMIN_EMAIL=admin@votredomaine.com
ADMIN_PASSWORD=VotreMotDePasseSecurise123!
JWT_SECRET=votre-cle-jwt-secrete-min-32-caracteres
```

## 💻 Développement Local

### Backend

```bash
cd server

# Installer les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Créer/migrer la base de données
npm run db:push

# Créer l'utilisateur admin
npm run db:seed

# Lancer en mode développement
npm run dev
```

Le backend sera disponible sur http://localhost:3001

### Frontend

```bash
cd client

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

Le frontend sera disponible sur http://localhost:3000

## 🐳 Déploiement Docker

### Build et lancement

```bash
# Copier et configurer .env
cp .env.example .env
# Éditez .env avec vos valeurs

# Build et démarrage
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Accès

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 📡 API Endpoints

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login` | Connexion (email, password) |
| GET | `/auth/me` | Info utilisateur courant |
| POST | `/auth/refresh` | Rafraîchir le token |

### Fichiers

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/files/upload` | Upload ZIP (multipart) |
| GET | `/files` | Liste des fichiers |
| GET | `/files/:id` | Détails d'un fichier |
| GET | `/files/:id/download` | Télécharger un fichier |
| DELETE | `/files/:id` | Supprimer (admin) |

### Utilisateurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/users` | Créer un utilisateur (admin) |
| GET | `/users` | Liste des utilisateurs (admin) |
| GET | `/users/:id` | Détails utilisateur (admin) |
| PATCH | `/users/:id` | Modifier utilisateur (admin) |
| PATCH | `/users/:id/reset-password` | Reset mot de passe (admin) |
| DELETE | `/users/:id` | Supprimer utilisateur (admin) |

### Assignations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/assignments` | Assigner fichier à utilisateur |
| POST | `/assignments/bulk` | Assignation multiple |
| GET | `/assignments/file/:fileId` | Users assignés à un fichier |
| DELETE | `/assignments/:id` | Retirer une assignation |

## 🔐 Sécurité

### Headers de sécurité (anti-iframe)

```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### Rate Limiting

- Général: 100 requêtes / 15 min
- Login: 5 tentatives / 15 min
- Upload: 10 fichiers / heure
- Download: 50 téléchargements / 15 min

### Mots de passe

- Hachage bcrypt avec salt configurable
- Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
- Reset admin avec mot de passe temporaire

## 🔧 Variables d'Environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | 3001 |
| `NODE_ENV` | Environnement | development |
| `JWT_SECRET` | Clé secrète JWT | (requis) |
| `JWT_EXPIRES_IN` | Durée de vie token | 24h |
| `CORS_ORIGIN` | Origine autorisée | http://localhost:3000 |
| `ADMIN_EMAIL` | Email admin initial | admin@j-innov.com |
| `ADMIN_PASSWORD` | Mot de passe admin | (requis) |
| `BCRYPT_SALT_ROUNDS` | Rounds bcrypt | 12 |
| `MAX_UPLOAD_MB` | Taille max upload | 100 |
| `S3_ENDPOINT` | Endpoint IONOS S3 | (requis) |
| `S3_REGION` | Région S3 | eu-central-1 |
| `S3_ACCESS_KEY` | Clé d'accès S3 | (requis) |
| `S3_SECRET_KEY` | Clé secrète S3 | (requis) |
| `S3_BUCKET` | Nom du bucket | (requis) |
| `DOWNLOAD_MODE` | Mode téléchargement | presigned |
| `SIGNED_URL_EXPIRES_SECONDS` | Expiration URL signée | 3600 |
| `VITE_API_URL` | URL API pour frontend | http://localhost:3001 |

## 📊 Base de Données

### Schéma Prisma

- **User**: Utilisateurs avec rôles ADMIN/USER
- **File**: Fichiers uploadés avec métadonnées S3
- **Assignment**: Relations fichier ↔ utilisateur
- **AuditLog**: Journal des actions

### Commandes Prisma

```bash
# Générer le client
npm run db:generate

# Appliquer les migrations
npm run db:push

# Seed l'admin
npm run db:seed

# Interface Prisma Studio
npm run db:studio
```

## 🧪 Test de l'API

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@j-innov.com","password":"VotrePassword"}'

# Upload fichier (avec token)
curl -X POST http://localhost:3001/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@fichier.zip" \
  -F "projectSlug=mon-projet"

# Liste des fichiers
curl http://localhost:3001/files \
  -H "Authorization: Bearer <token>"
```

## 📝 Licence

Propriétaire - J-Innov © 2024-2026
