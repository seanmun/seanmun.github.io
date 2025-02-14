import PersonalWebsite from '@/components/personal-website';

export default function HomePage() {
  // These are the images you want to display in the gallery
  const galleryImages = [
    '/gallery/image1.jpg',
    '/gallery/image2.jpg',
    // ... add your gallery images here
  ];

  return (
    <PersonalWebsite galleryImages={galleryImages} />
  );
}