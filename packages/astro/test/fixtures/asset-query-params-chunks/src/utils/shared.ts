// Shared module that will be extracted into a common chunk by Vite
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export class Logger {
  private prefix: string;
  constructor(prefix: string) {
    this.prefix = prefix;
  }
  log(message: string): void {
    console.log(`[${this.prefix}] ${message}`);
  }
}
