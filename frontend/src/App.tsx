import React, { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { config } from './config/wagmi'
import { Header } from './components/layout/Header'
import { Navigation } from './components/layout/Navigation'
import { Dashboard } from './components/Dashboard'
import { Marketplace } from './components/Marketplace'
import { Producers } from './components/Producers'
import { ProducerManagement } from './components/ProducerManagement'
import { Analytics } from './components/Analytics'
import { useAccount } from 'wagmi'
import { UserProvider, useUser } from './context/UserContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { Login } from './components/Auth/Login'
import { Register } from './components/Auth/Register'
import { SubmitProductionData } from './components/Producer/SubmitProductionData'
import { ReviewSubmissions } from './components/Verifier/ReviewSubmissions'
import { MyCredits } from './components/User/MyCredits'
import { Notifications } from './components/User/Notifications'
import { UserManagement } from './components/Admin/UserManagement'
import { KycManagement } from './components/Admin/KycManagement'
import { AuditLogs } from './components/Admin/AuditLogs'

const queryClient = new QueryClient()

interface AppContentProps {
  // No onConnectWallet prop needed here anymore
}

function AppContent() {
  const { address } = useAccount()
  const { user, isLoadingUser, token } = useUser()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      case 'marketplace':
        return <Marketplace />
      case 'producers':
        return <Producers />
      case 'producer-management':
        return <ProducerManagement />
      case 'analytics':
        return <Analytics />
      case 'submit-production':
        return <SubmitProductionData />
      case 'review-submissions':
        return <ReviewSubmissions />
      case 'my-credits':
        return <MyCredits />
      case 'notifications':
        return <Notifications />
      case 'user-management':
        return <UserManagement />
      case 'kyc-management':
        return <KycManagement />
      case 'audit-logs':
        return <AuditLogs />
      default:
        return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="ml-3 text-gray-600">Loading user profile...</p>
      </div>
    )
  }

  // If no user is logged in (no token or user object), show the login/register page
  if (!user && !token) {
    if (showRegisterPage) {
      return <Register 
        onRegisterSuccess={() => setShowRegisterPage(false)} 
        onNavigateToLogin={() => setShowRegisterPage(false)} 
      />;
    } else {
      return <Login onNavigateToRegister={() => setShowRegisterPage(true)} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {user && (
        <Navigation
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          userRole={user.role}
        />
      )}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {user ? (
            renderCurrentPage()
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
                <p className="text-gray-600 leading-relaxed mb-4">
                  Our platform enables the transparent tracking and trading of green hydrogen production credits.
                  Producers can register their facilities, track production, and trade credits in a decentralized marketplace.
                  All transactions are recorded on the blockchain for complete transparency and accountability.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">🌱</div>
                    <h3 className="font-medium text-green-900">Sustainable</h3>
                    <p className="text-sm text-green-700">Track renewable energy sources</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">🔗</div>
                    <h3 className="font-medium text-blue-900">Transparent</h3>
                    <p className="text-sm text-blue-700">Blockchain-based verification</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">💱</div>
                    <h3 className="font-medium text-purple-900">Tradeable</h3>
                    <p className="text-sm text-purple-700">Decentralized marketplace</p>
                  </div>
                </div>
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
        <UserProvider>
          <AppContent />
        </UserProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
