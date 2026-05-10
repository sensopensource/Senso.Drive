import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useToast } from "../contexts/ToastContext"
import type { LoginResponse } from "../types"


function LoginPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState<string>('')
  const [mdp, setMdp] = useState<string>('')
  const [logError, setLogError] = useState<string>('')

  useEffect(() => {
    if (sessionStorage.getItem('session_expired') === '1') {
      sessionStorage.removeItem('session_expired')
      showToast('Session expirée, veuillez vous reconnecter', 'info')
    }
  }, [showToast])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', mdp)

    const response = await fetch("http://localhost:8000/auth/login", {
      method: 'POST',
      headers: { 'Content-type': 'application/x-www-form-urlencoded' },
      body: formData,
    })

    if (response.ok) {
      setLogError('')
      const data: LoginResponse = await response.json()
      localStorage.setItem('token', data.access_token)
      navigate("/home")
    } else {
      setLogError('Identifiants invalides')
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 grid-bg">
      <div className="w-full max-w-[400px]">

        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-5 h-5 hair flex items-center justify-center">
              <span className="material-symbols-outlined text-[12px] text-soft">inventory_2</span>
            </div>
            <span className="text-[13px] font-semibold tracking-tight text-bright">Senso</span>
            <span className="text-[13px] font-mono text-mute">.Drive</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-bright">
            Bon retour
          </h1>
          <p className="text-[12px] text-soft mt-1.5">
            Connectez-vous pour accéder à vos documents.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="hair bg-panel p-6 flex flex-col gap-4"
        >

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[10.5px] font-mono text-mute uppercase tracking-wider"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="souidi.ayoub@supmti.ac.ma"
              autoComplete="off"
              className="hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors placeholder:text-mute"
            />
          </div>

          {/* Mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-[10.5px] font-mono text-mute uppercase tracking-wider"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={mdp}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMdp(e.target.value)}
              placeholder="••••••••••••"
              className="hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors placeholder:text-mute"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full !py-2.5 mt-2"
          >
            Se connecter
          </button>

          {/* Error */}
          {logError && (
            <p className="text-[11.5px] text-[var(--color-danger-raw)] font-mono text-center">
              {logError}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="mt-5 text-center text-[12px] text-soft">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-bright hover:underline">
            Créer un accès
          </Link>
        </div>

      </div>
    </div>
  )
}

export default LoginPage
