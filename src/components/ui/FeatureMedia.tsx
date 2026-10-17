'use client';
// File: src/components/ui/FeatureMedia.tsx
// Purpose: Visuals inside project case studies — silent looping videos,
// stills, and diagrams.
// - Videos play only while at least a third is on screen and pause when
//   scrolled away; nothing below the fold downloads until it's needed
//   (preload="none"), and the hero only fetches metadata up front.
// - On phones, srcMobile swaps in a vertical cut, capped at 75% of the
//   screen height so it never becomes a wall; portrait loops get the same cap.
// - Reduced motion: no autoplay — the poster shows with native controls.
// - width/height reserve the box so the page doesn't jump as media loads.

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { ProjectMedia } from '@/data/projects';
import { KineticPipelineDiagram } from '@/components/ui/KineticPipelineDiagram';
import { BuddyCupTripDemo } from '@/components/ui/BuddyCupTripDemo';

function LoopVideo({ media, eager }: { media: ProjectMedia; eager: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // null until mounted: the source depends on screen size, which the server can't know
  const [isPhone, setIsPhone] = useState<boolean | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setIsPhone(window.matchMedia('(max-width: 639px)').matches);
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const vertical = Boolean(isPhone && media.srcMobile);
  const src = vertical ? media.srcMobile : media.src;
  const poster = vertical ? media.posterMobile ?? media.poster : media.poster;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isPhone === null || reduceMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [isPhone, reduceMotion, src]);

  // A portrait loop gets the same 75%-of-the-screen cap as a vertical cut
  const portrait = Boolean(media.width && media.height && media.height > media.width);
  const frameStyle: React.CSSProperties = vertical
    ? { aspectRatio: '9 / 16', width: 'min(100%, calc(75vh * 9 / 16))' }
    : portrait
      ? { aspectRatio: `${media.width} / ${media.height}`, width: `min(100%, calc(75vh * ${media.width} / ${media.height}))` }
      : { aspectRatio: media.width && media.height ? `${media.width} / ${media.height}` : '16 / 9', width: '100%' };

  return (
    <div className="mx-auto rounded-lg overflow-hidden bg-gray-950 shadow dark:shadow-gray-950/50" style={frameStyle}>
      <video
        ref={videoRef}
        key={src}
        muted
        loop
        playsInline
        preload={eager ? 'metadata' : 'none'}
        poster={poster}
        controls={reduceMotion}
        aria-label={media.alt}
        className="w-full h-full object-cover block"
      >
        {isPhone !== null && src && <source src={src} type="video/mp4" />}
      </video>
    </div>
  );
}

export function FeatureMedia({
  media,
  eager = false,
  inGrid = false,
}: {
  media: ProjectMedia;
  eager?: boolean;
  inGrid?: boolean; // the grid owns the spacing when visuals sit side by side
}) {
  return (
    <figure className={inGrid ? 'm-0' : 'my-6'}>
      {media.type === 'video' && <LoopVideo media={media} eager={eager} />}
      {media.type === 'image' && media.src && (
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width ?? 1280}
          height={media.height ?? 720}
          sizes="(max-width: 896px) 100vw, 832px"
          loading={eager ? 'eager' : 'lazy'}
          className="w-full h-auto rounded-lg shadow dark:shadow-gray-950/50"
        />
      )}
      {media.type === 'diagram' && media.diagram === 'kinetic-pipeline' && <KineticPipelineDiagram />}
      {media.type === 'diagram' && media.diagram === 'buddycup-trip' && <BuddyCupTripDemo />}
      {media.caption && (
        <figcaption className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">{media.caption}</figcaption>
      )}
    </figure>
  );
}
