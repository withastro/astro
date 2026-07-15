/**
 * WE-FAST Bootstrap 5 Design & Grid System (`bootstrap-system.ts`)
 * Inspired by `kariitsme/bootstrap` (The world's most popular responsive HTML/CSS/JS mobile-first framework).
 *
 * Provides:
 * - Design Tokens & Variables (`--bs-primary`, `--bs-secondary`, etc.) with customizable themes.
 * - 12-Column Grid Layout Generator (`container`, `container-fluid`, `row`, `col-*`).
 * - Responsive Utilities (`d-flex`, `justify-content-between`, `align-items-center`, `py-*`, `px-*`, `my-*`).
 * - Sleek Component Styles (`card`, `navbar`, `btn`, `badge`, `accordion`, `modal`, `alert`, `table`).
 * - Embedded CSS string generator for zero-external-dependency static HTML bundle exports.
 */

export interface BootstrapColorTheme {
  primary: string;
  secondary: string;
  success: string;
  info: string;
  warning: string;
  danger: string;
  dark: string;
  light: string;
  bgDark?: string;
  textLight?: string;
}

export const BOOTSTRAP_THEMES: Record<string, BootstrapColorTheme> = {
  default: {
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    info: '#0dcaf0',
    warning: '#ffc107',
    danger: '#dc3545',
    dark: '#212529',
    light: '#f8f9fa',
    bgDark: '#121418',
    textLight: '#f8f9fa',
  },
  cyberNeon: {
    primary: '#00DC82', // Nuxt green / Cyber neon
    secondary: '#8a2be2',
    success: '#00ff7f',
    info: '#00e5ff',
    warning: '#ffb703',
    danger: '#ff0055',
    dark: '#050714',
    light: '#e2e8f0',
    bgDark: '#03040c',
    textLight: '#ffffff',
  },
  indigoSaaS: {
    primary: '#6366f1',
    secondary: '#64748b',
    success: '#10b981',
    info: '#3b82f6',
    warning: '#f59e0b',
    danger: '#ef4444',
    dark: '#0f172a',
    light: '#f8fafc',
    bgDark: '#0b0f19',
    textLight: '#f1f5f9',
  },
  emeraldEco: {
    primary: '#059669',
    secondary: '#475569',
    success: '#16a34a',
    info: '#0284c7',
    warning: '#d97706',
    danger: '#dc2626',
    dark: '#1e293b',
    light: '#f1f5f9',
    bgDark: '#0d1821',
    textLight: '#e2e8f0',
  },
  bistroWarm: {
    primary: '#d97706',
    secondary: '#78350f',
    success: '#15803d',
    info: '#0369a1',
    warning: '#f59e0b',
    danger: '#b91c1c',
    dark: '#291d12',
    light: '#fffbeb',
    bgDark: '#1a120b',
    textLight: '#fef3c7',
  },
};

