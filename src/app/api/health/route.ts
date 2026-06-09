import { NextResponse } from "next/server";
import { hasRedis } from "@/lib/store";

export const dynamic = "force-dynamic";

// Diagnostika: ověří, zda je v produkci připojené trvalé úložiště (Redis).
// storage = "redis" -> hlasy se ukládají trvale.
// storage = "memory" -> CHYBÍ databáze, hlasy se NEUKLÁDAJÍ napříč requesty!
export async function GET() {
  return NextResponse.json({
    storage: hasRedis ? "redis" : "memory",
    persistent: hasRedis,
  });
}
