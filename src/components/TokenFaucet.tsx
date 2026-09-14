import React, { useState } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses, DEV_TOKEN_ABI } from '../contracts';
import { Coins, Flame, Sparkles, PlusCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const TokenFaucet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);

  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  // Read DEV Balance
  const { data: balance, refetch: refetchBalance, isLoading: isBalanceLoading } = useReadContract({
    address: contracts.DevToken,
    abi: DEV_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && contracts.DevToken),
      refetchInterval: 5000,
    },
  });

  // Write Faucet Contract Call
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();

  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  React.useEffect(() => {
    if (isTxSuccess) {
      refetchBalance();
      setClaimStatus('Successfully claimed 100 DEV tokens!');
      const timer = setTimeout(() => setClaimStatus(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [isTxSuccess, refetchBalance]);

  const handleClaimFaucet = async () => {
    if (!isConnected) return;
    setClaimStatus(null);
    try {
      writeContract({
        address: contracts.DevToken,
        abi: DEV_TOKEN_ABI,
        functionName: 'faucet',
      });
    } catch (err: any) {
      console.error('Faucet claim error:', err);
    }
  };

  const handleAddTokenToMetaMask = async () => {
    const eth = (window as any).ethereum;
    if (eth?.request && contracts.DevToken) {
      try {
        await eth.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: contracts.DevToken,
              symbol: 'DEV',
              decimals: 18,
              image: 'https://cdn-icons-png.flaticon.com/512/2592/2592230.png',
            },
          },
        });
      } catch (error) {
        console.error('Error adding token to wallet:', error);
      }
    }
  };

  const formattedBalance = balance !== undefined ? Number(formatEther(balance as bigint)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00';

  if (!isConnected) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Welcome to TokenVote On-Chain Governance
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Decentralized Governance Powered by DEV Tokens
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connect your MetaMask wallet to claim free test DEV tokens, create community proposals, and cast token-weighted votes on Bohr Testnet.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> 1 DEV = 1 Vote
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Free Testnet Faucet
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Bohr Testnet (Chain 968)
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 pt-2 lg:pt-0">
            <appkit-button />
          </div>
        </div>
      </div>
    );
  }

  const isClaiming = isWritePending || isTxConfirming;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl p-6">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left: User Balance & Voting Weight */}
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Coins className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Your Governance Balance
              </span>
              <button
                onClick={handleAddTokenToMetaMask}
                title="Add DEV to MetaMask"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <PlusCircle className="w-3 h-3" />
                Add to MetaMask
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {isBalanceLoading ? '...' : formattedBalance}
              </span>
              <span className="text-sm font-bold text-indigo-400">DEV</span>
              <span className="text-xs text-slate-500 ml-1">
                (= {formattedBalance} Voting Power)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Test Faucet Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleClaimFaucet}
            disabled={isClaiming}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Claiming DEV...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Claim 100 Test DEV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {claimStatus && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{claimStatus}</span>
        </div>
      )}

      {/* Error Notification */}
      {writeError && (
        <div className="mt-4 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>
            {writeError.message.includes('cooldown')
              ? 'Faucet cooldown is active. Please wait 1 minute before claiming again.'
              : writeError.message.slice(0, 120)}
          </span>
        </div>
      )}
    </div>
  );
};
