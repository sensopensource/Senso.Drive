import { createContext, useState, useRef, useContext, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useSuggestions,
  useAnalyserAgent,
  useValiderSuggestion,
  useRefuserSuggestion,
  type Suggestion,
} from "../hooks/useSuggestions"

export type SuggestionUiState = 'pending' | 'done' | 'refused' | 'skipped'

type AgentContextType = {
  suggestions: Suggestion[]
  pendingCount: number

  analysisRunning: boolean
  startAnalysis: () => Promise<void>
  cancelAnalysis: () => void

  emptyToastOpen: boolean
  closeEmptyToast: () => void

  suggestionsModalOpen: boolean
  openSuggestions: () => void
  closeSuggestions: () => void

  tourSuggestions: Suggestion[]
  cardStates: SuggestionUiState[]
  currentIdx: number
  currentSuggestion: Suggestion | null

  validateCurrent: () => void
  refuseCurrent: (raison: string | null) => Promise<void>
  laterCurrent: () => void

  reorgOpen: boolean
  pendingValidationId: number | null
  confirmReorg: () => Promise<void>
  cancelReorg: () => void
}

const AgentContext = createContext<AgentContextType | null>(null)

function findNextPendingIdx(etats: SuggestionUiState[], from: number): number {
  for (let i = from + 1; i < etats.length; i++) {
    if (etats[i] === 'pending') return i
  }
  for (let i = 0; i < etats.length; i++) {
    if (etats[i] === 'pending') return i
  }
  return from
}

type ProviderProps = {
  children: ReactNode
}

export function AgentProvider({ children }: ProviderProps) {
  const queryClient = useQueryClient()
  const { suggestions } = useSuggestions()
  const { analyser } = useAnalyserAgent()
  const { valider } = useValiderSuggestion()
  const { refuser } = useRefuserSuggestion()

  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [emptyToastOpen, setEmptyToastOpen] = useState(false)
  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false)
  const [tourSuggestions, setTourSuggestions] = useState<Suggestion[]>([])
  const [cardStates, setCardStates] = useState<SuggestionUiState[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [reorgOpen, setReorgOpen] = useState(false)
  const [pendingValidationId, setPendingValidationId] = useState<number | null>(null)

  const annule = useRef(false)

  const pendingCount = suggestions.filter(s => s.statut === 'en_attente').length

  const currentSuggestion = tourSuggestions[currentIdx] ?? null

  const demarrer_tour = (liste: Suggestion[]) => {
    setTourSuggestions(liste)
    setCardStates(liste.map(() => 'pending'))
    setCurrentIdx(0)
  }

  const startAnalysis = async () => {
    annule.current = false
    setEmptyToastOpen(false)
    setSuggestionsModalOpen(false)
    setAnalysisRunning(true)

    try {
      await analyser()
      await queryClient.refetchQueries({ queryKey: ['suggestions'] })

      if (annule.current) return

      const fresh = queryClient.getQueryData<Suggestion[]>(['suggestions']) ?? []
      const en_attente = fresh.filter(s => s.statut === 'en_attente')

      if (en_attente.length === 0) {
        setEmptyToastOpen(true)
      } else {
        demarrer_tour(en_attente)
        setSuggestionsModalOpen(true)
      }
    } finally {
      setAnalysisRunning(false)
    }
  }

  const cancelAnalysis = () => {
    annule.current = true
    setAnalysisRunning(false)
  }

  const closeEmptyToast = () => {
    setEmptyToastOpen(false)
  }

  const openSuggestions = () => {
    if (tourSuggestions.length === 0) {
      const en_attente = suggestions.filter(s => s.statut === 'en_attente')
      if (en_attente.length === 0) {
        setEmptyToastOpen(true)
        return
      }
      demarrer_tour(en_attente)
    }
    setSuggestionsModalOpen(true)
  }

  const closeSuggestions = () => {
    setSuggestionsModalOpen(false)
  }

  const validateCurrent = () => {
    if (!currentSuggestion) return
    setPendingValidationId(currentSuggestion.id)
    setReorgOpen(true)
  }

  const refuseCurrent = async (raison: string | null) => {
    if (!currentSuggestion) return
    const idx = currentIdx
    await refuser({ id: currentSuggestion.id, raison_refus: raison })

    const nouveaux_etats = [...cardStates]
    nouveaux_etats[idx] = 'refused'
    setCardStates(nouveaux_etats)
    setCurrentIdx(findNextPendingIdx(nouveaux_etats, idx))
  }

  const laterCurrent = () => {
    const idx = currentIdx
    const nouveaux_etats = [...cardStates]
    nouveaux_etats[idx] = 'skipped'
    setCardStates(nouveaux_etats)
    setCurrentIdx(findNextPendingIdx(nouveaux_etats, idx))
  }

  const confirmReorg = async () => {
    if (pendingValidationId === null) return
    const id = pendingValidationId
    const idx = tourSuggestions.findIndex(s => s.id === id)

    await valider(id)

    setReorgOpen(false)
    setPendingValidationId(null)

    if (idx >= 0) {
      const nouveaux_etats = [...cardStates]
      nouveaux_etats[idx] = 'done'
      setCardStates(nouveaux_etats)
      setCurrentIdx(findNextPendingIdx(nouveaux_etats, idx))
    }
  }

  const cancelReorg = () => {
    setReorgOpen(false)
    setPendingValidationId(null)
  }

  return (
    <AgentContext.Provider value={{
      suggestions,
      pendingCount,
      analysisRunning,
      startAnalysis,
      cancelAnalysis,
      emptyToastOpen,
      closeEmptyToast,
      suggestionsModalOpen,
      openSuggestions,
      closeSuggestions,
      tourSuggestions,
      cardStates,
      currentIdx,
      currentSuggestion,
      validateCurrent,
      refuseCurrent,
      laterCurrent,
      reorgOpen,
      pendingValidationId,
      confirmReorg,
      cancelReorg,
    }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error("useAgent doit être utilisé dans un AgentProvider")
  }
  return context
}
