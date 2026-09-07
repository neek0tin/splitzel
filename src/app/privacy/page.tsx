"use client";

import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";

const LAST_UPDATED = "September 2026";
const CONTACT_EMAIL = "info@lisensyalab.com";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Privacy Policy" onBack={() => router.back()} />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="text-xs text-navy/50 dark:text-white/50 font-secondary">Last updated: {LAST_UPDATED}</p>

        <p className="mt-4 text-sm text-navy/80 dark:text-white/80 font-secondary leading-relaxed">
          Splitzel (&ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;the app&rdquo;) is a bill-splitting app. This page
          explains what information we collect, why, and how you can request it be deleted.
        </p>

        <Section title="Information We Collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Account information</strong> — when you sign in with Google or Facebook, we receive your name,
              profile picture, and email address from that provider so we can create your Splitzel account.
            </li>
            <li>
              <strong>Profile information you provide</strong> — your name as you enter it, and any payment details
              you choose to add (GCash number, bank name, bank account number/name). This is entirely optional and
              only shown to friends you&apos;ve connected with, so they know how to pay you back.
            </li>
            <li>
              <strong>Receipt photos</strong> — when you scan a receipt, the photo is sent to a third-party AI
              service (Anthropic) to read the item names, prices, and quantities on it. The photo itself is not
              stored by us after it&apos;s processed — only the extracted text (item names and prices) is saved to
              your bill.
            </li>
            <li>
              <strong>Bill-splitting activity</strong> — the receipts, splits, friend connections, and payment
              statuses you create while using the app.
            </li>
          </ul>
        </Section>

        <Section title="How We Use Your Information">
          <p>
            Strictly to run the app: creating your account, letting you split bills with friends, tracking who&apos;s
            paid, sending in-app notifications about split activity, and reading receipts you choose to scan. We do
            not use your information for advertising, and we do not sell your information to anyone.
          </p>
        </Section>

        <Section title="Third-Party Services We Use">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Google and Facebook</strong> — to let you sign in without creating a separate password.
            </li>
            <li>
              <strong>Supabase</strong> — our database and authentication provider, which stores your account and
              bill-splitting data securely.
            </li>
            <li>
              <strong>Anthropic (Claude)</strong> — processes receipt photos you scan to extract item data, as
              described above.
            </li>
            <li>
              <strong>Vercel</strong> — hosts the Splitzel web app itself.
            </li>
          </ul>
        </Section>

        <Section title="Who Can See Your Information">
          <p>
            Your payment details and split history are visible only to friends you&apos;ve explicitly connected with
            inside the app — connecting requires both people to take an action (entering a code or scanning a QR
            code), it never happens automatically. We don&apos;t make any of your information publicly visible or
            searchable.
          </p>
        </Section>

        <Section title="Data Retention &amp; Deletion" id="data-deletion">
          <p>
            We keep your information for as long as your account exists. If you&apos;d like your account and all
            associated data deleted, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-skyblue underline">
              {CONTACT_EMAIL}
            </a>{" "}
            from the email address associated with your account, and we&apos;ll delete it within 30 days.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Your data is stored with industry-standard security practices, including encryption in transit. No
            method of storing or transmitting data online is 100% secure, so while we work to protect your
            information, we can&apos;t guarantee absolute security.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>Splitzel is intended for college-aged students and is not directed at children under 13.</p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            If this policy changes, we&apos;ll update the &ldquo;Last updated&rdquo; date at the top of this page.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            Questions about this policy or your data? Email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-skyblue underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mt-6 scroll-mt-20">
      <h2 className="font-primary text-base font-bold tracking-brand text-navy dark:text-white">{title}</h2>
      <div className="mt-2 text-sm text-navy/70 dark:text-white/70 font-secondary leading-relaxed [&>ul]:mt-1">
        {children}
      </div>
    </div>
  );
}
