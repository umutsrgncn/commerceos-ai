import { auth } from "@/auth";
import { listActivity } from "@/lib/queries/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ items: [] }, { status: 401 });
  }

  const items = await listActivity(15);
  return Response.json({ items });
}
