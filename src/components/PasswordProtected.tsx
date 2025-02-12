'use client';

import { useState, ReactNode } from 'react';
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';

interface PasswordProtectedProps {
  children: ReactNode;
}

export default function PasswordProtected({ children }: PasswordProtectedProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { settings } = useAccessibilitySettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Entered password:', password);
    console.log('Expected password:', process.env.NEXT_PUBLIC_MAINTENANCE_PASSWORD);
    
    if (password === process.env.NEXT_PUBLIC_MAINTENANCE_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 backdrop-blur-md bg-white/30 dark:bg-gray-900/30 flex flex-col items-center justify-center z-40 rounded-lg">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Dashboard Access
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please enter the password to view analytics.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            className={`w-full py-2 rounded transition-colors ${
              settings.theme === 'amber'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}