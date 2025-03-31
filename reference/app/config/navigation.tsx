import { 
  BarChart3Icon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingIcon,
  CheckCircleIcon,
  Code,
  FileTextIcon,
  Gauge,
  GlobeIcon,
  HeartIcon,
  HomeIcon,
  LayoutIcon,
  LightbulbIcon,
  LineChartIcon,
  MapPinIcon,
  MousePointerClickIcon,
  PencilIcon,
  PhoneIcon,
  SearchIcon,
  ServerIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon
} from "lucide-react"

// Define all navigation items for the mega menu
export const navigationItems = [
  {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-5 w-5" />
  },
  {
    label: "Über Uns",
    icon: <UsersIcon className="h-5 w-5" />,
    children: [
      {
        label: "Team",
        href: "/about/team",
        icon: <UsersIcon className="h-5 w-5" />,
        description: "Unser erfahrenes Expertenteam stellt sich vor"
      },
      {
        label: "Erfahrung",
        href: "/about/erfahrung",
        icon: <StarIcon className="h-5 w-5" />,
        description: "25 Jahre Erfahrung als Premium Agentur"
      },
      {
        label: "Standorte",
        href: "/standorte",
        icon: <MapPinIcon className="h-5 w-5" />,
        description: "Unsere Standorte in Deutschland und international"
      }
    ]
  },
  {
    label: "Dienstleistungen",
    icon: <GlobeIcon className="h-5 w-5" />,
    children: [
      {
        label: "Suchmaschinenoptimierung",
        href: "/suchmaschinenoptimierung",
        icon: <SearchIcon className="h-5 w-5" />,
        description: "Professionelle Suchmaschinenoptimierung mit nachweisbaren Ergebnissen"
      },
      {
        label: "Google Werbung",
        href: "/services/google-werbung",
        icon: <MousePointerClickIcon className="h-5 w-5" />,
        description: "Effiziente Google Ads Kampagnen mit messbarem ROI"
      },
      {
        label: "Content Marketing",
        href: "/content-marketing",
        icon: <PencilIcon className="h-5 w-5" />,
        description: "Strategische Content-Entwicklung für maximale Online-Präsenz"
      },
      {
        label: "Social Media Betreuung",
        href: "/social-media",
        icon: <UsersIcon className="h-5 w-5" />,
        description: "Strategische Social Media Betreuung & Kampagnen"
      },
      {
        label: "Webseiten Optimierung",
        href: "/webseiten-optimierung",
        icon: <Gauge className="h-5 w-5" />,
        description: "Performance-Optimierung Ihrer Website für bessere Nutzererfahrung"
      },
      {
        label: "Webseiten Entwicklung",
        href: "/webseiten-entwicklung",
        icon: <Code className="h-5 w-5" />,
        description: "Professionelle Entwicklung maßgeschneiderter Websites und Webanwendungen"
      },
      {
        label: "E-Commerce Marketing",
        href: "/e-commerce-marketing",
        icon: <ShoppingCartIcon className="h-5 w-5" />,
        description: "Umsatzsteigerung für Online Shops"
      }
    ]
  },
  {
    label: "Technologie & Automation",
    icon: <ServerIcon className="h-5 w-5" />,
    children: [
      {
        label: "Marketing Automatisierung",
        href: "/marketing-automatisierung",
        icon: <TrendingUpIcon className="h-5 w-5" />,
        description: "DSGVO-konforme Automatisierungslösungen für effizientes Marketing"
      },
      {
        label: "CORE Plattform",
        href: "/core-plattform",
        icon: <ServerIcon className="h-5 w-5" />,
        description: "Unsere proprietäre Marketing-Technologie-Plattform"
      },
      {
        label: "Tracking-Lösungen",
        href: "/tracking",
        icon: <BarChart3Icon className="h-5 w-5" />,
        description: "Präzises Tracking für datenbasierte Marketingentscheidungen"
      },
      {
        label: "API Integrationen",
        href: "/api-integrationen",
        icon: <LineChartIcon className="h-5 w-5" />,
        description: "Nahtlose Integration in Ihre bestehenden Systeme"
      }
    ]
  },
  {
    label: "Branchen",
    icon: <BriefcaseIcon className="h-5 w-5" />,
    children: [
      {
        label: "B2B Unternehmen",
        href: "/branchen/b2b",
        icon: <BuildingIcon className="h-5 w-5" />,
        description: "Maßgeschneiderte Lösungen für B2B-Unternehmen"
      },
      {
        label: "Online Shops",
        href: "/branchen/online-shops",
        icon: <ShoppingCartIcon className="h-5 w-5" />,
        description: "Spezialisierte Strategien für E-Commerce-Unternehmen"
      },
      {
        label: "Lokale Dienstleister",
        href: "/branchen/lokale-dienstleister",
        icon: <MapPinIcon className="h-5 w-5" />,
        description: "Lokale Sichtbarkeit für Dienstleister vor Ort"
      },
      {
        label: "Enterprise Kunden",
        href: "/branchen/enterprise",
        icon: <BuildingIcon className="h-5 w-5" />,
        description: "Skalierbare Lösungen für Großunternehmen"
      }
    ]
  },
  {
    label: "Erfolge",
    icon: <StarIcon className="h-5 w-5" />,
    children: [
      {
        label: "Fallstudien",
        href: "/fallstudien",
        icon: <FileTextIcon className="h-5 w-5" />,
        description: "Detaillierte Einblicke in unsere Erfolgsgeschichten"
      },
      {
        label: "Kundenstimmen",
        href: "/kundenstimmen",
        icon: <CheckCircleIcon className="h-5 w-5" />,
        description: "Was unsere Kunden über uns sagen"
      }
    ]
  },
  {
    label: "Resources",
    icon: <BookOpenIcon className="h-5 w-5" />,
    children: [
      {
        label: "Blog",
        href: "/blog",
        icon: <PencilIcon className="h-5 w-5" />,
        description: "Aktuelle Insights und Expertentipps"
      },
      {
        label: "Whitepaper",
        href: "/whitepaper",
        icon: <FileTextIcon className="h-5 w-5" />,
        description: "Detaillierte Fachbeiträge zu Marketingthemen"
      },
      {
        label: "Webinare",
        href: "/webinare",
        icon: <LightbulbIcon className="h-5 w-5" />,
        description: "Kostenlose Online-Schulungen und Vorträge"
      }
    ]
  },
  {
    label: "Kontakt",
    icon: <PhoneIcon className="h-5 w-5" />,
    children: [
      {
        label: "Beratungstermin",
        href: "/beratungstermin",
        icon: <SmartphoneIcon className="h-5 w-5" />,
        description: "Vereinbaren Sie ein kostenloses Beratungsgespräch"
      },
      {
        label: "Anfrage",
        href: "/anfrage",
        icon: <PencilIcon className="h-5 w-5" />,
        description: "Stellen Sie uns Ihre Projektanfrage"
      }
    ]
  }
]

