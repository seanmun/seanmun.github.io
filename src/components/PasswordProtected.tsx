'use client';
// File: src/components/PasswordProtected.tsx
// Purpose: Dashboard login form. The password is checked by
// /api/dashboard/auth on the server — this component never knows it.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';

export default function PasswordProtected() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useAccessibilitySettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/dashboard/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setPassword('');
        router.refresh(); // the server component re-renders with the session cookie
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Incorrect password');
    } catch {
      setError('Could not reach the server');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            autoFocus
            className="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !password}
            className={`w-full py-2 rounded transition-colors disabled:opacity-60 ${
              settings.theme === 'amber'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isSubmitting ? 'Checking…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
