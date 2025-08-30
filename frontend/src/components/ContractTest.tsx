import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { HYDROGEN_CREDIT_ABI, getContractAddresses } from '../config/contracts';

export const ContractTest: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Get contract addresses
  const contractAddresses = getContractAddresses(chainId);

  // Test basic contract reads
  const { data: tokenName, error: nameError } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'name',
  });

  const { data: tokenSymbol, error: symbolError } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'symbol',
  });

  const { data: totalSupply, error: supplyError } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'totalSupply',
  });

  const { data: contractStats, error: statsError } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'getContractStats',
  });

  const { data: userBalance, error: balanceError } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    console.log('🔧 ContractTest Debug:', {
      isConnected,
      address,
      chainId,
      contractAddresses,
      tokenName,
      tokenSymbol,
      totalSupply: totalSupply ? totalSupply.toString() : 'undefined',
      contractStats: contractStats ? contractStats.map(s => s.toString()) : 'undefined',
      userBalance: userBalance ? userBalance.toString() : 'undefined',
      errors: {
        nameError: nameError?.message,
        symbolError: symbolError?.message,
        supplyError: supplyError?.message,
        statsError: statsError?.message,
        balanceError: balanceError?.message,
      }
    });

    setDebugInfo({
      isConnected,
      address,
      chainId,
      contractAddresses: contractAddresses,
      tokenName,
      tokenSymbol,
      totalSupply: totalSupply?.toString(),
      contractStats: contractStats?.map(s => s.toString()),
      userBalance: userBalance?.toString(),
      errors: {
        nameError: nameError?.message,
        symbolError: symbolError?.message,
        supplyError: supplyError?.message,
        statsError: statsError?.message,
        balanceError: balanceError?.message,
      }
    });
  }, [isConnected, address, chainId, tokenName, tokenSymbol, totalSupply, contractStats, userBalance, nameError, symbolError, supplyError, statsError, balanceError]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Contract Connection Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Connection Status</h3>
          <div className="space-y-1 text-sm">
            <div>Connected: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>{isConnected ? 'Yes' : 'No'}</span></div>
            <div>Address: <span className="font-mono text-xs">{address || 'Not connected'}</span></div>
            <div>Chain ID: <span className="font-semibold">{chainId}</span></div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Contract Addresses</h3>
          <div className="space-y-1 text-sm">
            <div>Credit: <span className="font-mono text-xs">{contractAddresses.hydrogenCredit}</span></div>
            <div>Marketplace: <span className="font-mono text-xs">{contractAddresses.marketplace}</span></div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Token Info</h3>
          <div className="space-y-1 text-sm">
            <div>Name: <span className={tokenName ? 'text-green-600' : 'text-red-600'}>{tokenName || 'Failed to load'}</span></div>
            <div>Symbol: <span className={tokenSymbol ? 'text-green-600' : 'text-red-600'}>{tokenSymbol || 'Failed to load'}</span></div>
            <div>Total Supply: <span className={totalSupply ? 'text-green-600' : 'text-red-600'}>{totalSupply ? (Number(totalSupply) / 1e18).toFixed(1) : 'Failed to load'}</span></div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Contract Stats</h3>
          {contractStats ? (
            <div className="space-y-1 text-sm">
              <div>Total Supply: <span className="text-green-600">{(Number(contractStats[0]) / 1e18).toFixed(1)} GHC</span></div>
              <div>Total Batches: <span className="text-green-600">{contractStats[1].toString()}</span></div>
              <div>Total Retired: <span className="text-green-600">{(Number(contractStats[2]) / 1e18).toFixed(1)} GHC</span></div>
              <div>Producers: <span className="text-green-600">{contractStats[3].toString()}</span></div>
            </div>
          ) : (
            <div className="text-red-600 text-sm">Failed to load contract stats</div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded md:col-span-2">
          <h3 className="font-semibold text-lg mb-2">User Balance</h3>
          <div className="text-sm">
            Balance: <span className={userBalance ? 'text-green-600 text-lg font-semibold' : 'text-red-600'}>{userBalance ? (Number(userBalance) / 1e18).toFixed(1) + ' GHC' : 'Failed to load or 0'}</span>
          </div>
        </div>

        {(nameError || symbolError || supplyError || statsError || balanceError) && (
          <div className="bg-red-50 p-4 rounded md:col-span-2">
            <h3 className="font-semibold text-lg mb-2 text-red-800">Errors</h3>
            <div className="space-y-1 text-sm text-red-700">
              {nameError && <div>Name Error: {nameError.message}</div>}
              {symbolError && <div>Symbol Error: {symbolError.message}</div>}
              {supplyError && <div>Supply Error: {supplyError.message}</div>}
              {statsError && <div>Stats Error: {statsError.message}</div>}
              {balanceError && <div>Balance Error: {balanceError.message}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 bg-blue-50 p-4 rounded">
        <h3 className="font-semibold text-lg mb-2">Debug JSON</h3>
        <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};
