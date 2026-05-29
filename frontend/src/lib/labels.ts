// Libellés UI centralisés (chaînes affichées uniquement).
// Le code et la DB gardent categorie/agent ; ici on fixe ce que voit l'utilisateur.
// Cf. refactos #10 (catégorie → Dossier) et #11 (agent → Slavy).

export const LABELS = {
  slavy: {
    nom:         'Slavy',
    analyser:    'Analyser ma bibliothèque',
    suggestions: 'Suggestions',
    parametres:  'Paramètres',
  },
  dossier: {
    singulier: 'Dossier',
    pluriel:   'Dossiers',
    nouveau:   'Nouveau dossier',
  },
  nav: {
    mesDocuments:  'Mes documents',
    tableauDeBord: 'Tableau de bord',
    corbeille:     'Corbeille',
    importer:      'Importer un document',
  },
} as const
