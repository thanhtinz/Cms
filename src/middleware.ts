import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gan pathname vao header de layout goc quyet dinh chrome:
// /admin va /portal dung shell rieng (khong dung header/footer web chinh).
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
