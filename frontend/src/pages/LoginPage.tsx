import { useState, type FormEvent, type ChangeEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import type { LoginResponse } from "../types"


function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')
  const [mdp, setMdp] = useState<string>('')
  const [logError, setLogError] = useState<string>('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', mdp)

    const response = await fetch("http://localhost:8000/auth/login", {
      method: 'POST',
      headers: {'Content-type': 'application/x-www-form-urlencoded'},
      body: formData
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
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Wordmark + titre + sous-titre */}
        <div className="mb-8 text-center">
          <div className="font-mono text-xs uppercase tracking-wider text-fg-3 mb-3">
            SENSO.DRIVE
          </div>
          <h1 className="font-display text-3xl font-semibold text-fg-1">
            Bon retour
          </h1>
          <p className="font-body text-sm text-fg-2 mt-2">
            Connectez-vous pour accéder à vos documents.
          </p>
        </div>

        {/* Carte avec form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface-1 border border-border p-7 space-y-4"
        >

          {/* Champ Email */}
          <div>
            <label
              htmlFor="email"
              className="block font-mono text-xs uppercase tracking-wider text-fg-3 mb-1.5"
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
              className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block font-mono text-xs uppercase tracking-wider text-fg-3 mb-1.5"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={mdp}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMdp(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>

          {/* Bouton submit */}
          <button
            type="submit"
            className="w-full bg-primary text-fg-inverse font-body font-semibold py-3 text-sm hover:opacity-90 transition-opacity"
          >
            Se connecter
          </button>

          {/* Message d'erreur */}
          {logError && (
            <p className="text-danger text-sm font-body text-center">
              {logError}
            </p>
          )}
        </form>

        {/* Footer carte */}
        <div className="mt-6 text-center text-sm font-body text-fg-2">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-fg-1 hover:underline">
            Créer un accès
          </Link>
        </div>

      </div>
    </div>
  )
}

export default LoginPage
