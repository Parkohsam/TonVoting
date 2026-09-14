import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bohrTestnet, sepolia, hardhat } from './chains';
import type { AppKitNetwork } from '@reown/appkit/networks';

// Get projectId from environment or use a default fallback
export const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

// Supported networks list
export const networks = [bohrTestnet, sepolia, hardhat] as [AppKitNetwork, ...AppKitNetwork[]];

// Setup Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Initialize Reown AppKit modal
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'TokenVote',
    description: 'Decentralized Token-Based Voting dApp',
    url: 'https://tokenvote.app',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
  },
  themeMode: 'dark',
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});
