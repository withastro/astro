import { NextRequest, NextResponse } from 'next/server'
import { 
  auditMissingLocalizedSlugs, 
  checkAndResolveDuplicateSlugs, 
  fixMissingLocalizedSlugs 
} from '@/app/utils/migration'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to audit content for missing localized slugs
 * GET /api/admin/migrate-slugs/audit
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the request is for audit only
    const auditResults = await auditMissingLocalizedSlugs()
    
    // Count total items with missing slugs
    const totalMissingItems = 
      auditResults.blog.length + 
      auditResults.project.length + 
      auditResults.category.length + 
      auditResults.page.length
    
    return NextResponse.json({
      status: 'success',
      totalMissingItems,
      auditResults
    })
  } catch (error) {
    console.error('Error auditing localized slugs:', error)
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    }, { status: 500 })
  }
}

interface MigrationResult {
  contentType: string;
  fixedItems: number;
  errors: Array<{
    id: number;
    error: string;
  }>;
}

interface OperationResult {
  operation: 'fixMissingLocalizedSlugs' | 'checkAndResolveDuplicateSlugs';
  results: MigrationResult[];
}

/**
 * API endpoint to fix missing localized slugs
 * POST /api/admin/migrate-slugs
 */
export async function POST(request: NextRequest) {
  try {
    // Get migration options from request
    const options = await request.json()
    
    // Extract options
    const { fixMissing = true, resolveCollisions = true } = options
    
    // Store all migration reports
    const results: OperationResult[] = []
    
    // Fix missing slugs if requested
    if (fixMissing) {
      const fixResults = await fixMissingLocalizedSlugs()
      results.push({ 
        operation: 'fixMissingLocalizedSlugs', 
        results: fixResults 
      })
    }
    
    // Resolve slug collisions if requested
    if (resolveCollisions) {
      const collisionResults = await checkAndResolveDuplicateSlugs()
      results.push({ 
        operation: 'checkAndResolveDuplicateSlugs', 
        results: collisionResults 
      })
    }
    
    // Calculate summary statistics
    const totalFixed = results.reduce((sum, operation) => {
      if (operation.operation === 'fixMissingLocalizedSlugs') {
        return sum + operation.results.reduce((s: number, r: MigrationResult) => s + r.fixedItems, 0)
      }
      return sum
    }, 0)
    
    const totalErrorItems = results.reduce((sum, operation) => {
      if (operation.operation === 'fixMissingLocalizedSlugs') {
        return sum + operation.results.reduce((s: number, r: MigrationResult) => s + r.errors.length, 0)
      }
      return sum
    }, 0)
    
    return NextResponse.json({
      status: 'success',
      summary: {
        totalFixed,
        totalErrorItems
      },
      results
    })
  } catch (error) {
    console.error('Error migrating localized slugs:', error)
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    }, { status: 500 })
  }
} 