import React, { useEffect, useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  Star,
  Send,
  Phone,
  UserPlus,
  UserCheck,
  Grid,
  Film,
  Home,
  MessageSquare,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Share2,
  Bookmark,
  ChevronLeft,
} from 'lucide-react';
import { Property, RentalListing, Reel, Review, User } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';

interface PropertyProfileProps {
  propertyId: string;
  onBack?: () => void;
}

export const PropertyProfileView: React.FC<PropertyProfileProps> = ({ propertyId, onBack }) => {
  const {
    openChatWith,
    showToast,
    openScheduleVisit,
    setActiveView,
    setViewParams,
  } = useApp();

  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'rooms' | 'reviews'>('rooms');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Story highlight mock categories for PG/Property
  const highlights = [
    { title: 'Boys Wing', icon: '🛏️' },
    { title: 'Food Menu', icon: '🍲' },
    { title: 'WiFi 300M', icon: '⚡' },
    { title: 'House Rules', icon: '📋' },
    { title: 'Study Hub', icon: '📚' },
  ];

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      setLoading(true);
      try {
        const data = await api.getPropertyById(propertyId);
        setProperty(data.property);
        setOwner(data.owner);
        setListings(data.listings);
        setReels(data.reels);
        setReviews(data.reviews);
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.owner?.followersCount || 120);
      } catch (e) {
        console.error('Failed to fetch property profile', e);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const handleToggleFollow = async () => {
    if (!owner) return;
    try {
      const res = await api.toggleFollow(owner.id);
      setIsFollowing(res.isFollowing);
      setFollowersCount(res.followersCount);
      showToast(res.isFollowing ? `Following ${owner.name}` : `Unfollowed ${owner.name}`, 'info');
    } catch (e) {
      setIsFollowing(!isFollowing);
    }
  };

  const handleMessage = () => {
    if (!owner || !property) return;
    openChatWith(owner.id, {
      type: 'PROPERTY',
      id: property.id,
      title: property.title,
      subtitle: `${property.area}, Indore • ₹${property.minRent.toLocaleString('en-IN')} - ₹${property.maxRent.toLocaleString('en-IN')}/mo`,
      price: property.minRent,
      imageUrl: property.coverPhoto,
      location: property.area,
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-zinc-400">Loading property profile...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400">Property not found</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-zinc-800 rounded-xl text-xs text-white">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>
      )}

      {/* INSTAGRAM-STYLE PROFILE HEADER */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Avatar with Instagram-style gradient border */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-xl shadow-rose-500/20">
              <img
                src={owner?.avatar || property.coverPhoto}
                alt={property.title}
                className="w-full h-full rounded-full object-cover border-4 border-zinc-950"
              />
            </div>
            {property.isVerified && (
              <div
                className="absolute bottom-1 right-1 bg-sky-500 text-white p-1 rounded-full ring-4 ring-zinc-950"
                title="Verified Property"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Details & Statistics */}
          <div className="flex-1 text-center sm:text-left space-y-4">
            {/* Business Title & Verification */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {property.title}
                  </h1>
                  {property.isVerified && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 mt-1">
                  <span className="flex items-center gap-1 text-rose-400 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {property.area}, Indore
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-zinc-300">{property.propertyType}</span>
                  {property.foodOption && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400">{property.foodOption}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Message</span>
                </button>

                <button
                  onClick={handleToggleFollow}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 border ${
                    isFollowing
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => openScheduleVisit(property.id, property.title, owner?.id || '')}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                  title="Schedule Physical Visit"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Profile Statistics Bar */}
            <div className="flex items-center justify-center sm:justify-start gap-6 py-2 border-y border-zinc-800/80 text-xs">
              <div className="text-center sm:text-left">
                <span className="font-extrabold text-sm text-white">{property.totalRooms}</span>
                <span className="text-zinc-400 ml-1">Total Rooms</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-extrabold text-sm text-emerald-400">{property.availableRooms}</span>
                <span className="text-zinc-400 ml-1">Available</span>
              </div>
              <div className="text-center sm:text-left flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-extrabold text-sm text-white">{property.rating}</span>
                <span className="text-zinc-400">({property.reviewCount})</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-extrabold text-sm text-white">{followersCount}</span>
                <span className="text-zinc-400 ml-1">Followers</span>
              </div>
            </div>

            {/* Price Range Pill & Bio */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                <span>Rent:</span>
                <span>
                  ₹{property.minRent.toLocaleString('en-IN')} - ₹{property.maxRent.toLocaleString('en-IN')} / month
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {property.description}
              </p>
            </div>
          </div>
        </div>

        {/* Highlight Circles (Instagram-style) */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80 flex items-center gap-4 overflow-x-auto no-scrollbar">
          {highlights.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0">
              <div className="w-14 h-14 rounded-full p-0.5 bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-all">
                <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-lg">
                  {h.icon}
                </div>
              </div>
              <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white">
                {h.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PROFILE TABS */}
      <div className="flex border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'rooms'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Active Rooms ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'reels'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Reels ({reels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'posts'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Photos</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'reviews'
              ? 'border-rose-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reviews ({reviews.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* Tab 1: Rooms (With 10-day active tags) */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((l) => (
            <div
              key={l.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 rounded-2xl overflow-hidden mb-3 bg-zinc-950">
                  <img src={l.photos[0]} alt={l.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>10-Day Active</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-base font-extrabold text-white">
                    ₹{l.rent.toLocaleString('en-IN')}/mo
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {l.roomType}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-zinc-100">{l.title}</h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{l.description}</p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                <button
                  onClick={() =>
                    openChatWith(owner?.id || '', {
                      type: 'LISTING',
                      id: l.id,
                      title: l.title,
                      price: l.rent,
                      subtitle: `${l.area} • ₹${l.rent}/mo`,
                      imageUrl: l.photos[0],
                    })
                  }
                  className="flex-1 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors"
                >
                  Book / Inquire
                </button>
                <button
                  onClick={() => openScheduleVisit(property.id, l.title, owner?.id || '')}
                  className="py-2 px-3 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold hover:bg-zinc-700"
                >
                  Visit
                </button>
              </div>
            </div>
          ))}
          {listings.length === 0 && (
            <div className="col-span-2 py-12 text-center text-zinc-400">
              No active room listings right now.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reels */}
      {activeTab === 'reels' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-xs font-bold line-clamp-2">{reel.caption}</p>
                <p className="text-[11px] font-bold text-amber-300 mt-1">
                  {reel.viewsCount} views
                </p>
              </div>
            </div>
          ))}
          {reels.length === 0 && (
            <div className="col-span-3 py-12 text-center text-zinc-400">
              No reels uploaded yet for this property.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Photos Grid */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {property.photos.map((photo, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl overflow-hidden bg-zinc-950 group cursor-pointer"
            >
              <img
                src={photo}
                alt={`Photo ${i}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={rev.userAvatar}
                    alt={rev.userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-100">{rev.userName}</p>
                    <p className="text-[10px] text-zinc-500">Verified Tenant Resident</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="py-12 text-center text-zinc-400">No tenant reviews yet.</div>
          )}
        </div>
      )}
    </div>
  );
};
