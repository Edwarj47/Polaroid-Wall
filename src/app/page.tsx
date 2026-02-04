export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4efe7] text-[#1f1c18] flex items-center justify-center">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-3xl font-semibold">Polaroid Wall Online</h1>
        <p className="text-base text-[#4a433c]">
          Sign in with Google to connect your Photos library and start creating your wall.
        </p>
        <a
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium shadow-md hover:shadow-lg transition"
          href="/api/auth/google"
        >
          Login with Google
        </a>
      </div>
    </main>
  );
}
