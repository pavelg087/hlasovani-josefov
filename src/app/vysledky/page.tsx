"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { POLL, nameById } from "@/data/poll";

type Row = { id: string; averageRank: number; points: number };

export default function ResultsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      const data = await res.json();
      setRows(data.rows || []);
      setVoteCount(data.voteCount || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-2 text-sm font-semibold text-primary">
        Společně pro Josefov · výsledky hlasování
      </div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        {POLL.title}
      </h1>
      <p className="mt-2 text-gray-600">
        Počet odevzdaných hlasů: <strong>{voteCount}</strong>
      </p>

      {loading ? (
        <p className="mt-8 text-gray-500">Načítám…</p>
      ) : voteCount === 0 ? (
        <p className="mt-8 text-gray-500">
          Zatím nikdo nehlasoval. Buďte první!
        </p>
      ) : (
        <ol className="mt-6 space-y-2">
          {rows.map((r, i) => {
            const top = i < POLL.highlightTop;
            return (
              <li
                key={r.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  top
                    ? "border-accent bg-amber-50"
                    : "border-surface-dark bg-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    top ? "bg-accent" : "bg-primary"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 font-medium text-gray-900">
                  {nameById(r.id)}
                </span>
                <span className="text-right text-sm text-gray-500">
                  ø pořadí {r.averageRank.toFixed(2)}
                  <br />
                  {r.points} b.
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Pořadí je dáno průměrným umístěním u všech hlasujících (nižší = lepší).
        „b." = bodový součet (1. místo = nejvíc bodů).
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={load}
          className="rounded-lg border border-primary px-5 py-2.5 font-semibold text-primary transition hover:bg-surface"
        >
          ↻ Obnovit
        </button>
        <Link
          href="/"
          className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-dark"
        >
          Zpět na hlasování
        </Link>
      </div>
    </main>
  );
}
