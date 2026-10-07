import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Building,
  Users,
  Film,
  UserCheck,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { Property, User, Reel, RentalRequirement, RentalListing } from '../../types/client.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { openPropertyProfile, openUserProfile, setViewParams, setActiveView } = useApp();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'properties' | 'people' | 'reels' | 'requirements'>('all');
  const [results, setResults] = useState<{
    properties: Property[];
    listings: RentalListing[];
    users: User[];
    reels: Reel[];
    requirements: RentalRequirement[];
  }>({
    properties: [],
    listings: [],
    users: [],
    reels: [],
    requirements: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ properties: [], listings: [], users: [], reels: [], requirements: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchGlobal(query.trim(), activeTab);
        setResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-rose-500" />
          <input
            type="text"
            autoFocus
            placeholder="Search Vijay Nagar, PG rooms, Aman Sharma, TCS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
          >
            Esc
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-zinc-800 px-4 py-2 gap-1 overflow-x-auto no-scrollbar bg-zinc-950/40">
          {(['all', 'properties', 'people', 'reels', 'requirements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === tab
                  ? 'bg-rose-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Results Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-12 text-center text-xs text-zinc-400">Searching Indore records...</div>
          )}

          {!loading && !query && (
            <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
              <Sparkles className="w-8 h-8 text-zinc-700 mx-auto" />
              <p>Type to search properties, tenants, reels, or areas in Indore</p>
            </div>
          )}

          {/* Properties Section */}
          {(activeTab === 'all' || activeTab === 'properties') && results.properties.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Properties & PGs ({results.properties.length})
              </p>
              <div className="space-y-2">
                {results.properties.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      openPropertyProfile(p.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.coverPhoto}
                        alt={p.title}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{p.title}</h4>
                        <p className="text-[11px] text-zinc-400">
                          {p.area} • ₹{p.minRent.toLocaleString('en-IN')}/mo
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* People Section (Tenants / Owners) */}
          {(activeTab === 'all' || activeTab === 'people') && results.users.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                People & Profiles ({results.users.length})
              </p>
              <div className="space-y-2">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      openUserProfile(u.username);
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{u.name}</h4>
                        <p className="text-[11px] text-zinc-400">
                          @{u.username} • {u.activeRole} • {u.locationArea}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reels Section */}
          {(activeTab === 'all' || activeTab === 'reels') && results.reels.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Reels ({results.reels.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {results.reels.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setViewParams({ reelId: r.id });
                      setActiveView('reels');
                      onClose();
                    }}
                    className="relative aspect-16/9 rounded-xl overflow-hidden cursor-pointer group bg-zinc-950 border border-zinc-800"
                  >
                    <img
                      src={r.thumbnailUrl}
                      alt={r.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 p-2 flex flex-col justify-end text-white">
                      <p className="text-[11px] font-bold line-clamp-1">{r.caption}</p>
                      <p className="text-[10px] text-amber-300">{r.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
