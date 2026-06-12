"use client";

import { useState } from "react";
import Link from "next/link";
import { POLL, nameById } from "@/data/poll";

type Row = { id: string; averageRank: number; points: number };

export default function ResultsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(pwd: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/results", {
        cache: "no-store",
        headers: { "x-results-password": pwd },
      });
      if (res.status === 401) {
        setError("Nesprávné heslo.");
        setAuthed(false);
        return;
      }
      if (res.status === 503) {
        setError(
          "Výsledky zatím nejsou nakonfigurované (na serveru chybí heslo RESULTS_PASSWORD)."
        );
        setAuthed(false);
        return;
      }
      if (!res.ok) {
        setError("Výsledky se nepodařilo načíst.");
        return;
      }
      const data = await res.json();
      setRows(data.rows || []);
      setVoteCount(data.voteCount || 0);
      setAuthed(true);
    } catch {
      setError("Chyba spojení.");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900">Výsledky hlasování</h1>
        <p className="mt-2 text-sm text-gray-600">
          Tato stránka je chráněná. Zadejte heslo pro zobrazení výsledků.
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            load(password);
          }}
        >
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Heslo"
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Ověřuji…" : "Zobrazit výsledky"}
          </button>
        </form>
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </main>
    );
  }

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

      {voteCount === 0 ? (
        <p className="mt-8 text-gray-500">Zatím nikdo nehlasoval.</p>
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
          onClick={() => load(password)}
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
