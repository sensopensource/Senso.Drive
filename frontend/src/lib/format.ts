// Helpers de formatage partages par les widgets admin.

// 1 248 (espace insecable comme separateur de milliers, convention FR)
export function formatNombre(n: number): string {
  return n.toLocaleString('fr-FR')
}

// 0 o / 1,2 Ko / 3,4 Mo / 1,5 Go — base 1024, convention FR
export function formatOctets(n: number): string {
  if (n < 1024) return `${n} o`
  const unites = ['Ko', 'Mo', 'Go', 'To']
  let valeur = n / 1024
  let i = 0
  while (valeur >= 1024 && i < unites.length - 1) {
    valeur /= 1024
    i++
  }
  return `${valeur.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${unites[i]}`
}

// 94.2k / 1.3M — pour les grandes valeurs (tokens)
export function formatCompact(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

// 12 mar. 2026
export function formatDateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// "il y a 2 min" / "il y a 3 h" / "hier" / date courte au-dela
export function formatRelatif(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  const secondes = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secondes < 60) return "à l'instant"
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`
  if (secondes < 172800) return 'hier'
  if (secondes < 604800) return `il y a ${Math.floor(secondes / 86400)}j`
  return formatDateCourte(iso)
}
