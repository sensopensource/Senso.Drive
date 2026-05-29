import AppShell from "../components/AppShell"
import SubBar from "../components/SubBar"
import HeroSlavy from "../components/dashboard/HeroSlavy"
import IdeesSlavy from "../components/dashboard/IdeesSlavy"
import AjoutesRecemment from "../components/dashboard/AjoutesRecemment"
import MesDocumentsTypes from "../components/dashboard/MesDocumentsTypes"
import StockageCard from "../components/dashboard/StockageCard"

function HomePage() {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-0">
        <SubBar>
          <div className="font-mono text-[11px] text-mute">accueil · <b className="text-bright font-medium">tableau de bord</b></div>
        </SubBar>

        <div className="flex-1 overflow-y-auto px-7 py-7">
          <HeroSlavy />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <IdeesSlavy />
            <AjoutesRecemment />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
            <MesDocumentsTypes />
            <StockageCard />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default HomePage
