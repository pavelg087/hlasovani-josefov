import { NextResponse } from "next/server";
import { POLL_ID } from "@/data/poll";
import { store, votesKey } from "@/lib/store";
import { computeResults } from "@/lib/voting";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = await store.hgetall(votesKey(POLL_ID));
  const rankings: string[][] = [];
  for (const raw of Object.values(all)) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) rankings.push(parsed as string[]);
    } catch {
      // přeskočit poškozený záznam
    }
  }
  const { rows, voteCount } = computeResults(rankings);
  return NextResponse.json({ rows, voteCount });
}
