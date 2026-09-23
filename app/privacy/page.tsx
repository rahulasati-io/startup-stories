import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { TrustList, TrustPage, TrustSection } from "@/components/TrustPage";

const CONTACT_EMAIL = "hello@misterstory.in";

export const metadata: Metadata = {
  title: "Privacy Policy | MisterStory",
  description:
    "How MisterStory collects, uses and protects newsletter and website information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <TrustPage
        eyebrow="Legal"
        title="Privacy Policy"
        introduction="This policy explains what personal information MisterStory collects, why it is used, which service providers help us operate the website and how you can make a privacy request."
        lastUpdated="24 September 2026"
      >
        <TrustSection title="Who we are">
          <p>
            MisterStory is a business-information publication operating from India. In this policy,
            “MisterStory”, “we”, “us” and “our” refer to the operator of misterstory.in.
          </p>
          <p>
            Privacy questions can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-amber-800 underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>.
          </p>
        </TrustSection>

        <TrustSection title="Information we collect">
          <TrustList>
            <li><strong>Newsletter information:</strong> the email address you submit and the page from which you subscribed.</li>
            <li><strong>Security information:</strong> an IP address may be processed temporarily to limit repeated or automated newsletter requests.</li>
            <li><strong>Technical information:</strong> hosting providers may create standard server logs containing information such as request time, browser type, device information, IP address and requested URL.</li>
            <li><strong>Communications:</strong> information you include when you email us about corrections, privacy or another enquiry.</li>
          </TrustList>
          <p>
            Please do not send sensitive personal information unless it is necessary for a specific request.
          </p>
        </TrustSection>

        <TrustSection title="How we use information">
          <TrustList>
            <li>To send the newsletter you requested and manage your subscription.</li>
            <li>To respond to enquiries, correction reports and privacy requests.</li>
            <li>To protect the website and newsletter form from abuse, fraud and automated submissions.</li>
            <li>To maintain, troubleshoot and improve the reliability of the website.</li>
            <li>To meet legal obligations and protect lawful rights.</li>
          </TrustList>
          <p>We do not sell or rent subscriber email addresses.</p>
        </TrustSection>

        <TrustSection title="Newsletter consent">
          <p>
            When you enter your email and select Subscribe, you ask MisterStory to send you its
            newsletter. You can withdraw that consent at any time by using the unsubscribe link in an
            email or by contacting us. Withdrawing consent does not affect processing that occurred
            before your withdrawal.
          </p>
        </TrustSection>

        <TrustSection title="Service providers and international processing">
          <p>We use service providers to operate the publication, including:</p>
          <TrustList>
            <li><strong>Kit</strong> to store subscribers and deliver newsletter emails.</li>
            <li><strong>Vercel</strong> to host and deliver the website.</li>
            <li><strong>Sanity</strong> to manage and deliver editorial content.</li>
          </TrustList>
          <p>
            These providers may process information in countries outside India. Their handling of data
            is governed by their own terms, privacy commitments and applicable data-protection law.
            We may replace or add providers as the website develops and will update this policy when a
            change materially affects personal information.
          </p>
        </TrustSection>

        <TrustSection title="Cookies and analytics">
          <p>
            MisterStory currently does not intentionally use advertising trackers or its own analytics
            cookies on the public website. Essential infrastructure may still use technical mechanisms
            necessary for security, delivery or a feature you request. If optional analytics or
            advertising technology is introduced, this policy and any required consent controls will be updated.
          </p>
        </TrustSection>

        <TrustSection title="Retention">
          <p>
            Newsletter information is retained while you remain subscribed and for a reasonable period
            afterwards where necessary to honour an unsubscribe request, resolve a dispute or comply
            with law. The website&apos;s in-memory rate-limit record normally expires after approximately ten
            minutes. Hosting and service-provider logs are retained according to the provider&apos;s settings
            and policies. Communications are kept only as long as reasonably necessary for their purpose.
          </p>
        </TrustSection>

        <TrustSection title="Your choices and rights">
          <p>Depending on applicable law, you may ask us to:</p>
          <TrustList>
            <li>Confirm whether we process your personal information.</li>
            <li>Correct inaccurate or incomplete information.</li>
            <li>Delete information that is no longer required.</li>
            <li>Withdraw newsletter consent or object to certain processing.</li>
          </TrustList>
          <p>
            Send a request through the{" "}
            <Link href="/contact" className="font-semibold text-amber-800 underline underline-offset-4">
              Contact page
            </Link>. We may need enough information to verify the request and locate the relevant record.
          </p>
        </TrustSection>

        <TrustSection title="Children">
          <p>
            MisterStory is not directed to children under 18, and we do not knowingly request personal
            information from children. If you believe a child has submitted personal information,
            please contact us so that we can review and remove it where appropriate.
          </p>
        </TrustSection>

        <TrustSection title="Security">
          <p>
            We use reasonable organisational and technical safeguards appropriate to the information we
            process. No internet transmission or storage system can be guaranteed completely secure.
          </p>
        </TrustSection>

        <TrustSection title="Changes to this policy">
          <p>
            We may update this policy when the website, service providers or legal requirements change.
            The latest version will appear on this page with a revised update date.
          </p>
        </TrustSection>
      </TrustPage>
      <Footer />
    </>
  );
}
