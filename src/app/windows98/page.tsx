// src/app/windows98/page.tsx
import fs from 'fs';
import path from 'path';
import Windows98ClientWrapper from '@/components/Windows98ClientWrapper';

export default function Windows98Page() {
  // Read images directory and get all image files
  const imagesDirectory = path.join(process.cwd(), 'public/images');
  const galleryImages = fs.readdirSync(imagesDirectory)
    // Filter for image files only
    .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
    // Add the /images/ prefix to each filename
    .map(file => `/images/${file}`);

  return (
    <Windows98ClientWrapper galleryImages={galleryImages} />
  );
}
