import { X } from "lucide-react"
import { ThemeName } from '@/config/themes'

interface ResumeModalProps {
 isOpen: boolean
 onClose: () => void
 settings: {
   theme: ThemeName
 }
}

export const ResumeModal = ({ isOpen, onClose, settings }: ResumeModalProps) => {
 if (!isOpen) return null

 // For page-specific themes (myspace, windows98), use default light styling in modals
 const isPageTheme = settings.theme === 'myspace' || settings.theme === 'windows98';
 const effectiveTheme = isPageTheme ? 'light' : settings.theme;

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
     <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
       {/* Sticky header with close button */}
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
           Professional Experience
         </h3>
         <button
           onClick={onClose}
           className={`p-2 rounded-full transition-colors
             ${effectiveTheme === 'amber'
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
         ${effectiveTheme === 'amber'
           ? 'bg-amber-50'
           : 'bg-white dark:bg-gray-800'
         }`}>
         <div className="space-y-6">
           {/* Career Summary */}
           <section>
             <h4 className={`text-lg font-medium mb-4
               ${effectiveTheme === 'amber'
                 ? 'text-amber-900'
                 : 'text-gray-800 dark:text-gray-200'
               }`}>
               CAREER SUMMARY
             </h4>
             
             <div className="space-y-6">
               {/* Digitas Health */}
               <div>
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h5 className="font-medium">
                       <a 
                         href="https://www.digitashealth.com/"
                         target="_blank"
                         rel="noopener noreferrer"
                         className={`hover:underline ${
                           effectiveTheme === 'amber'
                             ? 'text-amber-700 hover:text-amber-900'
                             : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                         }`}
                       >
                         DIGITAS HEALTH
                       </a>
                     </h5>
                     <p className={`text-sm ${
                       effectiveTheme === 'amber'
                         ? 'text-amber-600'
                         : 'text-gray-500 dark:text-gray-400'
                     }`}>Philadelphia, PA</p>
                   </div>
                   <span className={`text-sm ${
                     effectiveTheme === 'amber'
                       ? 'text-amber-600'
                       : 'text-gray-500 dark:text-gray-400'
                   }`}>2013 April – Present</span>
                 </div>
                 <ul className={`list-disc pl-5 space-y-1 ${
                   effectiveTheme === 'amber'
                     ? 'text-amber-800'
                     : 'text-gray-600 dark:text-gray-400'
                 }`}>
                   <li>Vice President/Director, CRM Innovation (Promotion, October 2019)</li>
                   <li>Director, Marketing Operations (Promotion, July 2015)</li>
                   <li>Manager, Marketing Operations</li>
                 </ul>
               </div>

               {/* Elsevier */}
               <div>
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h5 className="font-medium">
                       <a 
                         href="https://www.elsevier.com"
                         target="_blank"
                         rel="noopener noreferrer"
                         className={`hover:underline ${
                           effectiveTheme === 'amber'
                             ? 'text-amber-700 hover:text-amber-900'
                             : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                         }`}
                       >
                         ELSEVIER
                       </a>
                     </h5>
                     <p className={`text-sm ${
                       effectiveTheme === 'amber'
                         ? 'text-amber-600'
                         : 'text-gray-500 dark:text-gray-400'
                     }`}>Philadelphia, PA</p>
                   </div>
                   <span className={`text-sm ${
                     effectiveTheme === 'amber'
                       ? 'text-amber-600'
                       : 'text-gray-500 dark:text-gray-400'
                   }`}>2008 – 2013 April</span>
                 </div>
                 <ul className={`list-disc pl-5 space-y-1 ${
                   effectiveTheme === 'amber'
                     ? 'text-amber-800'
                     : 'text-gray-600 dark:text-gray-400'
                 }`}>
                   <li>Customer Marketing Manager (Promotion, September 2012)</li>
                   <li>Manager, Customer Analytics (Promotion, August 2010)</li>
                   <li>Direct Marketing Analyst</li>
                 </ul>
               </div>
             </div>
           </section>

           {/* Education */}
           <section>
             <h4 className={`text-lg font-medium mb-4
               ${effectiveTheme === 'amber'
                 ? 'text-amber-900'
                 : 'text-gray-800 dark:text-gray-200'
               }`}>
               EDUCATION
             </h4>
             <div className="flex justify-between items-start">
               <div>
                 <h5 className={`font-medium ${
                   effectiveTheme === 'amber'
                     ? 'text-amber-800'
                     : 'text-gray-700 dark:text-gray-300'
                 }`}>TEMPLE UNIVERSITY</h5>
                 <p className={`text-sm ${
                   effectiveTheme === 'amber'
                     ? 'text-amber-600'
                     : 'text-gray-500 dark:text-gray-400'
                 }`}>Philadelphia, PA</p>
                 <p className={
                   effectiveTheme === 'amber'
                     ? 'text-amber-800'
                     : 'text-gray-600 dark:text-gray-400'
                 }>Bachelor of Business Administration</p>
                 <p className={
                   effectiveTheme === 'amber'
                     ? 'text-amber-800'
                     : 'text-gray-600 dark:text-gray-400'
                 }>Major: Marketing</p>
               </div>
               <span className={`text-sm ${
                 effectiveTheme === 'amber'
                   ? 'text-amber-600'
                   : 'text-gray-500 dark:text-gray-400'
               }`}>2005 – 2008</span>
             </div>
           </section>

           {/* Contact Section */}
           <div className={`mt-8 p-4 rounded-lg ${
             effectiveTheme === 'amber'
               ? 'bg-amber-100'
               : 'bg-gray-50 dark:bg-gray-700'
           }`}>
             <p className={`text-sm mb-2 ${
               effectiveTheme === 'amber'
                 ? 'text-amber-800'
                 : 'text-gray-600 dark:text-gray-300'
             }`}>
               For a detailed resume including full work history and responsibilities, please get in touch:
             </p>
             <a 
               href="mailto:sean.munley@protonmail.com"
               className={`text-sm inline-flex items-center ${
                 effectiveTheme === 'amber'
                   ? 'text-amber-700 hover:text-amber-900'
                   : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
               } transition-colors`}
             >
               sean.munley@protonmail.com →
             </a>
           </div>
         </div>
       </div>
     </div>
   </div>
 )
}