# Déploiement de Senso.Drive

Documentation de référence du déploiement de Senso.Drive sur un VPS, de l'application
de dev jusqu'à la mise en ligne en HTTPS. Sert à la fois de **runbook** (pour
redéployer ou mettre à jour) et de **mémoire technique** (pourquoi chaque choix a été
fait, et quels pièges ont été rencontrés).

> ⚠️ **Ce dépôt est public.** Ce document ne doit **jamais** contenir de secret
> (mots de passe, clés API, secret JWT). Tous les secrets vivent dans `.env.prod`,
> qui est **gitignoré** et n'est présent que sur le serveur.

---

## 1. Objectif et contraintes

- Mettre Senso.Drive en ligne pour le stage : un déploiement qui **fait le taf**
  d'abord, évolutif ensuite.
- Dimensionné pour **1 à 10 utilisateurs** — pas d'over-engineering (pas de
  Kubernetes, pas de multi-serveur).
- Objectif transverse : **apprendre des compétences réutilisables** (Docker en prod,
  reverse proxy, TLS, durcissement d'un serveur Linux).

Le déploiement a été découpé en **5 phases**. Les phases 1 à 4 sont terminées et
décrites ci-dessous ; la phase 5 (sauvegardes + supervision) est listée en fin de
document.

---

## 2. Architecture cible

Tout passe par une **seule porte d'entrée publique** (Traefik), qui répartit le
trafic. Le navigateur ne parle jamais directement au backend ou à la base.

```
                  Internet (HTTPS :443)
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │            Traefik (v3.6)            │  ← reverse proxy + TLS
        │  - termine le HTTPS (cert Let's Enc.) │
        │  - redirige :80 → :443                │
        └───────────────┬─────────────┬─────────┘
            Host=sensodrive.cloud      │
            && PathPrefix(/api)        │ reste (/)
                          │            │
                          ▼            ▼
                  ┌──────────────┐  ┌──────────────┐
                  │   backend    │  │   frontend   │
                  │  FastAPI     │  │  nginx (SPA) │
                  │  (uvicorn)   │  │  build Vite  │
                  └──────┬───────┘  └──────────────┘
                         │
                         ▼ (réseau Docker interne uniquement)
                  ┌──────────────┐
                  │  db Postgres │   volumes : postgres_data, documents_data
                  └──────────────┘
```

Points clés :

- **Une seule origine** côté navigateur : le front est servi à `/`, l'API à `/api`
  (chemin **relatif**). Conséquence directe : **plus de CORS** et **plus d'URL d'API
  en dur**.
- La base de données et le backend **ne sont pas exposés** sur Internet : ils ne sont
  joignables que via le réseau Docker interne (par leur nom de service : `db`,
  `backend`). Seul Traefik écoute sur `:80`/`:443`.
- Les données persistantes sont dans des **volumes Docker** : `postgres_data` (la
  base) et `documents_data` (les fichiers uploadés).

---

## 3. Stack et serveur

| Élément        | Choix                                                              |
|----------------|--------------------------------------------------------------------|
| Serveur        | Contabo Cloud VPS — 6 vCPU / 12 Go RAM / NVMe                       |
| OS             | Ubuntu 24.04 LTS                                                    |
| Conteneurs     | Docker CE 29.x + Compose plugin v5                                  |
| Reverse proxy  | Traefik **v3.6** (voir piège Docker 29 en §10)                     |
| TLS            | Let's Encrypt (challenge TLS-ALPN), renouvellement auto par Traefik |
| Backend        | FastAPI servi par `uvicorn` (`python:3.12-slim`, dépendances `uv`) |
| Frontend       | Build Vite servi par `nginx:alpine`                                |
| Base           | PostgreSQL 16                                                      |
| Domaine        | `sensodrive.cloud`                                                  |

Le principe directeur : **ne pas toucher au `docker-compose.yml` de dev**. Toute la
prod vit dans des fichiers séparés (`*.prod`), pour que le workflow de développement
(`npm run dev`, bind-mount du code, hot reload) reste intact.

### Fichiers de déploiement

```
docker-compose.prod.yml        # la stack de prod (db + traefik + backend + frontend)
backend/Dockerfile.prod        # image backend de prod (sans hot reload)
frontend/Dockerfile.prod       # image frontend (build → nginx), multi-stage
frontend/nginx.conf            # config nginx : routing SPA
.env.prod                      # secrets de prod — GITIGNORÉ, présent seulement sur le serveur
```

---

## 4. Phase 1 — Conteneuriser pour la prod

But : obtenir une application **buildable et lançable en prod**, testée en local,
sans les facilités de dev (pas de hot reload, pas de ports de base exposés).

### Backend — `backend/Dockerfile.prod`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen
COPY app/ ./app/
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

- **Pas de `--reload`** (contrairement au dev) : en prod on ne surveille pas les
  fichiers, et on lance **2 workers** pour encaisser plusieurs requêtes en parallèle.
- Les dépendances sont copiées et installées **avant** le code applicatif → le cache
  Docker des dépendances n'est invalidé que si `pyproject.toml`/`uv.lock` changent.

### Frontend — `frontend/Dockerfile.prod`

```dockerfile
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Build **multi-stage** : une première image Node compile le front (`npm run build` →
dossier `dist/`), puis une image nginx légère ne garde que le résultat statique. On
n'embarque pas Node ni `node_modules` dans l'image finale.

### Frontend — `frontend/nginx.conf`

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

La ligne `try_files ... /index.html` est **essentielle pour une SPA** : si l'on
recharge `/admin` (F5), nginx ne trouve pas de fichier `/admin` sur le disque et
renverrait une 404 ; là, il sert `index.html` et c'est React Router qui prend le
relais côté client.

### `docker-compose.prod.yml` (état Phase 1)

- `build` en **forme longue** (`context` + `dockerfile`) pour pointer explicitement
  sur `Dockerfile.prod` (sinon Compose rebuild l'image de dev avec le hot reload).
- `restart: unless-stopped` sur les services au long cours.
- **La base n'a pas de section `ports`** → injoignable depuis l'hôte, uniquement via
  le réseau Docker interne.
- Healthcheck `pg_isready` + `depends_on: condition: service_healthy` : le backend ne
  démarre qu'une fois la base réellement prête.
- **Adminer retiré** de la prod (outil de dev uniquement).

> **Note CamelCase → minuscules** : dans le healthcheck, `$$POSTGRES_USER` utilise un
> double `$` pour que la variable soit résolue **dans le conteneur** au runtime, et
> non interpolée par Compose au moment de lire le YAML.

---

## 5. Phase 2 — Reverse proxy Traefik + origine relative

But : mettre **Traefik devant** le front et le back, pour n'avoir qu'une seule
origine publique. Cela supprime d'un coup deux problèmes liés : le **CORS** et
l'**URL d'API en dur**.

### Routage par labels Docker

Traefik découvre les conteneurs via le socket Docker et lit leurs **labels** pour
construire les routes :

- **backend** : `PathPrefix(/api)` + un middleware `stripprefix` qui retire `/api`
  avant de transmettre (les routes FastAPI restent inchangées). Service sur le port
  `8000`.
- **frontend** : `PathPrefix(/)` → tout le reste. Service sur le port `80`.

Traefik priorise par **longueur de règle** : `/api` (plus spécifique) l'emporte sur
`/`. Les `ports:` directs du back et du front ont été retirés : **Traefik est le seul
point d'entrée public**.

### Côté code front

- `src/api.ts` : l'URL d'API passe de `http://localhost:8000` à **`/api` (relatif)**.
  Elle suit donc automatiquement le domaine, quel qu'il soit — c'était le **bloqueur
  ferme** avant la mise en ligne (un visiteur aurait sinon résolu `localhost:8000`
  vers sa propre machine).
- `vite.config.ts` : un `server.proxy` `/api → http://localhost:8000` avec strip du
  préfixe reproduit le comportement de Traefik **en dev** (équivalent du StripPrefix),
  pour que `npm run dev` continue de marcher. Cette config n'affecte pas le build prod.
- **CORS retiré** de `backend/app/main.py` : tout est désormais same-origin (Traefik
  en prod, proxy Vite en dev), le middleware CORS est devenu mort.

---

## 6. Phase 3 — Préparer et durcir le VPS

But : un serveur propre et sécurisé avant d'y mettre l'application.

> Dans les commandes ci-dessous : `SERVEUR = 144.91.110.201`, `USER = senso`.

### 6.1 Utilisateur non-root

On ne travaille jamais en `root` au quotidien. Création d'un utilisateur `senso`
ajouté au groupe `sudo` :

```bash
adduser senso
usermod -aG sudo senso
```

### 6.2 Authentification SSH par clé

Une **clé SSH dédiée** au VPS (pour ne pas réutiliser la clé personnelle), avec
passphrase :

```bash
# sur le poste local
ssh-keygen -t ed25519 -f ~/.ssh/sensodrive_vps
ssh-copy-id -i ~/.ssh/sensodrive_vps.pub senso@144.91.110.201

# connexion
ssh -i ~/.ssh/sensodrive_vps senso@144.91.110.201
```

### 6.3 Durcissement de sshd

Fichier **`/etc/ssh/sshd_config.d/00-hardening.conf`** :

```
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

```bash
sudo systemctl restart ssh   # ne coupe pas les sessions ouvertes → pas de lockout
```

> **Piège Ubuntu 24.04 (important)** : sshd lit les fichiers de
> `/etc/ssh/sshd_config.d/` dans l'**ordre numérique** et applique la **première
> valeur rencontrée**. Or l'image livre `50-cloud-init.conf` (qui pose
> `PasswordAuthentication yes`) lu **avant** `60-cloudimg-settings.conf`. Le `yes`
> gagnait. D'où le préfixe **`00-`** de notre fichier : il est lu en premier et gagne.
> Ne jamais éditer les fichiers `cloud-*` (une mise à jour d'image les réécrit).

**Vérifications** : connexion par clé OK, mot de passe refusé, `root` refusé.

```bash
ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password senso@144.91.110.201  # → Permission denied
ssh root@144.91.110.201                                                                   # → Permission denied
```

### 6.4 Pare-feu (ufw)

Vérifier d'abord le vrai port sshd (`sudo sshd -T | grep '^port'` → `22`), puis :

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp        # AVANT enable, sinon on se verrouille dehors
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw show added          # relire avant d'activer
sudo ufw enable
sudo ufw status verbose
```

Le backend (`8000`) et Postgres (`5432`) **restent fermés** de l'extérieur : ils ne
sont accessibles que par le réseau Docker.

### 6.5 Docker + Compose

Installation via le **dépôt officiel Docker** (clé GPG dans `/etc/apt/keyrings/`).
Puis ajout de l'utilisateur au groupe `docker` pour s'en servir sans `sudo` :

```bash
sudo usermod -aG docker senso   # le -a est crucial : sans lui, on REMPLACE les groupes (dont sudo)
# se reconnecter pour que le groupe prenne effet
docker run hello-world          # doit marcher sans sudo
```

> Appartenir au groupe `docker` ≈ être root (compromis accepté en mono-admin).

### 6.6 Transfert du code et des secrets

- **Code** : `git clone` du dépôt **public** (pas d'authentification nécessaire en
  lecture) dans `~/Senso.Drive`.
- **Secrets** : `.env.prod` est gitignoré donc absent du clone → transféré par `scp`,
  puis verrouillé :

```bash
scp -i ~/.ssh/sensodrive_vps .env.prod senso@144.91.110.201:~/Senso.Drive/
# sur le serveur
chmod 600 .env.prod
```

### 6.7 Rotation des secrets sur le serveur

Les secrets de prod sont **générés sur le serveur** (jamais affichés, jamais sur le
poste local), pour qu'ils n'existent qu'à un seul endroit :

```bash
# exemples — valeurs générées puis injectées dans .env.prod, jamais imprimées
J=$(openssl rand -hex 32)
sed -i "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$J|" .env.prod

P=$(openssl rand -hex 16)
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$P|" .env.prod
```

> L'hexadécimal évite les caractères spéciaux qui casseraient le parsing du `.env`.
> Le mot de passe Postgres ne doit être changé que **base vide** (volume vierge) :
> Postgres ne lit `POSTGRES_PASSWORD` qu'à la **première** initialisation.
> Ne jamais `cat` un fichier de secrets ; pour relire sans exposer :
> `sed -E 's/=.*/=***/' .env.prod`.

---

## 7. Phase 4 — Domaine + HTTPS (Let's Encrypt)

But : servir le site sur `https://sensodrive.cloud` avec un certificat valide et
renouvelé automatiquement.

### 7.1 DNS

Chez le registrar du domaine, créer **un seul enregistrement A** pointant vers le VPS :

| Type | Nom | Valeur            |
|------|-----|-------------------|
| A    | `@` | `144.91.110.201`  |

> **Piège vécu** : le domaine avait déjà **deux A records de parking** (pages par
> défaut du registrar). Laisser plusieurs A sur `@` provoque un **round-robin** : le
> resolver en renvoie un au hasard → les visiteurs tombent une partie du temps sur le
> parking. Il faut **supprimer les anciens** et n'en garder qu'un.

Vérifier la propagation **en court-circuitant le cache local** (un cache négatif
NXDOMAIN peut persister ~5 min) :

```bash
dig @8.8.8.8 sensodrive.cloud +short   # doit répondre : 144.91.110.201
```

### 7.2 Configuration Traefik (HTTPS)

Ajouts dans le service `traefik` (`command`) :

```yaml
- --entrypoints.websecure.address=:443
- --entrypoints.web.http.redirections.entrypoint.to=websecure
- --entrypoints.web.http.redirections.entrypoint.scheme=https
- --certificatesresolvers.le.acme.tlschallenge=true
- --certificatesresolvers.le.acme.email=<email-de-contact>
- --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
```

- Nouvel **entrypoint `websecure` sur `:443`**.
- **Redirection globale** : tout le trafic `:80` est renvoyé en `https`.
- **Certificate resolver `le`** : module qui dialogue avec Let's Encrypt. On utilise
  le **TLS challenge** (validation sur le port 443) — simple, et qui n'interfère pas
  avec la redirection HTTP→HTTPS.
- Le certificat est **persisté** dans `/letsencrypt/acme.json`, monté sur un **volume
  nommé** `letsencrypt` (Traefik crée le fichier avec les bonnes permissions). Sans
  persistance, Traefik redemanderait un certificat à chaque redémarrage et finirait
  par taper dans les quotas Let's Encrypt.

Le port `443` est ajouté aux `ports`, et les **routers** basculent sur `websecure`
avec une règle par domaine :

```yaml
# backend
- traefik.http.routers.backend.rule=Host(`sensodrive.cloud`) && PathPrefix(`/api`)
- traefik.http.routers.backend.entrypoints=websecure
- traefik.http.routers.backend.tls.certresolver=le
# frontend
- traefik.http.routers.frontend.rule=Host(`sensodrive.cloud`)
- traefik.http.routers.frontend.entrypoints=websecure
- traefik.http.routers.frontend.tls.certresolver=le
```

> Le `Host(...)` est nécessaire ici : le certificat est lié à un **nom de domaine**,
> Traefik doit savoir quel domaine concerne ces routers pour demander le bon
> certificat.

### 7.3 Vérification

```bash
curl -I https://sensodrive.cloud   # → HTTP/2 200 (cert valide, curl sans -k accepte)
curl -I http://sensodrive.cloud    # → 308 + Location: https://sensodrive.cloud/
```

Puis un test bout-en-bout dans le navigateur : cadenas valide + connexion + upload.

---

## 8. Notion clé : certificats et HTTPS

Pour le rapport, en une page : un certificat TLS est la **carte d'identité** du site,
signée par une **autorité de certification** (CA) de confiance — ici Let's Encrypt,
gratuite. Le HTTPS apporte deux garanties :

1. **Chiffrement** : personne sur le chemin ne peut lire le trafic (mot de passe
   compris).
2. **Authenticité** : preuve qu'on parle bien au vrai `sensodrive.cloud`.

La CA ne signe qu'après que le demandeur ait **prouvé qu'il contrôle le domaine** (le
*challenge*). C'est ce qui empêche un imposteur d'obtenir un certificat valide pour
`sensodrive.cloud` — et donne donc sa valeur au cadenas. À la connexion, le serveur
prouve en plus qu'il détient la **clé privée** associée au certificat (la clé publique
est dans le certificat, visible de tous ; la privée reste sur le serveur). Copier un
certificat ne sert à rien sans la clé privée.

