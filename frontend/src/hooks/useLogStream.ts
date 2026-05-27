import { useState, useEffect } from "react"
import { apiFetch } from "../api"
import type { LogRead, LogListResponse } from "../types"

const MAX_LOGS = 100  // on plafonne le buffer pour ne pas faire gonfler la memoire indefiniment

// Charge les logs recents puis ecoute le flux SSE temps reel.
// `paused` coupe l'ecoute live sans vider ce qui est deja affiche.
export function useLogStream(paused: boolean) {
  const [logs, setLogs] = useState<LogRead[]>([])
  const [connected, setConnected] = useState(false)

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

  // 2. Flux live — fetch + reader du response.body
  useEffect(() => {
    if(paused) return
   
    const controller = new AbortController()

   const ecouter = async () => { 
     const response = await apiFetch('/admin/logs/stream', {signal: controller.signal})
     if (!response.ok || !response.body) return
     setConnected(true)

   const reader = response.body.getReader()
   const decoder = new TextDecoder()
   let buffer = ''

  while(true) {
    const {value,done} = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true})

    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const evt of events) {
      const ligne = evt.split('\n').find(l => l.startsWith('data:'))
      if (!ligne) continue 
      const log: LogRead = JSON.parse(ligne.slice(5).trim())
      setLogs(prev => [log, ...prev].slice(0, MAX_LOGS))
    }
  }
}

  ecouter().catch(() => {}).finally(() => setConnected(false))

  return () => { 
    controller.abort()
    setConnected(false)
  }
},[paused])

return { logs,connected }
}
