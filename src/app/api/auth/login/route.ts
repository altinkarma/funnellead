import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tss2026";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Şifre hatalı" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("tss_auth", "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 saat
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