Les certificats Let's Encrypt durent **90 jours** ; Traefik les **renouvelle
automatiquement** avant expiration.

---

## 9. Déployer et mettre à jour

### Premier déploiement (résumé ordonné)

1. VPS durci (§6 : user non-root, SSH par clé, sshd, ufw, Docker).
2. `git clone` du dépôt + `scp` de `.env.prod` + rotation des secrets (§6.6, §6.7).
3. Lancer la stack (§ commande ci-dessous).

### Mise à jour au quotidien (le runbook)

Sur le serveur, dans `~/Senso.Drive` :

```bash
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

- **`--env-file .env.prod` est obligatoire** (voir piège §10).
- `--build` reconstruit les images si le code a changé ; on peut l'omettre si seul un
  fichier de config a bougé.
- `-d` lance en **détaché** (ne meurt pas à la déconnexion SSH). Combiné à
  `restart: unless-stopped` + le service Docker activé au boot, la stack survit aux
  redémarrages et aux crashs.

### Commandes de supervision

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f traefik
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail 50 backend
```

---

## 10. Pièges rencontrés (et comment ils ont été résolus)

| Piège | Symptôme | Résolution |
|-------|----------|------------|
| **Docker 29 casse Traefik v3.1** | `client version 1.24 is too old`, 0 conteneur découvert | Docker 29 a supprimé l'API 1.24 ; passer à **Traefik v3.6+** (négocie la version d'API). |
| **`env_file` ≠ interpolation `${...}`** | `WARN POSTGRES_USER not set, blank string`, `DATABASE_URL` cassé | `env_file:` injecte dans le conteneur au runtime ; les `${...}` du YAML lisent le shell ou un fichier `.env`. Toujours lancer avec **`--env-file .env.prod`**. |
| **sshd Ubuntu 24.04** | `PasswordAuthentication no` ignoré | Fichiers `sshd_config.d/` lus en ordre numérique, **première valeur gagne**. Mettre un **`00-hardening.conf`**. |
| **`usermod` sans `-a`** | l'utilisateur perd ses autres groupes (dont `sudo`) | Toujours `usermod -aG <groupe> <user>` (le `-a` = *append*). |
| **DNS multi-records** | site joignable une fois sur deux | Supprimer les A records de parking, n'en garder **qu'un** vers le VPS. |
| **Cache DNS négatif** | `dig` local renvoie vide (NXDOMAIN) longtemps | Interroger un resolver public : `dig @8.8.8.8 ...` (le cache négatif dure ~le TTL). |
| **GitHub : push refusé** | `Password authentication is not supported` | GitHub n'accepte plus le mot de passe de compte ; passer le remote en **SSH** (`git remote set-url origin git@github.com:...`). |
| **Copier-coller en terminal** | commandes cassées (retours-ligne insérés > ~80 colonnes), indentation YAML décalée | Commandes courtes, une par ligne ; relire le diff avant de committer. |

