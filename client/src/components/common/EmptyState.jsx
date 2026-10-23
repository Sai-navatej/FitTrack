import React from 'react';

const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-card rounded-2xl border border-neutral-800/80 my-4">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center text-primary mb-4 border border-neutral-800">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
      <p className="text-sm text-neutral-400 mt-1 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-black font-semibold text-sm rounded-xl transition-all shadow-glow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
