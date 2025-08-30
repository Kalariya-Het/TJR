import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { LeafIcon } from 'lucide-react'
import { cn } from '../../utils'
import { useAccount } from 'wagmi'
import { useIsAdmin, useIsProducer } from '../../hooks/useContracts'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', current: true },
  { name: 'Marketplace', href: '/marketplace', current: false },
  { name: 'Producers', href: '/producers', current: false },
  { name: 'Analytics', href: '/analytics', current: false },
]

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { address } = useAccount()
  const { isAdmin } = useIsAdmin()
  const { isProducer } = useIsProducer()

  // Add conditional navigation items based on user role
  const getNavigationItems = () => {
    let items = [...navigation]
    
    if (isAdmin) {
      items.push({ name: 'Admin', href: '/admin', current: false })
    }
    
    if (isProducer) {
      items.push({ name: 'My Production', href: '/producer', current: false })
    }
    
    return items
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <LeafIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Green Hydrogen Credits
              </span>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {address && getNavigationItems().map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  item.current
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900',
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors'
                )}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Connect button and mobile menu */}
          <div className="flex items-center space-x-4">
            <ConnectButton />
            
            {/* Mobile menu button */}
            {address && (
              <div className="md:hidden">
                <button
                  type="button"
                  className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && address && (
          <div className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {getNavigationItems().map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    item.current
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900',
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