// Secondary navigation for footer and other areas
export const secondaryNavigation = {
  dienstleistungen: [
    { name: "Suchmaschinenoptimierung", href: "/suchmaschinenoptimierung" },
    { name: "Google Werbung", href: "/services/google-werbung" },
    { name: "Content Strategie", href: "/content-marketing" },
    { name: "Social Media", href: "/social-media" },
    { name: "Webseiten Optimierung", href: "/webseiten-optimierung" },
    { name: "Webseiten Entwicklung", href: "/webseiten-entwicklung" },
    { name: "Conversion Optimierung", href: "/conversion-optimierung" },
    { name: "Webanalyse", href: "/webanalyse" }
  ],
  technologie: [
    { name: "CORE Plattform", href: "/core-plattform" },
    { name: "Marketing Automation", href: "/marketing-automatisierung" },
    { name: "Tracking-Audit", href: "/tracking-audit" },
    { name: "Datenanalyse", href: "/datenanalyse" }
  ],
  unternehmen: [
    { name: "Über Uns", href: "/about" },
    { name: "Team", href: "/about/team" },
    { name: "Karriere", href: "/karriere" },
    { name: "Partner", href: "/partner" },
    { name: "Presse", href: "/presse" }
  ],
  rechtliches: [
    { name: "Datenschutz", href: "/datenschutz" },
    { name: "Impressum", href: "/impressum" },
    { name: "AGB", href: "/agb" },
    { name: "Sitemap", href: "/sitemap" },
    { name: "Cookie-Einstellungen", href: "/cookie-einstellungen" }
  ],
  kontakt: [
    { name: "Telefon", href: "/kontakt#telefon" },
    { name: "Email", href: "/kontakt#email" },
    { name: "Standorte", href: "/standorte" },
    { name: "Kostenlose Beratung", href: "/beratungstermin" }
  ]
} 