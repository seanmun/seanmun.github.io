// File: src/data/connections.ts
// Purpose: Define relationships between projects for the concept graph

export type ConnectionType =
  | 'business'
  | 'fantasy-sports'
  | 'blockchain'
  | 'telegram-bots'
  | 'health-wellness'
  | 'shared-tech';

export interface Connection {
  source: string;
  target: string;
  type: ConnectionType;
  label?: string;
}

export const connectionTypeConfig: Record<ConnectionType, {
  color: string;
  label: string;
}> = {
  'business': {
    color: '#FFD700',
    label: 'Business/Strategic',
  },
  'fantasy-sports': {
    color: '#22C55E',
    label: 'Fantasy Sports',
  },
  'blockchain': {
    color: '#A855F7',
    label: 'Blockchain/Web3',
  },
  'telegram-bots': {
    color: '#06B6D4',
    label: 'Telegram Bots',
  },
  'health-wellness': {
    color: '#F87171',
    label: 'Health/Wellness',
  },
  'shared-tech': {
    color: '#94A3B8',
    label: 'Shared Tech Stack',
  },
};

// Source and target must match a project title in projects.ts exactly. The
// graph skips (rather than crashes on) a link to a missing project, but a
// skipped link is a silent gap — update this file when projects are merged
// or renamed.
export const connections: Connection[] = [
  // Business/Strategic
  { source: 'Kinetic.email', target: 'Money Never Sleeps', type: 'business', label: 'Email platform for league communications' },
  { source: 'Kinetic.email', target: 'RumbleRaffle.com', type: 'business', label: 'Email platform integration' },
  { source: 'Kinetic.email', target: 'DraftDayTrades.com', type: 'business', label: 'Email notifications' },
  { source: 'Kinetic.email', target: 'TrustThePick.com', type: 'business', label: 'Email integration for draft lottery' },
  { source: 'Kinetic.email', target: 'Human-Diet.com', type: 'business', label: 'Email platform for health updates' },
  { source: 'Kinetic.email', target: 'Agent Army', type: 'business', label: 'Email alerts from agent insights' },
  { source: 'Kinetic.email', target: 'Cross-Chain Portfolio Tracker', type: 'business', label: 'Portfolio email notifications' },
  { source: 'Kinetic.email', target: 'OrdinalFrame', type: 'business', label: 'Email updates for ordinal activity' },
  { source: 'Kinetic.email', target: 'Rocket Pool Tour', type: 'business', label: 'Email platform for tour updates' },
  { source: 'RumbleRaffle.com', target: 'Money Never Sleeps', type: 'business', label: 'Gaming league crossover' },

  // Fantasy Sports Ecosystem
  { source: 'Money Never Sleeps', target: 'TrustThePick.com', type: 'fantasy-sports', label: 'Draft lottery for MNS league' },
  { source: 'Money Never Sleeps', target: 'DraftDayTrades.com', type: 'fantasy-sports', label: 'Draft day prediction pools' },
  { source: 'TrustThePick.com', target: 'DraftDayTrades.com', type: 'fantasy-sports', label: 'Draft ecosystem tools' },
  { source: 'Money Never Sleeps', target: 'Agent Army', type: 'fantasy-sports', label: 'Sam Hinkie Bot runs the MNS league' },

  // Blockchain/Web3
  { source: 'Money Never Sleeps', target: 'Cross-Chain Portfolio Tracker', type: 'blockchain', label: 'Shared blockchain/Alchemy API' },
  { source: 'Money Never Sleeps', target: 'OrdinalFrame', type: 'blockchain', label: 'Bitcoin/crypto ecosystem' },
  { source: 'OrdinalFrame', target: 'Cross-Chain Portfolio Tracker', type: 'blockchain', label: 'Bitcoin Ordinals and portfolio tracking' },

  // Telegram Bots
  { source: 'Agent Army', target: 'Money Never Sleeps', type: 'telegram-bots', label: 'League updates delivered in Telegram' },

  // Health/Wellness
  { source: 'Human-Diet.com', target: 'Agent Army', type: 'health-wellness', label: "A.I.bert's health data lake meets the diet timeline" },
  { source: 'Human-Diet.com', target: 'Amber Mode', type: 'health-wellness', label: 'Health-conscious projects' },
  { source: 'Agent Army', target: 'Amber Mode', type: 'health-wellness', label: 'Wellness optimization' },

  // Shared Tech Stack (selective)
  { source: 'Money Never Sleeps', target: 'DraftDayTrades.com', type: 'shared-tech', label: 'React, Next.js, Firebase, Tailwind' },
  { source: 'TrustThePick.com', target: 'Rocket Pool Tour', type: 'shared-tech', label: 'React, Next.js, TypeScript, Tailwind' },
  { source: 'Money Never Sleeps', target: 'Cross-Chain Portfolio Tracker', type: 'shared-tech', label: 'React, Next.js, Alchemy API' },
  { source: 'Kinetic.email', target: 'Buddy Cup', type: 'shared-tech', label: 'Claude + OpenAI API pipelines' },
  { source: 'Kinetic.email', target: 'To Posterity', type: 'shared-tech', label: 'Claude API content pipeline' },
];
