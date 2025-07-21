import type { NextApiRequest, NextApiResponse } from 'next'
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
]

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ALCHEMY_RPC_URL!),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { address, tokenAddress, date } = req.query as Record<string, string>
    if (!address || !tokenAddress || !date) {
      return res
        .status(400)
        .json({ error: 'address, tokenAddress and date are required' })
    }

    const ts = Math.floor(new Date(date).getTime() / 1000)
    if (isNaN(ts)) throw new Error('Invalid date')

    const blockHex: string = await (client as any).request({
      method: 'alchemy_getBlockByTimestamp',
      params: [ts, 'before'],
    })
    const blockNumber = BigInt(blockHex)

    const [rawBalance, decimals] = await Promise.all([
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
    ])

    // 4️⃣ format
    const formatted = formatUnits(rawBalance, decimals)

    return res.status(200).json({
      blockNumber,
      rawBalance: rawBalance.toString(),
      decimals,
      balance: formatted,
    })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'internal error' })
  }
}
