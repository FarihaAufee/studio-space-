"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Check,
  Loader2,
  Mail,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { resizeImageFile } from "@/lib/profile-image";

const inputClasses =
  "h-11 w-full rounded-full border border-input bg-card px-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:opacity-60";

const BIO_MAX_LENGTH = 500;

interface ProfileEditFormProps {
  initial: {
    name: string;
    email: string;
    phone: string;
    bio: string;
    image: string | null;
  };
}

/**
 * Standalone profile editing form (/profile/edit).
 *
 * Changes are persisted through the Better Auth client (`updateUser`), so
 * name, phone, bio and the avatar go to the same authenticated account the
 * session comes from — the email itself stays read-only, matching how
 * Better Auth treats it without a verification flow.
 */
export function ProfileEditForm({ initial }: ProfileEditFormProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [bio, setBio] = useState(initial.bio);
  const [image, setImage] = useState<string | null>(initial.image);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const sessionUser = session?.user ?? null;

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await resizeImageFile(file);
      setImage(dataUrl);
      toast.info("Photo ready — save changes to apply it.");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "We could not process that photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Your name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await authClient.updateUser({
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        image: image ?? "",
      });

      if (updateError) {
        toast.error(updateError.message || "Could not save your profile.");
        return;
      }

      toast.success("Profile updated.");
      router.push("/profile");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-8"
      aria-label="Edit profile"
    >
      {/* Avatar */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl tracking-tight">Profile photo</h2>
        <div className="flex items-center gap-5">
          <span className="relative size-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {image ? (
              <Image
                src={image}
                alt="Profile photo preview"
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                <UserRound className="size-8" aria-hidden="true" />
              </span>
            )}
            {uploadingPhoto ? (
              <span className="absolute inset-0 flex items-center justify-center bg-[#252A24]/60 text-white">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              </span>
            ) : null}
          </span>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="profile-photo"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-within:ring-3 focus-within:ring-ring/50"
            >
              <Camera className="size-4" aria-hidden="true" />
              {image ? "Change photo" : "Upload photo"}
            </Label>
            <input
              id="profile-photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void handlePhotoChange(event.target.files?.[0])}
              disabled={uploadingPhoto}
            />
            <p className="text-xs text-muted-foreground">
              JPG or PNG, square-cropped to 256px automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Identity */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-name" className="pl-4">
            Full name
          </Label>
          <input
            id="edit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jordan Smith"
            className={inputClasses}
            autoComplete="name"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-email" className="pl-4">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="edit-email"
              value={initial.email}
              readOnly
              disabled
              className={`${inputClasses} cursor-not-allowed pl-10 text-muted-foreground`}
            />
          </div>
          <p className="pl-4 text-xs text-muted-foreground">
            Your sign-in address stays fixed on your account.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="edit-phone" className="pl-4">
            Phone
          </Label>
          <input
            id="edit-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+8801XXXXXXXXX"
            className={inputClasses}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
      </section>

      {/* Bio */}
      <section className="flex flex-col gap-1.5">
        <Label htmlFor="edit-bio" className="pl-4">
          Bio
        </Label>
        <textarea
          id="edit-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Tell hosts and hosts about your work — specialties, gear, and what you create."
          rows={5}
          maxLength={BIO_MAX_LENGTH}
          className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:opacity-60"
        />
        <p className="pl-4 text-xs text-muted-foreground">
          {bio.length}/{BIO_MAX_LENGTH} characters
        </p>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button variant="ghost" render={<Link href="/profile" />} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || uploadingPhoto}>
          {saving ? (
            "Saving changes…"
          ) : (
            <>
              <Check className="size-4" aria-hidden="true" />
              Save changes
            </>
          )}
        </Button>
      </div>
      <p className="sr-only">
        Signed in as {sessionUser?.email ?? "your account"}
      </p>
    </form>
  );
}
