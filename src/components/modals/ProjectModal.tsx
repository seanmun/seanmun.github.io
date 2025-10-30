'use client';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Mail } from 'lucide-react';
import Image from 'next/image';
import { Project } from '@/data/projects';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ProjectModal = ({ isOpen, onClose, project }: ProjectModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  if (!isOpen) return null;

  // If no modal content, use project description as fallback
  const modalContent = project.modalContent || {
    overview: project.description,
    callToAction: project.link && project.link !== '#' ? {
      primary: { label: 'View Repository', url: project.link }
    } : undefined
  };

  const hasImages = modalContent.images && modalContent.images.length > 0;
  const hasMultipleImages = modalContent.images && modalContent.images.length > 1;

  const nextImage = () => {
    if (modalContent.images) {
      setCurrentImageIndex((prev) => (prev + 1) % modalContent.images!.length);
    }
  };

  const prevImage = () => {
    if (modalContent.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? modalContent.images!.length - 1 : prev - 1
      );
    }
  };

  const CTAButtons = () => (
    <div className="flex flex-col sm:flex-row gap-3">
      {modalContent.callToAction?.primary && (
        <a
          href={modalContent.callToAction.primary.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium hover:opacity-90"
        >
          <ExternalLink className="w-4 h-4" />
          {modalContent.callToAction.primary.label}
        </a>
      )}
      {modalContent.callToAction?.secondary && (
        <a
          href={modalContent.callToAction.secondary.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 transition-colors font-medium hover:opacity-80"
        >
          <Mail className="w-4 h-4" />
          {modalContent.callToAction.secondary.label}
        </a>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {project.title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image Carousel */}
        {hasImages && (
          <div className="relative bg-gray-50 dark:bg-gray-900">
            <div
              className="relative h-64 md:h-96 overflow-hidden cursor-pointer"
              onClick={() => setFullscreenImage(modalContent.images![currentImageIndex].src)}
            >
              <Image
                src={modalContent.images![currentImageIndex].src}
                alt={modalContent.images![currentImageIndex].alt}
                fill
                className="object-contain"
                quality={85}
                priority={currentImageIndex === 0}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />

              {/* Carousel controls - arrows only */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Image indicators - below image, above caption */}
            {hasMultipleImages && (
              <div className="flex justify-center gap-2 py-3">
                {modalContent.images!.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex
                        ? 'bg-gray-700 dark:bg-gray-300'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-400'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Image caption */}
            {modalContent.images![currentImageIndex].caption && (
              <div className="px-4 pb-3 text-sm text-center text-gray-600 dark:text-gray-400">
                {modalContent.images![currentImageIndex].caption}
              </div>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 text-gray-700 dark:text-gray-300">

            {/* Overview */}
            {modalContent.overview && (
              <div>
                <p className="leading-relaxed">{modalContent.overview}</p>
              </div>
            )}

            {/* Key Features */}
            {modalContent.keyFeatures && modalContent.keyFeatures.length > 0 && (
              <div>
                <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                  Key Features
                </h4>
                <ul className="list-disc pl-5 space-y-2">
                  {modalContent.keyFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Details */}
            {modalContent.technicalDetails && (
              <div>
                <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                  Technical Stack
                </h4>
                <p className="leading-relaxed">{modalContent.technicalDetails}</p>
              </div>
            )}

            {/* Planned Features */}
            {modalContent.plannedFeatures && modalContent.plannedFeatures.length > 0 && (
              <div>
                <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                  Planned Features
                </h4>
                <ul className="list-disc pl-5 space-y-2">
                  {modalContent.plannedFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Special Sections - MOVED TO BOTTOM */}
            {modalContent.specialSections?.map((section, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              >
                <h4 className="text-lg font-medium mb-3 text-green-800 dark:text-green-300">
                  {section.title}
                </h4>

                {section.image && (
                  <div className="flex justify-center mb-3">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      width={400}
                      height={300}
                      quality={85}
                      className="rounded-lg max-w-full h-auto border border-gray-200 dark:border-gray-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <p className="text-sm text-green-700 dark:text-green-300">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA Buttons */}
        {modalContent.callToAction && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            <CTAButtons />
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            <div
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={fullscreenImage}
                alt="Fullscreen view"
                width={1200}
                height={800}
                className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
                quality={100}
              />
            </div>
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Close fullscreen"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
