import { type ReactNode } from "react"
import TopBar from "./TopBar"
import AppSidebar from "./AppSidebar"

type Props = {
  children: ReactNode
}

function AppShell({ children }: Props) {
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col noise">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-hidden flex flex-col grid-bg">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
