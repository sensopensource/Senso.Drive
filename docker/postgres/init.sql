CREATE EXTENSION IF NOT EXISTS unaccent;
-- pour gerer les accents
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- pour gerer les fautres d'orthographes

CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french);
-- jai copie la config classque de french,pourchaque hword(mot compose),hword-part(partie de mot compose),mot classique japplique         
-- le traitement unaccent pour elenver les accents,ensuite stem pour tokeniser ou plutot garder le mot a sa racine
ALTER TEXT SEARCH CONFIGURATION french_unaccent
  ALTER MAPPING FOR hword,hword_part,word
  WITH unaccent, french_stem;

CREATE TABLE utilisateurs (
     
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE ,
    mot_de_passe_hash TEXT NOT NULL,
    date_inscription TIMESTAMPTZ DEFAULT NOW(),
    nom TEXT NOT NULL

);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    id_parent int REFERENCES categories(id)

);


CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    titre TEXT NOT NULL,
    auteur TEXT,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    id_utilisateur int REFERENCES utilisateurs(id),
    id_categorie int REFERENCES categories(id)
    
      );

CREATE TABLE versions(
    id SERIAL PRIMARY KEY,
    numero int NOT NULL,
    contenu TEXT NOT NULL,
    storage_fichier TEXT NOT NULL UNIQUE,
    type_fichier TEXT NOT NULL,
    search_vector tsvector,
    resume_LLM TEXT,
    date_upload TIMESTAMPTZ DEFAULT NOW(),
    id_document int REFERENCES documents(id)

);


CREATE TABLE anomalies(
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    id_utilisateur int REFERENCES utilisateurs(id),
    adresse_ip TEXT NOT NULL,
    description TEXT NOT NULL,
    severite TEXT NOT NULL,
    date_detection TIMESTAMPTZ DEFAULT NOW()

);

CREATE TABLE logs(
    id SERIAL PRIMARY KEY,
    id_utilisateur int REFERENCES utilisateurs(id),
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    adresse_ip TEXT NOT NULL,
    date_action TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags(
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE

);

CREATE TABLE documents_tags(
    id_document int REFERENCES documents(id),
    id_tag int REFERENCES tags(id),
    PRIMARY KEY (id_document,id_tag)
);


CREATE TABLE historiques_recherches(
    id SERIAL PRIMARY KEY,
    id_utilisateur int REFERENCES utilisateurs(id),
    requete TEXT NOT NULL,
    date_recherche TIMESTAMPTZ DEFAULT NOW(),
    nb_resultats int NOT NULL
);

INSERT INTO utilisateurs (role, email, mot_de_passe_hash, nom)
VALUES ('admin', 'admin@test.com', 'temp_hash', 'Admin Test');

INSERT INTO categories (nom)
VALUES ('Non categorise');

CREATE INDEX idx_documents_search_vector
    ON versions USING GIN(search_vector) ;
