import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { TrustPage, TrustSection } from "@/components/TrustPage";

const CONTACT_EMAIL = "hello@misterstory.in";

export const metadata: Metadata = {
  title: "Contact MisterStory",
  description:
    "Contact MisterStory about editorial feedback, corrections, privacy requests and general enquiries.",
  alternates: { canonical: "/contact" },
};

function EmailLink({ subject, children }: { subject: string; children: React.ReactNode }) {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`}
      className="font-semibold text-amber-800 underline underline-offset-4"
    >
      {children}
    </a>
  );
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <TrustPage
        eyebrow="Contact"
        title="Talk to MisterStory"
        introduction="Send questions, evidence-based corrections, company suggestions and privacy requests to the appropriate subject below."
      >
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">Email</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-2 block break-all text-2xl font-bold text-zinc-950 underline decoration-amber-600 underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <TrustSection title="Report a correction">
          <p>
            Email us with the article URL, the statement you believe is incorrect and a reliable source
            supporting the correction. Use the subject{" "}
            <EmailLink subject="Correction request">Correction request</EmailLink>.
          </p>
        </TrustSection>

        <TrustSection title="Editorial feedback and story ideas">
          <p>
            Suggest a company, business model or person that MisterStory should explain. Use the subject{" "}
            <EmailLink subject="Editorial suggestion">Editorial suggestion</EmailLink>.
          </p>
        </TrustSection>

        <TrustSection title="Privacy and newsletter requests">
          <p>
            To request access, correction or deletion of personal information, or to ask about a
            newsletter subscription, use the subject{" "}
            <EmailLink subject="Privacy request">Privacy request</EmailLink>. You can also unsubscribe
            directly through the link included in every newsletter.
          </p>
        </TrustSection>

        <TrustSection title="Business enquiries">
          <p>
            Clearly identify your organisation and the nature of the enquiry. Business contact does
            not guarantee coverage, and paid relationships do not determine editorial conclusions.
          </p>
        </TrustSection>
      </TrustPage>
      <Footer />
    </>
  );
}
