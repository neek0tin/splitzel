import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const GCASH_QR_BUCKET = "gcash-qr";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Storage objects aren't covered by the profiles->auth.users FK cascade,
  // so the GCash QR folder has to be cleared out by hand. Best-effort: a
  // stray orphaned file isn't worth blocking account deletion over.
  const { data: qrFiles } = await admin.storage.from(GCASH_QR_BUCKET).list(user.id);
  if (qrFiles && qrFiles.length > 0) {
    await admin.storage.from(GCASH_QR_BUCKET).remove(qrFiles.map((f) => `${user.id}/${f.name}`));
  }

  // Deleting the auth user cascades through the entire schema (profiles,
  // receipts, splits, split_members, split_item_assignments, payments,
  // split_payments, notifications, friend_connections) via the FK chain
  // already built into every migration -- no manual table cleanup needed.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Failed to delete account:", error);
    return NextResponse.json({ error: "Couldn't delete your account. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
