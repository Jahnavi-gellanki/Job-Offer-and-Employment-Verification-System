import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 'default', fullScreen = false }) {
  const sizeClasses = {
    small: 'w-5 h-5',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-md bg-blue-500/30 animate-pulse"></div>
        <Loader2 className={`${sizeClasses[size] || sizeClasses.default} text-cyan-400 animate-spin relative z-10`} />
      </div>
      {message && (
        <p className="text-sm font-medium text-slate-400 animate-pulse tracking-wide">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}
