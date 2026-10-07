import React, { useState, useEffect } from 'react';
import { Search, Film, MapPin, Building, Flame, Compass } from 'lucide-react';
import { Property, Reel, RentalListing } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';

export const ExploreView: React.FC = () => {
  const { openPropertyProfile, setViewParams, setActiveView } = useApp();

  const [properties, setProperties] = useState<Property[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('All');

  const trendingTags = ['All', 'Vijay Nagar', 'Girls PG', 'Boys PG', 'Scheme 54', 'Bhawarkua', '1BHK Flats'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pData, rData] = await Promise.all([api.getProperties(), api.getReels()]);
        setProperties(pData.properties);
        setReels(rData.reels);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 pb-24">
      {/* Top Explore Title & Tags */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-5 h-5 text-rose-500" />
          <h1 className="text-2xl font-black text-white tracking-tight">Explore Indore Rentals</h1>
        </div>

        {/* Trending Tags */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {trendingTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTag === tag
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* INSTAGRAM-STYLE RESPONSIVE EXPLORE GRID */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {/* Interleave reels and property photos in an aesthetic grid */}
          {properties.map((prop, idx) => {
            const matchedReel = reels[idx % reels.length];
            const isReelTile = idx % 3 === 1 && matchedReel;

            if (isReelTile && matchedReel) {
              return (
                <div
                  key={`reel-${matchedReel.id}-${idx}`}
                  onClick={() => {
                    setViewParams({ reelId: matchedReel.id });
                    setActiveView('reels');
                  }}
                  className="relative aspect-square sm:aspect-4/5 rounded-2xl overflow-hidden cursor-pointer group bg-zinc-950 border border-zinc-800/80 shadow-md"
                >
                  <img
                    src={matchedReel.thumbnailUrl}
                    alt={matchedReel.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <span className="text-[10px] font-bold text-amber-300">
                      ₹{matchedReel.rentAmount?.toLocaleString('en-IN') || '7,500'}/mo
                    </span>
                    <p className="text-xs font-bold line-clamp-1">{matchedReel.location}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`prop-${prop.id}`}
                onClick={() => openPropertyProfile(prop.id)}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-zinc-950 border border-zinc-800/80 shadow-md"
              >
                <img
                  src={prop.coverPhoto}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                  <p className="text-xs font-bold line-clamp-1">{prop.title}</p>
                  <p className="text-[11px] text-emerald-400 font-extrabold">
                    ₹{prop.minRent.toLocaleString('en-IN')}/mo • {prop.area}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
