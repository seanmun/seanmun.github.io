// File: src/app/projects/[slug]/page.tsx
// Purpose: Dedicated feature page for each project card

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projects } from '@/data/projects';
import { ProjectFeaturePage } from '@/components/ProjectFeaturePage';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};

  const description =
    project.modalContent?.overview?.slice(0, 160) ?? project.description.slice(0, 160);
  const image = project.modalContent?.images?.[0]?.src ?? '/profile/smunley2019.png';

  return {
    title: `${project.title} | Sean Munley`,
    description,
    openGraph: {
      title: `${project.title} | Sean Munley`,
      description,
      url: `https://seanmun.com/projects/${project.slug}`,
      siteName: 'Sean Munley',
      images: [{ url: image, alt: project.title }],
      locale: 'en-US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} | Sean Munley`,
      description,
      images: [image],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return <ProjectFeaturePage project={project} />;
}
