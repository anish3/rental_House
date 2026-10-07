import React from 'react';
import { Home, Compass, Film, PlusCircle, Send, User } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { ActiveView } from '../../types/client.ts';

export const MobileNav: React.FC = () => {
  const { activeView, setActiveView, openCreateModal, unreadMessagesCount, currentUser, openUserProfile } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 flex items-center justify-around px-2 z-40">
      <button
        onClick={() => setActiveView('home')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
          activeView === 'home' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Home className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] mt-0.5 font-medium">Home</span>
      </button>

      <button
        onClick={() => setActiveView('explore')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
          activeView === 'explore' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Compass className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] mt-0.5 font-medium">Explore</span>
      </button>

      <button
        onClick={() => openCreateModal('listing')}
        className="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 text-white shadow-lg shadow-rose-500/30"
      >
        <PlusCircle className="w-6 h-6 stroke-[2.5]" />
      </button>

      <button
        onClick={() => setActiveView('reels')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
          activeView === 'reels' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Film className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] mt-0.5 font-medium">Reels</span>
      </button>

      <button
        onClick={() => setActiveView('messages')}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors relative ${
          activeView === 'messages' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Send className="w-5 h-5 stroke-[2.2]" />
        {unreadMessagesCount > 0 && (
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-zinc-950"></span>
        )}
        <span className="text-[10px] mt-0.5 font-medium">Chat</span>
      </button>

      <button
        onClick={() => {
          if (currentUser) openUserProfile(currentUser.username);
        }}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
          activeView === 'user-profile' ? 'text-rose-500' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        {currentUser?.avatar ? (
          <img
            src={currentUser.avatar}
            alt="Profile"
            className="w-5 h-5 rounded-full object-cover border border-zinc-700"
          />
        ) : (
          <User className="w-5 h-5 stroke-[2.2]" />
        )}
        <span className="text-[10px] mt-0.5 font-medium">Profile</span>
      </button>
    </nav>
  );
};
