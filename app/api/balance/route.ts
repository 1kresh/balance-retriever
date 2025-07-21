import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { formatUnits } from 'viem'

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'who', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'string' }],
  },
]

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ALCHEMY_RPC_URL!),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const tokenAddress = searchParams.get('tokenAddress')
    const date = searchParams.get('date')

    if (!address || !tokenAddress || !date) {
      return NextResponse.json(
        { error: 'address, tokenAddress and date are required' },
        { status: 400 }
      )
    }

    const ts = Math.floor(new Date(date).getTime() / 1000)
    if (isNaN(ts)) throw new Error('Invalid date')

    // Get the latest block number first
    const latestBlock = await client.getBlockNumber()

    // Binary search to find the closest block by timestamp
    let left = BigInt(0)
    let right = latestBlock
    let blockNumber = right

    while (left <= right) {
      const mid = (left + right) / BigInt(2)
      const block = await client.getBlock({ blockNumber: mid })

      if (!block) {
        right = mid - BigInt(1)
        continue
      }

      if (Number(block.timestamp) === ts) {
        blockNumber = mid
        break
      } else if (Number(block.timestamp) < ts) {
        left = mid + BigInt(1)
        blockNumber = mid
      } else {
        right = mid - BigInt(1)
      }
    }

    const [rawBalance, decimals, symbol] = await Promise.all([
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        blockNumber,
      }) as Promise<bigint>,
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
        blockNumber,
      }) as Promise<number>,
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
        blockNumber,
      }) as Promise<string>,
    ])

    // 4️⃣ format
    const formatted = formatUnits(rawBalance, decimals)

    return NextResponse.json({
      blockNumber: blockNumber.toString(),
      rawBalance: rawBalance.toString(),
      decimals,
      symbol,
      balance: formatted,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'internal error' },
      { status: 500 }
    )
  }
}
