import { NextRequest, NextResponse } from "next/server";
import { POLL_ID } from "@/data/poll";
import { store, votesKey } from "@/lib/store";
import { isValidRanking } from "@/lib/voting";

export const dynamic = "force-dynamic";

// Načtení vlastního dosavadního hlasu (pro předvyplnění při změně).
export async function GET(req: NextRequest) {
  const voterId = req.nextUrl.searchParams.get("voterId");
  if (!voterId) {
    return NextResponse.json({ ranking: null });
  }
  const raw = await store.hget(votesKey(POLL_ID), voterId);
  if (!raw) return NextResponse.json({ ranking: null });
  try {
    return NextResponse.json({ ranking: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ ranking: null });
  }
}

// Odeslání / změna hlasu.
export async function POST(req: NextRequest) {
  let body: { voterId?: string; ranking?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný formát." }, { status: 400 });
  }

  const { voterId, ranking } = body;

  if (!voterId || typeof voterId !== "string" || voterId.length < 8) {
    return NextResponse.json(
      { error: "Chybí identifikátor hlasujícího." },
      { status: 400 }
    );
  }

  if (!isValidRanking(ranking)) {
    return NextResponse.json(
      { error: "Neplatné pořadí kandidátů." },
      { status: 400 }
    );
  }

  await store.hset(votesKey(POLL_ID), voterId, JSON.stringify(ranking));

  return NextResponse.json({ ok: true });
}
