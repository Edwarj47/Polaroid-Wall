import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function SettingsPage() {
  const userId = await requireUserId();
  if (!userId) {
    redirect("/login");
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("name, email")
    .eq("id", userId)
    .single();

  return (
    <main className="min-h-screen bg-[#f4efe7] text-[#1f1c18]">
      <div className="pwo-toolbar">
        <div className="pwo-toolbar-title">Settings</div>
        <div className="flex items-center gap-3">
          <a className="pwo-toolbar-link" href="/collections">
            Collections
          </a>
          <a className="pwo-toolbar-link" href="/api/auth/logout">
            Sign out
          </a>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-black/5">
          <h1 className="text-2xl font-semibold">Account</h1>
          <div className="mt-4 space-y-2 text-sm text-[#4a433c]">
            <div>
              <span className="font-semibold text-[#1f1c18]">Name:</span> {user?.name || ""}
            </div>
            <div>
              <span className="font-semibold text-[#1f1c18]">Email:</span> {user?.email || ""}
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-black/5">
          <h2 className="text-xl font-semibold">Policies</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a className="pwo-toolbar-link" href="/privacy">
              Privacy Policy
            </a>
            <a className="pwo-toolbar-link" href="/terms">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
