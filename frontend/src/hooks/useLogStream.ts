import { useState, useEffect, useRef } from "react"
import { apiFetch, API_URL } from "../api"
import type { LogRead, LogListResponse } from "../types"

const MAX_LOGS = 100  // on plafonne le buffer pour ne pas faire gonfler la memoire indefiniment

// Charge les logs recents puis ecoute le flux SSE temps reel.
// `paused` coupe l'ecoute live sans vider ce qui est deja affiche.
export function useLogStream(paused: boolean) {
  const [logs, setLogs] = useState<LogRead[]>([])
  const [connected, setConnected] = useState(false)
  const sourceRef = useRef<EventSource | null>(null)

  // 1. Snapshot initial (les 50 derniers logs) au montage
  useEffect(() => {
    let annule = false
    const charger = async () => {
      const response = await apiFetch('/admin/logs?page=1&size=50')
      if (!response.ok) return
      const data: LogListResponse = await response.json()
      if (!annule) setLogs(data.items)
    }
    charger()
    return () => { annule = true }
  }, [])

  // 2. Flux live — EventSource passe le token en query param (pas de header possible)
  useEffect(() => {
    if (paused) return

    const token = localStorage.getItem('token')
    if (!token) return

    const source = new EventSource(`${API_URL}/admin/logs/stream?token=${token}`)
    sourceRef.current = source

    source.onopen = () => setConnected(true)

    source.onmessage = (event) => {
      const log: LogRead = JSON.parse(event.data)
      setLogs(prev => [log, ...prev].slice(0, MAX_LOGS))
    }

    source.onerror = () => setConnected(false)

    return () => {
      source.close()
      sourceRef.current = null
      setConnected(false)
    }
  }, [paused])

  return { logs, connected }
}
