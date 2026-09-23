import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { TrustList, TrustPage, TrustSection } from "@/components/TrustPage";

export const metadata: Metadata = {
  title: "Terms of Use | MisterStory",
  description: "Terms governing access to and use of the MisterStory website and newsletter.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <TrustPage
        eyebrow="Legal"
        title="Terms of Use"
        introduction="These terms govern your access to and use of misterstory.in, its articles, company and people profiles, directories and newsletter."
        lastUpdated="24 September 2026"
      >
        <TrustSection title="Acceptance of these terms">
          <p>
            By using MisterStory, you agree to these Terms of Use and our{" "}
            <Link href="/privacy" className="font-semibold text-amber-800 underline underline-offset-4">
              Privacy Policy
            </Link>. If you do not agree, please do not use the website or subscribe to the newsletter.
          </p>
        </TrustSection>

        <TrustSection title="Information, not professional advice">
          <p>
            MisterStory publishes general educational and informational content about companies,
            industries, business strategies and people. Nothing on the website or in the newsletter is
            investment, financial, legal, tax, accounting or other professional advice.
          </p>
          <p>
            You are responsible for your own decisions and should consult an appropriately qualified
            professional before acting on information where professional advice is required.
          </p>
        </TrustSection>

        <TrustSection title="Accuracy and availability">
          <p>
            We work to provide clear and well-researched information, but companies, roles, financial
            figures and other facts can change. We do not guarantee that every page is complete, current
            or error-free. Content may be corrected, updated, reorganised or removed without notice.
          </p>
          <p>
            We do not guarantee uninterrupted access to the website, the newsletter or any particular feature.
          </p>
        </TrustSection>

        <TrustSection title="Intellectual property">
          <p>
            Unless otherwise stated, MisterStory&apos;s original writing, page design, graphics, branding and
            organisation are owned by or licensed to MisterStory and are protected by applicable law.
          </p>
          <p>
            You may link to our pages and quote short portions with clear attribution. You may not copy,
            republish, sell or commercially exploit substantial parts of the website without prior written permission.
          </p>
        </TrustSection>

        <TrustSection title="Acceptable use">
          <p>You must not:</p>
          <TrustList>
            <li>Attempt to gain unauthorised access to the website, Studio, accounts or infrastructure.</li>
            <li>Interfere with security, availability or normal operation of the website.</li>
            <li>Submit malicious code, deceptive requests or unlawful material.</li>
            <li>Use automated extraction at scale to reproduce or commercially republish our content without permission.</li>
            <li>Misrepresent MisterStory content, authorship or affiliation.</li>
          </TrustList>
          <p>
            Ordinary search-engine indexing and reasonable access consistent with our robots instructions are permitted.
          </p>
        </TrustSection>

        <TrustSection title="External links and third parties">
          <p>
            MisterStory may link to company websites, filings, social profiles, news reports or other
            third-party material. We do not control those services and are not responsible for their
            availability, security, accuracy or privacy practices. A link does not necessarily imply endorsement.
          </p>
        </TrustSection>

        <TrustSection title="Newsletter">
          <p>
            You may unsubscribe at any time through the link included in an email. We may change the
            newsletter schedule or discontinue it. You must not use another person&apos;s email address without permission.
          </p>
        </TrustSection>

        <TrustSection title="Limitation of responsibility">
          <p>
            To the fullest extent permitted by applicable law, MisterStory is not responsible for losses
            arising from reliance on the website, inability to access it, or use of a third-party website.
            Nothing in these terms excludes responsibility that cannot lawfully be excluded.
          </p>
        </TrustSection>

        <TrustSection title="Changes">
          <p>
            We may revise these terms when the publication or applicable requirements change. Continued
            use after an updated version is posted means the new terms apply from their stated update date.
          </p>
        </TrustSection>

        <TrustSection title="Governing law">
          <p>
            These terms are governed by the laws of India. Any dispute will be handled by a court or
            other forum having lawful jurisdiction. Mandatory rights available under applicable law remain unaffected.
          </p>
        </TrustSection>

        <TrustSection title="Contact">
          <p>
            Questions about these terms can be sent through the{" "}
            <Link href="/contact" className="font-semibold text-amber-800 underline underline-offset-4">
              Contact page
            </Link>.
          </p>
        </TrustSection>
      </TrustPage>
      <Footer />
    </>
  );
}
