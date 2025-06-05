import { X } from "lucide-react"
import Image from 'next/image'

interface OrdinalFrameModalProps {
  isOpen: boolean
  onClose: () => void
  settings: {
    theme: 'light' | 'dark' | 'amber'
  }
}

export const OrdinalFrameModal = ({ isOpen, onClose, settings }: OrdinalFrameModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
        {/* Sticky header with close button */}
        <div className={`sticky top-0 rounded-t-lg flex justify-between items-center p-4 border-b
          ${settings.theme === 'amber'
            ? 'bg-amber-50 border-amber-100'
            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
          }`}>
          <h3 className={`text-xl font-semibold
            ${settings.theme === 'amber'
              ? 'text-amber-900'
              : 'text-gray-900 dark:text-white'
            }`}>
            OrdinalFrame
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors
              ${settings.theme === 'amber'
                ? 'text-amber-600 hover:bg-amber-100'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className={`p-4 overflow-y-auto max-h-[60vh] md:max-h-[70vh]
          ${settings.theme === 'amber'
            ? 'bg-amber-50'
            : 'bg-white dark:bg-gray-800'
          }`}>
          <div className={`space-y-4
            ${settings.theme === 'amber'
              ? 'text-amber-900'
              : 'text-gray-600 dark:text-gray-300'
            }`}>
            
            <p>
              OrdinalFrame transforms a Raspberry Pi into a dynamic digital art frame that showcases Bitcoin Ordinals - unique digital artifacts inscribed directly onto the Bitcoin blockchain. This project bridges the gap between blockchain technology and physical art display.
            </p>

            {/* Project Images */}
            <div className="my-6 space-y-4">
              <div className="flex justify-center">
                <Image
                  src="/projects/ordinalframe-display.jpg"
                  alt="OrdinalFrame displaying Bitcoin Ordinals"
                  width={400}
                  height={300}
                  quality={75}
                  className="rounded-lg max-w-full h-auto"
                  priority
                  onError={(e) => {
                    // Hide image if it fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Optional second image */}
              <div className="flex justify-center">
                <Image
                  src="/projects/ordinalframe-setup.jpg"
                  alt="OrdinalFrame hardware setup"
                  width={400}
                  height={300}
                  quality={75}
                  className="rounded-lg max-w-full h-auto"
                  onError={(e) => {
                    // Hide image if it fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className={`text-lg font-medium
                ${settings.theme === 'amber'
                  ? 'text-amber-900'
                  : 'text-gray-800 dark:text-gray-200'
                }`}>
                Project Overview
              </h4>
              <p>
                A Bitcoin Ordinals digital art frame built on Raspberry Pi hardware. The frame automatically cycles through and displays Bitcoin Ordinals (digital artifacts inscribed on the Bitcoin blockchain), creating a unique intersection of cryptocurrency technology and physical art display.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className={`text-lg font-medium
                ${settings.theme === 'amber'
                  ? 'text-amber-900'
                  : 'text-gray-800 dark:text-gray-200'
                }`}>
                Key Features
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Automatic rotation through Bitcoin Ordinal collections</li>
                <li>Raspberry Pi-powered with high-resolution display</li>
                <li>Real-time fetching of Ordinals from the Bitcoin blockchain</li>
                <li>Support for various Ordinal formats (images, text, inscriptions)</li>
                <li>Remote configuration and collection management</li>
                <li>Energy-efficient operation for continuous display</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className={`text-lg font-medium
                ${settings.theme === 'amber'
                  ? 'text-amber-900'
                  : 'text-gray-800 dark:text-gray-200'
                }`}>
                Technical Stack
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Hardware:</strong> Raspberry Pi with dedicated display</li>
                <li><strong>Software:</strong> Python scripts for blockchain integration</li>
                <li><strong>APIs:</strong> Bitcoin blockchain and Ordinals indexers</li>
                <li><strong>Display:</strong> Custom rendering engine for various media types</li>
                <li><strong>Storage:</strong> Local caching with automatic updates</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className={`text-lg font-medium
                ${settings.theme === 'amber'
                  ? 'text-amber-900'
                  : 'text-gray-800 dark:text-gray-200'
                }`}>
                Planned Features
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Bitcoin message signature verification:</strong> Authenticate ownership of displayed Ordinals</li>
                <li><strong>Multi-wallet support:</strong> Display Ordinals from multiple Bitcoin wallets</li>
                <li><strong>Collection-based selection:</strong> Curate and cycle through specific Ordinal collections</li>
                <li><strong>Advanced display modes:</strong> Slideshow timing, transitions, and viewing preferences</li>
                <li><strong>Custom frame design:</strong> Physical frame design has been commissioned for a polished presentation</li>
                <li><strong>3D blueprint creation:</strong> Complete DIY blueprint for 3D printing the frame enclosure</li>
              </ul>
            </div>

            <div className={`mt-6 p-4 rounded-lg ${
              settings.theme === 'amber'
                ? 'bg-amber-100'
                : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1">
                  <p className={`text-sm mb-2 ${
                    settings.theme === 'amber'
                      ? 'text-amber-800'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    View the complete source code, setup instructions, and technical documentation on GitHub:
                  </p>
                  <a 
                    href="https://github.com/seanmun/ordinalframe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm inline-flex items-center ${
                      settings.theme === 'amber'
                        ? 'text-amber-700 hover:text-amber-900'
                        : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                    } transition-colors`}
                  >
                    View on GitHub →
                  </a>
                </div>
                <div>
                  <p className={`text-xs ${
                    settings.theme === 'amber'
                      ? 'text-amber-600'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Questions? <a 
                      href="mailto:sean.munley@protonmail.com"
                      target="_blank"
                      className={`${
                        settings.theme === 'amber'
                          ? 'text-amber-700 hover:text-amber-900'
                          : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                      } transition-colors`}
                    >
                      Get in touch
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}