const EFFECTIVE_DATE = "January 26, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f4efe7] text-[#1f1c18]">
      <div className="pwo-toolbar">
        <div className="pwo-toolbar-title">Terms of Service</div>
        <div className="flex items-center gap-3">
          <a className="pwo-toolbar-link" href="/">
            Home
          </a>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-4">
          <div>
            <h1 className="text-3xl font-semibold">Polaroid Wall Online Terms of Service</h1>
            <p className="text-sm text-[#6b6157]">Effective: {EFFECTIVE_DATE}</p>
          </div>
          <p className="text-sm text-[#4a433c]">
            These Terms govern your use of Polaroid Wall Online ("Service"). By using the
            Service, you agree to these Terms.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Account & Access</h2>
          <p className="text-sm text-[#4a433c]">
            You must sign in with Google to use the Service. You are responsible for
            maintaining the security of your account and for all activity under it.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">User Content</h2>
          <p className="text-sm text-[#4a433c]">
            You retain ownership of your photos and captions. You grant us a limited license
            to display your selected photos and captions solely to operate the Service.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Prohibited Use</h2>
          <ul className="list-disc pl-5 text-sm text-[#4a433c] space-y-2">
            <li>Do not misuse the Service or attempt to access it unlawfully.</li>
            <li>Do not infringe the rights of others.</li>
            <li>Do not upload unlawful, abusive, or harmful content.</li>
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Third-Party Services</h2>
          <p className="text-sm text-[#4a433c]">
            The Service uses Google APIs. Your use of Google services is subject to Google’s
            terms and policies. We are not responsible for third-party services.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Termination</h2>
          <p className="text-sm text-[#4a433c]">
            We may suspend or terminate access to the Service at any time for any reason.
            You may stop using the Service at any time.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Disclaimers</h2>
          <p className="text-sm text-[#4a433c]">
            The Service is provided "as is" without warranties of any kind. To the maximum
            extent permitted by law, we disclaim all warranties, express or implied.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Limitation of Liability</h2>
          <p className="text-sm text-[#4a433c]">
            To the maximum extent permitted by law, we are not liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use
            of the Service.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Changes</h2>
          <p className="text-sm text-[#4a433c]">
            We may update these Terms from time to time. Continued use of the Service means
            you accept the updated Terms.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm text-[#4a433c]">
            For questions about these Terms, contact us at: <strong>Jacob@DCSS.dev</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
