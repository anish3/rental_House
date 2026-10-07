import React from 'react';
import {
  Home,
  Compass,
  Film,
  Building2,
  Users,
  Send,
  Bell,
  PlusSquare,
  Bookmark,
  User as UserIcon,
  Shield,
  Layers,
  Sparkles,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { ActiveView, UserRole } from '../../types/client.ts';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeView,
    setActiveView,
    openCreateModal,
    unreadNotificationsCount,
    unreadMessagesCount,
    allDemoUsers,
    switchDemoUser,
    openUserProfile,
  } = useApp();

  const [isPersonaOpen, setIsPersonaOpen] = React.useState(false);

  const navItems = [
    { id: 'home' as ActiveView, label: 'Home Feed', icon: Home },
    { id: 'explore' as ActiveView, label: 'Explore', icon: Compass },
    { id: 'reels' as ActiveView, label: 'Reels', icon: Film, badge: 'Hot' },
    { id: 'find-property' as ActiveView, label: 'Find Property', icon: Building2 },
    { id: 'find-tenants' as ActiveView, label: 'Find Tenants', icon: Users, badge: 'Owners' },
    {
      id: 'messages' as ActiveView,
      label: 'Messages',
      icon: Send,
      count: unreadMessagesCount,
    },
    {
      id: 'notifications' as ActiveView,
      label: 'Notifications',
      icon: Bell,
      count: unreadNotificationsCount,
    },
    { id: 'saved' as ActiveView, label: 'Saved', icon: Bookmark },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 bg-zinc-950 border-r border-zinc-800/70 p-4 select-none z-30 justify-between">
      {/* Top Branding */}
      <div>
        <div
          onClick={() => setActiveView('home')}
          className="flex items-center gap-3 px-3 py-4 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                RentReel
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Indore
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Scroll into your next home.</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-zinc-800/90 text-white font-bold shadow-inner'
                    : 'text-zinc-300 hover:bg-zinc-900/90 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-rose-400 stroke-[2.5]' : 'text-zinc-400 stroke-[2]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm shadow-rose-500/40 animate-pulse">
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Create Button (Special Callout) */}
          <button
            onClick={() => openCreateModal('listing')}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:opacity-95 shadow-lg shadow-rose-600/25 transition-all active:scale-[0.98] mt-2"
          >
            <PlusSquare className="w-5 h-5 stroke-[2.5]" />
            <span>Create Listing / Reel</span>
          </button>
        </nav>

        {/* Dashboards shortcut */}
        <div className="mt-5 pt-4 border-t border-zinc-800/60 space-y-1">
          <p className="px-3.5 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
            Management Hubs
          </p>
          <button
            onClick={() => setActiveView('owner-dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'owner-dashboard'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Owner & PG Dashboard</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
              10d Expiry
            </span>
          </button>

          <button
            onClick={() => setActiveView('admin-dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'admin-dashboard'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-violet-400" />
              <span>Admin Operations</span>
            </div>
            <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20 font-bold">
              Trust
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Profile & Persona Switcher */}
      <div className="pt-3 border-t border-zinc-800/80 relative">
        {/* Persona Switcher Dropdown */}
        {isPersonaOpen && (
          <div className="absolute bottom-20 left-2 right-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="px-3 py-1.5 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 flex justify-between items-center">
              <span>Switch Marketplace Persona</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="max-h-56 overflow-y-auto py-1 space-y-1">
              {allDemoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchDemoUser(u.id);
                    setIsPersonaOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                    currentUser?.id === u.id
                      ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                  />
                  <div className="truncate flex-1">
                    <p className="font-semibold text-zinc-100 truncate">{u.name}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      {u.activeRole} • {u.locationArea}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentUser && (
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/80 transition-colors">
            <div
              onClick={() => openUserProfile(currentUser.username)}
              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-700 ring-2 ring-rose-500/40"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950"></span>
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                  <span className="text-rose-400 font-semibold">{currentUser.activeRole}</span> •{' '}
                  {currentUser.locationArea}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPersonaOpen(!isPersonaOpen)}
              title="Switch demo persona"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
