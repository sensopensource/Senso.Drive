import { useState } from "react"
import React from "react"

function App() {
  const [email,setEmail] = useState('email@exemple.senso')
  const [mdp,setMdp] = useState('mot de passe')
  return(
    <form>
    <label>
      Email 
      <input 
        type="email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
    </label>
    <label>
      Mot de passe
      <input
        type="password"
        value={mdp}
        onChange={(m: React.ChangeEvent<HTMLInputElement>) => setMdp(m.target.value)}
      />
    </label>
    <button type="submit">Se Logger</button>


    <p> 
    Preview:
    <br></br>    email        : {email} <br></br>
                 mot de passe : {mdp}
    </p>
    </form>
  )



  
  

}

export default App