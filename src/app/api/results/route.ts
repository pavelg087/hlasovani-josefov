import { NextRequest, NextResponse } from "next/server";
import { POLL_ID } from "@/data/poll";
import { store, votesKey } from "@/lib/store";
import { computeResults } from "@/lib/voting";

export const dynamic = "force-dynamic";

// Výsledky jsou chráněné heslem (proměnná RESULTS_PASSWORD).
// Heslo se předává v hlavičce "x-results-password".
export async function GET(req: NextRequest) {
  const expected = process.env.RESULTS_PASSWORD;

  if (!expected) {
    // Bez nastaveného hesla výsledky zásadně nevydáme.
    return NextResponse.json(
      { error: "Výsledky nejsou nakonfigurované (chybí heslo)." },
      { status: 503 }
    );
  }

  const provided = req.headers.get("x-results-password");
  if (provided !== expected) {
    return NextResponse.json({ error: "Nesprávné heslo." }, { status: 401 });
  }

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
