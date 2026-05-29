import { type ReactNode } from "react"
import TokensWidget from "./TokensWidget"
import TopUsersWidget from "./TopUsersWidget"
import DocTypesWidget from "./DocTypesWidget"
import SuggestionsWidget from "./SuggestionsWidget"
import LogsWidget from "./LogsWidget"
import UsersWidget from "./UsersWidget"
import { LABELS } from "../../lib/labels"

export type WidgetKey = 'tokens' | 'topUsers' | 'docTypes' | 'suggestions' | 'logs' | 'users'

// Contexte transmis aux widgets sensibles a la periode (range 24h/7j/30j/tout)
export type WidgetCtx = {
  jours: number | null
  rangeLabel: string
}

type WidgetDef = {
  label: string        // pour la zone "ajouter un widget"
  defaultSpan: number  // largeur par defaut (en colonnes sur 12)
  minSpan: number      // largeur minimale lisible (les tables ont besoin de place)
  render: (ctx: WidgetCtx) => ReactNode
}

export const REGISTRE: Record<WidgetKey, WidgetDef> = {
  tokens: {
    label: 'Consommation tokens',
    defaultSpan: 8, minSpan: 4,
    render: ({ jours, rangeLabel }) => <TokensWidget jours={jours} rangeLabel={rangeLabel} />,
  },
  topUsers: {
    label: 'Top users — docs',
    defaultSpan: 4, minSpan: 4,
    render: () => <TopUsersWidget />,
  },
  docTypes: {
    label: 'Documents par type',
    defaultSpan: 6, minSpan: 4,
    render: ({ jours }) => <DocTypesWidget jours={jours} />,
  },
  suggestions: {
    label: `Suggestions ${LABELS.slavy.nom}`,
    defaultSpan: 6, minSpan: 4,
    render: ({ jours, rangeLabel }) => <SuggestionsWidget jours={jours} rangeLabel={rangeLabel} />,
  },
  logs: {
    label: "Flux d'évènements",
    defaultSpan: 12, minSpan: 6,
    render: () => <LogsWidget />,
  },
  users: {
    label: 'Utilisateurs',
    defaultSpan: 12, minSpan: 8,
    render: () => <UsersWidget />,
  },
}

// Largeurs proposees (en colonnes) + libelle court pour le selecteur.
export const LARGEURS: { cols: number; label: string }[] = [
  { cols: 4,  label: '⅓' },
  { cols: 6,  label: '½' },
  { cols: 8,  label: '⅔' },
  { cols: 12, label: '1' },
]

// Map statique number → classe Tailwind (les literals doivent exister pour le scan Tailwind).
const SPAN_CLASS: Record<number, string> = {
  4:  'col-span-4',
  6:  'col-span-6',
  8:  'col-span-8',
  12: 'col-span-12',
}

export function spanClass(cols: number): string {
  return SPAN_CLASS[cols] ?? 'col-span-6'
}

// Ordre d'affichage par defaut (= ordre de la maquette)
export const ORDRE_DEFAUT: WidgetKey[] = ['tokens', 'topUsers', 'docTypes', 'suggestions', 'logs', 'users']

export const TOUTES_LES_CLES = ORDRE_DEFAUT

export function estWidgetKey(cle: string): cle is WidgetKey {
  return cle in REGISTRE
}
