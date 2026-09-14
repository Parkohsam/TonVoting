import { defineChain } from 'viem';
import { hardhat as hardhatChain, sepolia as sepoliaChain } from 'viem/chains';

export const bohrTestnet = defineChain({
  id: 968,
  name: 'Bohr Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
  },
  blockExplorers: {
    default: { name: 'BohrScan', url: 'https://scan.bohr.life' },
  },
  testnet: true,
});

export const hardhat = hardhatChain;
export const sepolia = sepoliaChain;

export const supportedChains = [bohrTestnet, sepolia, hardhat] as const;
