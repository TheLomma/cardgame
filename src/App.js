import { useState } from "react";

const SUITS = ["\u2665", "\u2666", "\u2663", "\u2660"];
const SUIT_COLORS = { "\u2665": "#e53e3e", "\u2666": "#e53e3e", "\u2663": "#1a202c", "\u2660": "#1a202c" };
const SUIT_NAMES_DE = { "\u2665": "Herz", "\u2666": "Karo", "\u2663": "Kreuz", "\u2660": "Pik" };
const SUIT_NAMES_EN = { "\u2665": "Hearts", "\u2666": "Diamonds", "\u2663": "Clubs", "\u2660": "Spades" };

const CARD_VALUES = [
  { rank: "A", value: 1, attack: 1 },
  { rank: "2", value: 2, attack: 2 },
  { rank: "3", value: 3, attack: 3 },
  { rank: "4", value: 4, attack: 4 },
  { rank: "5", value: 5, attack: 5 },
  { rank: "6", value: 6, attack: 6 },
  { rank: "7", value: 7, attack: 7 },
  { rank: "8", value: 8, attack: 8 },
  { rank: "9", value: 9, attack: 9 },
  { rank: "10", value: 10, attack: 10 },
];

const ROYALS = [
  { rank: "J", name_de: "Bube", name_en: "Jack", hp: 20, attack: 10 },
  { rank: "Q", name_de: "Dame", name_en: "Queen", hp: 30, attack: 15 },
  { rank: "K", name_de: "K\u00f6nig", name_en: "King", hp: 40, attack: 20 },
];

const SUIT_POWERS_DE = {
  "\u2665": "Heilt: Karten vom Ablagestapel zur\u00fcck in den Nachziehstapel",
  "\u2666": "Zieht: Zus\u00e4tzliche Karten ziehen",
  "\u2663": "Verdoppelt: Angriffswert wird verdoppelt",
  "\u2660": "Schild: Schaden des Feindes reduzieren",
};
const SUIT_POWERS_EN = {
  "\u2665": "Heal: Return cards from discard to draw pile",
  "\u2666": "Draw: Draw additional cards",
  "\u2663": "Double: Attack value is doubled",
  "\u2660": "Shield: Reduce enemy attack damage",
};

const CARD_THEMES = {
  fantasy: { name_de: "Fantasy", name_en: "Fantasy" },
  classic: { name_de: "Klassisch", name_en: "Classic" },
  dark: { name_de: "Dunkel", name_en: "Dark" },
};

const glass = {
  card: "backdrop-blur-2xl bg-white/10 border border-white/30 shadow-[0_8px_32px_0_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.3)] rounded-2xl",
  cardSelected: "ring-2 ring-white/70 shadow-[0_0_24px_4px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] -translate-y-3",
  panel: "backdrop-blur-2xl bg-white/8 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] rounded-2xl",
  btn: "backdrop-blur-md bg-white/15 border border-white/30 hover:bg-white/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] rounded-xl transition-all duration-200",
  btnPrimary: "backdrop-blur-md bg-white/90 border border-white/60 hover:bg-white text-gray-900 font-black shadow-[0_4px_20px_rgba(255,255,255,0.3),inset_0_1px_0_rgba(255,255,255,0.8)] rounded-xl transition-all duration-200 hover:scale-105",
  btnDanger: "backdrop-blur-md bg-red-500/30 border border-red-400/40 hover:bg-red-500/50 text-red-200 shadow-[inset_0_1px_0_rgba(255,100,100,0.3)] rounded-xl transition-all duration-200",
  btnPurple: "backdrop-blur-md bg-purple-500/30 border border-purple-400/40 hover:bg-purple-500/50 text-purple-200 shadow-[inset_0_1px_0_rgba(180,100,255,0.3)] rounded-xl transition-all duration-200",
  enemy: "backdrop-blur-2xl bg-red-900/30 border border-red-400/30 shadow-[0_8px_32px_0_rgba(220,50,50,0.2),inset_0_1px_0_rgba(255,150,150,0.2)] rounded-2xl",
  logPanel: "backdrop-blur-2xl bg-black/20 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-2xl",
};

// ---- PASTE THE FULL CANVAS SOURCE BELOW ----
// The complete component code from the canvas goes here.
// See instructions in README.md.
export default function PlaceholderApp() {
  return <div style={{color:"white",padding:40}}>Bitte src/App.js mit dem vollst\u00e4ndigen Canvas-Code ersetzen.</div>;
}
