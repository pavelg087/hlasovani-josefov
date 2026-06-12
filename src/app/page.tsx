"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CANDIDATES, POLL } from "@/data/poll";

const VOTER_KEY = "spj_voter_id";
const N = CANDIDATES.length;

function getVoterId(): string {
  let id = localStorage.getItem(VOTER_KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

// prázdný stav: ke každému kandidátovi zatím žádné číslo
function emptyPicks(): Record<string, number | ""> {
  const o: Record<string, number | ""> = {};
  for (const c of CANDIDATES) o[c.id] = "";
  return o;
}

export default function VotePage() {
  const [picks, setPicks] = useState<Record<string, number | "">>(emptyPicks);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voterId = useRef<string>("");

  useEffect(() => {
    voterId.current = getVoterId();
    (async () => {
      try {
        const res = await fetch(
          `/api/vote?voterId=${encodeURIComponent(voterId.current)}`
        );
        const data = await res.json();
        if (Array.isArray(data.ranking) && data.ranking.length === N) {
          // ranking = pole id v pořadí; převedeme na čísla 1..N
          const restored = emptyPicks();
          data.ranking.forEach((id: string, idx: number) => {
            if (id in restored) restored[id] = idx + 1;
          });
          setPicks(restored);
          setAlreadyVoted(true);
        }
      } catch {
        // ignorovat
      }
      setLoading(false);
    })();
  }, []);

  function setPick(id: string, value: string) {
    setPicks((prev) => ({
      ...prev,
      [id]: value === "" ? "" : Number(value),
    }));
  }

  // která čísla jsou použitá víckrát + která ještě chybí
  const { duplicates, missing, filledCount } = useMemo(() => {
    const counts = new Map<number, number>();
    let filled = 0;
    for (const c of CANDIDATES) {
      const v = picks[c.id];
      if (v !== "") {
        filled++;
        counts.set(v, (counts.get(v) || 0) + 1);
      }
    }
    const dup = new Set<number>();
    for (const [num, cnt] of counts) if (cnt > 1) dup.add(num);
    const miss: number[] = [];
    for (let i = 1; i <= N; i++) if (!counts.has(i)) miss.push(i);
    return { duplicates: dup, missing: miss, filledCount: filled };
  }, [picks]);

  const isComplete = filledCount === N && duplicates.size === 0;

  async function submit() {
    if (!isComplete) return;
    setSaving(true);
    setError(null);
    try {
      // seřadit kandidáty podle přiřazeného čísla -> pole id
      const ranking = [...CANDIDATES]
        .sort((a, b) => (picks[a.id] as number) - (picks[b.id] as number))
        .map((c) => c.id);
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId: voterId.current, ranking }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Hlas se nepodařilo uložit.");
      }
      setSavedAt(new Date());
      setAlreadyVoted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Neznámá chyba.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-2 text-sm font-semibold text-primary">
        Společně pro Josefov · interní hlasování
      </div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        {POLL.title}
      </h1>
      <p className="mt-3 text-gray-600">
        U každého kandidáta vyberte číslo pozice na kandidátní listině:
        <strong> 1 = lídr (první místo)</strong>, {N} = poslední. Každé číslo
        použijte právě jednou.
      </p>

      <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
        🔒 Hlasování je <strong>anonymní</strong>. Svůj hlas můžete kdykoli
        změnit a znovu odeslat (ze stejného prohlížeče).
      </div>

      {alreadyVoted && !savedAt && (
        <div className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
          ✓ Už jste hlasoval/a. Níže vidíte své pořadí — můžete ho upravit a
          uložit znovu.
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-gray-500">Načítám…</p>
      ) : (
        <>
          <ul className="mt-6 space-y-2">
            {CANDIDATES.map((c) => {
              const v = picks[c.id];
              const isDup = v !== "" && duplicates.has(v);
              return (
                <li
                  key={c.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 shadow-sm ${
                    isDup
                      ? "border-red-400 bg-red-50"
                      : "border-surface-dark bg-white"
                  }`}
                >
                  <span className="flex-1 font-medium text-gray-900">
                    {c.name}
                  </span>
                  <select
                    aria-label={`Pozice pro ${c.name}`}
                    value={v}
                    onChange={(e) => setPick(c.id, e.target.value)}
                    className={`w-20 rounded-lg border bg-white px-2 py-2 text-center font-semibold ${
                      isDup ? "border-red-400 text-red-700" : "border-gray-300"
                    }`}
                  >
                    <option value="">—</option>
                    {Array.from({ length: N }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>

          {/* stav vyplnění */}
          {duplicates.size > 0 ? (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              ⚠️ Číslo{duplicates.size > 1 ? "a" : ""}{" "}
              <strong>{[...duplicates].sort((a, b) => a - b).join(", ")}</strong>{" "}
              {duplicates.size > 1 ? "jsou použita" : "je použito"} víckrát.
              Každé číslo smí být jen jednou.
            </div>
          ) : missing.length > 0 ? (
            <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Zbývá přiřadit číslo:{" "}
              <strong>{missing.join(", ")}</strong> ({filledCount}/{N}{" "}
              vyplněno)
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              ✓ Pořadí je kompletní a připravené k odeslání.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {savedAt && (
            <div className="mt-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-900">
              ✓ Hlas uložen ({savedAt.toLocaleTimeString("cs-CZ")}). Pořadí
              můžete dál upravovat a uložit znovu.
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={submit}
              disabled={saving || !isComplete}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Ukládám…"
                : alreadyVoted
                  ? "Uložit změnu hlasu"
                  : "Odeslat hlas"}
            </button>
            <button
              onClick={() => {
                setPicks(emptyPicks());
                setSavedAt(null);
              }}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-surface"
            >
              Vymazat
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Průběžné výsledky se během hlasování nezobrazují, aby nikoho
            neovlivnily.
          </p>
        </>
      )}
    </main>
  );
}
