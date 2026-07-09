// File: src/components/ui/ProjectIcon.tsx
// Purpose: Shared icon lookup for project cards and project feature pages

import {
  Zap,
  Trophy,
  Box,
  Beef,
  Bot,
  Activity,
  Sun,
  Key,
  Banknote,
  Medal,
  DollarSign,
  Rocket,
  Mic,
  LandPlot
} from 'lucide-react';

const iconMap = {
  Zap,
  Trophy,
  Box,
  Beef,
  Bot,
  Activity,
  Sun,
  Key,
  Banknote,
  Medal,
  DollarSign,
  Rocket,
  Mic,
  LandPlot
};

interface ProjectIconProps {
  iconName: string;
  className?: string;
}

export function ProjectIcon({ iconName, className = 'w-12 h-12 text-blue-600' }: ProjectIconProps) {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent className={className} /> : null;
}
