import { useState, type FormEvent, type ChangeEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import type { LoginResponse } from "../types"

function RegisterPage() {
  const navigate = useNavigate()
  const [nom, setNom] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [mdp, setMdp] = useState<string>('')
  const [mdp2, setMdp2] = useState<string>('')
  const [regError, setRegError] = useState<string>('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (mdp !== mdp2) {
      setRegError('Les deux mots de passe ne correspondent pas')
      return
    }

    const payload = { email, password: mdp, nom }

    const response = await fetch("http://localhost:8000/auth/register", {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (response.ok) {
      setRegError('')
      localStorage.setItem('token', (data as LoginResponse).access_token)
      navigate("/home")
    } else {
      setRegError(data.detail || 'Erreur lors de la création du compte')
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
            Créer votre accès
          </h1>
          <p className="font-body text-sm text-fg-2 mt-2">
            Configurez votre drive et accédez à vos documents.
          </p>
        </div>

        {/* Carte avec form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface-1 border border-border p-7 space-y-4"
        >

          {/* Champ Nom */}
          <div>
            <label
              htmlFor="nom"
              className="block font-mono text-xs uppercase tracking-wider text-fg-3 mb-1.5"
            >
              Nom
            </label>
            <input
              id="nom"
              type="text"
              value={nom}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNom(e.target.value)}
              placeholder="Votre nom"
              autoComplete="off"
              className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>

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

          {/* Champ Confirmation */}
          <div>
            <label
              htmlFor="password2"
              className="block font-mono text-xs uppercase tracking-wider text-fg-3 mb-1.5"
            >
              Confirmer
            </label>
            <input
              id="password2"
              type="password"
              value={mdp2}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMdp2(e.target.value)}
              placeholder="Retapez votre mot de passe"
              className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>

          {/* Bouton submit */}
          <button
            type="submit"
            className="w-full bg-primary text-fg-inverse font-body font-semibold py-3 text-sm hover:opacity-90 transition-opacity"
          >
            Créer mon compte
          </button>

          {/* Message d'erreur */}
          {regError && (
            <p className="text-danger text-sm font-body text-center">
              {regError}
            </p>
          )}
        </form>

        {/* Footer carte */}
        <div className="mt-6 text-center text-sm font-body text-fg-2">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-fg-1 hover:underline">
            Se connecter
          </Link>
        </div>

      </div>
    </div>
  )
}

export default RegisterPage
