"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ChevronDown,
  Inbox,
  LayoutDashboard,
  ListPlus,
  LogOut,
  Menu,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useSignOut } from "@/hooks/use-sign-out";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Explore Studios", href: "/studios" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About Us", href: "/about" },
];

// Initials derived from the real session data for the avatar chip. Falls
// back to the email handle when the display name is missing, so every
// signed-in user is represented without any hardcoded placeholder text.
const getUserInitials = (name: string | null, email: string | null) => {
  const nameParts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (nameParts.length > 0) {
    return nameParts
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("");
  }
  const emailHandle = (email ?? "").split("@")[0]?.replace(/[^a-z0-9]/gi, "");
  return emailHandle ? emailHandle.slice(0, 2).toUpperCase() : "";
};

/** The user's profile image, if the session provides one. */
const getUserImage = (image: string | null | undefined) =>
  image && image.trim().length > 0 ? image : null;

export function Navbar() {
  const pathname = usePathname();
  const { toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Effective role, probed from GET /api/hosts/status with the session
  // cookie. Admin status comes from the same payload — both are decided
  // server-side; nothing here is ever read from browser state.
  const [isHost, setIsHost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Live Better Auth session, kept in sync by the reactive auth client —
  // signing in elsewhere in the app updates this store without a page reload.
  const { data: session, isPending } = authClient.useSession();
  const sessionUser = session?.user ?? null;
  const isAuthenticated = !isPending && Boolean(sessionUser);

  // Probe the effective role once per signed-in user and on route changes
  // (so activating host access is visible without a full reload). 401/403
  // responses simply keep the customer links; capabilities are never
  // inferred locally.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!sessionUser) {
        // Await first so no setState runs synchronously inside the effect.
        await Promise.resolve();
        if (!cancelled) {
          setIsHost(false);
          setIsAdmin(false);
        }
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/hosts/status`, {
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
          // Sessions that cannot be verified hide host/admin entries.
          setIsHost(false);
          setIsAdmin(false);
          return;
        }
        const raw = await response.json().catch(() => null);
        const data =
          raw && typeof raw === "object" && "data" in raw
            ? (raw as { data?: { isHost?: boolean; isAdmin?: boolean } }).data
            : undefined;
        setIsHost(Boolean(data?.isHost));
        setIsAdmin(Boolean(data?.isAdmin));
      } catch {
        // Network failure: leave the customer menu rather than guessing.
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionUser, pathname]);
  const userImage = getUserImage(sessionUser?.image);
  const userInitials = getUserInitials(sessionUser?.name ?? null, sessionUser?.email ?? null);
  // Prefer the stored display name; fall back to the account email so the
  // menu still identifies the real signed-in user when name is empty.
  const displayName =
    sessionUser?.name && sessionUser.name.trim().length > 0
      ? sessionUser.name.trim()
      : sessionUser?.email || "Account";

  // Shared logout flow: Better Auth signOut, toast feedback, refresh of the
  // server-rendered session state and redirect to the homepage. isSigningOut
  // drives the loading state on both the desktop dropdown and mobile button.
  const { handleSignOut, isSigningOut } = useSignOut();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    // Section anchors never claim the active indicator — only routes do.
    if (href.startsWith("/#")) return false;
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/90 shadow-[0_1px_12px_rgba(37,42,36,0.06)] backdrop-blur-md"
          : "border-b border-transparent bg-background"
      )}
    >
      <nav
        aria-label="Main navigation"
        className="container-page flex h-16 items-center justify-between md:h-[4.5rem]"
      >
        <Logo />

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className={cn(
                  "relative px-3.5 py-2 text-sm font-medium tracking-wide transition-colors",
                  isActive(link.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3.5 bottom-0 h-px origin-center bg-primary transition-transform duration-300",
                    isActive(link.href) ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {/* CSS swaps the glyph so SSR and hydration match exactly. */}
            <Sun className="hidden size-4.5 dark:block" />
            <Moon className="size-4.5 dark:hidden" />
          </Button>

          {isPending ? (
            // Unobtrusive placeholder while the session request resolves, so
            // the Login/Register buttons do not flash before auth is known.
            <span aria-hidden className="size-10 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                )}
              >
                <Avatar className="size-8">
                  {userImage && (
                    <AvatarImage src={userImage} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Base UI requires the GroupLabel (DropdownMenuLabel) to sit
                    inside a group — rendering it bare crashes the menu. */}
                  <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2.5">
                    <Avatar className="size-9 shrink-0">
                      {userImage && (
                        <AvatarImage src={userImage} alt={displayName} />
                      )}
                      <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">{displayName}</span>
                      {sessionUser?.email && (
                        <span className="truncate text-xs font-normal text-muted-foreground">
                          {sessionUser.email}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  {/* Customer: Become a Host. Host/admin: the host tools. */}
                  {isHost || isAdmin ? (
                    <>
                      <DropdownMenuItem render={<Link href="/host/dashboard" />}>
                        <LayoutDashboard className="size-4" /> Host Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/add-studio" />}>
                        <Plus className="size-4" /> Add New Studio
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/my-listings" />}>
                        <ListPlus className="size-4" /> My Listings
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/booking-requests" />}>
                        <Inbox className="size-4" /> Booking Requests
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem render={<Link href="/become-a-host" />}>
                      <Sparkles className="size-4" /> Become a Host
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem render={<Link href="/my-bookings" />}>
                    <CalendarCheck className="size-4" /> My Bookings
                  </DropdownMenuItem>
                  {isAdmin ? (
                    <DropdownMenuItem render={<Link href="/admin" />}>
                      <ShieldCheck className="size-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <User className="size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSigningOut}
                  onSelect={(event) => {
                    // Keep the menu open so the loading feedback stays
                    // visible until the sign-out request settles.
                    event.preventDefault();
                    void handleSignOut();
                  }}
                >
                  {isSigningOut ? (
                    <>
                      <Spinner className="size-4" /> Logging out…
                    </>
                  ) : (
                    <>
                      <LogOut className="size-4" /> Logout
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" render={<Link href="/login" />}>
                Login
              </Button>
              <Button render={<Link href="/register" />}>Register</Button>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 lg:hidden">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            <Sun className="hidden size-4.5 dark:block" />
            <Moon className="size-4.5 dark:hidden" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-border bg-background transition-all duration-300 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <div className="container-page flex flex-col gap-6 py-8">
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "border-b border-border/70 py-4 font-heading text-2xl tracking-tight transition-colors",
                    isActive(link.href)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setMobileOpen(false)}
                    render={<Link href="/admin" />}
                  >
                    Admin Dashboard
                  </Button>
                ) : null}
                {isHost || isAdmin ? (
                  <>
                    <Button
                      size="lg"
                      onClick={() => setMobileOpen(false)}
                      render={<Link href="/host/dashboard" />}
                    >
                      Host Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setMobileOpen(false)}
                      render={<Link href="/my-listings" />}
                    >
                      My Listings
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setMobileOpen(false)}
                      render={<Link href="/booking-requests" />}
                    >
                      Booking Requests
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => setMobileOpen(false)}
                    render={<Link href="/become-a-host" />}
                  >
                    Become a Host
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setMobileOpen(false)}
                  render={<Link href="/my-bookings" />}
                >
                  My Bookings
                </Button>
              </>
            ) : null}
            {!isAuthenticated ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setMobileOpen(false)}
                render={
                  <Link href="/login" onClick={() => setMobileOpen(false)} />
                }
              >
                Login
              </Button>
            ) : null}
            {isAuthenticated ? (
              <Button
                size="lg"
                disabled={isSigningOut || isPending}
                onClick={() => void handleSignOut()}
              >
                {isSigningOut ? (
                  <>
                    <Spinner className="size-4" /> Logging out…
                  </>
                ) : (
                  <>
                    <LogOut className="size-4" /> Logout
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => setMobileOpen(false)}
                render={
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                  />
                }
              >
                Register
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
