'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { projects } from '@/data/projects';
import { connections, connectionTypeConfig, ConnectionType } from '@/data/connections';
import ConceptInfoPanel from './ConceptInfoPanel';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface GraphNode {
  id: string;
  title: string;
  description: string;
  status: string;
  techStack: string[];
  link: string;
  connectionCount: number;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: ConnectionType;
  label?: string;
  color: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const statusColorMap: Record<string, string> = {
  Dev: '#3b82f6',
  MVP: '#eab308',
  Prod: '#22c55e',
};

function getThemeColors() {
  if (typeof document === 'undefined') {
    return { background: '#050a18', nodeColor: '#3b82f6', nodeHighlight: '#60a5fa' };
  }
  const theme = document.documentElement.getAttribute('data-theme') || 'default';
  switch (theme) {
    case 'dark':
      return { background: '#050a18', nodeColor: '#60a5fa', nodeHighlight: '#93c5fd' };
    case 'amber':
      return { background: '#0a0500', nodeColor: '#e46611', nodeHighlight: '#FFD700' };
    default:
      return { background: '#050a18', nodeColor: '#3b82f6', nodeHighlight: '#60a5fa' };
  }
}

export default function ConceptGraph() {
  const fgRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [themeColors, setThemeColors] = useState(getThemeColors);
  const [legendVisible, setLegendVisible] = useState(true);
  const [showManifesto, setShowManifesto] = useState(true);

  // Responsive sizing
  useEffect(() => {
    const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Theme observer
  useEffect(() => {
    setThemeColors(getThemeColors());
    const observer = new MutationObserver(() => setThemeColors(getThemeColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Build graph data
  const graphData: GraphData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => { counts[p.title] = 0; });
    connections.forEach(c => {
      counts[c.source] = (counts[c.source] || 0) + 1;
      counts[c.target] = (counts[c.target] || 0) + 1;
    });

    const nodes: GraphNode[] = projects.map(p => ({
      id: p.title,
      title: p.title,
      description: p.description,
      status: p.status,
      techStack: p.techStack,
      link: p.link,
      connectionCount: counts[p.title] || 0,
    }));

    const links: GraphLink[] = connections.map(c => ({
      source: c.source,
      target: c.target,
      type: c.type,
      label: c.label,
      color: connectionTypeConfig[c.type].color,
    }));

    return { nodes, links };
  }, []);

  // Precompute link curvature for duplicate edges
  const linkCurvatures = useMemo(() => {
    const pairCounts: Record<string, number> = {};
    const pairIndices: Record<string, number> = {};

    return graphData.links.map(link => {
      const s = typeof link.source === 'string' ? link.source : link.source.id;
      const t = typeof link.target === 'string' ? link.target : link.target.id;
      const pair = [s, t].sort().join('---');

      if (!(pair in pairCounts)) {
        pairCounts[pair] = graphData.links.filter(l => {
          const ls = typeof l.source === 'string' ? l.source : l.source.id;
          const lt = typeof l.target === 'string' ? l.target : l.target.id;
          return [ls, lt].sort().join('---') === pair;
        }).length;
        pairIndices[pair] = 0;
      }

      const total = pairCounts[pair];
      const idx = pairIndices[pair]++;
      if (total <= 1) return 0;
      return 0.25 * (idx - (total - 1) / 2);
    });
  }, [graphData.links]);

  // Configure forces for massive spread + set initial camera far back + add stars
  useEffect(() => {
    if (!fgRef.current) return;
    const fg = fgRef.current;

    // Massive spread - nodes repel hard, links keep related ones closer
    fg.d3Force('charge')?.strength(-4000).distanceMax(2000);
    fg.d3Force('link')?.distance(800);

    // Add starfield background
    const scene = fg.scene();
    if (scene) {
      // Dense star field - small points
      const starCount = 8000;
      const starGeo = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);
      for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 20000;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 20000;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 20000;
        starSizes[i] = Math.random() * 3 + 0.5;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      // Constellation lines - a few distant geometric patterns
      const constellationData = [
        // Constellation 1 - triangle shape far away
        [[-6000, 3000, -8000], [-5500, 3800, -8200], [-5200, 3100, -7800], [-6000, 3000, -8000]],
        // Constellation 2 - zigzag
        [[4000, -2000, -7000], [4300, -1500, -7200], [4600, -2200, -6800], [4900, -1600, -7100], [5200, -2100, -6900]],
        // Constellation 3 - diamond
        [[-3000, 5000, -9000], [-2600, 5500, -9100], [-2200, 5000, -8900], [-2600, 4500, -9000], [-3000, 5000, -9000]],
        // Constellation 4 - arc
        [[-1000, -4000, -8500], [-500, -3600, -8300], [200, -3500, -8400], [900, -3700, -8200], [1400, -4100, -8500]],
        // Constellation 5 - W shape
        [[7000, 1000, -9000], [7300, 1800, -9100], [7600, 1200, -8900], [7900, 1900, -9000], [8200, 1100, -9100]],
      ];

      constellationData.forEach(points => {
        const lineGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(points.length * 3);
        points.forEach((p, i) => {
          linePositions[i * 3] = p[0];
          linePositions[i * 3 + 1] = p[1];
          linePositions[i * 3 + 2] = p[2];
        });
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x4488cc,
          transparent: true,
          opacity: 0.15,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);

        // Add bright dots at constellation vertices
        points.forEach(p => {
          const dotGeo = new THREE.SphereGeometry(8, 8, 8);
          const dotMat = new THREE.MeshBasicMaterial({
            color: 0x88bbff,
            transparent: true,
            opacity: 0.6,
          });
          const dot = new THREE.Mesh(dotGeo, dotMat);
          dot.position.set(p[0], p[1], p[2]);
          scene.add(dot);
        });
      });
    }

    // Push camera way back to see the full universe
    setTimeout(() => {
      fg.cameraPosition({ x: 0, y: 500, z: 3500 });
    }, 100);
  }, []);

  // Node click - fly to node
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
    if (fgRef.current && node.x !== undefined) {
      const distance = 80;
      const dist = Math.hypot(node.x, node.y || 0, node.z || 0);
      const ratio = 1 + distance / (dist || 1);
      fgRef.current.cameraPosition(
        { x: node.x * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
        { x: node.x, y: node.y, z: node.z },
        1500
      );
    }
  }, []);

  // Escape to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNode(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Highlight set
  const highlightNodes = useMemo(() => {
    if (!selectedNode) return null;
    const set = new Set<string>([selectedNode.id]);
    connections.forEach(c => {
      if (c.source === selectedNode.id) set.add(c.target);
      if (c.target === selectedNode.id) set.add(c.source);
    });
    return set;
  }, [selectedNode]);

  // Paint text onto a canvas and return as a texture
  // All sizes are proportional to card dimensions so text scales with node size
  const createCardTexture = useCallback((n: GraphNode, w: number, h: number, color: string, isHighlighted: boolean) => {
    const res = 4; // resolution multiplier
    const cw = w * res;
    const ch = h * res;
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d')!;

    // All proportions relative to canvas size
    const pad = cw * 0.04; // padding

    // Background
    ctx.fillStyle = isHighlighted ? '#0f172a' : '#080d1a';
    ctx.fillRect(0, 0, cw, ch);

    // Top accent bar
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, cw, ch * 0.04);

    // Status badge
    const statusText = n.status.toUpperCase();
    const badgeFontSize = ch * 0.08;
    ctx.font = `bold ${badgeFontSize}px Arial`;
    const badgeWidth = ctx.measureText(statusText).width + pad * 1.5;
    const badgeHeight = ch * 0.1;
    const badgeY = ch * 0.06;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(pad, badgeY, badgeWidth, badgeHeight, badgeHeight * 0.3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(statusText, pad * 1.6, badgeY + badgeHeight * 0.75);

    // Title
    const titleFontSize = ch * 0.12;
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.fillStyle = isHighlighted ? '#f1f5f9' : '#334155';
    const titleY = ch * 0.28;
    ctx.fillText(n.title, pad, titleY);

    // Divider line
    const dividerY = ch * 0.32;
    ctx.strokeStyle = isHighlighted ? color : '#1e293b';
    ctx.lineWidth = Math.max(1, ch * 0.005);
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(pad, dividerY);
    ctx.lineTo(cw - pad, dividerY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Description text - word wrap
    const descFontSize = ch * 0.075;
    ctx.font = `${descFontSize}px Arial`;
    ctx.fillStyle = isHighlighted ? '#94a3b8' : '#1e293b';
    const maxChars = 200;
    const desc = n.description.length > maxChars
      ? n.description.slice(0, maxChars) + '...'
      : n.description;
    const maxLineWidth = cw - pad * 2;
    const words = desc.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxLineWidth) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    const lineHeight = descFontSize * 1.3;
    let y = ch * 0.38;
    const maxLines = Math.floor((ch - y) / lineHeight);
    lines.slice(0, maxLines).forEach(line => {
      ctx.fillText(line, pad, y);
      y += lineHeight;
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  // Custom 3D node: rectangle with canvas-textured face
  const nodeThreeObject = useCallback((node: any) => {
    const n = node as GraphNode;
    const group = new THREE.Group();

    // Size scales linearly with connections (4 connections = 2x the size of 2 connections)
    const scale = n.connectionCount || 1;
    const width = 60 * scale;
    const height = 45 * scale;
    const depth = 3;

    // Determine color
    const isHighlighted = !highlightNodes || highlightNodes.has(n.id);
    const color = isHighlighted
      ? (statusColorMap[n.status] || themeColors.nodeColor)
      : '#1e293b';

    // Create canvas texture for front and back faces
    const faceTexture = createCardTexture(n, width, height, color, isHighlighted);

    // Materials: [right, left, top, bottom, front, back]
    const sideMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(isHighlighted ? '#0f172a' : '#080d1a'),
      emissive: new THREE.Color(color),
      emissiveIntensity: isHighlighted ? 0.2 : 0.02,
      transparent: true,
      opacity: isHighlighted ? 0.9 : 0.12,
    });

    const faceMaterial = new THREE.MeshBasicMaterial({
      map: faceTexture,
      transparent: true,
      opacity: isHighlighted ? 1 : 0.15,
    });

    const materials = [
      sideMaterial, sideMaterial, // right, left
      sideMaterial, sideMaterial, // top, bottom
      faceMaterial, faceMaterial, // front, back
    ];

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const box = new THREE.Mesh(geometry, materials);
    group.add(box);

    // Glowing edge outline
    const edgeGeo = new THREE.EdgesGeometry(geometry);
    const edgeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: isHighlighted ? 0.8 : 0.08,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edges);

    return group;
  }, [highlightNodes, themeColors, createCardTexture]);

  const linkOpacity = useCallback((link: GraphLink) => {
    if (!selectedNode) return 0.4;
    const s = typeof link.source === 'string' ? link.source : link.source.id;
    const t = typeof link.target === 'string' ? link.target : link.target.id;
    return (s === selectedNode.id || t === selectedNode.id) ? 0.9 : 0.05;
  }, [selectedNode]);

  const linkWidth = useCallback((link: GraphLink) => {
    if (!selectedNode) return 1;
    const s = typeof link.source === 'string' ? link.source : link.source.id;
    const t = typeof link.target === 'string' ? link.target : link.target.id;
    return (s === selectedNode.id || t === selectedNode.id) ? 3 : 0.3;
  }, [selectedNode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: themeColors.background }}>
      {/* Back navigation */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20
                   transition-all duration-200 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
        <h1 className="text-white/90 text-xl font-semibold tracking-wide">Project Ecosystem</h1>
        <p className="text-white/40 text-xs mt-1">Scroll to zoom &middot; Drag to orbit &middot; Click a node to explore</p>
      </div>

      {/* 3D Graph */}
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={themeColors.background}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
        linkColor={(link: any) => (link as GraphLink).color}
        linkOpacity={linkOpacity as any}
        linkWidth={linkWidth as any}
        linkCurvature={(link: any) => {
          const idx = graphData.links.indexOf(link as GraphLink);
          return idx >= 0 ? linkCurvatures[idx] : 0;
        }}
        linkDirectionalParticles={3}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={(link: any) => (link as GraphLink).color}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.2}
        warmupTicks={100}
        cooldownTicks={200}
        enableNodeDrag={false}
        onBackgroundClick={() => setSelectedNode(null)}
        controlType="orbit"
      />

      {/* Info panel */}
      {selectedNode && (
        <ConceptInfoPanel
          node={selectedNode}
          connections={connections.filter(
            c => c.source === selectedNode.id || c.target === selectedNode.id
          )}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Compound Growth Note */}
      {showManifesto && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm p-5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10">
          <button
            onClick={() => setShowManifesto(false)}
            className="absolute top-2 right-2 text-white/30 hover:text-white/70 text-xs"
          >
            &times;
          </button>
          <h3 className="text-white/90 text-sm font-semibold mb-2">Why everything connects</h3>
          <p className="text-white/60 text-xs leading-relaxed">
            Every project I build becomes infrastructure for the next one. Once Kinetic.email
            was operational, it didn&apos;t just send emails&mdash;it became a capability layer
            that elevated nine other apps overnight. Building the portfolio unlocked integration
            with Money Never Sleeps. Each new tool compounds on what came before.
          </p>
          <p className="text-white/60 text-xs leading-relaxed mt-2">
            The bigger the node, the more it connects to. That&apos;s not just a visual trick&mdash;it
            reflects real leverage. One project well-built creates exponential returns across
            the entire ecosystem.
          </p>
          <p className="text-white/40 text-[10px] mt-3 italic">
            Click a node to explore its connections.
          </p>
        </div>
      )}

      {!showManifesto && (
        <button
          onClick={() => setShowManifesto(true)}
          className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded bg-black/40 text-white/50
                     hover:text-white/80 text-xs backdrop-blur-sm"
        >
          About
        </button>
      )}

      {/* Legend */}
      {legendVisible && (
        <div className="absolute bottom-4 right-4 z-20 p-4 rounded-lg bg-black/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wider">Connection Types</h3>
            <button
              onClick={() => setLegendVisible(false)}
              className="text-white/40 hover:text-white/80 text-xs ml-4"
            >
              Hide
            </button>
          </div>
          <div className="space-y-1.5">
            {Object.entries(connectionTypeConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: config.color }} />
                <span className="text-white/70 text-xs">{config.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/10">
            <p className="text-white/40 text-[10px]">Node size = number of connections</p>
            <p className="text-white/40 text-[10px] mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{backgroundColor: '#22c55e'}}></span>Prod
              <span className="inline-block w-2 h-2 rounded-full ml-2 mr-1" style={{backgroundColor: '#eab308'}}></span>MVP
              <span className="inline-block w-2 h-2 rounded-full ml-2 mr-1" style={{backgroundColor: '#3b82f6'}}></span>Dev
            </p>
          </div>
        </div>
      )}

      {!legendVisible && (
        <button
          onClick={() => setLegendVisible(true)}
          className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded bg-black/40 text-white/50
                     hover:text-white/80 text-xs backdrop-blur-sm"
        >
          Show Legend
        </button>
      )}
    </div>
  );
}
