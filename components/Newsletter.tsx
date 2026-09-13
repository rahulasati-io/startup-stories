"use client";

import { FormEvent, useState } from "react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmissionState("submitting");
    setMessage("");

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website: formData.get("website"),
          referrer: window.location.href,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "We couldn't complete your signup.");
      }

      setEmail("");
      setSubmissionState("success");
      setMessage(result.message || "You're subscribed. Welcome aboard!");
      form.reset();
    } catch (error) {
      setSubmissionState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
            One business story every week.
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
            Interesting companies, smart strategies and the numbers behind
            them.
          </p>
        </div>

        <form
          className="mt-5 w-full max-w-md md:mt-0"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email address"
              className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />

            <div className="absolute -left-[10000px]" aria-hidden="true">
              <label htmlFor="newsletter-website">Website</label>
              <input
                id="newsletter-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={submissionState === "submitting"}
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
            >
              {submissionState === "submitting" ? "Subscribing…" : "Subscribe"}
            </button>
          </div>

          <p
            className={`mt-2 min-h-5 text-sm ${
              submissionState === "error" ? "text-red-700" : "text-zinc-600"
            }`}
            role={submissionState === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message}
          </p>
        </form>
      </div>
    </section>
  );
}
