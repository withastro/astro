'use client';

import { Logo } from "./brand/Logo";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { secondaryNavigation } from '../config/navigation';
import { useParams } from 'next/navigation';

export function Footer() {
  const params = useParams();
  const locale = params.locale as string || 'de';

  // Add localization to links
  const localizeHref = (href: string) => `/${locale}${href}`;

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* CTA Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">Bereit für messbare Marketing-Erfolge?</h2>
              <p className="mb-4">Vereinbaren Sie jetzt eine kostenlose Beratung mit unseren Experten.</p>
            </div>
            <div className="flex justify-end">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Kostenlose Beratung
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Section */}
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div>
            <Logo variant="horizontal" mode="dark" className="h-8 mb-6" />
            <p className="mb-6">Premium Online Marketing Agentur in Berlin mit 25+ Jahren Erfahrung. Spezialisiert auf SEO, Content Marketing und DSGVO-konforme Automatisierungslösungen.</p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Dienstleistungen Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Dienstleistungen</h3>
            <ul className="space-y-4">
              {secondaryNavigation.dienstleistungen.map((item) => (
                <li key={item.name}>
                  <Link href={localizeHref(item.href)} className="hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Technologie Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Technologie</h3>
            <ul className="space-y-4">
              {secondaryNavigation.technologie.map((item) => (
                <li key={item.name}>
                  <Link href={localizeHref(item.href)} className="hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Unternehmen Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Unternehmen</h3>
            <ul className="space-y-4">
              {secondaryNavigation.unternehmen.map((item) => (
                <li key={item.name}>
                  <Link href={localizeHref(item.href)} className="hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Kontakt</h3>
            <ul className="space-y-4">
              {secondaryNavigation.kontakt.map((item) => (
                <li key={item.name}>
                  <Link href={localizeHref(item.href)} className="hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
              <li className="flex items-start pt-2">
                <MapPin className="h-5 w-5 mr-3 mt-0.5 text-gray-400" />
                <span>Musterstraße 123<br />10115 Berlin</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-gray-400" />
                <span>+49 30 12345678</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <span>info@onlinemarketingcore.de</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">&copy; {new Date().getFullYear()} OnlineMarketingCORE. Alle Rechte vorbehalten.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {secondaryNavigation.rechtliches.map((item) => (
              <Link key={item.name} href={localizeHref(item.href)} className="text-sm hover:text-white transition-colors">
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
} 