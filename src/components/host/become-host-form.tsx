"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CircleAlert, ClipboardCheck, Hourglass, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL, parseApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Become a Host onboarding form (client component).
 *
 *  - Prefills the full name and read-only email from the verified session.
 *  - Validates every field client-side, mirrors the server rules, and
 *    shows field-level messages.
 *  - POSTs /api/hosts/apply with browser credentials; duplicate
 *    submissions are blocked by the submitting state AND the server
 *    (409 with the existing application).
 *  - A pending application renders its status instead of the form, and the
 *    server response for fresh applications activates host access
 *    immediately (router refresh keeps every consumer in sync).
 */

const inputClasses =
  "h-11 w-full rounded-full border border-input bg-background px-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

const HOSTING_TYPES = [
  {
    value: "individual" as const,
    label: "Individual",
    hint: "You host your own space personally.",
  },
  {
    value: "business" as const,
    label: "Business",
    hint: "You represent a studio brand or company.",
  },
];

interface BecomeHostFormProps {
  fallbackName: string;
  email: string;
}

interface FormState {
  fullName: string;
  phone: string;
  businessName: string;
  location: string;
  introduction: string;
  hostingType: "individual" | "business" | "";
  termsAgreed: boolean;
}

const EMPTY_FORM: FormState = {
  fullName: "",
  phone: "",
  businessName: "",
  location: "",
  introduction: "",
  hostingType: "",
  termsAgreed: false,
};

