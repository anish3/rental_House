import React, { useState, useEffect } from 'react';
import { Bookmark, Film, Building, Home, Clock } from 'lucide-react';
import { RentalListing, Property, Reel } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';

export const SavedView: React.FC = () => {
  const { openPropertyProfile, setViewParams, setActiveView } = useApp();

  const [savedListings, setSavedListings] = useState<RentalListing[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [savedReels, setSavedReels] = useState<Reel[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'properties' | 'reels'>('listings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const res = await api.getSavedItems();
        setSavedListings(res.listings || []);
        setSavedProperties(res.properties || []);
        setSavedReels(res.reels || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h1 className="text-2xl font-black text-white tracking-tight">Saved Collection</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex-1 py-3 text-xs font-bold border-b-2 ${
            activeTab === 'listings'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-zinc-400'
          }`}
        >
          Room Listings ({savedListings.length})
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 text-xs font-bold border-b-2 ${
            activeTab === 'properties'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-zinc-400'
          }`}
        >
          Properties ({savedProperties.length})
        </button>
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex-1 py-3 text-xs font-bold border-b-2 ${
            activeTab === 'reels'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-zinc-400'
          }`}
        >
          Reels ({savedReels.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedListings.map((l) => (
            <div
              key={l.id}
              onClick={() => openPropertyProfile(l.propertyId)}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 cursor-pointer hover:border-zinc-700 transition-colors shadow-lg"
            >
              <img
                src={l.photos[0]}
                alt={l.title}
                className="w-full aspect-16/10 rounded-2xl object-cover mb-3"
              />
              <span className="text-xs font-extrabold text-white">
                ₹{l.rent.toLocaleString('en-IN')}/mo
              </span>
              <h4 className="text-xs font-bold text-zinc-200 mt-1 line-clamp-1">{l.title}</h4>
              <p className="text-[11px] text-zinc-400">{l.area}, Indore</p>
            </div>
          ))}
          {savedListings.length === 0 && (
            <div className="col-span-2 py-16 text-center text-xs text-zinc-500">
              No saved room listings yet. Click the bookmark icon on any post to save.
            </div>
          )}
        </div>
      )}

      {activeTab === 'reels' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {savedReels.map((r) => (
            <div
              key={r.id}
              onClick={() => {
                setViewParams({ reelId: r.id });
                setActiveView('reels');
              }}
              className="relative aspect-9/16 rounded-2xl overflow-hidden cursor-pointer bg-zinc-950 group"
            >
              <img
                src={r.thumbnailUrl}
                alt={r.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 p-2 flex flex-col justify-end text-white">
                <p className="text-xs font-bold line-clamp-1">{r.caption}</p>
                <p className="text-[10px] text-amber-300">₹{r.rentAmount}/mo</p>
              </div>
            </div>
          ))}
          {savedReels.length === 0 && (
            <div className="col-span-3 py-16 text-center text-xs text-zinc-500">
              No saved reels yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
