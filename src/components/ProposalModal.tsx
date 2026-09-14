import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractAddresses, TOKEN_VOTE_ABI } from '../contracts';
import { X, Plus, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userDevBalance: bigint;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userDevBalance,
}) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationPreset, setDurationPreset] = useState<'5m' | '1h' | '1d' | '3d' | 'custom'>('5m');
  const [customMinutes, setCustomMinutes] = useState('10');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending: isWritePending, error: writeError, reset } = useWriteContract();

  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isTxSuccess) {
      onSuccess();
      setTitle('');
      setDescription('');
      reset();
      onClose();
    }
  }, [isTxSuccess, onSuccess, onClose, reset]);

  if (!isOpen) return null;

  const getDurationInSeconds = (): number => {
    switch (durationPreset) {
      case '5m':
        return 5 * 60; // 300 seconds
      case '1h':
        return 60 * 60; // 3600 seconds
      case '1d':
        return 24 * 60 * 60; // 86400 seconds
      case '3d':
        return 3 * 24 * 60 * 60; // 259200 seconds
      case 'custom':
        return Math.max(60, Number(customMinutes) * 60);
      default:
        return 300;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a proposal title.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a description.');
      return;
    }
    if (userDevBalance < 1n * 10n ** 18n) {
      setErrorMessage('You need at least 1 DEV token to create a proposal. Use the faucet first!');
      return;
    }

    const duration = getDurationInSeconds();

    try {
      writeContract({
        address: contracts.TokenVote,
        abi: TOKEN_VOTE_ABI,
        functionName: 'createProposal',
        args: [title.trim(), description.trim(), BigInt(duration)],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit proposal.');
    }
  };

  const isSubmitting = isWritePending || isTxConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex-shrink-0">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Create New Proposal</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Submit a proposal to be voted on by DEV token holders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4 sm:space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2">
              Proposal Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fund Bohr Ecosystem Developer Grant #1"
              className="w-full px-3.5 sm:px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-xs sm:text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2">
              Description & Details
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background, motivation, and expected outcome for this proposal..."
              className="w-full px-3.5 sm:px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Voting Duration */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 sm:mb-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Voting Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: '5m', label: '5 Mins', note: 'Fast Demo' },
                { id: '1h', label: '1 Hour', note: 'Short Poll' },
                { id: '1d', label: '1 Day', note: 'Daily' },
                { id: '3d', label: '3 Days', note: 'Standard' },
                { id: 'custom', label: 'Custom', note: 'Minutes' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDurationPreset(preset.id as any)}
                  className={`p-2 rounded-xl text-center border transition-all text-xs ${
                    durationPreset === preset.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-[10px] text-slate-500">{preset.note}</div>
                </button>
              ))}
            </div>

            {durationPreset === 'custom' && (
              <div className="mt-3">
                <input
                  type="number"
                  min="1"
                  max="43200"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Enter minutes (min: 1)"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Threshold Notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Creation requires at least <strong>1 DEV</strong> token in your wallet.</span>
          </div>

          {/* Error display */}
          {(errorMessage || writeError) && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage || writeError?.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isConnected}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Chain...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Proposal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
