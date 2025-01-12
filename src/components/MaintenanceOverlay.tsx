import { useState } from 'react';
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';

interface MaintenanceOverlayProps {
  onPasswordSuccess: () => void;
}

export const MaintenanceOverlay = ({ onPasswordSuccess }: MaintenanceOverlayProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { settings } = useAccessibilitySettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Otis') {
      onPasswordSuccess();
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 backdrop-blur-md bg-white/30 dark:bg-gray-900/30 flex flex-col items-center justify-center z-40 rounded-lg">
    <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Down for Maintenance
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Making some improvements. Check back soon.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter maintenance password"
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
};