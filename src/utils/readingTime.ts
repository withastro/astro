/**
 * Calculate reading time for blog posts
 * @param content - The text content of the blog post
 * @returns Reading time in minutes
 */
export function getReadingTime(content: string): number {
  // Remove markdown syntax and HTML tags
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/[#*_~`]/g, '') // Remove markdown symbols
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .trim();

  // Count words (approximate)
  const words = text.split(/\s+/).filter(word => word.length > 0).length;
  
  // Average reading speed: 200-250 words per minute
  // Using 225 as a middle ground
  const readingTime = Math.ceil(words / 225);
  
  return Math.max(1, readingTime); // Minimum 1 minute
}

/**
 * Format reading time for display
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5 min read")
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
