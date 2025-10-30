import { X } from "lucide-react"
import { ThemeName } from '@/config/themes'

interface CertsModalProps {
 isOpen: boolean
 onClose: () => void
 settings: {
   theme: ThemeName
 }
}

export const CertsModal = ({ isOpen, onClose, settings }: CertsModalProps) => {
 if (!isOpen) return null

 // For page-specific themes (myspace, windows98), use default light styling in modals
 const isPageTheme = settings.theme === 'myspace' || settings.theme === 'windows98';
 const effectiveTheme = isPageTheme ? 'light' : settings.theme;

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
     <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
       <div className={`sticky top-0 rounded-t-lg flex justify-between items-center p-4 border-b
         ${effectiveTheme === 'amber'
           ? 'bg-amber-50 border-amber-100'
           : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
         }`}>
         <h3 className={`text-xl font-semibold
           ${effectiveTheme === 'amber'
             ? 'text-amber-900'
             : 'text-gray-900 dark:text-white'
           }`}>
           Certifications & Skills
         </h3>
         <button
           onClick={onClose}
           className={`p-2 rounded-full transition-colors
             ${effectiveTheme === 'amber'
               ? 'text-amber-600 hover:bg-amber-100'
               : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
             }`}
           aria-label="Close modal"
         >
           <X className="w-6 h-6" />
         </button>
       </div>

       <div className={`p-4 space-y-6 overflow-y-auto max-h-[60vh] md:max-h-[70vh]
         ${effectiveTheme === 'amber'
           ? 'bg-amber-50'
           : 'bg-white dark:bg-gray-800'
         }`}>
         <div>
           <h4 className={`text-lg font-medium mb-2
             ${effectiveTheme === 'amber'
               ? 'text-amber-900'
               : 'text-gray-800 dark:text-gray-200'
             }`}>
             Certification
           </h4>
           <p className={`${effectiveTheme === 'amber' ? 'text-amber-800' : 'text-gray-600 dark:text-gray-400'}`}>
             University of Penn LPS Full Stack Coding Boot Camp <span className="text-gray-500 dark:text-gray-500">- July 2019</span>
           </p>
         </div>

         <div>
           <h4 className={`text-lg font-medium mb-2
             ${effectiveTheme === 'amber'
               ? 'text-amber-900'
               : 'text-gray-800 dark:text-gray-200'
             }`}>
             Dev Proficiencies
           </h4>
           <p className="flex flex-wrap gap-2">
             {['HTML/CSS', 'SQL', 'AMP4email', 'AMPscript', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'Handlebars', 'Next.js', 'Express.js', 'Python'
             ].map((skill) => (
               <span
                 key={skill}
                 className="px-2 py-1 rounded text-sm tech-tag"
               >
                 {skill}
               </span>
             ))}
           </p>
         </div>

         <div>
           <h4 className={`text-lg font-medium mb-2
             ${effectiveTheme === 'amber'
               ? 'text-amber-900'
               : 'text-gray-800 dark:text-gray-200'
             }`}>
             CRM Tools
           </h4>
           <p className="flex flex-wrap gap-2">
             {[
               'Shopify', 'Salesforce', 'SFMC', 'Data Cloud', 'Pardot', 
               'Veeva', 'Eloqua', 'Iterable', 'Marketo', 'HubSpot', 'Campaign Monitor', 'Constant Contact'
             ].map((tool) => (
               <span
                 key={tool}
                 className="px-2 py-1 rounded text-sm tech-tag"
               >
                 {tool}
               </span>
             ))}
           </p>
         </div>

         <div>
           <h4 className={`text-lg font-medium mb-2
             ${effectiveTheme === 'amber'
               ? 'text-amber-900'
               : 'text-gray-800 dark:text-gray-200'
             }`}>
             AI Tools
           </h4>
           <p className="flex flex-wrap gap-2">
             {[
               'Claude', 'ChatGPT', 'Gemini', 'Venice', 'Grok', 'Claude API', 'OpenAI API', 'Gemini API', 'Venice Token API', 'Agentforce', 'Veo 3', 'n8n'
             ].map((tool) => (
               <span
                 key={tool}
                 className="px-2 py-1 rounded text-sm tech-tag"
               >
                 {tool}
               </span>
             ))}
           </p>
         </div>

         <div>
           <h4 className={`text-lg font-medium mb-2
             ${effectiveTheme === 'amber'
               ? 'text-amber-900'
               : 'text-gray-800 dark:text-gray-200'
             }`}>
             Project Management Tools
           </h4>
           <p className="flex flex-wrap gap-2">
             {[
               'JIRA', 'Notion', 'Monday.com', 'Workfront'
             ].map((tool) => (
               <span
                 key={tool}
                 className="px-2 py-1 rounded text-sm tech-tag"
               >
                 {tool}
               </span>
             ))}
           </p>
         </div>

         
       </div>
     </div>
   </div>
 )
}