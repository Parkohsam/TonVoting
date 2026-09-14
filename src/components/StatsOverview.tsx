import React from 'react';
import type { ProposalData } from './ProposalCard';
import { Vote, CheckCircle, Clock, Network } from 'lucide-react';

interface StatsOverviewProps {
  proposals: ProposalData[];
  statuses: number[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  proposals,
  statuses,
}) => {
  const totalProposals = proposals.length;
  const activeProposals = statuses.filter((s) => s === 0).length;
  const passedProposals = statuses.filter((s) => s === 1).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Stat 1: Total Proposals */}
      <div className="rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">Total Ballots</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-indigo-500/10 text-indigo-400">
            <Vote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-extrabold text-white">{totalProposals}</div>
        <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Submitted on-chain</div>
      </div>

      {/* Stat 2: Active Proposals */}
      <div className="rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">Active</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-400">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-extrabold text-emerald-400">{activeProposals}</div>
        <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Open for voting</div>
      </div>

      {/* Stat 3: Passed */}
      <div className="rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">Passed</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-400">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-extrabold text-blue-400">{passedProposals}</div>
        <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Community approved</div>
      </div>

      {/* Stat 4: Network */}
      <div className="rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">Network</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-400">
            <Network className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2 text-lg sm:text-xl font-bold text-white truncate">Bohr / Testnet</div>
        <div className="mt-0.5 text-[10px] sm:text-[11px] text-purple-400/90 font-mono">Gas: BOT / ETH</div>
      </div>
    </div>
  );
};
