import deployedData from './deployed.json';

export const CONTRACT_ADDRESSES: Record<number, { DevToken: `0x${string}`; TokenVote: `0x${string}` }> = {
  // BotChain Mainnet (Chain ID 677) - PRIMARY MAINNET
  677: {
    DevToken: (import.meta.env.VITE_DEV_TOKEN_ADDRESS as `0x${string}`) || (deployedData.contracts.DevToken?.address as `0x${string}`),
    TokenVote: (import.meta.env.VITE_TOKEN_VOTE_ADDRESS as `0x${string}`) || (deployedData.contracts.TokenVote?.address as `0x${string}`),
  },
  // Local Hardhat
  31337: {
    DevToken: (deployedData.contracts.DevToken?.address as `0x${string}`) || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    TokenVote: (deployedData.contracts.TokenVote?.address as `0x${string}`) || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  // Bohr Testnet (Chain ID 968)
  968: {
    DevToken: (import.meta.env.VITE_DEV_TOKEN_ADDRESS as `0x${string}`) || (deployedData.contracts.DevToken?.address as `0x${string}`),
    TokenVote: (import.meta.env.VITE_TOKEN_VOTE_ADDRESS as `0x${string}`) || (deployedData.contracts.TokenVote?.address as `0x${string}`),
  },
};

export const DEV_TOKEN_ABI = deployedData.contracts.DevToken.abi;
export const TOKEN_VOTE_ABI = deployedData.contracts.TokenVote.abi;

export function getContractAddresses(chainId?: number) {
  if (chainId && CONTRACT_ADDRESSES[chainId]) {
    return CONTRACT_ADDRESSES[chainId];
  }
  // Default to BotChain Mainnet (677) if available
  return CONTRACT_ADDRESSES[677] || CONTRACT_ADDRESSES[968] || CONTRACT_ADDRESSES[31337];
}
