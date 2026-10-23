import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, Dumbbell } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-primary mb-6 shadow-glow">
        <Dumbbell className="w-8 h-8" />
      </div>
      <h1 className="text-5xl font-black text-neutral-100 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-neutral-200 mt-2">Workout Zone Not Found</h2>
      <p className="text-sm text-neutral-400 max-w-sm mt-2 leading-relaxed">
        The fitness tracking page or workout routine you are looking for does not exist or has been moved.
      </p>

      <Link
        to="/"
        className="mt-6 flex items-center space-x-2 px-5 py-3 bg-primary hover:bg-primary-hover text-dark-950 font-bold rounded-xl text-sm transition-all shadow-glow hover:scale-105"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
