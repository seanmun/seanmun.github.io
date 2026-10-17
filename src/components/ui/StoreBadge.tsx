// File: src/components/ui/StoreBadge.tsx
// Purpose: "Coming soon" App Store / Google Play badges for projects with
// native apps on the way. Shaped like the stores' own badges but not links:
// there's nothing to download yet. Swap in a real store link at launch.

import React from 'react';

export type AppStore = 'ios' | 'android';

const STORES: Record<AppStore, { line: string; name: string; label: string }> = {
  ios: { line: 'Coming soon to the', name: 'App Store', label: 'iPhone app coming soon to the App Store' },
  android: { line: 'Coming soon to', name: 'Google Play', label: 'Android app coming soon to Google Play' },
};

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
      <path fill="#00C3FF" d="M3.6 2.2 13.4 12l-9.8 9.8c-.3-.2-.5-.6-.5-1.1V3.3c0-.5.2-.9.5-1.1Z" />
      <path fill="#00E07A" d="M3.6 2.2c.4-.2.9-.2 1.4.1l11.7 6.6-3.3 3.1Z" />
      <path fill="#FF3A44" d="m13.4 12 3.3 3.1L5 21.7c-.5.3-1 .3-1.4.1Z" />
      <path fill="#FFD400" d="m16.7 8.9 3.7 2.1c.8.5.8 1.5 0 2l-3.7 2.1-3.3-3.1Z" />
    </svg>
  );
}

export function StoreBadge({ store }: { store: AppStore }) {
  const s = STORES[store];
  return (
    <div
      role="note"
      aria-label={s.label}
      className="inline-flex items-center gap-2.5 h-12 pl-3 pr-4 rounded-lg bg-black text-white border border-gray-700 select-none"
    >
      {store === 'ios' ? <AppleMark /> : <PlayMark />}
      <span className="flex flex-col leading-none">
        <span className="text-[10px] tracking-wide text-gray-300">{s.line}</span>
        <span className="text-[17px] font-semibold mt-0.5">{s.name}</span>
      </span>
    </div>
  );
}
