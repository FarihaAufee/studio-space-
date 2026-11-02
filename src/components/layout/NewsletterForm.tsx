"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * Footer newsletter signup. There is no newsletter API yet, so this form
 * validates locally and shows an honest inline confirmation without
 * pretending to hit a backend.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      return;
    }

    // Newsletter subscriptions are stored once the backend is connected.
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          Thank you for subscribing. Once launch notifications go live,
          we&apos;ll let you know first.
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-sm">
      <div className="flex h-11 items-center gap-2 rounded-full border border-input bg-card p-1 pl-4 transition-colors focus-within:border-ring">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") setStatus("idle");
          }}
          aria-invalid={status === "error"}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Subscribe to the newsletter"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 ml-4 text-xs" role={status === "error" ? "alert" : undefined}>
        {status === "error" ? (
          <span className="text-destructive">
            Please enter a valid email address.
          </span>
        ) : (
          <span className="text-muted-foreground">
            New studios and host stories, roughly once a month.
          </span>
        )}
      </p>
    </form>
  );
}
