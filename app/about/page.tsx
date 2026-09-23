import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { TrustList, TrustPage, TrustSection } from "@/components/TrustPage";

export const metadata: Metadata = {
  title: "About MisterStory",
  description:
    "Learn how MisterStory researches and explains companies, business models, strategies and the people behind them.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <TrustPage
        eyebrow="About MisterStory"
        title="Company stories, made understandable."
        introduction="MisterStory is an independent, research-led publication that explains how companies work, how they make money and how the people behind them make important decisions."
      >
        <TrustSection title="Why MisterStory exists">
          <p>
            Useful company information is often scattered across annual reports, regulatory filings,
            interviews, announcements and news coverage. MisterStory brings that information together
            and turns it into clear, structured explanations for curious readers.
          </p>
          <p>
            Our goal is not to make a company sound impressive or unappealing. It is to help readers
            understand the business well enough to form their own view.
          </p>
        </TrustSection>

        <TrustSection title="What we cover">
          <TrustList>
            <li>How companies make money and how their economics work.</li>
            <li>The strategies companies use to grow, compete and adapt.</li>
            <li>The founders, executives and other people who shaped a business.</li>
            <li>Important events, ownership changes and turning points in a company&apos;s history.</li>
          </TrustList>
        </TrustSection>

        <TrustSection title="How we work">
          <p>
            We begin with primary material whenever it is available, including company filings,
            annual reports, investor material, regulatory records and direct company statements.
            Reputable reporting and interviews may provide additional context.
          </p>
          <p>
            Research is organised, checked and rewritten in plain language. Articles are reviewed
            before publication and may be updated when new information becomes available. Read our{" "}
            <Link href="/editorial-policy" className="font-semibold text-amber-800 underline underline-offset-4">
              Editorial and Research Policy
            </Link>{" "}
            for the complete process.
          </p>
        </TrustSection>

        <TrustSection title="Independence and transparency">
          <p>
            Editorial coverage is chosen for its usefulness to readers. If MisterStory publishes paid,
            sponsored or partner-supported material in the future, it will be identified clearly and
            will not be presented as independent editorial coverage.
          </p>
          <p>
            MisterStory is an informational publication. Nothing on the site is investment, legal,
            tax or other professional advice.
          </p>
        </TrustSection>

        <TrustSection title="Questions or corrections">
          <p>
            We welcome evidence-based feedback. Visit the{" "}
            <Link href="/contact" className="font-semibold text-amber-800 underline underline-offset-4">
              Contact page
            </Link>{" "}
            to share a correction, suggest a company or ask about our work.
          </p>
        </TrustSection>
      </TrustPage>
      <Footer />
    </>
  );
}
