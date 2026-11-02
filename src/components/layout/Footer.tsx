import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

// Lucide no longer ships brand icons, so the social marks are inline SVGs.
function StrokeIcon({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </StrokeIcon>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </StrokeIcon>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </StrokeIcon>
  );
}

function XIcon({ className }: { className?: string }) {
  // The modern X mark.
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com/studiospace", icon: FacebookIcon },
  { label: "Instagram", href: "https://instagram.com/studiospace", icon: InstagramIcon },
  { label: "LinkedIn", href: "https://linkedin.com/company/studiospace", icon: LinkedInIcon },
  // { label: "X", href: "https://x.com/studiospace", icon: XIcon },
];

const EXPLORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Explore Studios", href: "/studios" },
  { label: "Categories", href: "/#categories" },
  { label: "How It Works", href: "/#how-it-works" },
];

const HOST_LINKS = [
  { label: "Become a Host", href: "/#become-a-host" },
  { label: "Add New Studio", href: "/add-studio" },
  { label: "My Listings", href: "/studios/mine" },
];

const SUPPORT_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "mailto:hello@studiospace.example" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

// Resolved once per process so prerendering stays deterministic.
const CURRENT_YEAR = new Date().getFullYear();

function FooterLinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
        {heading}
      </h3>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container-page py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand + mission + newsletter */}
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-5 max-w-sm font-heading text-lg leading-relaxed text-muted-foreground italic">
              Find your space. Create your vision.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              The marketplace for premium creative studios — helping
              photographers, filmmakers, musicians and creators book beautiful
              workspaces, and hosts share theirs with the world.
            </p>
            <div className="mt-7">
              <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                Stay in the loop
              </h3>
              <div className="mt-4">
                <NewsletterForm />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterLinkColumn heading="Explore" links={EXPLORE_LINKS} />
          </div>

          <div className="lg:col-span-2">
            <FooterLinkColumn heading="For Hosts" links={HOST_LINKS} />
          </div>

          <div className="lg:col-span-3">
            <FooterLinkColumn heading="Support" links={SUPPORT_LINKS} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {CURRENT_YEAR} StudioSpace. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <social.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
