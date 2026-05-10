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
      body: JSON.stringify(payload),
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
    <div className="min-h-screen bg-ink flex items-center justify-center px-4 py-8 grid-bg">
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
            Créer votre accès
          </h1>
          <p className="text-[12px] text-soft mt-1.5">
            Configurez votre drive et accédez à vos documents.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="hair bg-panel p-6 flex flex-col gap-4"
        >

          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nom"
              className="text-[10.5px] font-mono text-mute uppercase tracking-wider"
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
              className="hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors placeholder:text-mute"
            />
          </div>

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

          {/* Confirmation */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password2"
              className="text-[10.5px] font-mono text-mute uppercase tracking-wider"
            >
              Confirmer
            </label>
            <input
              id="password2"
              type="password"
              value={mdp2}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMdp2(e.target.value)}
              placeholder="Retapez votre mot de passe"
              className="hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors placeholder:text-mute"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full !py-2.5 mt-2"
          >
            Créer mon compte
          </button>

          {/* Error */}
          {regError && (
            <p className="text-[11.5px] text-[var(--color-danger-raw)] font-mono text-center">
              {regError}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="mt-5 text-center text-[12px] text-soft">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-bright hover:underline">
            Se connecter
          </Link>
        </div>

      </div>
    </div>
  )
}

export default RegisterPage
