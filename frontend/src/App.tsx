import React from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'

import { config } from './config/wagmi'
import { Header } from './components/layout/Header'
import { Dashboard } from './components/Dashboard'
import { useAccount } from 'wagmi'

const queryClient = new QueryClient()

function AppContent() {
  const { address } = useAccount()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {address ? (
            <Dashboard />
          ) : (
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Green Hydrogen Credits
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Connect your wallet to start trading green hydrogen credits
              </p>
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  About Green Hydrogen Credits
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Our platform enables the transparent tracking and trading of green hydrogen production credits.
                  Producers can register their facilities, track production, and trade credits in a decentralized marketplace.
                  All transactions are recorded on the blockchain for complete transparency and accountability.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#10b981',
            accentColorForeground: 'white',
          })}
        >
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
