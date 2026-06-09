// =============================================================
//  KONFIGURACE HLASOVÁNÍ
// =============================================================
// Pro další hlasování stačí změnit POLL_ID (aby se začalo "načisto")
// a upravit nadpis/popis, případně seznam kandidátů.

export const POLL_ID = "poradi-kandidatka-2026";

export const POLL = {
  title: "Pořadí na kandidátní listině 2026",
  subtitle:
    "Seřaďte všechny kandidáty podle toho, jak by podle vás měli být na " +
    "kandidátní listině — nahoře ten, kdo má být první (lídr), dole poslední.",
  // kolik nejlépe umístěných se zvýrazní ve výsledcích (jen vizuálně)
  highlightTop: 3,
};

export type Candidate = {
  id: string;
  name: string;
};

// Pořadí zde NEHRAJE roli — při hlasování se kandidáti zobrazí náhodně
// zamícháni, aby nikdo nebyl zvýhodněn pozicí v seznamu.
export const CANDIDATES: Candidate[] = [
  { id: "typltova", name: "Ing. Mgr. Jitka Typltová" },
  { id: "bilek", name: "Ing. Radim Bílek" },
  { id: "bravencova", name: "Kateřina Bravencová" },
  { id: "hanakova", name: "Ivana Hanáková" },
  { id: "damborska", name: "Ing. Lucie Damborská" },
  { id: "koliba", name: "Luboš Koliba" },
  { id: "esterka", name: "Stanislav Esterka" },
  { id: "galatik", name: "Bc. Pavel Galatík, MSc." },
  { id: "macurek", name: "Bc. Marek Macůrek" },
  { id: "typlt", name: "Pavel Typlt" },
];

export const CANDIDATE_IDS = CANDIDATES.map((c) => c.id);

export function nameById(id: string): string {
  return CANDIDATES.find((c) => c.id === id)?.name ?? id;
}
