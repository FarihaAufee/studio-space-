"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Check, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/data/categories";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";
import { StudioImageManager } from "@/components/studios/studio-image-manager";
import { getStudioImages, type StudioImage } from "@/lib/studio-images";

/**
 * Shared studio form for creating a listing (/add-studio) and editing an
 * existing one (My Listings). With the `admin` prop it becomes the admin
 * edit form (/admin/studios/[id]/edit) targeting the admin API instead of
 * the host listing API, and makes hostName/hostEmail editable. Submits to
 * the StudioSpace backend; failures are shown honestly — no fake success
 * state.
 */

const inputClasses =
  "h-11 w-full rounded-full border border-input bg-card px-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

const pillInputClasses =
  "h-11 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:opacity-60";

const selectClasses =
  "h-11 w-full appearance-none rounded-full border border-input bg-card px-5 text-sm text-foreground outline-none transition-colors focus:border-ring [color-scheme:light] [&>option]:bg-white [&>option]:text-[#252A24] [&>option:checked]:bg-[#E9E5DB] [&>option:checked]:text-[#252A24]";

interface StudioFormProps {
  mode: "create" | "edit";
  /** Required in edit mode — the listing to update. */
  studioId?: string;
  /** Admin area edit: PUTs /api/admin/studios/:id (requires ADMIN_EMAILS match server-side). */
  admin?: boolean;
  initial?: {
    title?: string;
    category?: string;
    location?: string;
    address?: string;
    /** Legacy cover image — normalized into `images` when alone. */
    image?: string;
    /** Ordered gallery (index 0 is the cover) from the API. */
    images?: StudioImage[];
    overview?: string;
    hourlyRate?: number;
    securityDeposit?: number;
    maxCapacity?: number;
    amenities?: string[];
    /** Host fields: editable only in admin mode, else server-managed. */
    hostName?: string;
    hostEmail?: string;
  };
  /** Session-provided host defaults (create mode only). */
  hostName?: string;
  hostEmail?: string;
  /** Called after a successful edit (lets parents close dialogs / refresh). */
  onSaved?: () => void;
}

interface FormState {
  title: string;
  category: string;
  location: string;
  address: string;
  overview: string;
  hourlyRate: string;
  securityDeposit: string;
  maxCapacity: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  category: "",
  location: "",
  address: "",
  overview: "",
  hourlyRate: "",
  securityDeposit: "",
  maxCapacity: "",
};

