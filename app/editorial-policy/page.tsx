import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { TrustList, TrustPage, TrustSection } from "@/components/TrustPage";

export const metadata: Metadata = {
  title: "Editorial and Research Policy | MisterStory",
  description:
    "How MisterStory researches, verifies, writes, updates and corrects its company coverage.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <>
      <Header />
      <TrustPage
        eyebrow="Editorial standards"
        title="Editorial and Research Policy"
        introduction="This policy explains how MisterStory selects subjects, evaluates sources, uses research tools and handles corrections."
        lastUpdated="24 September 2026"
      >
        <TrustSection title="Our editorial purpose">
          <p>
            MisterStory publishes clear explanations of companies, business models, strategies and
            business leaders. We aim to separate verifiable facts from interpretation and to give
            readers enough context to understand why a fact matters.
          </p>
        </TrustSection>

        <TrustSection title="How topics are selected">
          <p>
            We choose subjects based on reader usefulness, business significance, availability of
            reliable information and the opportunity to explain something clearly. A company&apos;s size,
            popularity or willingness to speak with us does not guarantee coverage.
          </p>
        </TrustSection>

        <TrustSection title="Our source hierarchy">
          <p>Whenever practical, we prioritise:</p>
          <TrustList>
            <li>Regulatory filings, stock-exchange disclosures and government records.</li>
            <li>Annual reports, audited financial statements and official investor material.</li>
            <li>Direct company announcements, executive interviews and official websites.</li>
            <li>Established publications and specialist reporting for context or independent confirmation.</li>
          </TrustList>
          <p>
            Source links and research notes may be retained internally even when they are not displayed
            on the public article. Anonymous claims, promotional statements and secondary summaries are
            not treated as equivalent to primary evidence.
          </p>
        </TrustSection>

        <TrustSection title="Verification and writing">
          <TrustList>
            <li>Names, roles, dates and material numbers are checked against the strongest available source.</li>
            <li>Financial figures are labelled with their period and units where relevant.</li>
            <li>Estimates, opinions and reported claims are identified as such.</li>
            <li>Headlines should accurately represent the article and should not promise more than the article establishes.</li>
            <li>Articles are written in original language and reviewed for clarity before publication.</li>
          </TrustList>
        </TrustSection>

        <TrustSection title="Use of AI and other tools">
          <p>
            MisterStory may use software and AI-assisted tools to organise research, identify gaps,
            improve structure or help prepare early drafts. These tools are not treated as sources.
            A human editor is responsible for checking material claims, choosing the final wording and
            approving publication.
          </p>
          <p>
            We do not knowingly publish invented quotations, credentials, people or company facts.
            When reliable evidence is unavailable, the information should be omitted or its uncertainty
            made clear.
          </p>
        </TrustSection>

        <TrustSection title="Updates">
          <p>
            Company information changes. We may update an article to reflect a new role, filing,
            ownership change, financial period or other material development. The page may display its
            most recent update date. An update does not necessarily mean the earlier version contained
            an error.
          </p>
        </TrustSection>

        <TrustSection title="Corrections policy">
          <p>
            Readers can report a possible error through our{" "}
            <Link href="/contact" className="font-semibold text-amber-800 underline underline-offset-4">
              Contact page
            </Link>. Please include the page URL, the disputed statement and supporting evidence.
          </p>
          <TrustList>
            <li>Minor spelling, grammar or formatting mistakes may be corrected without a separate notice.</li>
            <li>Material factual errors are corrected as soon as reasonably possible after verification.</li>
            <li>Where useful to readers, a substantial correction or clarification will be noted on the page.</li>
            <li>Requests to remove accurate, lawfully published information are considered individually and are not automatically accepted.</li>
          </TrustList>
        </TrustSection>

        <TrustSection title="Conflicts, sponsorship and independence">
          <p>
            Commercial relationships must not determine editorial conclusions. Sponsored or paid
            material, if introduced, will be clearly labelled. Contributors should disclose a material
            financial or professional relationship that could reasonably affect their coverage.
          </p>
        </TrustSection>

        <TrustSection title="Not investment advice">
          <p>
            MisterStory provides general information and analysis. It does not recommend buying,
            selling or holding any security and does not provide investment, legal, tax or accounting advice.
          </p>
        </TrustSection>
      </TrustPage>
      <Footer />
    </>
  );
}
