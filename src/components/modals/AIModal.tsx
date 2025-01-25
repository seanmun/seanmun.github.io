import { X } from "lucide-react"
import Image from 'next/image'

interface AIModalProps {
 isOpen: boolean
 onClose: () => void
 settings: {
   theme: 'light' | 'dark' | 'amber'
 }
}

export const AIModal = ({ isOpen, onClose, settings }: AIModalProps) => {
 if (!isOpen) return null

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
     <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
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
           Embracing AI in Development
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

       <div className={`p-4 space-y-4 overflow-y-auto max-h-[60vh] md:max-h-[70vh]
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
             While I&rsquo;m experienced in multiple programming languages, I&rsquo;ve embraced AI to accelerate development and innovation. This approach has transformed how I build solutions, allowing me to focus on creative problem-solving rather than getting caught up in framework complexities.
           </p>

           <div className="my-6 flex justify-center">
             <Image
               src="/profile/silencememe.jpg"
               alt="Silence Meme"
               width={400}
               height={300}
               quality={75}
               className="rounded-lg max-w-full h-auto"
             />
           </div>

           <p>
             We&rsquo;re entering an era where the ability to conceptualize and direct AI tools is becoming as valuable as traditional coding skills. Success increasingly belongs to those who can effectively leverage these new technologies.
           </p>

           <p>
             This site demonstrates this approach in action, built using various AI platforms including Claude, Venice, Grok, ChatGPT, and Gemini. I continuously explore and integrate new AI tools to enhance development capabilities.
           </p>
         </div>
       </div>
     </div>
   </div>
 )
}