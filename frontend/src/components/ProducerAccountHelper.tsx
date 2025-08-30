import React, { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { Card } from './ui/Card'

export const ProducerAccountHelper: React.FC = () => {
  const { address } = useAccount()
  const chainId = useChainId()
  const [showPrivateKeys, setShowPrivateKeys] = useState(false)

  const testAccounts = [
    {
      name: 'Owner (Contract Admin)',
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      role: 'Contract Owner',
      credits: '0 GHC'
    },
    {
      name: 'Producer 1 (Solar)',
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      role: 'Solar Plant Producer',
      credits: '5000 GHC'
    },
    {
      name: 'Producer 2 (Wind)',
      address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      role: 'Wind Plant Producer',
      credits: '4800 GHC'
    },
    {
      name: 'Buyer 1',
      address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
      role: 'Credit Buyer',
      credits: '0 GHC'
    }
  ]

  const isCorrectNetwork = chainId === 1337
  const connectedAccount = testAccounts.find(acc => acc.address.toLowerCase() === address?.toLowerCase())

  return (
    <Card title="🧪 Test Account Helper">
      <div className="space-y-4">
        {/* Network Status */}
        <div className={`p-3 rounded-lg ${isCorrectNetwork ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isCorrectNetwork ? 'text-green-800' : 'text-red-800'}`}>
              Network: {isCorrectNetwork ? 'Hardhat Local (1337) ✓' : `Wrong Network (${chainId})`}
            </span>
          </div>
          {!isCorrectNetwork && (
            <p className="text-red-700 text-xs mt-1">
              Please switch to Hardhat Local network (Chain ID: 1337) in MetaMask
            </p>
          )}
        </div>

        {/* Connected Account Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Connected Account</h3>
          <p className="text-xs font-mono text-gray-600 break-all mb-2">{address || 'No wallet connected'}</p>
          {connectedAccount ? (
            <div className="text-sm">
              <span className="text-green-600 font-medium">✓ {connectedAccount.name}</span>
              <div className="text-gray-600 text-xs">
                Role: {connectedAccount.role} | Balance: {connectedAccount.credits}
              </div>
            </div>
          ) : address ? (
            <div className="text-orange-600 text-sm">
              ⚠️ This account is not a registered test producer
            </div>
          ) : null}
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">How to See Producer Credits</h3>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Make sure you're connected to Hardhat Local network (Chain ID: 1337)</li>
            <li>Import a producer account using the private key below</li>
            <li>Refresh the page to see updated balances</li>
          </ol>
        </div>

        {/* Account List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-800">Test Accounts</h3>
            <button
              onClick={() => setShowPrivateKeys(!showPrivateKeys)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showPrivateKeys ? 'Hide' : 'Show'} Private Keys
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testAccounts.map((account, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-800">{account.name}</span>
                  <span className="text-xs text-gray-600">{account.credits}</span>
                </div>
                <div className="text-xs font-mono text-gray-600 break-all mb-1">
                  {account.address}
                </div>
                {showPrivateKeys && (
                  <div className="text-xs font-mono text-red-600 break-all bg-red-50 p-1 rounded">
                    {account.privateKey}
                  </div>
                )}
                <div className="text-xs text-gray-500">{account.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MetaMask Instructions */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">MetaMask Setup Instructions</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p><strong>1. Add Hardhat Network:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Network Name: Hardhat</li>
              <li>• RPC URL: http://127.0.0.1:8545</li>
              <li>• Chain ID: 1337</li>
              <li>• Currency Symbol: ETH</li>
            </ul>
            <p><strong>2. Import Account:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Click "Import Account" in MetaMask</li>
              <li>• Paste a private key from above</li>
              <li>• Switch to the imported account</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )
}