---

## 11. Reste à faire — Phase 5 (minimum vital prod)

- **Sauvegardes automatiques** des volumes `postgres_data` (dump SQL) et
  `documents_data` (archive des fichiers), idéalement planifiées (cron).
- **Supervision** : ping externe de `https://sensodrive.cloud` (ex. UptimeRobot).
- **Dette token SSE** : le flux d'événements (logs temps réel) passe son token JWT en
  **query param** → il fuiterait dans les logs/Referer. Parade prévue : cookie
  httpOnly.
- **Rotation de la clé API** (hygiène) : régénérer toute clé qui aurait pu transiter
  en clair pendant la mise en place.
- Optionnel : fermer le dashboard Traefik (`--api.insecure=true`, actuellement sur
  `127.0.0.1:8080`, accessible seulement via tunnel SSH).

---

## 12. Variables d'environnement attendues (`.env.prod`)

Le fichier `.env.prod` (gitignoré, présent **uniquement sur le serveur**) contient,
avec des **valeurs réelles à ne jamais committer** :

```
POSTGRES_USER=...
POSTGRES_DB=...
POSTGRES_PASSWORD=...
JWT_SECRET_KEY=...
ANTHROPIC_API_KEY=...
```

Le `DATABASE_URL` du backend est reconstruit à partir des variables Postgres
directement dans `docker-compose.prod.yml`.