export function BecomeHostForm({ fallbackName, email }: BecomeHostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    fullName: fallbackName.trim(),
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  /** Client-side validation mirroring the server's per-field rules. */
  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) {
      errors.fullName = "Full name is required.";
    } else if (form.fullName.trim().length < 2 || form.fullName.trim().length > 80) {
      errors.fullName = "Full name must be 2–80 characters.";
    }
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^[+\d][\d\s().-]{5,19}$/.test(form.phone.trim())) {
      errors.phone = "Enter a valid phone number (6–20 characters).";
    }
    if (!form.businessName.trim()) {
      errors.businessName = "Business or studio brand name is required.";
    } else if (form.businessName.trim().length < 2 || form.businessName.trim().length > 80) {
      errors.businessName = "Business or studio brand name must be 2–80 characters.";
    }
    if (!form.location.trim()) {
      errors.location = "Studio location is required.";
    } else if (form.location.trim().length < 2 || form.location.trim().length > 120) {
      errors.location = "Studio location must be 2–120 characters.";
    }
    if (!form.introduction.trim()) {
      errors.introduction = "A short introduction is required.";
    } else if (form.introduction.trim().length < 30 || form.introduction.trim().length > 600) {
      errors.introduction = "Tell us about your hosting experience in 30–600 characters.";
    }
    if (!form.hostingType) {
      errors.hostingType = "Choose a hosting type.";
    }
    if (!form.termsAgreed) {
      errors.termsAgreed = "You must agree to the host terms.";
    }
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    // Duplicate-submission guard #1: synchronous button state.
    if (submitting) return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setNotice("Please fix the highlighted fields.");
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/hosts/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          // Email is read-only in the UI; the server only ever uses the
          // session email anyway.
          email: email.trim(),
          phone: form.phone.trim(),
          businessName: form.businessName.trim(),
          location: form.location.trim(),
          introduction: form.introduction.trim(),
          hostingType: form.hostingType,
          termsAgreed: form.termsAgreed,
        }),
      });
      const result = await parseApiResponse(response);

      if (response.ok) {
        toast.success("Welcome aboard — you are now a StudioSpace host!");
        // Role change lands in the DB; refresh re-renders every server
        // component (gates, navigation) before the dashboard navigation.
        router.refresh();
        router.push("/host/dashboard");
        return;
      }

      if (response.status === 409) {
        const raw = result.raw as { alreadyHost?: boolean } | null;
        if (raw?.alreadyHost) {
          toast.info("You are already a host — opening your dashboard.");
          router.push("/host/dashboard");
          return;
        }
        setNotice(result.message);
        toast.error(result.message);
        return;
      }

      // Server-side field errors map back onto the form fields.
      const serverErrors =
        result.raw &&
        typeof result.raw === "object" &&
        typeof (result.raw as { errors?: unknown }).errors === "object"
          ? ((result.raw as { errors: Record<string, string> }).errors ?? {})
          : {};
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
        setNotice("Please fix the highlighted fields.");
        toast.error(result.message);
      } else {
        setNotice(result.message);
        toast.error(result.message);
      }
    } catch {
      setNotice("We could not reach the StudioSpace API. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderError = (field: string, extraClass = "") =>
    fieldErrors[field] ? (
      <p className={`text-xs text-destructive ${extraClass}`} role="alert">
        {fieldErrors[field]}
      </p>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
      aria-label="Become a host application"
    >
      {notice && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      )}

      {/* Identity */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="host-full-name" className="pl-4">
            Full name
          </Label>
          <input
            id="host-full-name"
            value={form.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            placeholder={fallbackName.trim() ? undefined : "Enter your full name"}
            className={inputClasses}
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.fullName)}
            required
          />
          {renderError("fullName", "pl-4")}
          {!fallbackName.trim() && (
            <p className="pl-4 text-xs text-muted-foreground">
              Your profile has no name yet — enter the display name hosts and
              guests will see.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="host-email" className="pl-4">
            Email
          </Label>
          <input
            id="host-email"
            type="email"
            value={email}
            readOnly
            disabled
            className={`${inputClasses} cursor-not-allowed text-muted-foreground`}
            aria-describedby="host-email-note"
          />
          {renderError("email", "pl-4")}
          <p id="host-email-note" className="pl-4 text-xs text-muted-foreground">
            From your account — cannot be changed here.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="host-phone" className="pl-4">
            Phone number
          </Label>
          <input
            id="host-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            placeholder="+880 1XXX XXXXXX"
            className={inputClasses}
            autoComplete="tel"
            aria-invalid={Boolean(fieldErrors.phone)}
            required
          />
          {renderError("phone", "pl-4")}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="host-business" className="pl-4">
            Business or studio brand name
          </Label>
          <input
            id="host-business"
            value={form.businessName}
            onChange={(event) => setField("businessName", event.target.value)}
            placeholder="e.g. Lumina Studio"
            className={inputClasses}
            aria-invalid={Boolean(fieldErrors.businessName)}
            required
          />
          {renderError("businessName", "pl-4")}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="host-location" className="pl-4">
            Studio location
          </Label>
          <input
            id="host-location"
            value={form.location}
            onChange={(event) => setField("location", event.target.value)}
            placeholder="e.g. Dhanmondi, Dhaka"
            className={inputClasses}
            aria-invalid={Boolean(fieldErrors.location)}
            required
          />
          {renderError("location", "pl-4")}
        </div>
      </section>

      {/* Introduction */}
      <section className="flex flex-col gap-1.5">
        <Label htmlFor="host-introduction" className="pl-4">
          Short introduction / hosting experience
        </Label>
        <Textarea
          id="host-introduction"
          value={form.introduction}
          onChange={(event) => setField("introduction", event.target.value)}
          placeholder="Tell creators about your spaces and hosting experience — properties run, fellowships, or events hosted…"
          className="min-h-28 rounded-2xl border-border bg-background px-4 py-3"
          maxLength={600}
          aria-invalid={Boolean(fieldErrors.introduction)}
          required
        />
        <div className="flex items-center justify-between px-4">
          {fieldErrors.introduction ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.introduction}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">30–600 characters</span>
          )}
          <span className="text-xs text-muted-foreground">{form.introduction.trim().length}/600</span>
        </div>
      </section>

      {/* Hosting type */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="pl-4 text-sm font-medium text-foreground">
          Hosting type
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {HOSTING_TYPES.map((option) => (
            <label
              key={option.value}
              htmlFor={`hosting-${option.value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm transition-colors hover:bg-muted/60",
                form.hostingType === option.value && "border-primary bg-primary/5"
              )}
            >
              <Checkbox
                id={`hosting-${option.value}`}
                name="hostingType"
                className="mt-0.5"
                checked={form.hostingType === option.value}
                onCheckedChange={(checked) =>
                  setField("hostingType", checked ? option.value : "")
                }
                aria-describedby={`hosting-${option.value}-hint`}
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{option.label}</span>
                <span
                  id={`hosting-${option.value}-hint`}
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
        {renderError("hostingType")}
      </fieldset>

      {/* Terms */}
      <label
        htmlFor="host-terms"
        className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4 text-sm"
      >
        <Checkbox
          id="host-terms"
          name="termsAgreed"
          className="mt-0.5"
          checked={form.termsAgreed}
          onCheckedChange={(checked) => setField("termsAgreed", checked === true)}
        />
        <span className="leading-relaxed text-muted-foreground">
          I agree to the{" "}
          <Link
            href="/terms"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            host terms
          </Link>{" "}
          and confirm that the provided details are accurate.
        </span>
      </label>
      {renderError("termsAgreed")}

      {/* Submit */}
      <div className="flex flex-col items-start gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Submitting application…
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Become a Host
            </>
          )}
        </Button>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {submitting ? (
            <>
              <Hourglass className="size-3.5 shrink-0" aria-hidden="true" />
              One moment — validating your application.
            </>
          ) : (
            <>
              <ClipboardCheck className="size-3.5 shrink-0" aria-hidden="true" />
              Valid applications are approved instantly.
            </>
          )}
        </p>
      </div>
    </form>
  );
}
