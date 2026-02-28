'use client';
import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Connection, connectionTypeConfig } from '@/data/connections';

interface InfoPanelProps {
  node: {
    id: string;
    title: string;
    description: string;
    status: string;
    techStack: string[];
    link: string;
  };
  connections: Connection[];
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  Dev: '#3b82f6',
  MVP: '#eab308',
  Prod: '#22c55e',
};

export default function ConceptInfoPanel({ node, connections, onClose }: InfoPanelProps) {
  return (
    <div className="absolute top-0 right-0 z-30 h-full w-80 max-w-[90vw]
                    bg-gray-900/90 backdrop-blur-md border-l border-white/10
                    overflow-y-auto animate-slide-in-right">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="p-6 pt-12 space-y-5">
        <div>
          <h2 className="text-white text-lg font-bold">{node.title}</h2>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: statusColors[node.status] || '#6b7280' }}
          >
            {node.status}
          </span>
        </div>

        <p className="text-white/70 text-sm leading-relaxed line-clamp-4">
          {node.description}
        </p>

        <div>
          <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2">
            Connections ({connections.length})
          </h3>
          <div className="space-y-2">
            {connections.map((conn, i) => {
              const config = connectionTypeConfig[conn.type];
              const connectedTo = conn.source === node.id ? conn.target : conn.source;
              return (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-white/5">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <div>
                    <p className="text-white/90 text-sm font-medium">{connectedTo}</p>
                    {conn.label && (
                      <p className="text-white/40 text-xs mt-0.5">{conn.label}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2">Tech Stack</h3>
          <div className="flex flex-wrap gap-1.5">
            {node.techStack.map(tech => (
              <span key={tech} className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-xs">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {node.link && node.link.startsWith('http') && (
          <a
            href={node.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium
                       transition-colors w-full justify-center mt-4"
          >
            Visit Project <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
