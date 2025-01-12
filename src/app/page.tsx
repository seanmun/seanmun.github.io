import PersonalWebsite from '@/components/personal-website'
import { readdirSync } from 'fs'
import { join } from 'path'

export default function Home() {
  // Read all files from the public/images folder
  const imagesDirectory = join(process.cwd(), 'public/images')
  const imageFiles = readdirSync(imagesDirectory)
  
  // Create full paths for images
  const imagePaths = imageFiles.map(file => `/images/${file}`)

  return <PersonalWebsite galleryImages={imagePaths} />
}