export function StudioForm({
  mode,
  studioId,
  admin = false,
  initial,
  hostName,
  hostEmail,
  onSaved,
}: StudioFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    title: initial?.title ?? "",
    category: initial?.category ?? "",
    location: initial?.location ?? "",
    address: initial?.address ?? "",
    overview: initial?.overview ?? "",
    hourlyRate: initial?.hourlyRate !== undefined ? String(initial.hourlyRate) : "",
    securityDeposit:
      initial?.securityDeposit !== undefined ? String(initial.securityDeposit) : "",
    maxCapacity: initial?.maxCapacity !== undefined ? String(initial.maxCapacity) : "",
  });
  // Ordered image list (index 0 = cover). Legacy `initial.image`-only
  // documents are normalized so old listings keep editing seamlessly.
  const [images, setImages] = useState<StudioImage[]>(
    getStudioImages({ image: initial?.image, images: initial?.images })
  );
  const [hostNameValue, setHostNameValue] = useState(
    initial?.hostName ?? hostName ?? ""
  );
  const [hostEmailValue, setHostEmailValue] = useState(
    initial?.hostEmail ?? hostEmail ?? ""
  );
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities ?? []);
  const [amenityDraft, setAmenityDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addAmenity = () => {
    const value = amenityDraft.trim();
    if (!value) return;
    if (amenities.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setAmenityDraft("");
      return;
    }
    setAmenities((current) => [...current, value]);
    setAmenityDraft("");
  };

  const removeAmenity = (item: string) => {
    setAmenities((current) => current.filter((entry) => entry !== item));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setFieldErrors({});

    if (!isEdit && (!hostNameValue.trim() || !hostEmailValue.trim())) {
      setNotice("Your session details are needed to list the studio. Please sign in again.");
      return;
    }

    // At least one image (uploaded or URL) is required — the first one is
    // the cover and mirrors the legacy flat `image` field for old readers.
    if (images.length === 0) {
      setFieldErrors({
        image: "Add at least one image — upload a photo or paste a direct http(s) image URL.",
      });
      setNotice("Please add at least one image before saving.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      category: form.category,
      location: form.location.trim(),
      address: form.address.trim(),
      images,
      image: images[0]!.url,
      overview: form.overview.trim(),
      amenities,
    };

    const hourlyRate = Number(form.hourlyRate);
    if (!form.hourlyRate.trim() || !Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      setFieldErrors({ hourlyRate: "Hourly rate must be a number greater than zero" });
      return;
    }
    payload.hourlyRate = hourlyRate;

    if (form.securityDeposit.trim()) {
      const deposit = Number(form.securityDeposit);
      if (!Number.isFinite(deposit) || deposit < 0) {
        setFieldErrors({ securityDeposit: "Security deposit must be zero or more" });
        return;
      }
      payload.securityDeposit = deposit;
    }

    const maxCapacity = Number(form.maxCapacity);
    if (
      !form.maxCapacity.trim() ||
      !Number.isFinite(maxCapacity) ||
      maxCapacity <= 0 ||
      !Number.isInteger(maxCapacity)
    ) {
      setFieldErrors({
        maxCapacity: "Max capacity must be a whole number greater than zero",
      });
      return;
    }
    payload.maxCapacity = maxCapacity;

    // hostName is a required field on creation; ownership fields are
    // server-managed on update and must never be sent from a host session.
    // Admin edits may correct the host display fields (hostName/hostEmail)
    // — hostId itself is always dropped server-side, for admins too.
    if (!isEdit) {
      payload.hostName = hostNameValue.trim();
      payload.hostEmail = hostEmailValue.trim();
    } else if (admin) {
      if (hostNameValue.trim()) payload.hostName = hostNameValue.trim();
      if (hostEmailValue.trim()) payload.hostEmail = hostEmailValue.trim();
    }

    setSubmitting(true);
    try {
      const endpoint = isEdit
        ? admin
          ? `${API_BASE_URL}/admin/studios/${studioId}`
          : `${API_BASE_URL}/hosts/listings/${studioId}`
        : `${API_BASE_URL}/studios`;
      const response = await fetch(
        endpoint,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      const result = await parseApiResponse(response);

      if (!result.ok) {
        // Backend validation errors arrive keyed by field name.
        const errors =
          result.raw &&
          typeof result.raw === "object" &&
          typeof (result.raw as { errors?: unknown }).errors === "object"
            ? ((result.raw as { errors: Record<string, string> }).errors ?? {})
            : {};
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setNotice("Please fix the highlighted fields.");
        } else {
          setNotice(result.message);
        }
        toast.error(result.message);
        return;
      }

      if (isEdit) {
        toast.success("Listing updated.");
        onSaved?.();
        // Admin edits land back on the admin studio list, otherwise the
        // refresh keeps the host-dialog behaviour.
        if (admin) router.push("/admin/studios");
        else router.refresh();
      } else {
        const created = result.data as { _id?: string } | null;
        toast.success("Studio listed. It is now visible in the gallery.");
        if (created?._id) {
          router.push(`/studios/${created._id}`);
        } else {
          router.push("/my-listings");
        }
      }
    } catch {
      setNotice("We could not reach the StudioSpace API. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" aria-label={isEdit ? "Edit studio listing" : "List a new studio"}>
      {notice && (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {notice}
        </p>
      )}

      {/* Basics */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl tracking-tight">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="studio-title" className="pl-4">Studio title</Label>
            <input
              id="studio-title"
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="e.g. Sunlit Rooftop Photo Studio"
              className={inputClasses}
              aria-invalid={Boolean(fieldErrors.title)}
              required
            />
            {fieldErrors.title && (
              <p className="pl-4 text-xs text-destructive">{fieldErrors.title}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="studio-category" className="pl-4">Category</Label>
            <select
              id="studio-category"
              value={form.category}
              onChange={(event) => setField("category", event.target.value)}
              className={selectClasses}
              aria-invalid={Boolean(fieldErrors.category)}
              required
            >
              <option value="" disabled>
                Choose a category
              </option>
              {CATEGORIES.map((item) => (
                <option key={item.slug} value={item.title}>
                  {item.title}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="pl-4 text-xs text-destructive">{fieldErrors.category}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="studio-location" className="pl-4">City / area</Label>
            <input
              id="studio-location"
              value={form.location}
              onChange={(event) => setField("location", event.target.value)}
              placeholder="e.g. Dhaka"
              className={inputClasses}
              aria-invalid={Boolean(fieldErrors.location)}
              required
            />
            {fieldErrors.location && (
              <p className="pl-4 text-xs text-destructive">{fieldErrors.location}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="studio-address" className="pl-4">Full address</Label>
            <input
              id="studio-address"
              value={form.address}
              onChange={(event) => setField("address", event.target.value)}
              placeholder="House 12, Road 5, Dhanmondi, Dhaka"
              className={inputClasses}
              aria-invalid={Boolean(fieldErrors.address)}
              required
            />
            {fieldErrors.address && (
              <p className="pl-4 text-xs text-destructive">{fieldErrors.address}</p>
            )}
          </div>
        </div>
      </section>

      {/* Presentation */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl tracking-tight">Presentation</h2>

        <div className="flex flex-col gap-1.5">
          <Label className="pl-4">Photos</Label>
          <StudioImageManager value={images} onChange={setImages} disabled={submitting} />
          {fieldErrors.image && (
            <p className="pl-4 text-xs text-destructive">{fieldErrors.image}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="studio-overview" className="pl-4">Overview</Label>
          <Textarea
            id="studio-overview"
            value={form.overview}
            onChange={(event) => setField("overview", event.target.value)}
            placeholder="Describe the space, the light, the gear available, and what it is best for…"
            className="min-h-24 rounded-2xl border-border bg-card px-4 py-3"
            aria-invalid={Boolean(fieldErrors.overview)}
            required
          />
          {fieldErrors.overview && (
            <p className="pl-4 text-xs text-destructive">{fieldErrors.overview}</p>
          )}
        </div>
      </section>

      {/* Pricing and capacity */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl tracking-tight">Pricing &amp; capacity</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="studio-rate" className="pl-4">Hourly rate (৳)</Label>
            <input
              id="studio-rate"
              type="number"
              min={1}
              value={form.hourlyRate}
              onChange={(event) => setField("hourlyRate", event.target.value)}
              placeholder="1500"
              className={pillInputClasses}
              aria-invalid={Boolean(fieldErrors.hourlyRate)}
              required
            />
            {fieldErrors.hourlyRate && (
              <p className="text-xs text-destructive">{fieldErrors.hourlyRate}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="studio-deposit" className="pl-4">Security deposit (৳)</Label>
            <input
              id="studio-deposit"
              type="number"
              min={0}
              value={form.securityDeposit}
              onChange={(event) => setField("securityDeposit", event.target.value)}
              placeholder="Optional"
              className={pillInputClasses}
              aria-invalid={Boolean(fieldErrors.securityDeposit)}
            />
            {fieldErrors.securityDeposit && (
              <p className="text-xs text-destructive">{fieldErrors.securityDeposit}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="studio-capacity" className="pl-4">Max guests</Label>
            <input
              id="studio-capacity"
              type="number"
              min={1}
              step={1}
              value={form.maxCapacity}
              onChange={(event) => setField("maxCapacity", event.target.value)}
              placeholder="10"
              className={pillInputClasses}
              aria-invalid={Boolean(fieldErrors.maxCapacity)}
              required
            />
            {fieldErrors.maxCapacity && (
              <p className="text-xs text-destructive">{fieldErrors.maxCapacity}</p>
            )}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl tracking-tight">Amenities</h2>
        <div className="flex gap-2">
          <Label htmlFor="studio-amenity" className="sr-only">
            Add amenity
          </Label>
          <input
            id="studio-amenity"
            value={amenityDraft}
            onChange={(event) => setAmenityDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addAmenity();
              }
            }}
            placeholder="e.g. Professional lighting"
            className={pillInputClasses}
          />
          <Button type="button" variant="outline" onClick={addAmenity} className="h-11 shrink-0 rounded-2xl">
            <Plus className="size-4" /> Add
          </Button>
        </div>
        {amenities.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {amenities.map((item) => (
              <li key={item}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-foreground">
                  <Check className="size-3 text-primary" aria-hidden="true" />
                  {item}
                  <button
                    type="button"
                    onClick={() => removeAmenity(item)}
                    aria-label={`Remove ${item}`}
                    className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No amenities added yet — list what creators can use on site.
          </p>
        )}
        {fieldErrors.amenities && (
          <p className="text-xs text-destructive">{fieldErrors.amenities}</p>
        )}
      </section>

      {/* Host details (create mode and admin edits — ownership is
          server-managed; hosts cannot change it, admins may correct
          the display fields) */}
      {(!isEdit || admin) && (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl tracking-tight">Host details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="studio-host-name" className="pl-4">Host name</Label>
              <input
                id="studio-host-name"
                value={hostNameValue}
                onChange={(event) => setHostNameValue(event.target.value)}
                placeholder="Your public host name"
                className={inputClasses}
                aria-invalid={Boolean(fieldErrors.hostName)}
                /* required on host creation; optional in admin edits where
                   legacy docs may not carry host fields at all */
                required={!admin}
              />
              {fieldErrors.hostName && (
                <p className="pl-4 text-xs text-destructive">{fieldErrors.hostName}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="studio-host-email" className="pl-4">Host email</Label>
              <input
                id="studio-host-email"
                type="email"
                value={hostEmailValue}
                onChange={(event) => setHostEmailValue(event.target.value)}
                placeholder="host@example.com"
                className={
                  admin
                    ? inputClasses
                    : `${inputClasses} cursor-not-allowed text-muted-foreground`
                }
                aria-invalid={Boolean(fieldErrors.hostEmail)}
                /* required for creation; optional/correctable for admins */
                required={!admin}
                readOnly={!admin}
                disabled={!admin}
              />
              <p className="pl-4 text-xs text-muted-foreground">
                {admin
                  ? "Only an admin can adjust this contact field; it also decides legacy ownership."
                  : "From your account — ownership is tied to it and cannot be changed."}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (
            "Submitting…"
          ) : (
            <>
              <Camera className="size-4" aria-hidden="true" />
              {isEdit ? "Save changes" : "Publish listing"}
            </>
          )}
        </Button>
      </div>
      <p className="flex items-center gap-2 text-xs leading-relaxed text-muted-foreground">
        <Save className="size-3.5 shrink-0" aria-hidden="true" />
        listings appear in the public gallery immediately after publishing.
      </p>
    </form>
  );
}
