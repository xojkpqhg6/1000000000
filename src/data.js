// Das Ziel: eine Milliarde Euro.
export const TARGET = 1_000_000_000;

// Meilensteine, die beim Stapeln nacheinander erreicht werden.
// `at` = Euro-Schwelle, ab der der Glückwunsch erscheint.
export const MILESTONES = [
  {
    at: 1_000_000,
    emoji: "🎉",
    title: "Glückwunsch – Millionär!",
    text: "Deine erste Million steht. Für viele ein Lebensziel … und wir fangen gerade erst an.",
  },
  {
    at: 100_000_000,
    emoji: "🤑",
    title: "100-facher Millionär!",
    text: "Einhundert Millionen Euro. Klingt gigantisch – ist aber erst ein Zehntel des Wegs.",
  },
  {
    at: TARGET,
    emoji: "👑",
    title: "MILLIARDÄR!",
    text: "Eine ganze Milliarde Euro liegt vor dir. Jetzt schau, wie wenig selbst riesige Ausgaben davon abknabbern.",
    final: true,
  },
];

// Vergleichsobjekte. `price` in Euro. `lifetime: true` => Preis = Gehalt * 40 Jahre.
// Die Reihenfolge im Spiel wird zur Laufzeit nach Preis sortiert (klein → groß),
// damit die Optionen „nacheinander größer werden".
export const ITEMS = [
  { emoji: "🚗", name: "VW Passat", price: 45_000 },
  {
    emoji: "☕",
    name: "Täglich ein Coffee to go",
    hint: "ein Leben lang · ~3,50 €/Tag",
    price: 90_000,
  },
  {
    emoji: "🏖️",
    name: "Alle Urlaube deines Lebens",
    hint: "~1.700 €/Jahr · 70 Jahre",
    price: 120_000,
  },
  {
    emoji: "🛒",
    name: "Lebensmittel für ein ganzes Leben",
    hint: "~300 €/Monat · 70 Jahre",
    price: 250_000,
  },
  { emoji: "🏎️", name: "Lamborghini Huracán", price: 250_000 },
  { emoji: "🏢", name: "Eigentumswohnung", price: 400_000 },
  {
    emoji: "🏡",
    name: "Miete & Wohnen, ein Leben lang",
    hint: "~715 €/Monat · 70 Jahre",
    price: 600_000,
  },
  { emoji: "🏠", name: "Einfamilienhaus", price: 750_000 },
  { emoji: "💼", name: "Dein komplettes Arbeitsleben", hint: "40 Jahre Gehalt", lifetime: true },
  { emoji: "🏁", name: "LaFerrari", price: 2_500_000 },
  { emoji: "🏝️", name: "Villa am See", price: 6_000_000 },
  { emoji: "✈️", name: "Privatjet (Gulfstream)", price: 65_000_000 },
  { emoji: "🛥️", name: "Superyacht", price: 300_000_000 },
];
