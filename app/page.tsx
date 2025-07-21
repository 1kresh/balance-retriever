'use client'
import { useState } from 'react'

type Result = {
  blockNumber: number
  rawBalance: string
  decimals: number
  symbol: string
  balance: string
}

export default function Home() {
  const [address, setAddress] = useState('')
  const [date, setDate] = useState('')
  const [tokenAddress, setTokenAddress] = useState(
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC
  )
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchBalance = async () => {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const qs = new URLSearchParams({ address, tokenAddress, date })
      const res = await fetch(`/api/balance?${qs}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'API error')
      setResult(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4'>
      <main className='max-w-2xl mx-auto'>
        <div className='bg-white rounded-2xl shadow-xl p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Historical ERC-20 Balance
            </h1>
            <p className='text-gray-600'>
              Query token balances at any point in time
            </p>
          </div>

          <div className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Wallet Address
              </label>
              <input
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder='0x...'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Date
              </label>
              <input
                type='date'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900'
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Token Address
              </label>
              <input
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500'
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder='0x...'
              />
            </div>

            <button
              onClick={fetchBalance}
              disabled={loading || !address || !date || !tokenAddress}
              className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed'
            >
              {loading ? (
                <div className='flex items-center justify-center'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                  Fetching...
                </div>
              ) : (
                'Get Balance'
              )}
            </button>
          </div>

          {error && (
            <div className='mt-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-700 text-sm'>{error}</p>
            </div>
          )}

          {result && (
            <div className='mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Results
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='bg-white p-4 rounded-lg border border-gray-200'>
                  <p className='text-sm text-gray-600 mb-1'>Block Number</p>
                  <p className='font-mono text-lg font-semibold text-gray-900'>
                    {result.blockNumber}
                  </p>
                </div>
                <div className='bg-white p-4 rounded-lg border border-gray-200'>
                  <p className='text-sm text-gray-600 mb-1'>Token Symbol</p>
                  <p className='font-mono text-lg font-semibold text-blue-600'>
                    {result.symbol}
                  </p>
                </div>
                <div className='bg-white p-4 rounded-lg border border-gray-200'>
                  <p className='text-sm text-gray-600 mb-1'>Decimals</p>
                  <p className='font-mono text-lg font-semibold text-gray-900'>
                    {result.decimals}
                  </p>
                </div>
                <div className='bg-white p-4 rounded-lg border border-gray-200'>
                  <p className='text-sm text-gray-600 mb-1'>Raw Balance</p>
                  <p className='font-mono text-sm text-gray-900 break-all'>
                    {result.rawBalance}
                  </p>
                </div>
                <div className='bg-white p-4 rounded-lg border border-gray-200 md:col-span-2'>
                  <p className='text-sm text-gray-600 mb-1'>
                    Formatted Balance
                  </p>
                  <p className='font-mono text-lg font-semibold text-green-600'>
                    {result.balance} {result.symbol}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
