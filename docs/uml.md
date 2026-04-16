# Diagramme UML — DocManager

## Diagramme de classes

```mermaid
classDiagram
    direction LR

    class Utilisateur {
        +int id
        +string email
        +string nom
        +string mot_de_passe_hash
        +datetime date_inscription
    }

    class Categorie {
        +int id
        +string nom
        +int parent_id [nullable]
    }

    class Document {
        +int id
        +string titre
        +string auteur
        +datetime date_creation
        +int utilisateur_id
        +int categorie_id
    }

    class Version {
        +int id
        +int document_id
        +int numero
        +string contenu
        +string resume [nullable]
        +string storage_fichier
        +string type_fichier
        +tsvector search_vector
        +datetime date_upload
    }

    class Anomalie {
        +int id
        +string code
        +int utilisateur_id
        +string ip_address
        +string description
        +string severite
        +datetime date_detection
    }

    class Log {
        +int id
        +int utilisateur_id
        +string action
        +string details
        +string ip_address
        +datetime date_action
    }

    class Tag {
        +int id
        +string nom
    }

    class DocumentTag {
        +int document_id
        +int tag_id
    }

    class HistoriqueRecherche {
        +int id
        +int utilisateur_id
        +string requete
        +int nb_resultats
        +datetime date_recherche
    }

    Utilisateur "1" --> "*" Document : possede
    Utilisateur "1" --> "*" HistoriqueRecherche : effectue
    Utilisateur "1" --> "*" Anomalie : declenche
    Utilisateur "1" --> "*" Log : genere
    Categorie "1" --> "*" Document : contient
    Categorie "0..1" --> "*" Categorie : parent
    Document "1" --> "1..*" Version : a
    Document "1" --> "*" DocumentTag : a
    Tag "1" --> "*" DocumentTag : est
```

## Diagramme entite-relation (MCD)

```mermaid
erDiagram
    UTILISATEUR {
        int id PK
        string email UK
        string nom
        string mot_de_passe_hash
        datetime date_inscription
    }

    CATEGORIE {
        int id PK
        string nom
        int parent_id FK "nullable, self-ref"
    }

    DOCUMENT {
        int id PK
        string titre
        string auteur
        datetime date_creation
        int utilisateur_id FK
        int categorie_id FK
    }

    VERSION {
        int id PK
        int document_id FK
        int numero
        string contenu
        string resume "nullable, genere par LLM"
        string storage_fichier UK
        string type_fichier
        tsvector search_vector
        datetime date_upload
    }

    ANOMALIE {
        int id PK
        string code
        int utilisateur_id FK
        string ip_address
        string description
        string severite
        datetime date_detection
    }

    LOG {
        int id PK
        int utilisateur_id FK
        string action
        string details
        string ip_address
        datetime date_action
    }

    TAG {
        int id PK
        string nom UK
    }

    DOCUMENT_TAG {
        int document_id FK
        int tag_id FK
    }

    HISTORIQUE_RECHERCHE {
        int id PK
        int utilisateur_id FK
        string requete
        int nb_resultats
        datetime date_recherche
    }

    UTILISATEUR ||--o{ DOCUMENT : "possede"
    UTILISATEUR ||--o{ HISTORIQUE_RECHERCHE : "effectue"
    UTILISATEUR ||--o{ ANOMALIE : "declenche"
    UTILISATEUR ||--o{ LOG : "genere"
    CATEGORIE ||--o{ DOCUMENT : "contient"
    CATEGORIE |o--o{ CATEGORIE : "sous-categorie de"
    DOCUMENT ||--|{ VERSION : "a"
    DOCUMENT ||--o{ DOCUMENT_TAG : ""
    TAG ||--o{ DOCUMENT_TAG : ""
```
