import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "nhaminh-auth";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== process.env.GLOBAL_PASSWORD) {
      return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(AUTH_COOKIE, password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ONE_YEAR,
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
