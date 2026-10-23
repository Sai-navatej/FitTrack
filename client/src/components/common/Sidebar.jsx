import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  History,
  UtensilsCrossed,
  Scale,
  Droplets,
  TrendingUp,
  User,
  LogOut,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Workouts', path: '/workouts', icon: Dumbbell },
  { name: 'Exercise Library', path: '/exercises', icon: BookOpen },
  { name: 'Workout History', path: '/history', icon: History },
  { name: 'Nutrition', path: '/nutrition', icon: UtensilsCrossed },
  { name: 'Weight Tracking', path: '/weight', icon: Scale },
  { name: 'Water Tracker', path: '/water', icon: Droplets },
  { name: 'Progress', path: '/progress', icon: TrendingUp },
  { name: 'Profile', path: '/profile', icon: User },
];

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navContent = (
    <div className="flex flex-col h-full bg-dark-900 border-r border-neutral-800/80 w-64 select-none">
      {/* Brand logo */}
      <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-500 to-primary flex items-center justify-center text-dark-950 font-black shadow-glow-sm">
            <Flame className="w-6 h-6 fill-dark-950" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-neutral-100 flex items-center">
              Fit<span className="text-primary ml-0.5">Track</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
              Personal Fitness
            </span>
          </div>
        </NavLink>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow-sm'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-neutral-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-neutral-800/80 bg-neutral-900/50">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-sm text-primary flex-shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-neutral-200 truncate">{user?.fullName || 'User'}</p>
              <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-neutral-800/60 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 border border-neutral-700/50 hover:border-red-500/30 text-xs font-semibold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 animate-slide-right flex">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
