'use client'

import SlugMigrationTool from '@/app/components/admin/SlugMigrationTool'

export default function SlugMigrationPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Slug Migration Tool</h1>
      <div className="mb-8">
        <p className="mb-2">
          This tool helps migrate content that is missing localized slugs. It can:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Audit content to find items without proper localized slugs</li>
          <li>Automatically generate appropriate slugs based on content titles</li>
          <li>Resolve potential slug collisions across locales</li>
        </ul>
        <p className="text-yellow-600">
          <strong>Note:</strong> This is an administrative tool and should be used with caution. 
          Changes made by this tool affect live content URLs.
        </p>
      </div>
      
      <SlugMigrationTool />
    </div>
  )
} 