export class BootstrapGenerator {
  /**
   * Generates a comprehensive CSS bundle containing Bootstrap 5 grid variables, utilities, and components.
   */
  public static generateCSS(themeKey: string = 'cyberNeon'): string {
    const theme = BOOTSTRAP_THEMES[themeKey] || BOOTSTRAP_THEMES.cyberNeon;

    return `/* WE-FAST Bootstrap 5 Design System & Grid System */
:root {
  --bs-primary: ${theme.primary};
  --bs-secondary: ${theme.secondary};
  --bs-success: ${theme.success};
  --bs-info: ${theme.info};
  --bs-warning: ${theme.warning};
  --bs-danger: ${theme.danger};
  --bs-dark: ${theme.dark};
  --bs-light: ${theme.light};
  --bs-body-bg: ${theme.bgDark || '#0b0f19'};
  --bs-body-color: ${theme.textLight || '#f8f9fa'};
  --bs-font-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --bs-border-radius: 0.75rem;
  --bs-border-radius-lg: 1.25rem;
  --bs-box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--bs-font-sans-serif);
  background-color: var(--bs-body-bg);
  color: var(--bs-body-color);
  line-height: 1.6;
  overflow-x: hidden;
}

/* 12-Column Responsive Grid System */
.container, .container-fluid {
  width: 100%;
  padding-right: var(--bs-gutter-x, 1.5rem);
  padding-left: var(--bs-gutter-x, 1.5rem);
  margin-right: auto;
  margin-left: auto;
}
.container {
  max-width: 1280px;
}
.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: calc(-0.5 * var(--bs-gutter-x, 1.5rem));
  margin-left: calc(-0.5 * var(--bs-gutter-x, 1.5rem));
}
.row > * {
  padding-right: calc(0.5 * var(--bs-gutter-x, 1.5rem));
  padding-left: calc(0.5 * var(--bs-gutter-x, 1.5rem));
}

.col-12 { flex: 0 0 auto; width: 100%; }
.col-6 { flex: 0 0 auto; width: 50%; }
.col-4 { flex: 0 0 auto; width: 33.333333%; }
.col-3 { flex: 0 0 auto; width: 25%; }

@media (min-width: 768px) {
  .col-md-12 { flex: 0 0 auto; width: 100%; }
  .col-md-6 { flex: 0 0 auto; width: 50%; }
  .col-md-4 { flex: 0 0 auto; width: 33.333333%; }
  .col-md-3 { flex: 0 0 auto; width: 25%; }
}

@media (min-width: 992px) {
  .col-lg-12 { flex: 0 0 auto; width: 100%; }
  .col-lg-8 { flex: 0 0 auto; width: 66.666667%; }
  .col-lg-6 { flex: 0 0 auto; width: 50%; }
  .col-lg-4 { flex: 0 0 auto; width: 33.333333%; }
  .col-lg-3 { flex: 0 0 auto; width: 25%; }
}

/* Utilities */
.d-flex { display: flex !important; }
.d-grid { display: grid !important; }
.flex-column { flex-direction: column !important; }
.justify-content-between { justify-content: space-between !important; }
.justify-content-center { justify-content: center !important; }
.align-items-center { align-items: center !important; }
.text-center { text-align: center !important; }
.text-primary { color: var(--bs-primary) !important; }
.text-secondary { color: var(--bs-secondary) !important; }
.text-success { color: var(--bs-success) !important; }
.text-warning { color: var(--bs-warning) !important; }
.text-muted { color: #94a3b8 !important; }

.py-1 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
.py-2 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
.py-3 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
.py-4 { padding-top: 2.5rem !important; padding-bottom: 2.5rem !important; }
.py-5 { padding-top: 4rem !important; padding-bottom: 4rem !important; }

.my-1 { margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
.my-2 { margin-top: 1rem !important; margin-bottom: 1rem !important; }
.my-3 { margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
.my-4 { margin-top: 2rem !important; margin-bottom: 2rem !important; }
.my-5 { margin-top: 3.5rem !important; margin-bottom: 3.5rem !important; }
.mb-3 { margin-bottom: 1rem !important; }
.mb-4 { margin-bottom: 1.5rem !important; }

.gap-2 { gap: 0.5rem !important; }
.gap-3 { gap: 1rem !important; }
.gap-4 { gap: 1.5rem !important; }

/* Components */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}
.navbar-brand {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--bs-primary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  padding: 0.65rem 1.4rem;
  font-size: 0.95rem;
  border-radius: var(--bs-border-radius);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}
.btn-primary {
  background: var(--bs-primary);
  color: #fff;
  box-shadow: 0 4px 14px 0 rgba(13, 110, 253, 0.39);
}
.btn-primary:hover {
  filter: brightness(1.15);
  transform: translateY(-2px);
}
.btn-outline-light {
  background: transparent;
  color: var(--bs-light);
  border-color: rgba(255, 255, 255, 0.3);
}
.btn-outline-light:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--bs-light);
}

.card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--bs-border-radius-lg);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--bs-box-shadow);
}
.card:hover {
  transform: translateY(-5px);
  border-color: var(--bs-primary);
  box-shadow: 0 20px 30px -10px rgba(0, 220, 130, 0.2);
}
.badge {
  display: inline-block;
  padding: 0.35em 0.75em;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 50rem;
}
.bg-primary { background-color: var(--bs-primary) !important; }
.bg-success { background-color: var(--bs-success) !important; }
.bg-info { background-color: var(--bs-info) !important; color: #000 !important; }
.bg-warning { background-color: var(--bs-warning) !important; color: #000 !important; }

/* Grid Overlay Helper for Studio */
.wefast-grid-overlay .col-12,
.wefast-grid-overlay .col-md-6,
.wefast-grid-overlay .col-lg-4,
.wefast-grid-overlay .col-lg-3,
.wefast-grid-overlay .col-6 {
  outline: 1px dashed rgba(0, 220, 130, 0.4) !important;
  position: relative;
}
.wefast-grid-overlay .col-12::after,
.wefast-grid-overlay .col-md-6::after,
.wefast-grid-overlay .col-lg-4::after {
  content: attr(class);
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  background: rgba(0, 220, 130, 0.8);
  color: #000;
  padding: 1px 4px;
  border-radius: 3px;
  pointer-events: none;
  font-family: monospace;
}
`;
  }
}
