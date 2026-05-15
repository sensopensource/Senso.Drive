import { useState, useEffect } from "react"
import { useAgent } from "../contexts/AgentContext"

const STEPS = [
  { at: 0,  msg: "Lecture des documents…" },
  { at: 25, msg: "Construction du contexte…" },
  { at: 50, msg: "L'agent réfléchit…" },
  { at: 80, msg: "Filtrage des suggestions…" },
]

function findLabelFor(p: number): string {
  let courant = STEPS[0].msg
  for (const step of STEPS) {
    if (p >= step.at) courant = step.msg
  }
  return courant
}

function AgentAnalysisToast() {
  const { analysisRunning, cancelAnalysis } = useAgent()
  const [progress, setProgress] = useState(0)
  const [label, setLabel] = useState(STEPS[0].msg)

  useEffect(() => {
    if (!analysisRunning) return

    let p = 0
    const timer = setInterval(() => {
      p = Math.min(90, p + Math.random() * 8)
      setProgress(p)
      setLabel(findLabelFor(p))
    }, 200)

    return () => {
      clearInterval(timer)
      setProgress(0)
      setLabel(STEPS[0].msg)
    }
  }, [analysisRunning])

  if (!analysisRunning) return null

  return (
    <div className="toast">
      <div className="toast-head">
        <span className="toast-icon"></span>
        <span className="toast-title">L'agent analyse ta bibliothèque</span>
        <button
          type="button"
          onClick={cancelAnalysis}
          className="toast-close"
          aria-label="Annuler l'analyse"
        >
          ×
        </button>
      </div>
      <div className="toast-sub">{label}</div>
      <div className="toast-bar">
        <div className="toast-bar-fill" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  )
}

export default AgentAnalysisToast
