"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CANDIDATES, POLL, type Candidate } from "@/data/poll";

const VOTER_KEY = "spj_voter_id";

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VotePage() {
  const [order, setOrder] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voterId = useRef<string>("");
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    voterId.current = getVoterId();
    (async () => {
      try {
        const res = await fetch(
          `/api/vote?voterId=${encodeURIComponent(voterId.current)}`
        );
        const data = await res.json();
        if (data.ranking && Array.isArray(data.ranking)) {
          const byId = new Map(CANDIDATES.map((c) => [c.id, c]));
          const restored = data.ranking
            .map((id: string) => byId.get(id))
            .filter(Boolean) as Candidate[];
          if (restored.length === CANDIDATES.length) {
            setOrder(restored);
            setAlreadyVoted(true);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignorovat, použijeme náhodné pořadí
      }
      setOrder(shuffle(CANDIDATES));
      setLoading(false);
    })();
  }, []);

  function move(index: number, dir: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function onDrop(toIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === toIndex) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: voterId.current,
          ranking: order.map((c) => c.id),
        }),
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
      <p className="mt-3 text-gray-600">{POLL.subtitle}</p>

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
          <ol className="mt-6 space-y-2">
            {order.map((c, i) => (
              <li
                key={c.id}
                draggable
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className="flex items-center gap-3 rounded-xl border border-surface-dark bg-white p-3 shadow-sm"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium text-gray-900">
                  {c.name}
                </span>
                <span className="hidden text-gray-300 sm:block" aria-hidden>
                  ⠿
                </span>
                <div className="flex flex-col gap-1">
                  <button
                    aria-label="Posunout nahoru"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded bg-surface px-2 py-0.5 text-gray-700 hover:bg-surface-dark disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    aria-label="Posunout dolů"
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    className="rounded bg-surface px-2 py-0.5 text-gray-700 hover:bg-surface-dark disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-3 text-xs text-gray-400">
            Tip: pořadí měníte tažením položky nebo šipkami ▲▼. Nahoře = 1. místo
            (lídr).
          </p>

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
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {saving
                ? "Ukládám…"
                : alreadyVoted
                  ? "Uložit změnu hlasu"
                  : "Odeslat hlas"}
            </button>
            <Link
              href="/vysledky"
              className="rounded-lg border border-primary px-6 py-3 font-semibold text-primary transition hover:bg-surface"
            >
              Zobrazit výsledky
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
