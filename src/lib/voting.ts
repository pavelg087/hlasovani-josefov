import { CANDIDATE_IDS } from "@/data/poll";

// Ověří, že předané pořadí je platné: obsahuje přesně všechny kandidáty
// právě jednou (žádné cizí ani chybějící id).
export function isValidRanking(ranking: unknown): ranking is string[] {
  if (!Array.isArray(ranking)) return false;
  if (ranking.length !== CANDIDATE_IDS.length) return false;
  const set = new Set(ranking);
  if (set.size !== CANDIDATE_IDS.length) return false;
  return CANDIDATE_IDS.every((id) => set.has(id));
}

export type ResultRow = {
  id: string;
  averageRank: number; // průměrné pořadí (1 = nejlepší), nižší je lepší
  points: number; // Borda: rank 1 => N bodů ... rank N => 1 bod
};

// Spočítá souhrnné výsledky z jednotlivých pořadí.
export function computeResults(rankings: string[][]): {
  rows: ResultRow[];
  voteCount: number;
} {
  const n = CANDIDATE_IDS.length;
  const sumRank: Record<string, number> = {};
  const points: Record<string, number> = {};
  for (const id of CANDIDATE_IDS) {
    sumRank[id] = 0;
    points[id] = 0;
  }

  for (const ranking of rankings) {
    ranking.forEach((id, index) => {
      const rank = index + 1; // 1 = nahoře = nejlepší
      sumRank[id] += rank;
      points[id] += n - index; // 1. místo => n bodů
    });
  }

  const voteCount = rankings.length;
  const rows: ResultRow[] = CANDIDATE_IDS.map((id) => ({
    id,
    averageRank: voteCount ? sumRank[id] / voteCount : 0,
    points: points[id],
  }));

  // seřadit dle průměrného pořadí (nižší lepší); shoda => více bodů
  rows.sort((a, b) => {
    if (voteCount === 0) return 0;
    if (a.averageRank !== b.averageRank) return a.averageRank - b.averageRank;
    return b.points - a.points;
  });

  return { rows, voteCount };
}
