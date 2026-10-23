import React from 'react';
import { Menu, Droplets, Bell, BellOff, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWaterReminder } from '../../context/WaterReminderContext';

const Navbar = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const { notificationPermission, requestPermission, quickLogWater } = useWaterReminder();

  return (
    <header className="sticky top-0 z-20 bg-dark-950/80 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Mobile toggle and title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 md:hidden">
          <Flame className="w-5 h-5 text-primary" />
          <span className="font-extrabold text-neutral-100">FitTrack</span>
        </div>

        <div className="hidden md:block">
          <h2 className="text-sm font-medium text-neutral-400">
            Welcome back, <span className="text-neutral-100 font-semibold">{user?.fullName || 'Athlete'}</span>
          </h2>
        </div>
      </div>

      {/* Quick top actions */}
      <div className="flex items-center space-x-3">
        {/* Quick +250ml water button */}
        <button
          onClick={() => quickLogWater(250)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all shadow-sm"
          title="Quick log 250ml water"
        >
          <Droplets className="w-4 h-4" />
          <span className="hidden sm:inline">+250ml</span>
        </button>

        {/* Browser notification permission button */}
        {notificationPermission !== 'granted' ? (
          <button
            onClick={requestPermission}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
            title="Enable 2-Hour Hydration Reminders"
          >
            <BellOff className="w-4 h-4" />
            <span className="hidden sm:inline">Enable Reminders</span>
          </button>
        ) : (
          <div
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs"
            title="Hydration Reminders Active"
          >
            <Bell className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline text-[11px] text-neutral-300">Active</span>
          </div>
        )}

        {/* Goal Badge */}
        {user?.fitnessGoal && (
          <div className="hidden lg:flex items-center px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-primary mr-2" />
            {user.fitnessGoal === 'muscle_gain' ? 'Muscle Gain' : user.fitnessGoal === 'fat_loss' ? 'Fat Loss' : 'Maintenance'}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
