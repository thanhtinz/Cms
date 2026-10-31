import { NextResponse } from "next/server";
import { TEMPLATE_IMAGES } from "@/lib/template-images-data";

// Phuc vu anh mau website tu du lieu base64 nhung trong ma nguon
// (src/lib/template-images-data.ts). URL dang:
//   /hinh-mau/shop-san-pham-so/cover-v2.jpg
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const key = (params.path ?? []).join("/");
  const b64 = TEMPLATE_IMAGES[key];
  if (!b64) return new NextResponse("Not found", { status: 404 });
  const buf = Buffer.from(b64, "base64");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
