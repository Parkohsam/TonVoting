import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { bohrTestnet } from '../config/chains';
import { Vote, ExternalLink, Globe } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isBohr = chainId === bohrTestnet.id;
  const isHardhat = chainId === 31337;
  const isCorrectNetwork = isBohr || isHardhat;

  const handleAddBohrNetwork = async () => {
    const eth = (window as any).ethereum;
    if (eth?.request) {
      try {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${bohrTestnet.id.toString(16)}`,
              chainName: bohrTestnet.name,
              nativeCurrency: bohrTestnet.nativeCurrency,
              rpcUrls: bohrTestnet.rpcUrls.default.http,
              blockExplorerUrls: [bohrTestnet.blockExplorers.default.url],
            },
          ],
        });
      } catch (err) {
        console.error('Failed to add Bohr network:', err);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full pt-4 pb-2 px-4 sm:px-6 lg:px-8 bg-slate-950/70 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-6 py-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/30 flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-400 p-[2px] shadow-lg shadow-indigo-500/25 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Vote className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                TokenVote
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Governance
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              Token-Weighted On-Chain Governance
            </p>
          </div>
        </div>

        {/* Right: Network status & Wallet Connect */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Bohr Network Quick Add Helper */}
          {!isBohr && (
            <button
              onClick={handleAddBohrNetwork}
              title="Add Bohr Testnet (Chain ID 968) to MetaMask"
              className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Bohr Testnet</span>
            </button>
          )}

          {/* Network Indicator Pill */}
          {isConnected && (
            <div className="flex items-center">
              {isCorrectNetwork ? (
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-medium shadow-inner">
                  <span className={`w-2 h-2 rounded-full ${isBohr ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-slate-300 font-mono text-[11px] sm:text-xs">
                    {isBohr ? 'Bohr Testnet (968)' : 'Local Hardhat'}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => switchChain({ chainId: bohrTestnet.id })}
                  className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3.5 py-2 rounded-xl hover:bg-rose-500/20 transition-all font-medium animate-pulse"
                >
                  <Globe className="w-3.5 h-3.5 text-rose-400" />
                  Switch to Bohr
                </button>
              )}
            </div>
          )}

          {/* Wallet Connect Button via Reown AppKit */}
          <div className="flex-shrink-0">
            <appkit-button />
          </div>
        </div>
      </div>
    </header>
  );
};
