import { useEffect, useState } from 'react'

interface ContentTypeAudit {
  length: number
  items: Array<{
    id: number
    title: string
    slug: string | null
    locale: string
  }>
}

interface AuditResults {
  blog: ContentTypeAudit
  project: ContentTypeAudit
  category: ContentTypeAudit
  page: ContentTypeAudit
}

interface MigrationError {
  itemId: number
  locale: string
  error: string
}

interface MigrationReport {
  contentType: string
  totalItems: number
  missingSlugItems: number
  fixedItems: number
  errors: MigrationError[]
}

interface MigrationResult {
  operation: string
  results: MigrationReport[]
}

interface MigrationSummary {
  totalFixed: number
  totalErrorItems: number
}

interface MigrationResponse {
  status: 'success' | 'error'
  summary?: MigrationSummary
  results?: MigrationResult[]
  message?: string
}

export default function SlugMigrationTool() {
  const [loading, setLoading] = useState(false)
  const [auditing, setAuditing] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null)
  const [migrationResults, setMigrationResults] = useState<MigrationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState({
    fixMissing: true,
    resolveCollisions: true
  })

  // Function to audit content for missing slugs
  const auditSlugs = async () => {
    setAuditing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/migrate-slugs/audit')
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.status === 'error') {
        throw new Error(data.message)
      }
      
      setAuditResults(data.auditResults)
    } catch (error) {
      console.error('Error auditing slugs:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setAuditing(false)
    }
  }
  
  // Function to run the migration
  const runMigration = async () => {
    setMigrating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/migrate-slugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.status === 'error') {
        throw new Error(data.message)
      }
      
      setMigrationResults(data)
      
      // Refresh audit results after migration
      auditSlugs()
    } catch (error) {
      console.error('Error running migration:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setMigrating(false)
    }
  }
  
  // Run initial audit when component mounts
  useEffect(() => {
    auditSlugs()
  }, [])
  
  // Count total missing items from audit results
  const totalMissingItems = auditResults ? (
    (auditResults.blog?.length || 0) +
    (auditResults.project?.length || 0) +
    (auditResults.category?.length || 0) +
    (auditResults.page?.length || 0)
  ) : 0

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Localized Slug Migration Tool</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Audit Results</h2>
        
        {auditing ? (
          <div className="text-center py-4">
            <p>Auditing content for missing slugs...</p>
          </div>
        ) : auditResults ? (
          <div>
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p>Total items missing slugs: <span className="font-bold">{totalMissingItems}</span></p>
              <ul className="list-disc pl-5 mt-2">
                <li>Blog posts: {auditResults.blog?.length || 0}</li>
                <li>Projects: {auditResults.project?.length || 0}</li>
                <li>Categories: {auditResults.category?.length || 0}</li>
                <li>Pages: {auditResults.page?.length || 0}</li>
              </ul>
            </div>
            
            {totalMissingItems > 0 && (
              <button 
                onClick={() => runMigration()}
                disabled={migrating}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {migrating ? 'Running Migration...' : 'Fix Missing Slugs'}
              </button>
            )}
          </div>
        ) : (
          <p>No audit results available. Click "Run Audit" to check for missing slugs.</p>
        )}
        
        <button 
          onClick={auditSlugs}
          disabled={auditing}
          className="mt-2 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {auditing ? 'Running Audit...' : 'Run Audit'}
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Migration Options</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.fixMissing}
              onChange={(e) => setOptions({ ...options, fixMissing: e.target.checked })}
              className="form-checkbox"
            />
            <span>Fix missing slugs</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.resolveCollisions}
              onChange={(e) => setOptions({ ...options, resolveCollisions: e.target.checked })}
              className="form-checkbox"
            />
            <span>Resolve slug collisions</span>
          </label>
        </div>
      </div>
      
      {migrationResults && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Migration Results</h2>
          
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p>Total items fixed: <span className="font-bold">{migrationResults.summary?.totalFixed || 0}</span></p>
            <p>Items with errors: <span className="font-bold">{migrationResults.summary?.totalErrorItems || 0}</span></p>
          </div>
          
          {migrationResults.results?.map((result, i) => (
            <div key={i} className="mb-4">
              <h3 className="font-semibold">{result.operation}</h3>
              
              {result.results.map((report, j) => (
                <div key={j} className="ml-4 mt-2">
                  <h4 className="font-semibold">{report.contentType}</h4>
                  <p>Total: {report.totalItems}, Fixed: {report.fixedItems}</p>
                  
                  {report.errors.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-semibold text-red-600">Errors ({report.errors.length})</h5>
                      <ul className="list-disc pl-5 text-sm">
                        {report.errors.slice(0, 5).map((error, k) => (
                          <li key={k}>
                            Item {error.itemId} ({error.locale}): {error.error}
                          </li>
                        ))}
                        {report.errors.length > 5 && (
                          <li>And {report.errors.length - 5} more errors...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 