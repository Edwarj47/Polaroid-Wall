const EFFECTIVE_DATE = "January 26, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f4efe7] text-[#1f1c18]">
      <div className="pwo-toolbar">
        <div className="pwo-toolbar-title">Privacy Policy</div>
        <div className="flex items-center gap-3">
          <a className="pwo-toolbar-link" href="/">
            Home
          </a>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-4">
          <div>
            <h1 className="text-3xl font-semibold">Polaroid Wall Online Privacy Policy</h1>
            <p className="text-sm text-[#6b6157]">Effective: {EFFECTIVE_DATE}</p>
          </div>
          <p className="text-sm text-[#4a433c]">
            This Privacy Policy explains how Polaroid Wall Online ("we", "us", "our")
            collects, uses, and shares information when you use our website and services.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <ul className="list-disc pl-5 text-sm text-[#4a433c] space-y-2">
            <li>
              Account information: your Google account email, name, and Google user ID.
            </li>
            <li>
              Tokens: OAuth access and refresh tokens needed to fetch your selected photos.
            </li>
            <li>
              Photo metadata: Google Photos media item IDs and image base URLs needed to
              render photos. We do not store the photo files themselves.
            </li>
            <li>
              User content: captions/notes, wall titles, layout preferences, and share tokens.
            </li>
            <li>
              Usage data: basic logs for security and debugging (e.g., errors, request timing).
            </li>
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">How We Use Information</h2>
          <ul className="list-disc pl-5 text-sm text-[#4a433c] space-y-2">
            <li>Authenticate you and maintain your session.</li>
            <li>Fetch and display the photos you select.</li>
            <li>Store and display your captions and wall settings.</li>
            <li>Enable sharing and collaboration features.</li>
            <li>Protect the service and troubleshoot issues.</li>
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Sharing</h2>
          <p className="text-sm text-[#4a433c]">
            If you create a share link, anyone with that link can view the photos and captions
            in the associated collection. Collaborators you invite can view or edit based on
            the role you assign (viewer/editor/owner).
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Data Retention</h2>
          <p className="text-sm text-[#4a433c]">
            We retain account data, captions, and settings until you delete them or request
            deletion. OAuth tokens are stored to access your selected photos. You can revoke
            access at any time from your Google account settings.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="text-sm text-[#4a433c]">
            We use industry-standard measures to protect data, but no method of transmission
            or storage is 100% secure. Use the service at your own risk.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm border border-black/5 space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm text-[#4a433c]">
            For privacy questions, contact us at: <strong>Jacob@DCSS.dev</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
