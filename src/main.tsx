import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PrivyProvider } from '@privy-io/react-auth'
import { ThemeProvider } from './components/theme-provider.tsx'
import './lib/i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || "cm5nt75jf02tlmw1hh80dzqmh"}
      config={{
        loginMethods: ['email'],  // Only email for now - add 'twitter', 'discord' after configuring in Privy dashboard
        appearance: {
          theme: 'light',
          accentColor: '#8B5CF6',
        },
      }}
    >
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </PrivyProvider>
  </React.StrictMode>,
)
