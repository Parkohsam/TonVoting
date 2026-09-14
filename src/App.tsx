import React, { useState, useMemo } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { Navbar } from './components/Navbar';
import { TokenFaucet } from './components/TokenFaucet';
import { ProposalCard, type ProposalData } from './components/ProposalCard';
import { ProposalModal } from './components/ProposalModal';
import { VoteModal } from './components/VoteModal';
import { StatsOverview } from './components/StatsOverview';
import { getContractAddresses, TOKEN_VOTE_ABI, DEV_TOKEN_ABI } from './contracts';
import { Plus, Search, RefreshCw, Inbox, ExternalLink, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);

  // Filter & Search states
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [votingProposal, setVotingProposal] = useState<{ id: number; title: string } | null>(null);

  // Read User DEV balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: contracts.DevToken,
    abi: DEV_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && contracts.DevToken),
      refetchInterval: 5000,
    },
  });

  const userDevBalance = (balanceData as bigint) || 0n;

  // Read all proposals & statuses directly from smart contract
  const {
    data: allProposalsData,
    isLoading: isProposalsLoading,
    isRefetching: isProposalsRefetching,
    refetch: refetchProposals,
    error: proposalsError,
  } = useReadContract({
    address: contracts.TokenVote,
    abi: TOKEN_VOTE_ABI,
    functionName: 'getAllProposals',
    query: {
      enabled: Boolean(contracts.TokenVote),
      refetchInterval: 5000,
    },
  });

  const rawProposals = allProposalsData ? (allProposalsData as [ProposalData[], number[]])[0] : [];
  const rawStatuses = allProposalsData ? (allProposalsData as [ProposalData[], number[]])[1] : [];

  // Pair on-chain proposals with their statuses and reverse so newest appears first
  const proposalList = useMemo(() => {
    if (!rawProposals || rawProposals.length === 0) return [];
    return rawProposals
      .map((proposal, idx) => ({
        proposal,
        status: Number(rawStatuses[idx] ?? 0),
      }))
      .reverse();
  }, [rawProposals, rawStatuses]);

  // Counts for tabs
  const { allCount, activeCount, closedCount } = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    let active = 0;
    let closed = 0;
    proposalList.forEach(({ proposal, status }) => {
      const isStillActive = status === 0 && Number(proposal.endTime) > now;
      if (isStillActive) active++;
      else closed++;
    });
    return {
      allCount: proposalList.length,
      activeCount: active,
      closedCount: closed,
    };
  }, [proposalList]);

  // Filter and search
  const filteredProposals = useMemo(() => {
    return proposalList.filter(({ proposal, status }) => {
      const now = Math.floor(Date.now() / 1000);
      const isStillActive = status === 0 && Number(proposal.endTime) > now;

      if (filter === 'active' && !isStillActive) return false;
      if (filter === 'closed' && isStillActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = proposal.title.toLowerCase().includes(q);
        const matchesDesc = proposal.description.toLowerCase().includes(q);
        const matchesProposer = proposal.proposer.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesProposer;
      }

      return true;
    });
  }, [proposalList, filter, searchQuery]);

  const handleRefreshAll = () => {
    refetchBalance();
    refetchProposals();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Floating Navbar with Generous Breathing Room */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-16 space-y-6 sm:space-y-10">
        {/* Token Faucet & Balance Card */}
        <TokenFaucet />

        {/* Stats Overview */}
        <StatsOverview
          proposals={rawProposals}
          statuses={rawStatuses}
        />

        {/* Contract error / network reminder if contract call fails */}
        {proposalsError && (
          <div className="rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 p-3.5 sm:p-4 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                Connected to network. Ensure smart contracts are deployed to this chain ({chainId}).
              </span>
            </div>
            <button
              onClick={handleRefreshAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors text-xs w-full sm:w-auto justify-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Proposals Dashboard Section */}
        <div className="space-y-4 sm:space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Governance Proposals</span>
                <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  {proposalList.length} Total
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Browse, propose, and vote on community initiatives weighted by your DEV tokens.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleRefreshAll}
                title="Refresh on-chain data"
                className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-sm flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isProposalsRefetching ? 'animate-spin text-indigo-400' : ''}`} />
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!isConnected}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>New Proposal</span>
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4 p-1.5 sm:p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-sm">
            {/* Filter Tabs with Clear Counts */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl">
              {[
                { id: 'all', label: 'All', fullLabel: 'All Proposals', count: allCount },
                { id: 'active', label: 'Active', fullLabel: 'Active Ballots', count: activeCount },
                { id: 'closed', label: 'Closed', fullLabel: 'Closed / Final', count: closedCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    filter === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                  <span
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      filter === tab.id ? 'bg-indigo-800/80 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search proposals by title, description, or address..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Proposals Grid / List */}
        {isProposalsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-56 sm:h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-4 sm:p-6"
              />
            ))}
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-14 sm:py-20 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800/80 p-5 sm:p-8">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500">
              <Inbox className="w-6 sm:w-7 h-6 sm:h-7" />
            </div>
            <h3 className="mt-3.5 sm:mt-4 text-base sm:text-lg font-bold text-slate-200">
              {proposalList.length === 0
                ? 'No Proposals Created Yet'
                : `No Proposals Under "${filter === 'active' ? 'Active' : filter === 'closed' ? 'Closed' : 'All'}"`}
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {proposalList.length === 0
                ? 'There are no proposals on-chain yet. Claim 100 DEV tokens from the faucet above and launch the very first community proposal!'
                : searchQuery
                ? `No proposals matched your search for "${searchQuery}".`
                : 'No proposals currently match this filter tab.'}
            </p>
            <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {filter !== 'all' && proposalList.length > 0 && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  View All Proposals ({allCount})
                </button>
              )}
              {isConnected && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Proposal</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredProposals.map(({ proposal, status }) => (
              <ProposalCard
                key={proposal.id.toString()}
                proposal={proposal}
                status={status}
                onOpenVote={(id, title) => setVotingProposal({ id, title })}
                onRefresh={handleRefreshAll}
              />
            ))}
          </div>
        )}
      </main>

      {/* Proposal Creation Modal */}
      <ProposalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefreshAll}
        userDevBalance={userDevBalance}
      />

      {/* Voting Modal */}
      {votingProposal && (
        <VoteModal
          isOpen={true}
          proposalId={votingProposal.id}
          proposalTitle={votingProposal.title}
          userDevBalance={userDevBalance}
          onClose={() => setVotingProposal(null)}
          onSuccess={handleRefreshAll}
        />
      )}

      {/* Footer with Testnet Info */}
      <footer className="mt-14 sm:mt-20 border-t border-slate-800/80 bg-slate-950/80 py-6 sm:py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">TokenVote</span>
            <span>•</span>
            <span>Testnet Governance dApp</span>
          </div>

          {/* Testnet Explorer & RPC metadata */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px]">
            <span className="text-slate-400">
              Chain ID: <strong className="text-slate-200">{chainId || 968}</strong>
            </span>
            <span className="text-slate-400">
              Gas Token: <strong className="text-purple-300">BOT / ETH</strong>
            </span>
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>BohrScan Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              RPC Endpoint
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
