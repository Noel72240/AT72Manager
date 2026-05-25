import { HashRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/router'
import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { StartupGate } from '@/components/startup'

export default function App() {
  return (
    <AppProviders>
      <HashRouter>
        <StartupGate>
          <AppRouter />
        </StartupGate>
        <CommandPalette />
      </HashRouter>
    </AppProviders>
  )
}
