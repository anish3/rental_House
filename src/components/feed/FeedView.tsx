import React, { useEffect, useState } from 'react';
import { Sparkles, Filter, RefreshCw, Flame, Building, Compass, Plus, Film } from 'lucide-react';
import { PropertyPostCard } from './PropertyPostCard.tsx';
import { RequirementCard } from './RequirementCard.tsx';
import { RentalListing, RentalRequirement, Reel, Post } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';

export const FeedView: React.FC = () => {
  const { setActiveView, openCreateModal, setViewParams } = useApp();

  const [filterTab, setFilterTab] = useState<'all' | 'listings' | 'requirements' | 'reels'>('all');
  const [selectedArea, setSelectedArea] = useState<string>('All Indore');
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [requirements, setRequirements] = useState<RentalRequirement[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  const indoreAreas = [
    { name: 'All Indore', count: '100+' },
    { name: 'Vijay Nagar', count: '38 rooms', highlight: 'Top Student Hub' },
    { name: 'Scheme 54', count: '24 flats', highlight: 'Behind C21' },
    { name: 'Bhawarkua', count: '45 PGs', highlight: 'Near DAVV' },
    { name: 'Scheme 140', count: '19 suites', highlight: 'IT Corridor' },
    { name: 'Palasia', count: '14 flats', highlight: 'Central Indore' },
    { name: 'Rau', count: '22 PGs', highlight: 'Budget Living' },
  ];

  const loadFeedData = async () => {
    setLoading(true);
    try {
      const data = await api.getFeed();
      setListings(data.listings);
      setRequirements(data.requirements);
      setReels(data.reels);
    } catch (e) {
      console.error('Error fetching feed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, []);

  // Filter listings by area
  const filteredListings = listings.filter((l) => {
    if (selectedArea === 'All Indore') return true;
    return l.area.toLowerCase().includes(selectedArea.toLowerCase());
  });

  const filteredRequirements = requirements.filter((r) => {
    if (selectedArea === 'All Indore') return true;
    return r.preferredAreas.some((a) => a.toLowerCase().includes(selectedArea.toLowerCase()));
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-20">
      {/* Area Story Circles / Highlights */}
      <div className="mb-6 overflow-x-auto no-scrollbar py-2">
        <div className="flex items-center gap-3 min-w-max">
          {indoreAreas.map((area, idx) => {
            const isSelected = selectedArea === area.name;
            return (
              <button
                key={area.name}
                onClick={() => setSelectedArea(area.name)}
                className="flex flex-col items-center gap-1.5 group transition-transform active:scale-95"
              >
                <div
                  className={`w-16 h-16 rounded-full p-0.5 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 ring-2 ring-rose-500/50'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-zinc-950 flex flex-col items-center justify-center text-center p-1">
                    <span className="text-xs font-bold text-white leading-tight truncate max-w-[50px]">
                      {area.name.replace('All ', '')}
                    </span>
                    <span className="text-[9px] text-zinc-400">{area.count}</span>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-medium tracking-tight ${
                    isSelected ? 'text-rose-400 font-bold' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  {area.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Discovery Tabs */}
      <div className="flex items-center justify-between gap-2 mb-6 bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Stream
          </button>

          <button
            onClick={() => setFilterTab('listings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'listings'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Verified Rooms ({filteredListings.length})
          </button>

          <button
            onClick={() => setFilterTab('requirements')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'requirements'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tenant Requests ({filteredRequirements.length})
          </button>

          <button
            onClick={() => setFilterTab('reels')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'reels'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Reel Tours ({reels.length})
          </button>
        </div>

        <button
          onClick={loadFeedData}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Reels Sneak Peek Strip in Feed */}
      {reels.length > 0 && filterTab !== 'requirements' && (
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-rose-950/40 via-zinc-900 to-amber-950/20 border border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                Trending Property Reels
              </span>
            </div>
            <button
              onClick={() => setActiveView('reels')}
              className="text-xs font-bold text-rose-400 hover:text-rose-300"
            >
              Watch All →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {reels.slice(0, 4).map((reel) => (
              <div
                key={reel.id}
                onClick={() => {
                  setViewParams({ reelId: reel.id });
                  setActiveView('reels');
                }}
                className="relative aspect-9/16 rounded-2xl overflow-hidden cursor-pointer group bg-zinc-950 shadow-md"
              >
                <img
                  src={reel.thumbnailUrl}
                  alt={reel.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-[10px] font-bold truncate">{reel.location}</p>
                  {reel.rentAmount && (
                    <p className="text-[11px] font-extrabold text-amber-300">
                      ₹{reel.rentAmount.toLocaleString('en-IN')}/mo
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed Stream */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-400">Loading fresh Indore rental stream...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* If tab is 'listings' */}
          {filterTab === 'listings' &&
            filteredListings.map((listing) => (
              <PropertyPostCard key={listing.id} listing={listing} />
            ))}

          {/* If tab is 'requirements' */}
          {filterTab === 'requirements' &&
            filteredRequirements.map((req) => (
              <RequirementCard key={req.id} requirement={req} />
            ))}

          {/* If tab is 'reels' */}
          {filterTab === 'reels' && (
            <div className="grid grid-cols-2 gap-3">
              {reels.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => {
                    setViewParams({ reelId: reel.id });
                    setActiveView('reels');
                  }}
                  className="relative aspect-9/16 rounded-3xl overflow-hidden cursor-pointer group bg-zinc-950 border border-zinc-800"
                >
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-bold line-clamp-2">{reel.caption}</p>
                    <p className="text-[11px] text-amber-300 font-extrabold mt-1">
                      {reel.rentAmount ? `₹${reel.rentAmount.toLocaleString('en-IN')}/mo` : 'Room Tour'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* If tab is 'all': Interleave listings and tenant requirements! */}
          {filterTab === 'all' && (
            <>
              {filteredListings.slice(0, 2).map((listing) => (
                <PropertyPostCard key={listing.id} listing={listing} />
              ))}

              {filteredRequirements.length > 0 && (
                <div className="my-2">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Tenant Looking for Room in Indore
                    </span>
                  </div>
                  <RequirementCard requirement={filteredRequirements[0]} />
                </div>
              )}

              {filteredListings.slice(2).map((listing) => (
                <PropertyPostCard key={listing.id} listing={listing} />
              ))}

              {filteredRequirements.slice(1).map((req) => (
                <RequirementCard key={req.id} requirement={req} />
              ))}

              {filteredListings.length === 0 && filteredRequirements.length === 0 && (
                <div className="py-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8">
                  <Building className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="font-bold text-zinc-300">No listings in {selectedArea} right now</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Listings auto-expire every 10 days to guarantee availability. Be the first to post!
                  </p>
                  <button
                    onClick={() => openCreateModal('listing')}
                    className="mt-4 px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs"
                  >
                    Post Room Listing
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
