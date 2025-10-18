import { X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from 'next/image'
import { useState } from 'react'
import { ThemeName } from '@/config/themes'

interface HinkieBotModalProps {
  isOpen: boolean
  onClose: () => void
  settings: {
    theme: ThemeName
  }
}

export const HinkieBotModal = ({ isOpen, onClose, settings }: HinkieBotModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const carouselItems = [
    {
      image: "/projects/start.png",
      title: "/start Command",
      description: "Initial bot welcome message with available commands and features overview"
    },
    {
      image: "/projects/rules.png", 
      title: "/rules Command",
      description: "Complete league rules and regulations displayed in an organized format"
    },
    {
      image: "/projects/moreRules.png",
      title: "Extended Rules",
      description: "Detailed rules commands to keep order in a complex league"
    },
    {
      image: "/projects/matchup.png",
      title: "Matchup Information", 
      description: "Current week head-to-head matchup details"
    },
    {
      image: "/projects/player.png",
      title: "Player Information",
      description: "Detailed player information, salary, and fantasy relevance"
    },
    {
      image: "/projects/roster.png",
      title: "Roster Management",
      description: "Team roster display with player positions, roster status, and salary cap totals"
    },
    {
      image: "/projects/standings.png",
      title: "League Standings",
      description: "Current league standings with win-loss records and playoff positioning"
    },
    {
      image: "/projects/responds.png",
      title: "Hinkie Insights",
      description: "Sam Hinkie wisdom and motivational quotes delivered throughout conversations"
    }
  ]

  if (!isOpen) return null

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl my-4 md:my-8">
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
            Fantasy League Bot
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
        <div className={`p-4 overflow-y-auto max-h-[70vh] md:max-h-[80vh]
          ${settings.theme === 'amber'
            ? 'bg-amber-50'
            : 'bg-white dark:bg-gray-800'
          }`}>
          
          {/* Bot Description */}
          <div className={`space-y-4 mb-6
            ${settings.theme === 'amber'
              ? 'text-amber-900'
              : 'text-gray-600 dark:text-gray-300'
            }`}>
            
            <div className="space-y-3">
              <h4 className={`text-lg font-medium
                ${settings.theme === 'amber'
                  ? 'text-amber-900'
                  : 'text-gray-800 dark:text-gray-200'
                }`}>
                Sam Hinkie Bot (@Sam_Hinkie_bot)
              </h4>
              <p>
                A Telegram bot for fantasy basketball league management, powered by the wisdom of Sam Hinkie. 
                This bot helps manage league information, provides Hinkie quotes, and facilitates league 
                communication while maintaining the spirit of &ldquo;Trust the Process.&rdquo;
              </p>
            </div>

            <div className="space-y-3">
              <h4 className={`text-lg font-medium
                ${settings.theme === 'amber'
                  ? 'text-amber-900'
                  : 'text-gray-800 dark:text-gray-200'
                }`}>
                Features
              </h4>
              
              <div className="space-y-2">
                <h5 className={`font-medium
                  ${settings.theme === 'amber'
                    ? 'text-amber-800'
                    : 'text-gray-700 dark:text-gray-300'
                  }`}>
                  Sam Hinkie Quotes
                </h5>
                <p className="text-sm">Get inspirational quotes from Sam Hinkie by:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Replying to any bot message</li>
                  <li>Mentioning &ldquo;Hinkie&rdquo; in chat</li>
                  <li>Tagging @Sam_Hinkie_bot</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h5 className={`font-medium
                  ${settings.theme === 'amber'
                    ? 'text-amber-800'
                    : 'text-gray-700 dark:text-gray-300'
                  }`}>
                  League Information Commands
                </h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/rules</code> - League rules
                  </div>
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/settings</code> - League settings
                  </div>
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/prize</code> - Prize structure
                  </div>
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/keeper</code> - Keeper rules
                  </div>
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/redshirt</code> - Redshirt rules
                  </div>
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/cap</code> - Salary cap info
                  </div>
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/dues</code> - League dues
                  </div>
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/franchise</code> - Franchise rules
                  </div>
                  <div className="space-y-1">
                    <code className={`px-1 py-0.5 rounded text-xs
                      ${settings.theme === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>/draft</code> - Draft information
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Carousel */}
          <div className="space-y-4">
            <h4 className={`text-lg font-medium
              ${settings.theme === 'amber'
                ? 'text-amber-900'
                : 'text-gray-800 dark:text-gray-200'
              }`}>
              Bot in Action
            </h4>
            
            <div className="relative">
              {/* Carousel Container */}
              <div className={`relative rounded-lg overflow-hidden
                ${settings.theme === 'amber'
                  ? 'bg-amber-100'
                  : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                
                {/* Image */}
                <div className="aspect-video relative">
                  <Image
                    src={carouselItems[currentSlide].image}
                    alt={carouselItems[currentSlide].title}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Navigation Buttons */}
                <button
                  onClick={prevSlide}
                  className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors
                    ${settings.theme === 'amber'
                      ? 'bg-amber-200 hover:bg-amber-300 text-amber-800'
                      : 'bg-white hover:bg-gray-100 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'
                    }`}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={nextSlide}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors
                    ${settings.theme === 'amber'
                      ? 'bg-amber-200 hover:bg-amber-300 text-amber-800'
                      : 'bg-white hover:bg-gray-100 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'
                    }`}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {carouselItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors
                        ${currentSlide === index
                          ? settings.theme === 'amber'
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                          : settings.theme === 'amber'
                            ? 'bg-amber-300'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Image Caption */}
              <div className={`mt-3 text-center
                ${settings.theme === 'amber'
                  ? 'text-amber-900'
                  : 'text-gray-700 dark:text-gray-300'
                }`}>
                <h5 className="font-medium text-sm">{carouselItems[currentSlide].title}</h5>
                <p className="text-xs mt-1">{carouselItems[currentSlide].description}</p>
              </div>
            </div>
          </div>

          {/* GitHub Link */}
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
                  View the complete source code and setup instructions on GitHub:
                </p>
                <a 
                  href="https://github.com/seanmun/HinkieBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm inline-flex items-center ${
                    settings.theme === 'amber'
                      ? 'text-amber-700 hover:text-amber-900'
                      : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                  } transition-colors`}
                >
                  View HinkieBot Repository →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}