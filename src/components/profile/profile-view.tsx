"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CalendarCheck,
  CalendarDays,
  Camera,
  Check,
  Eye,
  EyeOff,
  FileText,
  ListPlus,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserRound,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useSignOut } from "@/hooks/use-sign-out";
import { resizeImageFile } from "@/lib/profile-image";
import { API_BASE_URL } from "@/lib/api";
import { ConnectedAccounts } from "@/components/profile/connected-accounts";
import { cn } from "cn";

// Matches the pill input styling used across StudioSpace (auth forms).
const inputClasses =
  "h-11 w-full rounded-full border border-input bg-card px-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60";

const BIO_MAX_LENGTH = 500;

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

interface PasswordFormState {
  current: string;
  next: string;
  confirm: string;
}

const EMPTY_PASSWORD_FORM: PasswordFormState = { current: "", next: "", confirm: "" };

// Initials derived from the real display name — shared convention with the
// Navbar avatar. Falls back to the email handle when the name is missing.
const getInitials = (name: string | null | undefined) => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
};

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** A labeled detail row shown while the profile is in read mode. */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4.5 text-muted-foreground" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </span>
        <span className="break-words text-[0.9375rem] leading-relaxed text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}

/** Password field with an inline visibility toggle. */
function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  disabled,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled?: boolean;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(inputClasses, "pr-12")}
        required
        minLength={8}
      />
      <button
        type="button"
        onClick={() => setVisible((visible) => !visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Full-page skeleton shown while the Better Auth session resolves. */
function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="rounded-3xl shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
        <CardContent className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Skeleton className="size-24 rounded-full" />
            <div className="flex flex-1 flex-col items-center gap-2.5 sm:items-start">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="flex items-start gap-4" key={index}>
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
        <CardContent className="flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              className={index === 2 ? "h-4 w-2/3" : "h-10 w-full rounded-full"}
              key={index}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileView() {
  // Live Better Auth session — edits elsewhere stay in sync without a reload.
  const {
    data: session,
    isPending,
    error: sessionError,
  } = authClient.useSession();
  const user = session?.user ?? null;

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(EMPTY_PASSWORD_FORM);
  const [changingPassword, setChangingPassword] = useState(false);

  // Shared logout flow (Better Auth signOut + toast + redirect home).
  const { handleSignOut, isSigningOut } = useSignOut();

  // Effective role, probed server-side (GET /api/hosts/status) so the
  // quick links stay honest for customers, hosts, and admins.
  const [isHost, setIsHost] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) return;
      await Promise.resolve();
      try {
        const response = await fetch(`${API_BASE_URL}/hosts/status`, {
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!response.ok) {
          setIsHost(false);
          return;
        }
        const raw = await response.json().catch(() => null);
        const data =
          raw && typeof raw === "object" && "data" in raw
            ? (raw as { data?: { isHost?: boolean } }).data
            : undefined;
        setIsHost(Boolean(data?.isHost));
      } catch {
        // Network failure keeps the customer links rather than guessing.
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const memberSince = user?.createdAt ? new Date(user.createdAt) : null;
  const memberSinceLabel =
    memberSince && !Number.isNaN(memberSince.getTime())
      ? `Member since ${format(memberSince, "MMMM d, yyyy")}`
      : null;

  const startEditing = () => {
    setProfileForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      bio: user?.bio ?? "",
    });
    setEditing(true);
  };

  const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so selecting the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo is too large. Please choose an image under 8 MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const dataUrl = await resizeImageFile(file);
      const { error } = await authClient.updateUser({ image: dataUrl });
      if (error) {
        throw new Error(
          error.message || "We could not update your photo. Please try again."
        );
      }
      toast.success("Profile photo updated.");
    } catch (thrown) {
      toast.error(
        toErrorMessage(thrown, "We could not update your photo. Please try again.")
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoRemoved = async () => {
    if (!user?.image) return;
    setUploadingPhoto(true);
    try {
      const { error } = await authClient.updateUser({ image: null });
      if (error) {
        throw new Error(
          error.message || "We could not remove your photo. Please try again."
        );
      }
      toast.success("Profile photo removed.");
    } catch (thrown) {
      toast.error(
        toErrorMessage(thrown, "We could not remove your photo. Please try again.")
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = profileForm.name.trim();
    const email = profileForm.email.trim().toLowerCase();
    if (!name) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSavingProfile(true);
    try {
      // The email lives on a dedicated Better Auth endpoint; everything else
      // goes through a single user update persisted by the MongoDB adapter.
      if (user && email !== user.email.toLowerCase()) {
        const { error } = await authClient.changeEmail({ newEmail: email });
        if (error) {
          throw new Error(
            error.message ||
              "We could not update your email address. It may already be in use."
          );
        }
      }
      const { error } = await authClient.updateUser({
        name,
        phone: profileForm.phone.trim(),
        bio: profileForm.bio.trim(),
      });
      if (error) {
        throw new Error(
          error.message || "We could not save your profile. Please try again."
        );
      }
      toast.success("Profile updated.");
      setEditing(false);
    } catch (thrown) {
      toast.error(toErrorMessage(thrown, "Something went wrong. Please try again."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordForm.current) {
      toast.error("Please enter your current password.");
      return;
    }
    if (passwordForm.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      if (error) {
        throw new Error(
          /invalid/i.test(error.message ?? "")
            ? "Your current password is incorrect."
            : error.message ||
                "We could not update your password. Please try again."
        );
      }
      toast.success("Password updated.");
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch (thrown) {
      toast.error(toErrorMessage(thrown, "Something went wrong. Please try again."));
    } finally {
      setChangingPassword(false);
    }
  };

  if (isPending) {
    return (
      <main className="container-page py-10 md:py-14">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-52" />
        </div>
        <div className="mx-auto mt-8 w-full max-w-5xl">
          <ProfileSkeleton />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container-page py-10 md:py-14">
        <Card className="mx-auto max-w-lg rounded-3xl text-center shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
          <CardContent className="flex flex-col items-center gap-4 py-14">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted">
              <UserRound className="size-6 text-muted-foreground" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="font-heading text-2xl tracking-tight">
                We couldn&apos;t load your profile
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                {sessionError
                  ? "There was a problem reaching the server. Please try again in a moment."
                  : "Your session may have expired. Sign in again to continue managing your account."}
              </p>
            </div>
            <Button render={<Link href="/login" />}>Sign in</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const userImage = user.image && user.image.trim().length > 0 ? user.image : null;
  const initials = getInitials(user.name) || user.email.slice(0, 1).toUpperCase();

  return (
    <main className="container-page py-10 md:py-14">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        {/* Page heading */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Account
          </p>
          <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
            My Profile
          </h1>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Profile information */}
          <Card className="gap-8 rounded-3xl py-8 shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
            <CardHeader>
              <CardTitle className="font-heading text-2xl tracking-tight">
                Profile Information
              </CardTitle>
              <CardDescription>
                This is how your profile appears across StudioSpace.
              </CardDescription>
              {!editing && (
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditing}
                    aria-label="Edit profile"
                  >
                    <Pencil className="size-4" /> Edit Profile
                  </Button>
                </CardAction>
              )}
            </CardHeader>

            <CardContent className="flex flex-col gap-8">
              {/* Identity strip */}
              <div className="flex flex-col items-center gap-4 border-b border-border/70 pb-8 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
                <div className="relative size-24 shrink-0">
                  <Avatar className="size-24">
                    {userImage && <AvatarImage src={userImage} alt={user.name || user.email} />}
                    <AvatarFallback className="bg-primary font-heading text-3xl font-medium text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Upload / change photo — available in both modes */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    aria-label="Upload or change profile photo"
                    className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/80 disabled:opacity-60"
                  >
                    {uploadingPhoto ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelected}
                    className="hidden"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:items-start">
                  <span className="max-w-full truncate font-heading text-2xl tracking-tight">
                    {user.name || user.email}
                  </span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  {memberSinceLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      <CalendarDays className="size-3.5" />
                      {memberSinceLabel}
                    </span>
                  )}
                  {editing && (
                    <button
                      type="button"
                      onClick={() => void handlePhotoRemoved()}
                      disabled={uploadingPhoto}
                      className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline disabled:opacity-60"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              {/* Read mode */}
              {!editing ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoRow icon={User} label="Full Name" value={user.name || "Not provided"} />
                  <InfoRow icon={Mail} label="Email" value={user.email} />
                  <InfoRow
                    icon={Phone}
                    label="Phone Number"
                    value={user.phone?.trim() ? user.phone : "Not provided"}
                  />
                  <InfoRow
                    icon={FileText}
                    label="Bio"
                    value={user.bio?.trim() ? user.bio : "Not provided"}
                  />
                </div>
              ) : (
                /* Edit mode */
                <form
                  onSubmit={handleProfileSave}
                  className="flex flex-col gap-5"
                  aria-label="Edit profile information"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="profile-name" className="pl-4">
                        Full Name
                      </Label>
                      <input
                        id="profile-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Jordan Smith"
                        className={inputClasses}
                        value={profileForm.name}
                        onChange={(event) =>
                          setProfileForm((form) => ({ ...form, name: event.target.value }))
                        }
                        disabled={savingProfile}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="profile-email" className="pl-4">
                        Email
                      </Label>
                      <input
                        id="profile-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={inputClasses}
                        value={profileForm.email}
                        onChange={(event) =>
                          setProfileForm((form) => ({ ...form, email: event.target.value }))
                        }
                        disabled={savingProfile}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="profile-phone" className="pl-4">
                        Phone Number
                      </Label>
                      <input
                        id="profile-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+1 (555) 000-0000"
                        className={inputClasses}
                        value={profileForm.phone}
                        onChange={(event) =>
                          setProfileForm((form) => ({ ...form, phone: event.target.value }))
                        }
                        disabled={savingProfile}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <div className="flex items-end justify-between">
                        <Label htmlFor="profile-bio" className="pl-4">
                          Bio
                        </Label>
                        <span className="pr-4 text-xs text-muted-foreground">
                          {profileForm.bio.length}/{BIO_MAX_LENGTH}
                        </span>
                      </div>
                      <textarea
                        id="profile-bio"
                        name="bio"
                        rows={4}
                        maxLength={BIO_MAX_LENGTH}
                        placeholder="Tell other members about your work — photography, film, music or anything creative."
                        className="min-h-28 w-full resize-none rounded-2xl border border-input bg-card px-5 py-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60"
                        value={profileForm.bio}
                        onChange={(event) =>
                          setProfileForm((form) => ({ ...form, bio: event.target.value }))
                        }
                        disabled={savingProfile}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col-reverse items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={savingProfile}
                    >
                      <X className="size-4" /> Cancel
                    </Button>
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? (
                        <>
                          <Spinner className="size-4" /> Saving Changes…
                        </>
                      ) : (
                        <>
                          <Check className="size-4" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Account settings */}
          <Card className="gap-6 rounded-3xl py-8 shadow-[0_2px_24px_rgba(37,42,36,0.05)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 font-heading text-2xl tracking-tight">
                <ShieldCheck className="size-5 text-muted-foreground" />
                Account Settings
              </CardTitle>
              <CardDescription>Security and shortcuts for your account.</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              {/* Change password */}
              <section className="flex flex-col gap-3" aria-label="Change password">
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-muted-foreground" />
                  <h2 className="font-heading text-lg font-medium">Change Password</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep your account secure with a strong, unique password.
                </p>
                <form
                  onSubmit={handlePasswordChange}
                  className="flex flex-col gap-3.5"
                  aria-label="Update password"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="current-password" className="sr-only">
                      Current password
                    </Label>
                    <PasswordInput
                      id="current-password"
                      value={passwordForm.current}
                      onChange={(value) =>
                        setPasswordForm((form) => ({ ...form, current: value }))
                      }
                      autoComplete="current-password"
                      disabled={changingPassword}
                      placeholder="Current password"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="new-password" className="sr-only">
                      New password
                    </Label>
                    <PasswordInput
                      id="new-password"
                      value={passwordForm.next}
                      onChange={(value) =>
                        setPasswordForm((form) => ({ ...form, next: value }))
                      }
                      autoComplete="new-password"
                      disabled={changingPassword}
                      placeholder="New password (min. 8 characters)"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirm-password" className="sr-only">
                      Confirm new password
                    </Label>
                    <PasswordInput
                      id="confirm-password"
                      value={passwordForm.confirm}
                      onChange={(value) =>
                        setPasswordForm((form) => ({ ...form, confirm: value }))
                      }
                      autoComplete="new-password"
                      disabled={changingPassword}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? (
                      <>
                        <Spinner className="size-4" /> Updating…
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </section>

              <Separator />

              {/* OAuth providers linked to this account (explicit flow —
                  Better Auth never auto-links an OAuth identity into an
                  existing password account without a verified local email). */}
              <ConnectedAccounts />

              <Separator />

              {/* Quick links — role-aware: customers get the host
                  onboarding, hosts get the listing manager. */}
              <section className="flex flex-col gap-3" aria-label="Quick links">
                <h2 className="font-heading text-lg font-medium">Quick Links</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {isHost ? (
                    <Button variant="outline" render={<Link href="/my-listings" />}>
                      <ListPlus className="size-4" /> My Listings
                    </Button>
                  ) : (
                    <Button variant="outline" render={<Link href="/become-a-host" />}>
                      <Sparkles className="size-4" /> Become a Host
                    </Button>
                  )}
                  <Button variant="outline" render={<Link href="/my-bookings" />}>
                    <CalendarCheck className="size-4" /> My Bookings
                  </Button>
                </div>
              </section>

              <Separator />

              {/* Sign out */}
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <Spinner className="size-4" /> Signing out…
                  </>
                ) : (
                  <>
                    <LogOut className="size-4" /> Sign Out
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
