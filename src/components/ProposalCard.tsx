import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddresses, TOKEN_VOTE_ABI } from '../contracts';
import { Clock, User, CheckCircle, XCircle, MinusCircle, Check, Copy, Vote } from 'lucide-react';

export interface ProposalData {
  id: bigint;
  title: string;
  description: string;
  proposer: string;
  startTime: bigint;
  endTime: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  totalVoters: bigint;
}

interface ProposalCardProps {
  proposal: ProposalData;
  status: number; // 0: Active, 1: Passed, 2: Rejected, 3: Tied
  onOpenVote: (proposalId: number, title: string) => void;
  onRefresh: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  status,
  onOpenVote,
}) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  const proposalIdNum = Number(proposal.id);

  // Check if current user voted
  const { data: receiptData } = useReadContract({
    address: contracts.TokenVote,
    abi: TOKEN_VOTE_ABI,
    functionName: 'getVoterReceipt',
    args: address ? [BigInt(proposalIdNum), address] : undefined,
    query: {
      enabled: Boolean(address && contracts.TokenVote),
      refetchInterval: 5000,
    },
  });

  const hasVoted = receiptData ? (receiptData as [boolean, number, bigint])[0] : false;
  const userVoteType = receiptData ? (receiptData as [boolean, number, bigint])[1] : 0;
  const userWeight = receiptData ? (receiptData as [boolean, number, bigint])[2] : 0n;

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const end = Number(proposal.endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Ended');
        setIsExpired(true);
      } else {
        setIsExpired(false);
        const days = Math.floor(diff / (24 * 3600));
        const hours = Math.floor((diff % (24 * 3600)) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h left`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m left`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s left`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [proposal.endTime]);

  const copyProposer = () => {
    navigator.clipboard.writeText(proposal.proposer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate vote percentages
  const forNum = Number(formatEther(proposal.forVotes));
  const againstNum = Number(formatEther(proposal.againstVotes));
  const abstainNum = Number(formatEther(proposal.abstainVotes));
  const totalVotesNum = forNum + againstNum + abstainNum;

  const forPct = totalVotesNum > 0 ? ((forNum / totalVotesNum) * 100).toFixed(1) : '0';
  const againstPct = totalVotesNum > 0 ? ((againstNum / totalVotesNum) * 100).toFixed(1) : '0';
  const abstainPct = totalVotesNum > 0 ? ((abstainNum / totalVotesNum) * 100).toFixed(1) : '0';

  const isActive = status === 0 && !isExpired;

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 transition-all p-4 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Top bar: ID, Status, Deadline */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              #{proposalIdNum}
            </span>
            {/* Status Badge */}
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            ) : status === 1 ? (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                Passed
              </span>
            ) : status === 2 ? (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-3.5 h-3.5" />
                Rejected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <MinusCircle className="w-3.5 h-3.5" />
                Tied
              </span>
            )}
          </div>

          {/* Time Remaining */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className={isActive ? 'text-amber-300 font-medium' : 'text-slate-500'}>
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Proposal Title */}
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug line-clamp-2">
          {proposal.title}
        </h3>

        {/* Proposer details */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 text-[11px] sm:text-xs text-slate-400">
          <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span>By:</span>
          <button
            onClick={copyProposer}
            className="font-mono text-slate-300 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            title="Click to copy proposer address"
          >
            {`${proposal.proposer.slice(0, 6)}...${proposal.proposer.slice(-4)}`}
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
          </button>
        </div>

        {/* Description */}
        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-slate-300/90 line-clamp-3 leading-relaxed">
          {proposal.description}
        </p>

        {/* Vote Results Progress Bar */}
        <div className="mt-4 sm:mt-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-medium">
            <span>Results ({proposal.totalVoters.toString()} Voters)</span>
            <span>{totalVotesNum.toLocaleString()} DEV Total</span>
          </div>

          <div className="h-2 sm:h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${forPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`For: ${forPct}%`}
            />
            <div
              style={{ width: `${againstPct}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`Against: ${againstPct}%`}
            />
            <div
              style={{ width: `${abstainPct}%` }}
              className="bg-amber-500/80 h-full transition-all duration-500"
              title={`Abstain: ${abstainPct}%`}
            />
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1 text-[11px] sm:text-xs">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-1.5 sm:p-2 text-center">
              <div className="text-emerald-400 font-bold text-xs sm:text-sm">{forPct}%</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">For ({forNum.toFixed(0)})</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-1.5 sm:p-2 text-center">
              <div className="text-rose-400 font-bold text-xs sm:text-sm">{againstPct}%</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">Against ({againstNum.toFixed(0)})</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-1.5 sm:p-2 text-center">
              <div className="text-amber-400 font-bold text-xs sm:text-sm">{abstainPct}%</div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">Abstain ({abstainNum.toFixed(0)})</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / User Voting Action */}
      <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {hasVoted ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">You voted:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] sm:text-xs ${
                userVoteType === 1
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : userVoteType === 0
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {userVoteType === 1 ? 'FOR' : userVoteType === 0 ? 'AGAINST' : 'ABSTAIN'} ({Number(formatEther(userWeight)).toFixed(0)} DEV)
            </span>
          </div>
        ) : isActive ? (
          <div className="text-[11px] sm:text-xs text-slate-400">
            Voting open to all DEV holders
          </div>
        ) : (
          <div className="text-[11px] sm:text-xs text-slate-500">
            Voting session closed
          </div>
        )}

        {/* Action Button */}
        {isActive && !hasVoted && (
          <button
            onClick={() => onOpenVote(proposalIdNum, proposal.title)}
            disabled={!isConnected}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Vote className="w-3.5 h-3.5" />
            <span>Vote Now</span>
          </button>
        )}
      </div>
    </div>
  );
};
