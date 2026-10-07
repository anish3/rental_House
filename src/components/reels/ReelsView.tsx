import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  MapPin,
  Building,
  UserCheck,
  UserPlus,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import { Reel, Comment } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';

export const ReelsView: React.FC<{ initialReelId?: string }> = ({ initialReelId }) => {
  const {
    openChatWith,
    openPropertyProfile,
    openUserProfile,
    showToast,
    currentUser,
  } = useApp();

  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const videoRef = useRef<HTMLVideoElement>(null);

  const categories = [
    { id: 'ALL', label: 'All Tours' },
    { id: 'ROOM_TOUR', label: 'Room Tours' },
    { id: 'PG_TOUR', label: 'PG & Hostel' },
    { id: 'AMENITIES', label: 'Amenities & Gym' },
  ];

  useEffect(() => {
    const fetchReels = async () => {
      setLoading(true);
      try {
        const data = await api.getReels(selectedCategory === 'ALL' ? undefined : selectedCategory);
        setReels(data.reels);
        if (initialReelId) {
          const idx = data.reels.findIndex((r) => r.id === initialReelId);
          if (idx !== -1) setCurrentIndex(idx);
        }
      } catch (e) {
        console.error('Failed to load reels', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, [selectedCategory, initialReelId]);

  const currentReel = reels[currentIndex];

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    if (currentReel && isCommentsOpen) {
      api.getReelComments(currentReel.id).then((res) => setComments(res.comments));
    }
  }, [currentReel?.id, isCommentsOpen]);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleLike = async () => {
    if (!currentReel) return;
    try {
      const res = await api.likeReel(currentReel.id);
      setReels((prev) =>
        prev.map((r, i) =>
          i === currentIndex ? { ...r, isLiked: res.isLiked, likesCount: res.likesCount } : r
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!currentReel) return;
    try {
      const res = await api.toggleSave('reel', currentReel.id);
      setReels((prev) =>
        prev.map((r, i) => (i === currentIndex ? { ...r, isSaved: res.isSaved } : r))
      );
      showToast(currentReel.isSaved ? 'Reel removed from saved' : 'Reel saved!', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentReel) return;
    try {
      const res = await api.addReelComment(currentReel.id, newComment.trim());
      setComments((prev) => [...prev, res.comment]);
      setNewComment('');
      setReels((prev) =>
        prev.map((r, i) =>
          i === currentIndex ? { ...r, commentsCount: r.commentsCount + 1 } : r
        )
      );
    } catch (e) {
      showToast('Could not post comment', 'error');
    }
  };

  const handleMessageOwner = () => {
    if (!currentReel?.owner) return;
    openChatWith(currentReel.owner.id, {
      type: 'REEL',
      id: currentReel.id,
      title: currentReel.propertyTitle || 'Property Reel Inquiry',
      subtitle: `${currentReel.location} • ₹${currentReel.rentAmount?.toLocaleString('en-IN') || 'Inquire'}/mo`,
      price: currentReel.rentAmount,
      imageUrl: currentReel.thumbnailUrl,
      location: currentReel.location,
    });
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-400">No reels found in this category.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex flex-col items-center justify-center p-2 relative select-none">
      {/* Category Pill Filters */}
      <div className="absolute top-3 z-30 flex items-center gap-2 bg-zinc-950/70 backdrop-blur-md p-1.5 rounded-full border border-zinc-800">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedCategory === c.id
                ? 'bg-rose-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Main Reels Vertical Container */}
      <div className="relative w-full max-w-sm h-full max-h-[720px] rounded-3xl overflow-hidden bg-black shadow-2xl border border-zinc-800 flex items-center justify-center">
        {/* Video Player */}
        <video
          ref={videoRef}
          src={currentReel.videoUrl}
          poster={currentReel.thumbnailUrl}
          playsInline
          loop
          muted={isMuted}
          autoPlay
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Play/Pause Overlay Icon */}
        {!isPlaying && (
          <div
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer pointer-events-auto"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-900/80 backdrop-blur-md flex items-center justify-center text-white">
              <Play className="w-8 h-8 ml-1" />
            </div>
          </div>
        )}

        {/* Top Controls: Sound Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-zinc-950/60 backdrop-blur-md text-white hover:bg-zinc-900 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Side Vertical Action Bar */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4 text-white">
          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center group">
            <div
              className={`p-3 rounded-full backdrop-blur-md transition-all ${
                currentReel.isLiked ? 'bg-rose-500 text-white' : 'bg-zinc-950/60 hover:bg-zinc-900'
              }`}
            >
              <Heart
                className={`w-6 h-6 ${currentReel.isLiked ? 'fill-white stroke-white' : ''}`}
              />
            </div>
            <span className="text-[11px] font-bold mt-1 drop-shadow-md">
              {currentReel.likesCount}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="flex flex-col items-center group"
          >
            <div className="p-3 rounded-full bg-zinc-950/60 backdrop-blur-md hover:bg-zinc-900 transition-all">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold mt-1 drop-shadow-md">
              {currentReel.commentsCount}
            </span>
          </button>

          {/* Save */}
          <button onClick={handleSave} className="flex flex-col items-center group">
            <div
              className={`p-3 rounded-full backdrop-blur-md transition-all ${
                currentReel.isSaved ? 'bg-amber-500 text-white' : 'bg-zinc-950/60 hover:bg-zinc-900'
              }`}
            >
              <Bookmark
                className={`w-6 h-6 ${currentReel.isSaved ? 'fill-white stroke-white' : ''}`}
              />
            </div>
            <span className="text-[11px] font-bold mt-1 drop-shadow-md">
              {currentReel.savesCount}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              showToast('Reel link copied to clipboard!', 'info');
            }}
            className="flex flex-col items-center group"
          >
            <div className="p-3 rounded-full bg-zinc-950/60 backdrop-blur-md hover:bg-zinc-900 transition-all">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold mt-1 drop-shadow-md">Share</span>
          </button>

          {/* Message Owner Direct */}
          <button onClick={handleMessageOwner} className="flex flex-col items-center group">
            <div className="p-3 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 backdrop-blur-md shadow-lg shadow-rose-500/30">
              <Send className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold mt-1 drop-shadow-md">Chat</span>
          </button>
        </div>

        {/* Bottom Property Banner & Owner Details */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-auto">
          {/* Owner details */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div
              onClick={() => currentReel.owner && openUserProfile(currentReel.owner.username)}
              className="cursor-pointer"
            >
              <img
                src={currentReel.owner?.avatar || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150'}
                alt={currentReel.owner?.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-white"
              />
            </div>
            <div className="flex-1 truncate">
              <p
                onClick={() => currentReel.owner && openUserProfile(currentReel.owner.username)}
                className="text-xs font-bold text-white cursor-pointer hover:underline truncate"
              >
                {currentReel.owner?.name || 'Indore Property'}
              </p>
              <p className="text-[11px] text-zinc-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" />
                {currentReel.location}
              </p>
            </div>
          </div>

          {/* Reel Caption */}
          <p className="text-xs text-white/95 line-clamp-2 mb-3 leading-relaxed">
            {currentReel.caption}
          </p>

          {/* FLOATING PROPERTY INQUIRY CARD */}
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-xl">
            <div className="truncate">
              <div className="text-[11px] font-bold text-zinc-300 truncate">
                {currentReel.propertyTitle || 'Indore Room Available'}
              </div>
              <div className="text-sm font-extrabold text-white flex items-baseline gap-1">
                <span>₹{currentReel.rentAmount?.toLocaleString('en-IN') || '7,500'}</span>
                <span className="text-[10px] text-zinc-400 font-normal">/month</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {currentReel.propertyId && (
                <button
                  onClick={() => openPropertyProfile(currentReel.propertyId!)}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold transition-colors"
                >
                  View Unit
                </button>
              )}
              <button
                onClick={handleMessageOwner}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[11px] font-bold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
              >
                Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Up/Down Navigation Arrows (Desktop) */}
      <div className="hidden lg:flex flex-col gap-2 ml-4 absolute right-12 top-1/2 -translate-y-1/2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === reels.length - 1}
          className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Sliding Comments Drawer */}
      {isCommentsOpen && (
        <div className="absolute inset-x-2 bottom-2 max-w-sm mx-auto h-[60%] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-3xl p-4 z-40 flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-white">
                Comments ({comments.length})
              </span>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-3 py-3 pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs">
                  <img
                    src={c.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={c.userName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-bold text-zinc-200 mr-1.5">{c.userName}</span>
                    <span className="text-zinc-300">{c.text}</span>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-xs text-zinc-500 py-6">
                  No comments yet. Ask about availability or rent!
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-zinc-800">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-rose-500 text-white font-bold text-xs rounded-xl hover:bg-rose-600"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
