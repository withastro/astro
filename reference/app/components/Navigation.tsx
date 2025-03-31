'use client';

import { Logo } from "./brand/Logo";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Phone } from "lucide-react";
import { MegaMenu } from "./layouts/MegaMenu";
import { secondaryNavigation } from "../config/navigation";
import { navigationItems } from '../config/navigation';

export function Navigation() {
  const params = usePathname();
  const locale = params.locale as string || 'de';

  // Add locale to all navigation item links
  const localizedItems = navigationItems.map(item => {
    if (item.href) {
      return {
        ...item,
        href: `/${locale}${item.href}`
      };
    }
    
    if (item.children) {
      return {
        ...item,
        children: item.children.map(child => ({
          ...child,
          href: `/${locale}${child.href || '/'}`
        })),
        featured: item.featured ? item.featured.map(feature => ({
          ...feature,
          href: `/${locale}${feature.href || '/'}`
        })) : undefined
      };
    }
    
    return item;
  });

  const logoComponent = (
    <Link href={`/${locale}`} className="flex items-center space-x-2">
      <Logo variant="horizontal" className="h-6" />
    </Link>
  );

  const actionButtons = (
    <></>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <MegaMenu 
        items={localizedItems} 
        logo={logoComponent}
        actions={actionButtons}
      />
      
      {/* Mobile Navigation - Only shown on smaller screens */}
      <div className="lg:hidden px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <Logo variant="horizontal" className="h-6" />
        </Link>
        
        <div className="flex items-center gap-2">
          <Button size="sm">Kontakt</Button>
        </div>
      </div>
    </header>
  );
} 