import { auth } from "@/auth";
import { saveUploadedImage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll("file").filter((v): v is File => v instanceof File);

  if (files.length === 0) {
    return Response.json(
      { ok: false, error: "Yüklenecek dosya yok." },
      { status: 400 }
    );
  }

  const results = await Promise.all(files.map((f) => saveUploadedImage(f)));
  const failed = results.find((r) => !r.ok);
  if (failed) {
    return Response.json(failed, { status: 400 });
  }

  const urls = results
    .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
    .map((r) => r.url);

  return Response.json({ ok: true, urls });
}
