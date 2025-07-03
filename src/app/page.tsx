// src/app/page.tsx
import fs from 'fs';
import path from 'path';
import ClientWrapper from '@/components/ClientWrapper';

export default function HomePage() {
  // Read images directory and get all image files
  const imagesDirectory = path.join(process.cwd(), 'public/images');
  const galleryImages = fs.readdirSync(imagesDirectory)
    // Filter for image files only
    .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
    // Add the /images/ prefix to each filename
    .map(file => `/images/${file}`);

  return (
    <ClientWrapper galleryImages={galleryImages} />
  );
}