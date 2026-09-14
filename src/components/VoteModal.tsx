import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses, TOKEN_VOTE_ABI } from '../contracts';
import { X, CheckCircle2, XCircle, MinusCircle, AlertCircle, Loader2, Award } from 'lucide-react';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proposalId: number;
  proposalTitle: string;
  userDevBalance: bigint;
}

export const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  proposalId,
  proposalTitle,
  userDevBalance,
}) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);

  // 0 = Against, 1 = For, 2 = Abstain
  const [selectedVote, setSelectedVote] = useState<0 | 1 | 2 | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending: isWritePending, error: writeError, reset } = useWriteContract();

  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isTxSuccess) {
      onSuccess();
      setSelectedVote(null);
      reset();
      onClose();
    }
  }, [isTxSuccess, onSuccess, onClose, reset]);

  if (!isOpen) return null;

  const handleVoteSubmit = () => {
    setErrorMessage(null);

    if (selectedVote === null) {
      setErrorMessage('Please select a voting option (For, Against, or Abstain).');
      return;
    }

    if (userDevBalance <= 0n) {
      setErrorMessage('You do not hold any DEV tokens to vote with. Use the faucet first!');
      return;
    }

    try {
      writeContract({
        address: contracts.TokenVote,
        abi: TOKEN_VOTE_ABI,
        functionName: 'castVote',
        args: [BigInt(proposalId), selectedVote],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit vote.');
    }
  };

  const isSubmitting = isWritePending || isTxConfirming;
  const formattedWeight = Number(formatEther(userDevBalance)).toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Proposal #{proposalId}
            </div>
            <h3 className="text-xl font-bold text-white mt-0.5 line-clamp-1">
              Cast Your Vote
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Proposal Title Preview */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <p className="text-xs text-slate-400">Voting on:</p>
          <p className="text-sm font-semibold text-slate-200 mt-1">{proposalTitle}</p>
        </div>

        {/* Voting Power */}
        <div className="mt-4 flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300">Your Voting Power:</span>
          </div>
          <div className="font-bold text-indigo-300">
            {formattedWeight} DEV ({formattedWeight} Votes)
          </div>
        </div>

        {/* Vote Choices */}
        <div className="mt-5 space-y-3">
          {/* Option 1: FOR */}
          <button
            type="button"
            onClick={() => setSelectedVote(1)}
            disabled={isSubmitting}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
              selectedVote === 1
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-5 h-5 ${selectedVote === 1 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-bold text-sm">Vote FOR</div>
                <div className="text-xs text-slate-400">Support this proposal and its implementation</div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              For
            </span>
          </button>

          {/* Option 0: AGAINST */}
          <button
            type="button"
            onClick={() => setSelectedVote(0)}
            disabled={isSubmitting}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
              selectedVote === 0
                ? 'border-rose-500 bg-rose-500/15 text-rose-300 shadow-md shadow-rose-500/10'
                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <XCircle className={`w-5 h-5 ${selectedVote === 0 ? 'text-rose-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-bold text-sm">Vote AGAINST</div>
                <div className="text-xs text-slate-400">Oppose and reject this proposal</div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Against
            </span>
          </button>

          {/* Option 2: ABSTAIN */}
          <button
            type="button"
            onClick={() => setSelectedVote(2)}
            disabled={isSubmitting}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
              selectedVote === 2
                ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-500/10'
                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <MinusCircle className={`w-5 h-5 ${selectedVote === 2 ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-bold text-sm">ABSTAIN</div>
                <div className="text-xs text-slate-400">Participate in quorum without taking a side</div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Abstain
            </span>
          </button>
        </div>

        {/* Error Notification */}
        {(errorMessage || writeError) && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>
              {writeError?.message?.includes('Already voted')
                ? 'You have already voted on this proposal.'
                : errorMessage || writeError?.message}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVoteSubmit}
            disabled={isSubmitting || selectedVote === null || !isConnected}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming on Chain...</span>
              </>
            ) : (
              <span>Submit Vote</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
