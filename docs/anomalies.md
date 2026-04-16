# Liste des anomalies — DocManager

## Principe de detection

Chaque anomalie est detectee par une **regle a seuil** : si un evenement depasse un nombre d'occurrences dans une fenetre de temps, une alerte est levee. Les seuils sont configurables.

Les anomalies sont classees par severite :
- **Critique** — action immediate requise, potentielle compromission
- **Haute** — comportement suspect, investigation necessaire
- **Moyenne** — irregularite a surveiller
- **Basse** — informatif, pas d'action immediate

---

## Authentification

| Code | Anomalie | Description | Regle de detection | Severite |
|------|----------|-------------|-------------------|----------|
| AUTH-01 | Brute force | Tentatives de connexion echouees repetees sur un meme compte | 5+ echecs en 10 min pour un meme email | Critique |
| AUTH-02 | Horaire anormal | Connexion en dehors des heures habituelles | Connexion entre 00h et 5h | Basse |
| AUTH-03 | Creation de comptes en rafale | Inscription massive depuis une meme source | 3+ comptes crees depuis la meme IP en 1h | Haute |

### Actions recommandees
- **AUTH-01** : Bloquer temporairement le compte (lockout 15 min), notifier l'admin
- **AUTH-02** : Logger l'evenement, visible dans le dashboard admin
- **AUTH-03** : Bloquer l'IP temporairement, notifier l'admin

---

## Documents

| Code | Anomalie | Description | Regle de detection | Severite |
|------|----------|-------------|-------------------|----------|
| DOC-01 | Telechargement massif | Un utilisateur telecharge un volume anormal de documents | 20+ telechargements en 10 min par un meme user | Haute |
| DOC-02 | Suppression massive | Un utilisateur supprime un grand nombre de documents rapidement | 10+ suppressions en 5 min par un meme user | Critique |
| DOC-03 | Upload fichier suspect | Tentative d'upload d'un type de fichier non autorise | Type de fichier hors PDF/DOCX | Moyenne |
| DOC-04 | Upload surdimensionne | Upload d'un fichier depassant la taille maximale autorisee | Fichier > 50 Mo | Moyenne |

### Actions recommandees
- **DOC-01** : Rate limiting sur l'endpoint de telechargement, alerte admin
- **DOC-02** : Soft delete (corbeille) au lieu de suppression definitive, alerte admin
- **DOC-03** : Rejet de l'upload avec message d'erreur explicite, log de la tentative
- **DOC-04** : Rejet de l'upload, log de la tentative

---

## Recherche

| Code | Anomalie | Description | Regle de detection | Severite |
|------|----------|-------------|-------------------|----------|
| SRCH-01 | Recherche automatisee | Requetes de recherche a frequence anormale (scraping) | 30+ recherches en 5 min par un meme user | Haute |

### Actions recommandees
- **SRCH-01** : Rate limiting sur l'endpoint de recherche, alerte admin

---

## Administration

| Code | Anomalie | Description | Regle de detection | Severite |
|------|----------|-------------|-------------------|----------|
| ADM-01 | Acces admin non autorise | Un utilisateur non-admin tente d'acceder a une route reservee admin | Toute requete sur /admin/* par un user non-admin | Critique |
| ADM-02 | Modification de role suspecte | Changement du role d'un utilisateur | Tout changement de role est logge systematiquement | Haute |

### Actions recommandees
- **ADM-01** : Rejet avec HTTP 403, log avec IP + user_id + route tentee, alerte admin
- **ADM-02** : Log complet (qui a change quoi, quand), notification a l'admin si le changement n'est pas fait par un admin

---

## Resume

| Severite | Nombre | Codes |
|----------|--------|-------|
| Critique | 3 | AUTH-01, DOC-02, ADM-01 |
| Haute | 4 | AUTH-03, DOC-01, SRCH-01, ADM-02 |
| Moyenne | 2 | DOC-03, DOC-04 |
| Basse | 1 | AUTH-02 |
| **Total** | **10** | |

## Implementation technique (prevue semaines 5-6)

Chaque anomalie detectee sera stockee dans une table `anomalies` :

```sql
CREATE TABLE anomalies (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    ip_address TEXT,
    description TEXT,
    severite TEXT NOT NULL,
    date_detection TIMESTAMPTZ DEFAULT NOW()
);
```

Le dashboard admin affichera les anomalies recentes avec filtrage par severite, code, et utilisateur.
