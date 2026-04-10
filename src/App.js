// v7.2
import { useState, useRef, useEffect } from "react";

const SUITS = ["♥", "♦", "♣", "♠"];
// SUIT_COLORS removed (unused)
const SUIT_NAMES_DE = { "♥": "Herz", "♦": "Karo", "♣": "Kreuz", "♠": "Pik" };
const SUIT_NAMES_EN = { "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs", "♠": "Spades" };

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
  { rank: "K", name_de: "König", name_en: "King", hp: 40, attack: 20 },
];

const SUIT_POWERS_DE = {
  "♥": "Heilt: Karten vom Ablagestapel zurück in den Nachziehstapel",
  "♦": "Zieht: Zusätzliche Karten ziehen",
  "♣": "Verdoppelt: Angriffswert wird verdoppelt",
  "♠": "Schild: Schaden des Feindes reduzieren",
};
const SUIT_POWERS_EN = {
  "♥": "Heal: Return cards from discard to draw pile",
  "♦": "Draw: Draw additional cards",
  "♣": "Double: Attack value is doubled",
  "♠": "Shield: Reduce enemy attack damage",
};

const CARD_THEMES = {
  fantasy: { name_de: "Fantasy", name_en: "Fantasy", bg: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", accent: "#a78bfa" },
  classic: { name_de: "Klassisch", name_en: "Classic", bg: "linear-gradient(135deg,#1a2a1a 0%,#2d4a2d 50%,#1a2a1a 100%)", accent: "#4ade80" },
  dark:    { name_de: "Dunkel",    name_en: "Dark",    bg: "linear-gradient(135deg,#0a0a0a 0%,#1a0a0a 50%,#0a0a0a 100%)", accent: "#f87171" },
};

const ACHIEVEMENTS = [
  { id: "first_blood",   icon: "⚔️",  title_de: "Erster Angriff",      title_en: "First Blood",        desc_de: "Erste Karte gespielt",            desc_en: "Played your first card",           check: (s) => s.totalCards >= 1 },
  { id: "slayer",        icon: "💀",  title_de: "Königsmörder",        title_en: "Regicide",           desc_de: "Ersten Feind besiegt",             desc_en: "Defeated your first enemy",        check: (s) => s.totalEnemies >= 1 },
  { id: "all_royals",    icon: "👑",  title_de: "Alle Royals",         title_en: "All Royals",         desc_de: "Alle 12 Feinde besiegt",           desc_en: "Defeated all 12 enemies",          check: (s) => s.totalEnemies >= 12 },
  { id: "centurion",     icon: "💯",  title_de: "Centurion",           title_en: "Centurion",          desc_de: "100 Gesamtschaden verursacht",      desc_en: "Dealt 100 total damage",           check: (s) => s.totalDamage >= 100 },
  { id: "combo_master",  icon: "🔥",  title_de: "Kombo-Meister",       title_en: "Combo Master",       desc_de: "10 Karten in einer Runde gespielt", desc_en: "Played 10 cards in one round",     check: (s) => s.maxCardsInRound >= 10 },
  { id: "speedrun",      icon: "⚡",  title_de: "Blitzsieger",         title_en: "Speedrun",           desc_de: "Sieg in unter 3 Minuten",          desc_en: "Won in under 3 minutes",           check: (s) => s.wonInSeconds > 0 && s.wonInSeconds < 180 },
  { id: "pacifist",      icon: "🕊️",  title_de: "Pazifist",           title_en: "Pacifist",           desc_de: "Feind mit genau 0 HP besiegt",     desc_en: "Defeated enemy with exactly 0 HP", check: (s) => s.exactKills >= 1 },
  { id: "no_jester",     icon: "🃏",  title_de: "Kein Joker",          title_en: "No Joker",           desc_de: "Solo-Sieg ohne Jester",            desc_en: "Won solo without Jester",          check: (s) => s.soloWinNoJester },
  { id: "big_hit",       icon: "💥",  title_de: "Megaschlag",          title_en: "Big Hit",            desc_de: "30+ Schaden in einem Angriff",     desc_en: "30+ damage in one attack",         check: (s) => s.maxSingleHit >= 30 },
  { id: "survivor",      icon: "🛡️",  title_de: "Überlebender",        title_en: "Survivor",           desc_de: "Sieg mit nur 1 Karte auf der Hand", desc_en: "Won with only 1 card in hand",     check: (s) => s.wonWith1Card },
];

// ── DAILY CHALLENGE ──────────────────────────────────────────────────────────
function getDailyChallenge() {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const rng = (n) => { let s = seed * 16807 % 2147483647; for (let i = 0; i < n; i++) s = s * 16807 % 2147483647; return s; };
  const mods = [
    { id: "double_attack",  icon: "🔥", title_de: "Doppelter Feind-Angriff",  title_en: "Double Enemy Attack",  desc_de: "Alle Feinde greifen mit 2x Schaden an",    desc_en: "All enemies deal 2x damage",       apply: (e) => ({ ...e, attack: e.attack * 2 }) },
    { id: "half_hand",      icon: "✂️", title_de: "Halbe Hand",             title_en: "Half Hand",           desc_de: "Starthand nur halb so groß",           desc_en: "Starting hand is half size",       apply: null },
    { id: "no_clubs",       icon: "♾️", title_de: "Kein Kreuz",            title_en: "No Clubs",            desc_de: "Kreuz-Karten zählen nicht doppelt",   desc_en: "Clubs don't double damage",        apply: null },
    { id: "iron_king",      icon: "🛡️", title_de: "Eisenkönig",           title_en: "Iron King",           desc_de: "Könige haben +20 HP",                desc_en: "Kings have +20 HP",               apply: (e) => e.rank === "K" ? { ...e, hp: e.hp + 20, currentHp: e.currentHp + 20 } : e },
    { id: "fragile_jacks",  icon: "💨", title_de: "Schwache Buben",        title_en: "Fragile Jacks",       desc_de: "Buben haben nur 10 HP",              desc_en: "Jacks have only 10 HP",           apply: (e) => e.rank === "J" ? { ...e, hp: 10, currentHp: 10 } : e },
    { id: "no_hearts",      icon: "💔", title_de: "Kein Heilen",           title_en: "No Healing",          desc_de: "Herz-Effekt ist deaktiviert",        desc_en: "Hearts effect is disabled",       apply: null },
    { id: "speed_mode",     icon: "⏱", title_de: "Speedrun",              title_en: "Speed Mode",          desc_de: "Sieg in unter 5 Minuten nötig",      desc_en: "Must win in under 5 minutes",     apply: null },
  ];
  const idx = rng(3) % mods.length;
  const mod = mods[idx];
  const dateStr = `${now.getDate().toString().padStart(2,"0")}.${(now.getMonth()+1).toString().padStart(2,"0")}.${now.getFullYear()}`;
  return { ...mod, date: dateStr, seed };
}

const GAME_LAYOUTS = {
  arena: { name_de: "Arena", name_en: "Arena" },
  dashboard: { name_de: "Dashboard", name_en: "Dashboard" },
};

function createDeck(numPlayers) {
  const deck = [];
  SUITS.forEach((suit) => {
    CARD_VALUES.forEach((cv) => {
      deck.push({ rank: cv.rank, suit, value: cv.value, attack: cv.attack, id: `${cv.rank}${suit}`, type: "number" });
    });
  });
  const jesterCount = numPlayers <= 2 ? 0 : numPlayers === 3 ? 1 : 2;
  for (let j = 0; j < jesterCount; j++) {
    deck.push({ rank: "🃏", suit: "🃏", value: 0, attack: 0, id: `Jester${j}`, type: "jester" });
  }
  return deck;
}

function createEnemyDeck() {
  const enemies = [];
  ROYALS.forEach((royal) => {
    SUITS.forEach((suit) => {
      enemies.push({ ...royal, suit, id: `${royal.rank}${suit}`, currentHp: royal.hp, immune: [] });
    });
  });
  return enemies;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getHandSize(numPlayers) {
  if (numPlayers === 1) return 8;
  if (numPlayers === 2) return 7;
  if (numPlayers === 3) return 6;
  return 5;
}

const t = (lang, de, en) => (lang === "de" ? de : en);

function PlayerTurnBanner({ game, lang, phase, numPlayers, lastYielded }) {
  if (!game || numPlayers < 1) return null;
  const activeIdx = game.currentPlayerIndex;
  const phaseColor = phase === "discard" ? "#f87171" : phase === "jester" ? "#c084fc" : "#4ade80";
  const phaseLabel = phase === "discard"
    ? (lang === "de" ? "⚠️ Schaden abwerfen" : "⚠️ Discard damage")
    : phase === "jester"
    ? (lang === "de" ? "🃏 Nächsten Spieler wählen" : "🃏 Choose next player")
    : (lang === "de" ? "🎮 Am Zug" : "🎮 Active");
  return (
    <div className="w-full rounded-2xl px-3 py-2 mb-2" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: phaseColor }}>{phaseLabel}</span>
        {numPlayers > 1 && <span className="text-white/30 text-xs">{lang === "de" ? `Runde: Spieler ${activeIdx + 1}` : `Turn: Player ${activeIdx + 1}`}</span>}
      </div>
      {numPlayers > 1 && (
        <div className="flex gap-2 flex-wrap">
          {game.players.map((player, pi) => {
            const isActive = pi === activeIdx;
            const hasYielded = (lastYielded || []).includes(pi);
            const isDiscard = phase === "discard" && isActive;
            return (
              <div key={pi} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-300" style={{ background: isDiscard ? "rgba(239,68,68,0.25)" : isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)", border: isDiscard ? "1.5px solid rgba(239,68,68,0.7)" : isActive ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)", transform: isActive ? "scale(1.05)" : "scale(1)", opacity: hasYielded && !isActive ? 0.5 : 1 }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ background: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)", color: isActive ? "#111" : "rgba(255,255,255,0.6)" }}>{pi + 1}</span>
                <span className="text-xs font-bold" style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.4)" }}>{player.name}</span>
                {isActive && <span className="text-xs" style={{ color: phaseColor }}>▶</span>}
                {hasYielded && !isActive && <span className="text-xs text-white/30">✓</span>}
                <span className="text-white/30 text-xs ml-0.5">({player.hand.length})</span>
              </div>
            );
          })}
        </div>
      )}
      {numPlayers === 1 && (
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: "rgba(255,255,255,0.9)", color: "#111" }}>1</span>
          <span className="text-white font-bold text-sm">{game.players[0].name}</span>
          <span className="text-xs" style={{ color: phaseColor }}>▶ {phaseLabel}</span>
          <span className="ml-auto text-white/30 text-xs">{game.players[0].hand.length} {lang === "de" ? "Karten" : "cards"}</span>
        </div>
      )}
    </div>
  );
}

function PlayingCard({ card, selected, onClick, disabled, small = false, isNew = false, lang = "de" }) {
  const [hovered, setHovered] = useState(false);
  const isRed = card.suit === "♥" || card.suit === "♦";
  const isJester = card.type === "jester";
  const color = isJester ? "text-yellow-300" : isRed ? "text-red-300" : "text-white";
  const borderColor = isRed ? "rgba(252,165,165,0.5)" : "rgba(255,255,255,0.25)";
  const SUIT_POWERS_DISPLAY = lang === "de" ? SUIT_POWERS_DE : SUIT_POWERS_EN;
  const suitPower = !isJester ? SUIT_POWERS_DISPLAY[card.suit] ?? null : null;
  const tooltipContent = isJester
    ? (lang === "de" ? "Jester: Immunität aufheben / Hand tauschen" : "Jester: Cancel immunity / swap hand")
    : `${card.rank}${card.suit} | ${lang === "de" ? "Wert" : "Value"}: ${card.value} | ${lang === "de" ? "Angriff" : "Attack"}: ${card.attack}${suitPower ? " | " + suitPower : ""}`;

  if (small) {
    return (
      <div onClick={!disabled ? onClick : undefined}
        className={`relative cursor-pointer select-none transition-all duration-200 rounded-xl w-12 h-16 flex flex-col items-center justify-center ${selected ? "ring-2 ring-white -translate-y-2 shadow-lg" : disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1"}`}
        style={{ background: selected ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)", border: `1px solid ${borderColor}`, backdropFilter: "blur(12px)", animation: isNew ? "cardSlideIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards, cardGlow 0.6s ease-out 0.2s" : undefined }}>
        <span className={`text-xs font-black ${color}`}>{card.rank}</span>
        <span className={`text-base ${color}`}>{card.suit}</span>
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 p-2 rounded-xl text-xs text-white/90 pointer-events-none"
          style={{ background: "rgba(10,10,30,0.7)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(40px) saturate(180%)" }}>
          {tooltipContent}
        </div>
      )}
      <div onClick={!disabled ? onClick : undefined}
        className={`relative cursor-pointer select-none transition-all duration-200 rounded-2xl w-20 h-28 flex flex-col p-1.5 ${selected ? "ring-2 ring-white -translate-y-3 shadow-2xl" : disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-lg"}`}
        style={{ background: selected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)", border: `1.5px solid ${borderColor}`, backdropFilter: "blur(18px)", boxShadow: selected ? "0 0 24px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.4)" : "inset 0 1px 0 rgba(255,255,255,0.2)" }}>
        <div className={`text-xs font-black leading-tight ${color}`}>{card.rank}<br />{card.suit}</div>
        <div className={`flex-1 flex items-center justify-center text-2xl drop-shadow ${color}`}>{card.suit}</div>
        <div className={`text-xs font-black leading-tight rotate-180 ${color}`}>{card.rank}<br />{card.suit}</div>
        {card.attack > 0 && (
          <div className="absolute bottom-0.5 left-0 right-0 text-center">
            <span className="text-xs font-bold text-white/90">⚔{card.attack}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DeckVisual({ count, color = "#a78bfa", label }) {
  const shown = Math.min(count, 5);
  const cards = Array.from({ length: shown });
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 32, height: 44 }}>
        {cards.map((_, i) => (
          <div key={i} className="absolute rounded-lg" style={{ width: 28, height: 40, left: i * 1.5, top: i * -1.5, background: "rgba(255,255,255,0.08)", border: `1px solid ${color}55`, boxShadow: i === shown - 1 ? `0 0 6px ${color}66` : undefined }} />
        ))}
        {count === 0 && <div className="absolute rounded-lg" style={{ width: 28, height: 40, border: `1px dashed ${color}33`, opacity: 0.4 }} />}
      </div>
      <span className="font-black text-xs" style={{ color }}>{count}</span>
      <span className="opacity-50" style={{ color, fontSize: 9 }}>{label}</span>
    </div>
  );
}

const CARD_ANIM_STYLE = `@keyframes cardSlideIn{0%{opacity:0;transform:translateY(32px) scale(0.85)}60%{opacity:1;transform:translateY(-4px) scale(1.04)}100%{opacity:1;transform:translateY(0) scale(1)}} @keyframes cardGlow{0%{box-shadow:0 0 0 0 rgba(167,139,250,0.7)}50%{box-shadow:0 0 18px 6px rgba(167,139,250,0.45)}100%{box-shadow:0 0 0 0 rgba(167,139,250,0)}}`;

const SHAKE_STYLE = `@keyframes enemyShake{0%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(6px)}45%{transform:translateX(-4px)}60%{transform:translateX(4px)}75%{transform:translateX(-2px)}90%{transform:translateX(2px)}100%{transform:translateX(0)}} @keyframes enemyDie{0%{opacity:1;transform:scale(1) translateY(0);filter:blur(0px) brightness(1)}40%{opacity:0.7;transform:scale(1.08) translateY(-6px);filter:blur(0px) brightness(2.5)}70%{opacity:0.3;transform:scale(0.85) translateY(8px);filter:blur(4px) brightness(0.5)}100%{opacity:0;transform:scale(0.6) translateY(20px);filter:blur(12px) brightness(0)}} @keyframes hpShake{0%,100%{box-shadow:0 0 8px currentColor}25%{box-shadow:0 0 24px #f87171,0 0 48px #f87171}75%{box-shadow:0 0 16px #fbbf24,0 0 32px #fbbf24}}`;

function EnemyCard({ enemy, lang, tableCards = [], shaking = false, dying = false, damageByPlayer = {}, players = [] }) {
  const isRed = enemy.suit === "♥" || enemy.suit === "♦";
  const hpPct = Math.max(0, Math.min(100, (enemy.currentHp / enemy.hp) * 100));
  const hpColor = hpPct > 60 ? "#4ade80" : hpPct > 30 ? "#facc15" : "#f87171";
  const cumulativeDamage = (tableCards || []).reduce((s, c) => s + (c._dealtDamage || 0), 0);
  const damagePct = Math.max(0, Math.min(100, (cumulativeDamage / enemy.hp) * 100));
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(timer);
  }, [enemy.id]);

  return (
    <div className="relative">
      <style>{CARD_ANIM_STYLE + SHAKE_STYLE}</style>
      <style>{`@keyframes floatUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-60px)}}`}</style>
      <div className="rounded-2xl p-3 space-y-2"
        style={{ transition: dying ? "none" : "opacity 0.4s ease, transform 0.4s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-12px)", background: dying ? "rgba(255,180,0,0.18)" : "rgba(220,50,50,0.12)", backdropFilter: "blur(32px) saturate(180%)", border: dying ? "1.5px solid rgba(255,200,0,0.6)" : "1.5px solid rgba(255,120,120,0.3)", boxShadow: dying ? "0 0 60px rgba(255,200,0,0.5), inset 0 2px 0 rgba(255,220,100,0.5)" : "0 12px 48px rgba(220,50,50,0.2), inset 0 2px 0 rgba(255,180,180,0.35)", animation: dying ? "enemyDie 0.65s ease-out forwards" : shaking ? "enemyShake 0.45s ease" : undefined }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl drop-shadow">{enemy.rank}</span>
            <span className={`text-2xl ${isRed ? "text-red-400" : "text-white"}`}>{enemy.suit}</span>
            <div>
              <p className="text-white font-black text-sm leading-tight">
                {lang === "de" ? (enemy.rank === "J" ? "Bube" : enemy.rank === "Q" ? "Dame" : "König") : (enemy.rank === "J" ? "Jack" : enemy.rank === "Q" ? "Queen" : "King")}
              </p>
              <p className={`text-xs font-bold ${isRed ? "text-red-300" : "text-slate-200"}`}>
                {lang === "de" ? SUIT_NAMES_DE[enemy.suit] : SUIT_NAMES_EN[enemy.suit]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-xs font-semibold">{lang === "de" ? "Angriff" : "Attack"}</p>
            <p className="text-red-200 font-black text-lg drop-shadow">⚔️ {enemy.attack}</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>HP</span>
            <span className="text-white font-bold">{enemy.currentHp} / {enemy.hp}</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${hpPct}%`, background: hpColor, boxShadow: `0 0 8px ${hpColor}` }} />
          </div>
        </div>
        {tableCards.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-white/70 text-xs font-semibold">{lang === "de" ? "Tisch:" : "Table:"}</span>
            {tableCards.map((c, i) => (
              <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-bold ${c.suit === "♥" || c.suit === "♦" ? "text-red-300 bg-red-900/30" : "text-white/80 bg-white/10"}`}>{c.rank}{c.suit}</span>
            ))}
          </div>
        )}
        {cumulativeDamage > 0 && (
          <div>
            <div className="flex justify-between text-xs text-orange-300/70 mb-1">
              <span>🗡 {lang === "de" ? "Tisch-Schaden" : "Table Damage"}</span>
              <span>{cumulativeDamage} / {enemy.hp}</span>
            </div>
            <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${damagePct}%`, background: "#fb923c", boxShadow: "0 0 6px #fb923c" }} />
            </div>
          </div>
        )}
        {enemy.immuneSuit && (
          <p className="text-xs text-yellow-300/80 font-bold">🛡 {lang === "de" ? `Immun gegen ${SUIT_NAMES_DE[enemy.immuneSuit]}` : `Immune to ${SUIT_NAMES_EN[enemy.immuneSuit]}`}</p>
        )}
        {enemy.jesterCancelled && (
          <p className="text-xs text-purple-300/80 font-bold">🃏 {lang === "de" ? "Immunität aufgehoben" : "Immunity cancelled"}</p>
        )}
        {players.length > 0 && Object.keys(damageByPlayer).length > 0 && (
          <div className="pt-1 border-t border-white/10">
            <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-1.5">{lang === "de" ? "Schaden pro Spieler" : "Damage per Player"}</p>
            <div className="space-y-1">
              {players.map((p, pi) => {
                const dmg = damageByPlayer[pi] || 0;
                if (dmg === 0) return null;
                const pct = Math.min(100, (dmg / enemy.hp) * 100);
                const colors = ["#f87171","#60a5fa","#34d399","#fbbf24"];
                const col = colors[pi % colors.length];
                return (
                  <div key={pi}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-bold" style={{color: col}}>{p.name}</span>
                      <span className="text-white/60 font-black">{dmg}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{background:"rgba(255,255,255,0.08)"}}>
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{width:`${pct}%`, background: col, boxShadow:`0 0 6px ${col}`}} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegicideApp() {
  const [lang, setLang] = useState("de");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtxRef.current;
  };

  const playTone = (freq, type = "sine", duration = 0.15, gain = 0.18, delay = 0) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch(e) {}
  };

  const sfx = {
    attack: () => { playTone(180, "sawtooth", 0.08, 0.22); playTone(120, "square", 0.12, 0.12, 0.06); },
    bigAttack: () => { playTone(100, "sawtooth", 0.1, 0.28); playTone(70, "square", 0.18, 0.2, 0.07); playTone(140, "sawtooth", 0.08, 0.15, 0.15); },
    defeat: () => { playTone(440, "sine", 0.12, 0.2); playTone(330, "sine", 0.15, 0.18, 0.1); playTone(220, "sine", 0.25, 0.22, 0.22); },
    heal: () => { playTone(520, "sine", 0.1, 0.15); playTone(660, "sine", 0.12, 0.15, 0.1); playTone(780, "sine", 0.1, 0.12, 0.2); },
    draw: () => { playTone(600, "sine", 0.07, 0.12); playTone(750, "sine", 0.07, 0.1, 0.08); },
    shield: () => { playTone(300, "triangle", 0.1, 0.15); playTone(380, "triangle", 0.12, 0.13, 0.09); },
    victory: () => { [523, 659, 784, 1047].forEach((f, i) => playTone(f, "sine", 0.18, 0.2, i * 0.13)); },
    gameover: () => { [220, 185, 155, 110].forEach((f, i) => playTone(f, "sawtooth", 0.22, 0.18, i * 0.15)); },
    cardSelect: () => playTone(800, "sine", 0.05, 0.08),
    jester: () => { [600, 800, 1000, 800, 600].forEach((f, i) => playTone(f, "sine", 0.06, 0.1, i * 0.07)); },
    yield: () => playTone(260, "triangle", 0.1, 0.1),
    discard: () => playTone(200, "sawtooth", 0.08, 0.12),
    enemyDefeated: () => { [392, 523, 659, 784].forEach((f, i) => playTone(f, "sine", 0.15, 0.22, i * 0.1)); },
  };

  const [theme, setTheme] = useState("fantasy");
  const glass = {
    btn: "backdrop-blur-2xl bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1.5px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.15)]",
    btnPrimary: "backdrop-blur-2xl bg-white/25 border border-white/60 hover:bg-white/35 text-white font-black rounded-2xl transition-all duration-300 shadow-[0_8px_32px_rgba(255,255,255,0.15),inset_0_2px_0_rgba(255,255,255,0.7)] hover:scale-105",
    btnDanger: "backdrop-blur-2xl bg-red-500/20 border border-red-400/40 hover:bg-red-500/30 text-white font-semibold rounded-2xl transition-all duration-300",
    btnPurple: "backdrop-blur-2xl bg-purple-500/20 border border-purple-400/40 hover:bg-purple-500/30 text-white font-semibold rounded-2xl transition-all duration-300",
    panel: "backdrop-blur-2xl bg-white/8 border border-white/20 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.35),inset_0_1.5px_0_rgba(255,255,255,0.25)]",
    card: "backdrop-blur-xl bg-white/10 border border-white/25 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.35)]",
  };

  const [gameStartTime, setGameStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!gameStartTime) return;
    const interval = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - gameStartTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [gameStartTime]);
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const [newLogIdx, setNewLogIdx] = useState(-1);
  const [gameLayout, setGameLayout] = useState("arena");
  const [screen, setScreen] = useState("menu");
  const [numPlayers, setNumPlayers] = useState(1);
  const [game, setGame] = useState(null);
  const [soloJestersUsed, setSoloJestersUsed] = useState(0);
  const [soloJestersAvail, setSoloJestersAvail] = useState(2);
  const [lastYielded, setLastYielded] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [log, setLog] = useState([]);
  const [animMsg, setAnimMsg] = useState("");
  const [phase, setPhase] = useState("play");
  const [discardNeeded, setDiscardNeeded] = useState(0);
  const [discardedSoFar, setDiscardedSoFar] = useState(0);
  const [pendingNextPlayerIndex, setPendingNextPlayerIndex] = useState(null);
  const [roundStats, setRoundStats] = useState({ damage: 0, cards: 0, healed: 0 });
  const [lastRoundStats, setLastRoundStats] = useState(null);
  const [roundBanner, setRoundBanner] = useState(null);
  const [totalStats, setTotalStats] = useState({ damage: 0, cards: 0, enemies: 0 });
  const [paused, setPaused] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [floatingNums, setFloatingNums] = useState([]);
  const [handSort, setHandSort] = useState("default");
  const [enemyShaking, setEnemyShaking] = useState(false);
  const [newCardIds, setNewCardIds] = useState(new Set());
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => { try { return JSON.parse(localStorage.getItem("regicide_ach") || "[]"); } catch { return []; } });
  const [newAchievement, setNewAchievement] = useState(null);
  const achievementStats = useRef({ totalCards: 0, totalEnemies: 0, totalDamage: 0, maxCardsInRound: 0, wonInSeconds: 0, exactKills: 0, soloWinNoJester: false, maxSingleHit: 0, wonWith1Card: false });

  const [dailyChallenge] = useState(() => getDailyChallenge());
  const [dailyActive, setDailyActive] = useState(false);
  const [dailyCompleted, setDailyCompleted] = useState(() => { try { const s = localStorage.getItem("regicide_daily"); if (!s) return null; const d = JSON.parse(s); return d.seed === getDailyChallenge().seed ? d : null; } catch { return null; } });

  const checkAchievements = (stats) => {
    const current = { ...achievementStats.current, ...stats };
    achievementStats.current = current;
    const newOnes = ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a.id) && a.check(current));
    if (newOnes.length === 0) return;
    const updated = [...unlockedAchievements, ...newOnes.map(a => a.id)];
    setUnlockedAchievements(updated);
    try { localStorage.setItem("regicide_ach", JSON.stringify(updated)); } catch {}
    setNewAchievement(newOnes[0]);
    setTimeout(() => setNewAchievement(null), 3500);
  };
  const [enemyDying, setEnemyDying] = useState(false);
  const floatIdRef = useRef(0);

  const loadHighscores = () => { try { return JSON.parse(localStorage.getItem("coupdeta_hs") || "[]"); } catch { return []; } };
  const saveHighscore = (entry) => {
    try { const list = loadHighscores(); list.push(entry); list.sort((a, b) => b.score - a.score); localStorage.setItem("coupdeta_hs", JSON.stringify(list.slice(0, 10))); } catch {}
  };
  const clearHighscores = () => { try { localStorage.removeItem("coupdeta_hs"); } catch {} };

  const spawnFloat = (text, color = "#f87171", size = "text-3xl") => {
    const id = floatIdRef.current++;
    setFloatingNums(prev => [...prev, { id, text, color, size, x: 40 + Math.random() * 20 }]);
    setTimeout(() => setFloatingNums(prev => prev.filter(f => f.id !== id)), 1400);
  };

  const markNewCards = (cardIds) => {
    setNewCardIds(new Set(cardIds));
    setTimeout(() => setNewCardIds(new Set()), 700);
  };

  const triggerEnemyHit = () => {
    setEnemyShaking(true);
    setTimeout(() => setEnemyShaking(false), 450);
  };

  const addLog = (msg) => {
    setLog((prev) => [msg, ...prev].slice(0, 20));
    setNewLogIdx(0);
    setTimeout(() => setNewLogIdx(-1), 600);
  };

  const showAnim = (msg, duration = 2000) => {
    setAnimMsg(msg);
    setTimeout(() => setAnimMsg(""), duration);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (screen === "game" && game) {
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (e.key >= "1" && e.key <= "8") {
          const idx = parseInt(e.key) - 1;
          if (idx < currentPlayer.hand.length && phase === "play") toggleCardSelection(currentPlayer.hand[idx].id);
          return;
        }
        if ((e.key === "Enter" || e.key === " ") && phase === "play") { e.preventDefault(); if (selectedCards.length > 0) playCards(); return; }
        if ((e.key === "y" || e.key === "Y") && phase === "play") { yieldTurn(); return; }
        if (e.key === "Escape") { setSelectedCards([]); return; }
        if ((e.key === "j" || e.key === "J") && numPlayers === 1 && soloJestersAvail > 0 && phase === "play") { soloFlipJester("step1"); return; }
        if ((e.key === "j" || e.key === "J") && numPlayers === 1 && soloJestersAvail > 0 && phase === "discard") { soloFlipJester("step4"); return; }
      }
      if (e.key === "m" || e.key === "M") { if (screen !== "game") setScreen("menu"); }
      if ((e.key === "p" || e.key === "P") && screen === "game" && phase === "play") { setPaused(prev => !prev); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, game, phase, selectedCards, numPlayers, soloJestersAvail]);

  const initDailyGame = () => {
    setDailyActive(true);
    setNumPlayers(1);
    // Pass numPlayers=1 directly so initGame doesn't read stale state
    setTimeout(() => initGame(true, 1), 0);
  };

  const initGame = (isDaily = false, overrideNumPlayers = null) => {
    const effectivePlayers = overrideNumPlayers ?? numPlayers;
    const playerDeck = shuffle(createDeck(effectivePlayers));
    const enemyDeck = shuffle(createEnemyDeck());
    const jacks = shuffle(enemyDeck.filter((e) => e.rank === "J"));
    const queens = shuffle(enemyDeck.filter((e) => e.rank === "Q"));
    const kings = shuffle(enemyDeck.filter((e) => e.rank === "K"));
    const orderedEnemies = [...jacks, ...queens, ...kings];
    const effectiveHandSize = (isDaily && dailyChallenge.id === "half_hand") ? Math.max(2, Math.floor(getHandSize(effectivePlayers) / 2)) : getHandSize(effectivePlayers);
    const handSize = effectiveHandSize;
    const players = [];
    let remaining = [...playerDeck];
    for (let i = 0; i < effectivePlayers; i++) {
      players.push({ id: i, name: `${t(lang, "Spieler", "Player")} ${i + 1}`, hand: remaining.splice(0, handSize) });
    }
    let finalEnemies = orderedEnemies;
    if (isDaily && dailyChallenge.apply) {
      finalEnemies = orderedEnemies.map(e => dailyChallenge.apply(e));
    }
    const newGame = { players, drawPile: remaining, discardPile: [], enemyDeck: finalEnemies.slice(1), currentEnemy: { ...finalEnemies[0] }, currentPlayerIndex: 0, tableCards: [], damageByPlayer: {}, won: false, lost: false, isDaily: isDaily };
    setSoloJestersUsed(0);
    setSoloJestersAvail(effectivePlayers === 1 ? 2 : 0);
    setGameStartTime(Date.now());
    setElapsedSeconds(0);
    setLastYielded([]);
    setGame(newGame);
    setSelectedCards([]);
    setLog([]);
    setPhase("play");
    setDiscardNeeded(0);
    setRoundStats({ damage: 0, cards: 0, healed: 0 });
    setTotalStats({ damage: 0, cards: 0, enemies: 0 });
    setLastRoundStats(null);
    addLog(t(lang, "Spiel gestartet! Besiegt den ersten Feind.", "Game started! Defeat the first enemy."));
    setScreen("game");
  };

  const getCardValue = (card) => {
    if (card.type === "jester") return 0;
    if (card.rank === "A") return 1;
    if (card.rank === "J") return 10;
    if (card.rank === "Q") return 15;
    if (card.rank === "K") return 20;
    return parseInt(card.rank);
  };

  const toggleCardSelection = (cardId) => {
    sfx.cardSelect();
    if (phase !== "play") return;
    const currentHand = game.players[game.currentPlayerIndex].hand;
    const clickedCard = currentHand.find((c) => c.id === cardId);
    if (!clickedCard) return;
    setSelectedCards((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length === 0) return [cardId];
      const firstCard = currentHand.find((c) => c.id === prev[0]);
      if (!firstCard) return [cardId];
      if (clickedCard.type === "jester" || firstCard.type === "jester") return [cardId];
      const isFirstRoyal = ["J","Q","K"].includes(firstCard.rank);
      const isClickedRoyal = ["J","Q","K"].includes(clickedCard.rank);
      if (isFirstRoyal || isClickedRoyal) return [cardId];
      const isFirstAnimal = firstCard.rank === "A";
      const isClickedAnimal = clickedCard.rank === "A";
      if (isFirstAnimal || isClickedAnimal) {
        if (prev.length === 1) return [...prev, cardId];
        return [cardId];
      }
      if (firstCard.rank !== clickedCard.rank) return [cardId];
      const allSelected = [...prev, cardId];
      const comboTotal = allSelected.reduce((s, id) => { const c = currentHand.find((x) => x.id === id); return s + (c ? getCardValue(c) : 0); }, 0);
      if (comboTotal > 10) { addLog(t(lang, "Kombo-Gesamtwert darf 10 nicht überschreiten!", "Combo total must not exceed 10!")); return prev; }
      return allSelected;
    });
  };

  const calcBaseAttack = (cards) => {
    if (cards.length === 0) return 0;
    if (cards.some((c) => c.type === "jester")) return 0;
    return cards.reduce((sum, c) => {
      if (c.rank === "A") return sum + 1;
      if (c.rank === "J") return sum + 10;
      if (c.rank === "Q") return sum + 15;
      if (c.rank === "K") return sum + 20;
      return sum + parseInt(c.rank);
    }, 0);
  };

  const calcAttack = (cards, enemy) => {
    const base = calcBaseAttack(cards);
    if (base === 0) return 0;
    const enemyToCheck = enemy || game?.currentEnemy;
    const hasClubs = cards.some((c) => c.suit === "♣");
    const enemyImmuneToClubs = enemyToCheck?.suit === "♣" && !enemyToCheck?.jesterCancelled;
    // Daily: no_clubs modifier disables clubs doubling
    const clubsDisabled = game?.isDaily && dailyChallenge?.id === "no_clubs";
    if (hasClubs && !enemyImmuneToClubs && !clubsDisabled) return base * 2;
    return base;
  };

  const applyHearts = (g, cards, baseAttack) => {
    const heartsCards = cards.filter((c) => c.suit === "♥" && c.type !== "jester");
    if (heartsCards.length === 0) return g;
    // Daily: no_hearts modifier disables healing
    if (g.isDaily && dailyChallenge?.id === "no_hearts") { addLog(t(lang, "♥ Tagesmod – Heilung deaktiviert", "♥ Daily mod – healing disabled")); return g; }
    if (g.currentEnemy.suit === "♥" && !g.currentEnemy.jesterCancelled) { addLog(t(lang, "♥ Immunität – Heilung blockiert", "♥ Immune – heal blocked")); return g; }
    const shuffledDiscard = shuffle([...g.discardPile]);
    const toHeal = shuffledDiscard.slice(0, baseAttack);
    const newDiscard = shuffledDiscard.slice(baseAttack);
    sfx.heal();
    spawnFloat(`+${toHeal.length} ♥`, "#34d399", "text-3xl");
    addLog(`♥ ${t(lang, `Heilt ${toHeal.length} Karten zurück`, `Healed ${toHeal.length} cards back`)}`);
    return { ...g, discardPile: newDiscard, drawPile: [...g.drawPile, ...toHeal] };
  };

  const applyDiamonds = (g, cards, players, baseAttack) => {
    const diamondCards = cards.filter((c) => c.suit === "♦" && c.type !== "jester");
    if (diamondCards.length === 0) return { g, players };
    if (g.currentEnemy.suit === "♦" && !g.currentEnemy.jesterCancelled) { addLog(t(lang, "♦ Immunität – Ziehen blockiert", "♦ Immune – draw blocked")); return { g, players }; }
    let drawPile = [...g.drawPile];
    let newPlayers = players.map((p) => ({ ...p, hand: [...p.hand] }));
    let drawn = 0;
    const maxHand = getHandSize(numPlayers);
    for (let i = 0; i < numPlayers && drawn < baseAttack; i++) {
      const pi = (g.currentPlayerIndex + i) % numPlayers;
      const player = newPlayers[pi];
      const canDraw = maxHand - player.hand.length;
      const toDraw = Math.min(canDraw, baseAttack - drawn);
      if (toDraw > 0 && drawPile.length > 0) {
        const drawnCards = drawPile.splice(0, Math.min(toDraw, drawPile.length));
        player.hand = [...player.hand, ...drawnCards];
        drawn += drawnCards.length;
        newPlayers[pi] = player;
        markNewCards(drawnCards.map(c => c.id));
      }
    }
    if (drawn > 0) { sfx.draw(); spawnFloat(`+${drawn} ♦`, "#60a5fa", "text-3xl"); }
    addLog(`♦ ${t(lang, `${drawn} Karten gezogen`, `${drawn} cards drawn`)}`);
    return { g: { ...g, drawPile }, players: newPlayers };
  };

  const applySpades = (g, cards, enemy, baseAttack) => {
    const spadeCards = cards.filter((c) => c.suit === "♠" && c.type !== "jester");
    if (spadeCards.length === 0) return enemy;
    if (enemy.suit === "♠" && !enemy.jesterCancelled) { addLog(t(lang, "♠ Immunität – Schild blockiert", "♠ Immune – shield blocked")); return enemy; }
    const newAttack = Math.max(0, enemy.attack - baseAttack);
    sfx.shield();
    spawnFloat(`♠ -${baseAttack}`, "#a78bfa", "text-2xl");
    addLog(`♠ ${t(lang, `Schild: Feind-Angriff ${enemy.attack} → ${newAttack}`, `Shield: Enemy attack ${enemy.attack} → ${newAttack}`)}`);
    return { ...enemy, attack: newAttack };
  };

  const soloFlipJester = (timing) => {
    if (numPlayers !== 1 || soloJestersAvail <= 0 || !game) return;
    if (timing === "step1" && phase !== "play") return;
    if (timing === "step4" && phase !== "discard") return;
    let drawPile = [...game.drawPile];
    const discardPile = [...game.discardPile, ...game.players[0].hand];
    const newHand = drawPile.splice(0, 8);
    setSoloJestersUsed((p) => p + 1);
    setSoloJestersAvail((p) => p - 1);
    addLog(t(lang, `🃏 Jester umgedreht! Hand neu gezogen (${newHand.length} Karten).`, `🃏 Jester flipped! Hand refilled (${newHand.length} cards).`));
    setGame({ ...game, players: [{ ...game.players[0], hand: newHand }], drawPile, discardPile });
    if (timing === "step4") addLog(t(lang, `⚠️ Schaden (${discardNeeded}) muss noch bezahlt werden!`, `⚠️ Damage (${discardNeeded}) still needs to be paid!`));
  };

  const playJester = () => {
    sfx.jester();
    if (!game) return;
    const selectedIds = [...selectedCards];
    const players = game.players.map((p, i) => i === game.currentPlayerIndex ? { ...p, hand: p.hand.filter((c) => !selectedIds.includes(c.id)) } : p);
    const enemy = { ...game.currentEnemy, jesterCancelled: true };
    addLog(`🃏 ${t(lang, "Jester gespielt! Gegner-Immunität aufgehoben.", "Jester played! Enemy immunity cancelled.")}`);
    showAnim(t(lang, "🃏 Jester! Immunität aufgehoben!", "🃏 Jester! Immunity cancelled!"));
    setGame({ ...game, players, currentEnemy: enemy });
    setPhase("jester");
    setSelectedCards([]);
  };

  const chooseNextPlayer = (pi) => {
    if (phase !== "jester" || !game) return;
    setGame({ ...game, currentPlayerIndex: pi });
    setPhase("play");
    addLog(t(lang, `Spieler ${pi + 1} ist als nächstes dran.`, `Player ${pi + 1} goes next.`));
  };

  const getAutoDiscardSuggestion = (hand, needed) => {
    const sorted = [...hand].sort((a, b) => getCardValue(b) - getCardValue(a));
    const result = [];
    let remaining = needed;
    for (const card of sorted) {
      if (remaining <= 0) break;
      result.push(card.id);
      remaining -= getCardValue(card);
    }
    return remaining <= 0 ? result : [];
  };

  const checkCanActAndTriggerLose = (g, playerIdx, lyielded) => {
    const player = g.players[playerIdx];
    if (player.hand.length > 0) return false;
    const others = g.players.map((_, i) => i).filter((i) => i !== playerIdx);
    const allOthersYielded = others.length > 0 && others.every((i) => lyielded.includes(i));
    if (allOthersYielded || others.length === 0) {
      sfx.gameover();
      saveHighscore({ date: new Date().toLocaleDateString(), players: numPlayers, won: false, enemies: totalStats.enemies, damage: totalStats.damage, cards: totalStats.cards, jesters: soloJestersUsed, score: totalStats.damage + totalStats.enemies * 50 });
      addLog(t(lang, "Keine Karten – Niederlage!", "No cards – defeat!"));
      setGame({ ...g, lost: true });
      setScreen("gameover");
      return true;
    }
    return false;
  };

  const discardCardForDamage = (cardId) => {
    sfx.discard();
    if (phase !== "discard" || !game) return;
    const currentPlayer = game.players[game.currentPlayerIndex];
    const card = currentPlayer.hand.find((c) => c.id === cardId);
    if (!card) return;
    const cardValue = getCardValue(card);
    const newHand = currentPlayer.hand.filter((c) => c.id !== cardId);
    const newDiscard = [...game.discardPile, card];
    const newDiscardNeeded = discardNeeded - cardValue;
    addLog(`🗑 ${t(lang, `Abgeworfen: ${card.rank}${card.suit !== "🃏" ? card.suit : ""} (${cardValue}), noch ${Math.max(0, newDiscardNeeded)} nötig`, `Discarded: ${card.rank}${card.suit !== "🃏" ? card.suit : ""} (${cardValue}), need ${Math.max(0, newDiscardNeeded)} more`)}`);
    let newPlayers = game.players.map((p, i) => i === game.currentPlayerIndex ? { ...p, hand: newHand } : p);
    if (newDiscardNeeded <= 0) {
      const nextAfterDiscard = game._nextPlayerAfterDiscard ?? (game.currentPlayerIndex + 1) % numPlayers;
      let drawPile2 = [...game.drawPile];
      let mutableNewDiscard = [...newDiscard];
      if (drawPile2.length === 0 && mutableNewDiscard.length > 0) {
        drawPile2 = shuffle([...mutableNewDiscard]);
        mutableNewDiscard = [];
        addLog(t(lang, "🔄 Nachziehstapel leer – Ablage gemischt!", "🔄 Draw pile empty – discard reshuffled!"));
      }
      const prevDiscardLen = newPlayers[game.currentPlayerIndex].hand.length;
      while (newPlayers[game.currentPlayerIndex].hand.length < getHandSize(numPlayers) && drawPile2.length > 0) {
        newPlayers[game.currentPlayerIndex] = { ...newPlayers[game.currentPlayerIndex], hand: [...newPlayers[game.currentPlayerIndex].hand, drawPile2.shift()] };
      }
      markNewCards(newPlayers[game.currentPlayerIndex].hand.slice(prevDiscardLen).map(c => c.id));
      addLog(t(lang, "✅ Schaden bezahlt! Nächster Spieler.", "✅ Damage paid! Next player."));
      const stateAfterDiscard = { ...game, players: newPlayers, discardPile: mutableNewDiscard, drawPile: drawPile2, currentPlayerIndex: nextAfterDiscard, _nextPlayerAfterDiscard: undefined };
      if (!checkCanActAndTriggerLose(stateAfterDiscard, nextAfterDiscard, lastYielded)) setGame(stateAfterDiscard);
      setPhase("play");
      setDiscardNeeded(0);
      setDiscardedSoFar(0);
      setPendingNextPlayerIndex(null);
    } else {
      const totalCardsLeft = newPlayers.reduce((s, p) => s + p.hand.length, 0);
      if (totalCardsLeft === 0 && newDiscardNeeded > 0) { setGame({ ...game, players: newPlayers, discardPile: newDiscard, lost: true }); setScreen("gameover"); return; }
      setGame({ ...game, players: newPlayers, discardPile: newDiscard });
      setDiscardNeeded(newDiscardNeeded);
      setDiscardedSoFar(discardedSoFar + cardValue);
    }
  };

  const playCards = () => {
    if (selectedCards.length === 0 || !game) return;
    const currentPlayer = game.players[game.currentPlayerIndex];
    const cards = currentPlayer.hand.filter((c) => selectedCards.includes(c.id));
    if (cards.length === 0) return;
    if (cards.some((c) => c.type === "jester")) { playJester(); return; }
    if (cards.length > 1) {
      if (cards.some((c) => ["J","Q","K"].includes(c.rank))) { addLog(t(lang, "Ungültig: Royals müssen allein gespielt werden!", "Invalid: Royals must be played alone!")); return; }
      const animals = cards.filter((c) => c.rank === "A");
      if (animals.length > 0) {
        if (cards.length > 2) { addLog(t(lang, "Ungültig: Tier-Begleiter nur mit 1 weiteren Karte!", "Invalid: Animal companion with 1 other card only!")); return; }
      } else {
        const ranks = [...new Set(cards.map((c) => c.rank))];
        if (ranks.length > 1) { addLog(t(lang, "Ungültig: Nur Karten gleichen Rangs!", "Invalid: Same-rank cards only!")); return; }
        if (cards.reduce((s, c) => s + getCardValue(c), 0) > 10) { addLog(t(lang, "Ungültig: Kombo-Gesamtwert > 10!", "Invalid: Combo total > 10!")); return; }
      }
    }
    const selectedIds = [...selectedCards];
    setSelectedCards([]);
    let g = { ...game };
    let players = g.players.map((p) => ({ ...p, hand: [...p.hand] }));
    let enemy = { ...g.currentEnemy };
    players[g.currentPlayerIndex] = { ...players[g.currentPlayerIndex], hand: players[g.currentPlayerIndex].hand.filter((c) => !selectedIds.includes(c.id)) };
    const baseAttack = calcBaseAttack(cards);
    const attack = calcAttack(cards, enemy);
    const taggedCards = cards.map((c, idx) => ({ ...c, _dealtDamage: idx === 0 ? attack : 0 }));
    const newHp = enemy.currentHp - attack;
    setRoundStats(prev => ({ damage: prev.damage + attack, cards: prev.cards + cards.length, healed: prev.healed }));
    checkAchievements({ totalCards: achievementStats.current.totalCards + cards.length, totalDamage: achievementStats.current.totalDamage + attack, maxSingleHit: Math.max(achievementStats.current.maxSingleHit, attack) });
    if (attack >= 20) sfx.bigAttack(); else sfx.attack();
    triggerEnemyHit();
    setGame(prev => {
      if (!prev) return prev;
      const dmg = { ...(prev.damageByPlayer || {}) };
      dmg[g.currentPlayerIndex] = (dmg[g.currentPlayerIndex] || 0) + attack;
      return { ...prev, damageByPlayer: dmg };
    });
    spawnFloat(`-${attack}`, attack >= 20 ? "#fbbf24" : attack >= 10 ? "#f87171" : "#fb923c", attack >= 20 ? "text-5xl" : attack >= 10 ? "text-4xl" : "text-3xl");
    addLog(`⚔️ ${t(lang, `Angriff: ${attack} Schaden → ${enemy.rank}${enemy.suit} (HP: ${enemy.currentHp}→${Math.max(0,newHp)})`, `Attack: ${attack} dmg → ${enemy.rank}${enemy.suit} (HP: ${enemy.currentHp}→${Math.max(0,newHp)})`)}`);
    g = applyHearts({ ...g, players }, cards, baseAttack);
    players = g.players || players;
    const diamondResult = applyDiamonds(g, cards, players, baseAttack);
    g = diamondResult.g; players = diamondResult.players;
    enemy = applySpades(g, cards, enemy, baseAttack);
    let tableCards = [...g.tableCards, ...taggedCards];
    if (newHp <= 0) {
      const finishedStats = { damage: roundStats.damage + attack, cards: roundStats.cards + cards.length, healed: roundStats.healed };
      setLastRoundStats(finishedStats);
      setRoundBanner({ enemy: `${enemy.rank}${enemy.suit}`, damage: finishedStats.damage, cards: finishedStats.cards, time: formatTime(elapsedSeconds), damageByPlayer: { ...(g.damageByPlayer || {}) }, enemiesLeft: g.enemyDeck.length });
      // Banner bleibt bis Spieler klickt (kein auto-close)
      setTotalStats(prev => ({ damage: prev.damage + finishedStats.damage, cards: prev.cards + finishedStats.cards, enemies: prev.enemies + 1 }));
      checkAchievements({ totalEnemies: achievementStats.current.totalEnemies + 1, exactKills: achievementStats.current.exactKills + (newHp === 0 ? 1 : 0), maxCardsInRound: Math.max(achievementStats.current.maxCardsInRound, finishedStats.cards) });
      setRoundStats({ damage: 0, cards: 0, healed: 0 });
      sfx.enemyDefeated();
      spawnFloat("👑 BESIEGT!", "#fbbf24", "text-4xl");
      showAnim(t(lang, `🎉 ${enemy.rank}${enemy.suit} BESIEGT! 👑✨`, `🎉 ${enemy.rank}${enemy.suit} DEFEATED! 👑✨`), 2500);
      addLog(t(lang, `Feind besiegt: ${enemy.rank}${enemy.suit}`, `Enemy defeated: ${enemy.rank}${enemy.suit}`));
      let newDiscard = [...g.discardPile];
      let newDraw = [...g.drawPile];
      if (newHp === 0) { newDraw = [{ ...enemy }, ...newDraw]; newDiscard = [...newDiscard, ...tableCards]; addLog(t(lang, "Genau besiegt – Feind auf Nachziehstapel!", "Exact – enemy on draw pile!")); }
      else { newDiscard = [...newDiscard, ...tableCards, { ...enemy }]; addLog(t(lang, "Overkill – Karten auf Ablage.", "Overkill – cards to discard.")); }
      // ── Auflöse-Animation: erst dying=true, dann nach 650ms weiter ──
      setEnemyDying(true);
      setTimeout(() => {
        setEnemyDying(false);
        if (g.enemyDeck.length === 0) {
          sfx.victory();
          const wonSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
          const handAtWin = players[g.currentPlayerIndex]?.hand?.length ?? 0;
          checkAchievements({
            wonInSeconds: wonSeconds,
            wonWith1Card: handAtWin === 1,
            soloWinNoJester: numPlayers === 1 && soloJestersUsed === 0,
          });
          saveHighscore({ date: new Date().toLocaleDateString(), players: numPlayers, won: true, enemies: totalStats.enemies + 1, damage: totalStats.damage + finishedStats.damage, cards: totalStats.cards + finishedStats.cards, jesters: soloJestersUsed, score: totalStats.damage + finishedStats.damage + (totalStats.enemies + 1) * 50 + (soloJestersUsed === 0 ? 100 : 0) });
          setGame({ ...g, players, discardPile: newDiscard, drawPile: newDraw, tableCards: [], won: true });
          setScreen("victory");
          return;
        }
        const nextEnemy = { ...g.enemyDeck[0], currentHp: g.enemyDeck[0].hp };
        const remainingEnemies = g.enemyDeck.slice(1);
        let drawPile = [...newDraw];
        for (let i = 0; i < numPlayers; i++) {
          const pi = (g.currentPlayerIndex + i) % numPlayers;
          const p = { ...players[pi] };
          while (p.hand.length < getHandSize(numPlayers) && drawPile.length > 0) p.hand.push(drawPile.shift());
          players[pi] = p;
        }
        setLastYielded([]);
        const newState = { ...g, players, drawPile, discardPile: newDiscard, enemyDeck: remainingEnemies, currentEnemy: nextEnemy, tableCards: [] };
        if (!checkCanActAndTriggerLose(newState, g.currentPlayerIndex, [])) setGame(newState);
        setPhase("play");
      }, 650);
    } else {
      enemy.currentHp = newHp;
      const incomingDamage = enemy.attack;
      const nextPlayerIndex = (g.currentPlayerIndex + 1) % numPlayers;
      if (incomingDamage <= 0) {
        let drawPile = [...g.drawPile];
        const currP = { ...players[g.currentPlayerIndex] };
        const prevLen = currP.hand.length;
        while (currP.hand.length < getHandSize(numPlayers) && drawPile.length > 0) currP.hand.push(drawPile.shift());
        markNewCards(currP.hand.slice(prevLen).map(c => c.id));
        players[g.currentPlayerIndex] = currP;
        const stateNoAttack = { ...g, players, drawPile, currentEnemy: enemy, currentPlayerIndex: nextPlayerIndex, tableCards };
        if (!checkCanActAndTriggerLose(stateNoAttack, nextPlayerIndex, lastYielded)) setGame(stateNoAttack);
        setPhase("play"); setDiscardNeeded(0); setDiscardedSoFar(0);
      } else {
        addLog(`👿 ${t(lang, `${enemy.rank}${enemy.suit} greift an: ${incomingDamage} Schaden!`, `${enemy.rank}${enemy.suit} attacks for ${incomingDamage} damage!`)}`);
        showAnim(t(lang, `⚠️ ${incomingDamage} Schaden – Karten abwerfen!`, `⚠️ ${incomingDamage} damage – discard cards!`));
        setGame({ ...g, players, currentEnemy: enemy, currentPlayerIndex: g.currentPlayerIndex, tableCards, _nextPlayerAfterDiscard: nextPlayerIndex });
        setPhase("discard"); setDiscardNeeded(incomingDamage); setDiscardedSoFar(0); setPendingNextPlayerIndex(nextPlayerIndex);
      }
    }
  };

  const yieldTurn = () => {
    if (!game || phase !== "play") return;
    sfx.yield();
    if (numPlayers === 1) { addLog(t(lang, "Solo: kein Passen möglich!", "Solo: cannot yield!")); return; }
    const otherPlayers = game.players.map((_, i) => i).filter((i) => i !== game.currentPlayerIndex);
    if (otherPlayers.every((i) => lastYielded.includes(i))) { addLog(t(lang, "Passen nicht möglich – alle anderen haben bereits gepasst!", "Cannot yield – all others already yielded!")); return; }
    if (game.players[game.currentPlayerIndex].hand.length === 0) { setGame({ ...game, lost: true }); setScreen("gameover"); return; }
    setLastYielded((prev) => [...prev.filter((i) => i !== game.currentPlayerIndex), game.currentPlayerIndex]);
    addLog(t(lang, `Spieler ${game.currentPlayerIndex + 1} passt.`, `Player ${game.currentPlayerIndex + 1} yields.`));
    const incomingDamage = game.currentEnemy.attack;
    const nextPlayerIndex = (game.currentPlayerIndex + 1) % numPlayers;
    setSelectedCards([]);
    if (incomingDamage <= 0) { setGame({ ...game, currentPlayerIndex: nextPlayerIndex }); setPhase("play"); }
    else {
      addLog(`👿 ${t(lang, `${game.currentEnemy.rank}${game.currentEnemy.suit} greift an: ${incomingDamage} Schaden!`, `${game.currentEnemy.rank}${game.currentEnemy.suit} attacks for ${incomingDamage} damage!`)}`);
      showAnim(t(lang, `⚠️ ${incomingDamage} Schaden – Karten abwerfen!`, `⚠️ ${incomingDamage} damage – discard cards!`));
      setGame({ ...game, currentPlayerIndex: nextPlayerIndex });
      setPhase("discard"); setDiscardNeeded(incomingDamage); setDiscardedSoFar(0); setPendingNextPlayerIndex(nextPlayerIndex);
    }
  };

  const getAiSuggestion = () => {
    if (!game || phase !== "play") return null;
    const hand = game.players[game.currentPlayerIndex].hand;
    const enemy = game.currentEnemy;
    const hpLeft = enemy.currentHp;
    const candidates = [];
    for (const card of hand) {
      if (card.type === "jester") continue;
      const atk = calcAttack([card], enemy);
      candidates.push({ ids: [card.id], atk, kills: atk >= hpLeft });
    }
    const byRank = {};
    for (const card of hand) {
      if (card.type === "jester" || ["J","Q","K"].includes(card.rank)) continue;
      if (!byRank[card.rank]) byRank[card.rank] = [];
      byRank[card.rank].push(card);
    }
    for (const rank in byRank) {
      const group = byRank[rank];
      for (let size = 2; size <= group.length; size++) {
        const combo = group.slice(0, size);
        if (combo.reduce((s, c) => s + getCardValue(c), 0) > 10) break;
        const atk = calcAttack(combo, enemy);
        candidates.push({ ids: combo.map(c => c.id), atk, kills: atk >= hpLeft });
      }
    }
    if (candidates.length === 0) return null;
    const killers = candidates.filter(c => c.kills);
    if (killers.length > 0) return killers.sort((a, b) => a.atk - b.atk)[0];
    return candidates.sort((a, b) => b.atk - a.atk)[0];
  };

  const applyAiSuggestion = () => {
    const sug = getAiSuggestion();
    if (!sug) return;
    setSelectedCards(sug.ids);
  };

  // ── SCREENS ──────────────────────────────────────────────────────────────

  if (screen === "highscores") {
    const scores = loadHighscores();
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setScreen("menu")} className={`px-4 py-2 font-bold text-sm ${glass.btn}`}>← {t(lang, "Zurück", "Back")}</button>
            <h1 className="text-3xl font-black text-white">🏆 {t(lang, "Bestenliste", "Highscores")}</h1>
            <button onClick={() => { clearHighscores(); setScreen("menu"); }} className={`px-3 py-1.5 text-xs font-bold ${glass.btnDanger}`}>{t(lang, "Löschen", "Clear")}</button>
          </div>
          {scores.length === 0 ? (
            <div className="text-center py-16"><div className="text-6xl mb-4">🏆</div><p className="text-white/40 text-lg">{t(lang, "Noch keine Einträge.", "No entries yet.")}</p></div>
          ) : (
            <div className="space-y-3">
              {scores.map((s, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`;
                const rankCol = i === 0 ? "#fbbf24" : i === 1 ? "#d1d5db" : i === 2 ? "#b45309" : "rgba(255,255,255,0.3)";
                return (
                  <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${rankCol}44` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center">{medal}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white text-lg" style={{ color: rankCol }}>{s.score} {t(lang, "Pkt", "pts")}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${s.won ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>{s.won ? (lang==="de"?"SIEG":"WIN") : (lang==="de"?"NIEDERLAGE":"LOSS")}</span>
                          <span className="text-white/30 text-xs">{s.date}</span>
                          <span className="text-white/30 text-xs">👤 {s.players}P</span>
                        </div>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          <span className="text-white/50 text-xs">⚔️ {s.damage}</span>
                          <span className="text-white/50 text-xs">👑 {s.enemies}/12</span>
                          <span className="text-white/50 text-xs">🃏 {s.cards}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-center py-6">
            <button onClick={() => setScreen("menu")} className={`px-8 py-3 font-black text-lg ${glass.btnPrimary}`}>{t(lang, "Zurück zum Menü", "Back to Menu")}</button>
          </div>
          <div className="text-center pb-4"><span className="font-mono bg-white text-gray-900 px-2 py-0.5 rounded-lg font-black text-xs">v7.2</span></div>
        </div>
      </div>
    );
  }

  if (screen === "rules") {
    const sections = [
      { icon: "🎯", titleDe: "Ziel", titleEn: "Goal", bodyDe: "Besiegt alle 12 royalen Feinde (4 Buben, 4 Damen, 4 Könige) kooperativ.", bodyEn: "Defeat all 12 royal enemies (4 Jacks, 4 Queens, 4 Kings) cooperatively." },
      { icon: "⚔️", titleDe: "Zug", titleEn: "Turn", bodyDe: "1. Karte(n) spielen\n2. Farb-Kräfte anwenden\n3. Schaden dem Feind zufügen\n4. Feind greift zurück – Karten abwerfen\n5. Karten nachziehen", bodyEn: "1. Play card(s)\n2. Apply suit powers\n3. Deal damage to enemy\n4. Enemy counter-attacks – discard cards\n5. Draw back up to hand size" },
      { icon: "🔗", titleDe: "Kombos", titleEn: "Combos", bodyDe: "Gleicher Rang + Gesamtwert ≤ 10\nTier-Begleiter: Ass + 1 beliebige Karte\nJester: immer allein", bodyEn: "Same rank + total value ≤ 10\nAnimal companion: Ace + 1 any card\nJester: always alone" },
      { icon: "✨", titleDe: "Farb-Kräfte", titleEn: "Suit Powers", bodyDe: "♥ Heilt Karten vom Ablagestapel zurück\n♦ Alle Spieler ziehen Karten\n♣ Angriffswert wird verdoppelt\n♠ Feind-Angriff dauerhaft reduzieren", bodyEn: "♥ Heal cards from discard back\n♦ All players draw cards\n♣ Attack value is doubled\n♠ Reduce enemy attack permanently" },
      { icon: "🛡", titleDe: "Immunität", titleEn: "Immunity", bodyDe: "Jeder Feind ist immun gegen seine eigene Farbe. Jester hebt Immunität auf.", bodyEn: "Each enemy is immune to its own suit's power. Jester cancels immunity." },
    ];
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setScreen("menu")} className={`px-4 py-2 font-bold text-sm ${glass.btn}`}>← {t(lang, "Zurück", "Back")}</button>
            <h1 className="text-3xl font-black text-white">{t(lang, "📖 Regelwerk", "📖 Rules")}</h1>
          </div>
          <div className="space-y-4">
            {sections.map((s, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex items-center gap-3 mb-3"><span className="text-2xl">{s.icon}</span><h2 className="text-white font-black text-lg">{lang === "de" ? s.titleDe : s.titleEn}</h2></div>
                <p className="text-white/65 text-sm leading-relaxed whitespace-pre-line">{lang === "de" ? s.bodyDe : s.bodyEn}</p>
              </div>
            ))}
          </div>
          <div className="text-center py-6">
            <button onClick={() => setScreen("menu")} className={`px-8 py-3 font-black text-lg ${glass.btnPrimary}`}>{t(lang, "Zum Menü ⚔️", "To Menu ⚔️")}</button>
          </div>
          <div className="text-center pb-4"><span className="font-mono bg-white text-gray-900 px-2 py-0.5 rounded-lg font-black text-xs">v7.2</span></div>
        </div>
      </div>
    );
  }

  if (screen === "menu") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "#0a0a0f", backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(45,27,105,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,0,0,0.2) 0%, transparent 50%)" }}>
        <style>{`@keyframes glow{from{text-shadow:0 0 20px rgba(201,168,76,0.6),2px 2px 0 #000}to{text-shadow:0 0 50px rgba(201,168,76,1),0 0 100px rgba(201,168,76,0.4),2px 2px 0 #000}} @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
        <div className="text-center mb-8">
          <div className="text-6xl mb-2" style={{ animation: "bounce 2s ease-in-out infinite" }}>👑</div>
          <h1 className="font-black mb-2" style={{ fontFamily: "Georgia,serif", fontSize: "clamp(36px,8vw,80px)", color: "#c9a84c", textShadow: "0 0 30px rgba(201,168,76,0.8),2px 2px 0 #000", letterSpacing: 8, animation: "glow 3s ease-in-out infinite alternate" }}>COUP D'ÉTAT</h1>
          <p style={{ color: "#e8d5a3", letterSpacing: 5, fontSize: 14, opacity: 0.8, fontFamily: "Georgia,serif" }}>{t(lang, "Das Kooperative Kartenspiel", "The Cooperative Card Game")}</p>
        </div>
        <div className="relative w-full max-w-md space-y-5 p-8" style={{ background: "linear-gradient(135deg,rgba(26,26,46,0.95),rgba(22,33,62,0.95))", border: "2px solid #c9a84c", borderRadius: 16, boxShadow: "0 0 40px rgba(201,168,76,0.2)" }}>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setLang("de")} className={`px-4 py-2 rounded-xl font-bold text-sm ${lang === "de" ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>🇩🇪 Deutsch</button>
            <button onClick={() => setLang("en")} className={`px-4 py-2 rounded-xl font-bold text-sm ${lang === "en" ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>🇬🇧 English</button>
          </div>
          <div>
            <p className="text-xs mb-2 text-center tracking-widest uppercase text-white/50">{t(lang, "Kartenstil", "Card Style")}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.entries(CARD_THEMES).map(([key, th]) => (
                <button key={key} onClick={() => setTheme(key)} className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${theme === key ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>{lang === "de" ? th.name_de : th.name_en}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs mb-2 text-center tracking-widest uppercase text-white/50">{t(lang, "Layout", "Layout")}</p>
            <div className="flex gap-2 justify-center">
              {Object.entries(GAME_LAYOUTS).map(([key, lo]) => (
                <button key={key} onClick={() => setGameLayout(key)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${gameLayout === key ? "bg-white/90 text-gray-900 shadow-lg scale-105" : glass.btn}`}>
                  {key === "arena" ? "⚔️" : "📊"} {lang === "de" ? lo.name_de : lo.name_en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs mb-2 text-center tracking-widest uppercase text-white/50">{t(lang, "Anzahl Spieler", "Number of Players")}</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => setNumPlayers(n)} className={`w-12 h-12 rounded-xl font-black text-lg transition-all ${numPlayers === n ? "bg-white/90 text-gray-900 scale-110 shadow-lg" : glass.btn}`}>{n}</button>
              ))}
            </div>
            <p className="text-xs text-center mt-1 text-white/40">{t(lang, `Handgröße: ${getHandSize(numPlayers)} Karten`, `Hand size: ${getHandSize(numPlayers)} cards`)}</p>
          </div>
          <div>
            <p className="text-xs mb-2 text-center tracking-widest uppercase text-white/50">{t(lang, "Sound", "Sound")}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setSoundEnabled(false)} className={`px-4 py-2 rounded-xl font-bold text-sm ${!soundEnabled ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>🔇 {t(lang, "Aus", "Off")}</button>
              <button onClick={() => setSoundEnabled(true)} className={`px-4 py-2 rounded-xl font-bold text-sm ${soundEnabled ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>🔊 {t(lang, "An", "On")}</button>
            </div>
          </div>
          <button onClick={initGame} className={`w-full py-3 ${glass.btnPrimary}`}>{t(lang, "⚔️ Spiel Starten", "⚔️ Start Game")}</button>
          <button onClick={() => setScreen("rules")} className={`w-full py-2.5 ${glass.btn}`}>📖 {t(lang, "Regelwerk lesen", "Read Rules")}</button>
          <button onClick={() => setScreen("highscores")} className={`w-full py-2.5 ${glass.btn}`}>🏆 {t(lang, "Bestenliste", "Highscores")}</button>
            <button onClick={() => setScreen("achievements")} className={`w-full py-2.5 ${glass.btn}`}>🏅 {t(lang, "Erfolge", "Achievements")} <span className="text-purple-300 font-black">({unlockedAchievements.length}/{ACHIEVEMENTS.length})</span></button>
            {/* Daily Challenge Block */}
            <div className="w-full rounded-2xl p-4 space-y-3" style={{ background: "rgba(251,191,36,0.08)", border: "1.5px solid rgba(251,191,36,0.35)" }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{dailyChallenge.icon}</span>
                <div className="flex-1">
                  <p className="text-yellow-300 font-black text-sm">📅 {t(lang, "Tagesherausforderung", "Daily Challenge")} <span className="text-white/30 text-xs font-normal">({dailyChallenge.date})</span></p>
                  <p className="text-white font-bold text-xs">{lang === "de" ? dailyChallenge.title_de : dailyChallenge.title_en}</p>
                  <p className="text-white/50 text-xs">{lang === "de" ? dailyChallenge.desc_de : dailyChallenge.desc_en}</p>
                </div>
                {dailyCompleted && <span className="text-green-400 text-xl">✓</span>}
              </div>
              {dailyCompleted ? (
                <div className="text-center py-1">
                  <p className="text-green-400 font-black text-sm">🏆 {t(lang, "Heute geschafft!", "Completed today!")} ⏱ {formatTime(dailyCompleted.time)}</p>
                </div>
              ) : (
                <button onClick={initDailyGame} className="w-full py-2.5 font-black text-sm rounded-2xl" style={{ background: "rgba(251,191,36,0.2)", border: "1.5px solid rgba(251,191,36,0.5)", color: "#fbbf24" }}>⚡ {t(lang, "Jetzt spielen", "Play Now")}</button>
              )}
            </div>
        </div>
        <div className="text-center py-3"><span className="font-mono px-2 py-0.5 rounded-lg font-black text-xs bg-white text-gray-900">v7.2</span></div>
      </div>
    );
  }

  if (screen === "gameover" || screen === "victory") {
    const won = screen === "victory";
    const confettiColors = ["#fbbf24","#f87171","#34d399","#60a5fa","#a78bfa","#f472b6"];
    const particles = won ? Array.from({length:24},(_,i)=>i) : [];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: won ? "linear-gradient(135deg,#1a1000,#3d2800,#1a1000)" : "linear-gradient(135deg,#1a0000,#3d0000,#0a0a0a)" }}>
        <style>{`@keyframes confettiFall{0%{transform:translateY(-40px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
        {particles.map((i) => (
          <div key={i} className="absolute top-0 pointer-events-none" style={{ left: `${(i*37+7)%100}%`, width: 8+(i%4)*4, height: 8+(i%4)*4, background: confettiColors[i%confettiColors.length], borderRadius: i%3===0?"50%":"2px", opacity: 0.85, animation: `confettiFall ${2.5+(i%5)*0.4}s ${(i*0.17)%2}s ease-in infinite` }} />
        ))}
        <div className="text-center space-y-5 relative max-w-lg w-full z-10">
          <div className="text-8xl drop-shadow-2xl" style={{filter:won?"drop-shadow(0 0 32px #fbbf24)":undefined}}>{won?"👑":"💀"}</div>
          <h2 className="text-5xl font-black" style={{ color: won?"rgba(251,191,36,0.95)":"rgba(239,68,68,0.95)", textShadow: won?"0 0 40px rgba(251,191,36,0.5)":"0 0 40px rgba(239,68,68,0.4)" }}>
            {won ? t(lang,"SIEG!","VICTORY!") : t(lang,"NIEDERLAGE!","DEFEAT!")}
          </h2>
          <p className="text-white/60">{won ? t(lang,"Ihr habt alle Könige besiegt!","You defeated all kings!") : t(lang,"Das Königreich ist gefallen.","The kingdom has fallen.")}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {icon:"⚔️",labelDe:"Schaden",labelEn:"Damage",value:totalStats.damage,color:"#f87171"},
              {icon:"🃏",labelDe:"Karten",labelEn:"Cards",value:totalStats.cards,color:"#60a5fa"},
              {icon:"👑",labelDe:"Feinde",labelEn:"Enemies",value:totalStats.enemies,color:"#fbbf24"},
              {icon:"⏱",labelDe:"Zeit",labelEn:"Time",value:formatTime(elapsedSeconds),color:"#34d399"},
            ].map((s,i)=>(
              <div key={i} className="rounded-2xl p-4 text-center" style={{background:"rgba(255,255,255,0.07)",border:`1px solid ${s.color}33`}}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-3xl font-black" style={{color:s.color}}>{s.value}</div>
                <div className="text-white/40 text-xs mt-1">{lang==="de"?s.labelDe:s.labelEn}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setScreen("menu"); setGame(null); }} className={`px-6 py-2.5 font-bold ${glass.btn}`}>{t(lang,"Hauptmenü","Main Menu")}</button>
            <button onClick={initGame} className={`px-8 py-2.5 font-bold ${glass.btnPrimary}`}>{t(lang,"Nochmal spielen","Play Again")}</button>
          </div>
          <div className="text-center"><span className="font-mono bg-white text-gray-900 px-2 py-0.5 rounded-lg font-black text-xs">v7.2</span></div>
        </div>
      </div>
    );
  }

  if (screen === "achievements") {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setScreen("menu")} className={`px-4 py-2 font-bold text-sm ${glass.btn}`}>← {t(lang, "Zurück", "Back")}</button>
            <h1 className="text-3xl font-black text-white">🏅 {t(lang, "Erfolge", "Achievements")} <span className="text-purple-300">({unlockedAchievements.length}/{ACHIEVEMENTS.length})</span></h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedAchievements.includes(a.id);
              return (
                <div key={a.id} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: unlocked ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.04)", border: unlocked ? "1.5px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.08)", opacity: unlocked ? 1 : 0.5 }}>
                  <span className="text-3xl">{unlocked ? a.icon : "🔒"}</span>
                  <div>
                    <p className="text-white font-black text-sm">{lang === "de" ? a.title_de : a.title_en}</p>
                    <p className="text-white/50 text-xs mt-0.5">{lang === "de" ? a.desc_de : a.desc_en}</p>
                    {unlocked && <p className="text-purple-300 text-xs font-bold mt-1">✓ {t(lang, "Freigeschaltet", "Unlocked")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center py-6">
            <button onClick={() => setScreen("menu")} className={`px-8 py-3 font-black text-lg ${glass.btnPrimary}`}>{t(lang, "Zum Menü", "To Menu")}</button>
          </div>
          <div className="text-center pb-4"><span className="font-mono bg-white text-gray-900 px-2 py-0.5 rounded-lg font-black text-xs">v7.2</span></div>
        </div>
      </div>
    );
  }

  if (screen !== "game" || !game) return null;

  const currentPlayer = game.players[game.currentPlayerIndex];
  const selectedCardObjs = selectedCards.map((id) => currentPlayer.hand.find((c) => c.id === id)).filter(Boolean);
  const attackValue = calcAttack(selectedCardObjs, game.currentEnemy);
  const prevDamageDisplay = game.tableCards.reduce((s, c) => s + (c._dealtDamage || 0), 0);
  const totalDamageDisplay = prevDamageDisplay + attackValue;
  const enemyRemainingHp = game.currentEnemy.currentHp;
  const themeConfig = CARD_THEMES[theme] || CARD_THEMES.fantasy;
  const bgStyle = { background: themeConfig.bg };
  const accentGlow = themeConfig.accent;

  const ComboPreview = () => {
    if (phase !== "play" || selectedCards.length < 1) return null;
    const cards = selectedCardObjs;
    if (cards.length === 0) return null;
    const isValid = (() => {
      if (cards.some(c => c.type === "jester")) return cards.length === 1;
      const animals = cards.filter(c => c.rank === "A");
      if (animals.length > 0) return cards.length === 2;
      const ranks = [...new Set(cards.map(c => c.rank))];
      if (ranks.length > 1) return false;
      return cards.reduce((s, c) => s + getCardValue(c), 0) <= 10;
    })();
    const base = calcBaseAttack(cards);
    const atk = calcAttack(cards, game.currentEnemy);
    const suits = [...new Set(cards.filter(c=>c.type!=="jester").map(c=>c.suit))];
    const totalAfter = prevDamageDisplay + atk;
    const willKill = totalAfter >= game.currentEnemy.currentHp;
    const enemy = game.currentEnemy;
    const powers = suits.map(suit => {
      const immune = enemy.suit === suit && !enemy.jesterCancelled;
      if (suit === "♥") return { label: t(lang,`♥ Heilt ${base}`,`♥ Heal ${base}`), color:"#34d399", blocked: immune };
      if (suit === "♦") return { label: t(lang,`♦ Zieht ${base}`,`♦ Draw ${base}`), color:"#60a5fa", blocked: immune };
      if (suit === "♣") return { label: t(lang,`♣ Verdoppelt→${atk}`,`♣ Double→${atk}`), color:"#c084fc", blocked: immune };
      if (suit === "♠") return { label: t(lang,`♠ Schild -${base}`,`♠ Shield -${base}`), color:"#a78bfa", blocked: immune };
      return null;
    }).filter(Boolean);
    return (
      <div className="px-3 py-2 rounded-xl text-xs font-bold flex flex-col gap-1.5" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={isValid?"text-emerald-400":"text-red-400"}>{isValid?"✅":"❌"}</span>
          <span className="text-white/80">{cards.length} {t(lang,"Karte(n)","card(s)")} · <span className="font-black">⚔️ {atk}</span></span>
          {willKill && <span className="text-emerald-300 font-black animate-pulse">💀 {t(lang,"Tötet!","Kills!")}</span>}
          {!willKill && <span className="text-white/40">{t(lang,`Gesamt: ${totalAfter}/${game.currentEnemy.currentHp}`,`Total: ${totalAfter}/${game.currentEnemy.currentHp}`)}</span>}
        </div>
        {powers.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {powers.map((p,i) => (
              <span key={i} className={`px-2 py-0.5 rounded-lg ${p.blocked?"line-through opacity-40":""}`} style={{background:p.color+"22",color:p.color,border:`1px solid ${p.color}44`}}>{p.label}{p.blocked?" 🛡":""}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ActionBar = () => (
    <div className="p-2 md:p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(24px)",border:"1px solid rgba(255,255,255,0.15)"}}>
      <div className="flex items-center gap-2 flex-wrap">
        {phase === "jester" && (
          <div className="flex-1 px-3 py-2 rounded-xl" style={{background:"rgba(168,85,247,0.2)",border:"1px solid rgba(168,85,247,0.4)"}}>
            <p className="text-purple-200 font-bold text-sm">🃏 {t(lang,"Jester! Wähle nächsten Spieler:","Jester! Choose next player:")}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {game.players.map((_, pi) => (
                <button key={pi} onClick={() => chooseNextPlayer(pi)} className={`px-3 py-1 text-white/90 text-sm font-bold rounded-lg ${glass.btnPurple}`}>{t(lang,`Spieler ${pi+1}`,`Player ${pi+1}`)}</button>
              ))}
            </div>
          </div>
        )}
        {phase === "discard" && (
          <div className="flex-1 px-3 py-2 rounded-xl" style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)"}}>
            <p className="text-red-300 font-bold text-sm">⚠️ {t(lang,"Schaden abdecken!","Cover damage!")}</p>
            <p className="text-white/70 text-xs">{t(lang,`Noch ${Math.ceil(discardNeeded)} zu decken`,`Still ${Math.ceil(discardNeeded)} to cover`)}</p>
          </div>
        )}
        {phase === "play" && selectedCards.length > 0 && (
          <div className="text-sm text-white/70">
            {selectedCards.length} {t(lang,"Karte(n)","card(s)")} · <span className="text-white font-bold">⚔️ {attackValue}</span>
            {totalDamageDisplay >= enemyRemainingHp && <span className="ml-2 text-emerald-300 text-xs font-bold">✓ {t(lang,"Reicht!","Enough!")}</span>}
          </div>
        )}
        <div className="flex gap-2 ml-auto flex-wrap">
          {phase === "play" && aiEnabled && (() => {
            const sug = getAiSuggestion();
            return sug ? (
              <button onClick={applyAiSuggestion} className={`px-3 py-2 text-sm font-bold ${glass.btnPurple}`}>
                🤖 {t(lang,`KI: ⚔️${sug.atk}${sug.kills?" ☠️":""}`,`AI: ⚔️${sug.atk}${sug.kills?" ☠️":""}`)}
              </button>
            ) : null;
          })()}
          {phase === "play" && selectedCards.length > 0 && (
            <button onClick={() => setSelectedCards([])} className={`px-3 py-2 text-white/80 text-sm ${glass.btn}`}>{t(lang,"Abwählen","Deselect")}</button>
          )}
          {numPlayers === 1 && soloJestersAvail > 0 && phase === "play" && (
            <button onClick={() => soloFlipJester("step1")} className={`px-3 py-2 text-sm font-bold ${glass.btnPurple}`}>🃏 {t(lang,`Jester (${soloJestersAvail}x)`,`Jester (${soloJestersAvail}x)`)}</button>
          )}
          {numPlayers === 1 && soloJestersAvail > 0 && phase === "discard" && (
            <button onClick={() => soloFlipJester("step4")} className={`px-3 py-2 text-sm font-bold ${glass.btnPurple}`}>🃏 {t(lang,`Jester tauschen (${soloJestersAvail}x)`,`Jester swap (${soloJestersAvail}x)`)}</button>
          )}
          {phase === "play" && (
            <>
              <button onClick={yieldTurn} className={`px-4 py-2 font-bold text-sm ${glass.btn}`}>{t(lang,"Passen","Yield")} <kbd className="opacity-40 text-xs ml-1">Y</kbd></button>
              <button onClick={playCards} disabled={selectedCards.length === 0} className={`px-6 py-2 font-bold text-sm rounded-xl transition-all ${selectedCards.length > 0 ? glass.btnPrimary : "opacity-30 cursor-not-allowed bg-white/10 text-white/30 border border-white/10 rounded-xl"}`}>
                ⚔️ {t(lang,"Spielen","Play")}
              </button>
            </>
          )}
          {phase === "discard" && <span className="text-red-300 text-sm font-bold animate-pulse">👆 {t(lang,"Karte anklicken","Click a card")}</span>}
        </div>
      </div>
    </div>
  );

  const sortHand = (hand) => {
    const order = { "\u2665": 0, "\u2666": 1, "\u2663": 2, "\u2660": 3 };
    const copy = [...hand];
    if (handSort === "value") return copy.sort((a, b) => getCardValue(b) - getCardValue(a));
    if (handSort === "suit") return copy.sort((a, b) => (order[a.suit] ?? 4) - (order[b.suit] ?? 4) || getCardValue(b) - getCardValue(a));
    if (handSort === "attack") return copy.sort((a, b) => b.attack - a.attack);
    return copy;
  };

  const SortBar = () => (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-white/30 text-xs font-bold tracking-widest uppercase">{t(lang, "Sort:", "Sort:")}</span>
      {[
        { key: "default", label: t(lang, "Standard", "Default"), icon: "\uD83D\uDD22" },
        { key: "value",   label: t(lang, "Wert", "Value"),       icon: "\u2B06\uFE0F" },
        { key: "suit",    label: t(lang, "Farbe", "Suit"),       icon: "\u2660" },
        { key: "attack",  label: t(lang, "Angriff", "Attack"),   icon: "\u2694\uFE0F" },
      ].map(({ key, label, icon }) => (
        <button key={key} onClick={() => setHandSort(key)}
          className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
            handSort === key ? "bg-white/90 text-gray-900" : "bg-white/10 text-white/50 border border-white/20 hover:bg-white/20"
          }`}>
          {icon} {label}
        </button>
      ))}
    </div>
  );

  const PlayerHand = ({ player, pi, small }) => {
    const handNewCardIds = newCardIds;
    const isActive = pi === game.currentPlayerIndex;
    const isDiscardTarget = phase === "discard" && isActive;
    const suggestedIds = isDiscardTarget ? getAutoDiscardSuggestion(player.hand, discardNeeded) : [];
    return (
      <div className="rounded-xl p-2 md:p-3 transition-all" style={{ background: isDiscardTarget ? "rgba(139,0,0,0.2)" : isActive ? "linear-gradient(135deg,rgba(13,40,74,0.3),rgba(26,26,46,0.8))" : "rgba(26,26,46,0.5)", border: isDiscardTarget ? "2px solid #cc2200" : isActive ? "2px solid #1a4a8a" : "1px solid rgba(201,168,76,0.15)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive?"bg-white/90 text-gray-900":"bg-white/15 text-white"}`}>{pi+1}</span>
            <span className={`font-bold text-sm ${isActive?"text-white":"text-white/50"}`}>{player.name} {isActive?`(${t(lang,"am Zug","active")})`:""}</span>
          </div>
          <span className="text-white/40 text-xs">{player.hand.length} {t(lang,"Karten","cards")}</span>
          {isDiscardTarget && <span className="text-red-300 text-xs font-black animate-pulse">⚠️ {t(lang,"Abwerfen!","Discard!")}</span>}
        </div>
        {isActive && <div className="mb-1.5"><SortBar /></div>}
        <div className={`flex gap-1.5 py-3 ${isActive?"overflow-x-auto flex-nowrap":"flex-wrap"}`}>
          {sortHand(player.hand).map((card) => (
            <PlayingCard key={card.id} card={card} lang={lang} isNew={handNewCardIds.has(card.id)}
              selected={selectedCards.includes(card.id) || (isDiscardTarget && suggestedIds.includes(card.id))}
              onClick={() => { if (phase==="discard"&&isActive) discardCardForDamage(card.id); else if (phase==="play"&&isActive) toggleCardSelection(card.id); }}
              disabled={!isActive||(phase!=="play"&&phase!=="discard")}
              small={small!==undefined?small:!isActive} />
          ))}
          {player.hand.length===0 && <span className="text-white/30 text-sm italic">{t(lang,"Keine Karten","No cards")}</span>}
        </div>
      </div>
    );
  };

  // ── SHARED OVERLAYS (Pause + AnimMsg + Floating Numbers) ─────────────────
  const SharedOverlays = () => (
    <>
      <style>{`@keyframes logSlideIn{0%{opacity:0;transform:translateX(-8px) scale(0.97)}100%{opacity:1;transform:translateX(0) scale(1)}}`}</style>
      {floatingNums.map(f => (
        <div key={f.id} className={`fixed pointer-events-none select-none font-black z-50 ${f.size}`}
          style={{ color: f.color, left: `${f.x}%`, top: "30%", animation: "floatUp 1.4s ease-out forwards", textShadow: `0 0 16px ${f.color}` }}>
          {f.text}
        </div>
      ))}
      {roundBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl text-center cursor-pointer"
          onClick={() => setRoundBanner(null)}
          style={{ background: "rgba(20,10,40,0.92)", backdropFilter: "blur(24px)", border: "1.5px solid rgba(251,191,36,0.5)", boxShadow: "0 0 40px rgba(251,191,36,0.25)", animation: "slideDown 0.4s ease-out" }}>
          <style>{`@keyframes slideDown{0%{opacity:0;transform:translateX(-50%) translateY(-20px)}100%{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
          <p className="text-yellow-300 font-black text-lg mb-2">👑 {roundBanner.enemy} {lang==="de"?"besiegt!":"defeated!"}</p>
          <div className="flex gap-4 justify-center">
            <div className="text-center"><div className="text-white font-black text-xl">{roundBanner.damage}</div><div className="text-white/40 text-xs">{lang==="de"?"Schaden":"Damage"}</div></div>
            <div className="text-center"><div className="text-white font-black text-xl">{roundBanner.cards}</div><div className="text-white/40 text-xs">{lang==="de"?"Karten":"Cards"}</div></div>
            <div className="text-center"><div className="text-white font-black text-xl">{roundBanner.time}</div><div className="text-white/40 text-xs">{lang==="de"?"Zeit":"Time"}</div></div>
          </div>
          <p className="text-white/30 text-xs mt-2">{lang==="de"?"Tippen zum Schließen":"Tap to close"}</p>
        </div>
      )}
      {animMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl font-black text-xl text-white shadow-2xl animate-bounce text-center"
          style={{ background: animMsg.includes("BESIEGT")||animMsg.includes("DEFEATED") ? "rgba(120,80,0,0.95)" : "rgba(30,0,60,0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          {animMsg}
        </div>
      )}
      {paused && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.8)",backdropFilter:"blur(16px)"}} onClick={(e)=>{if(e.target===e.currentTarget)setPaused(false);}}>
          <div className="w-full max-w-md rounded-3xl p-6 space-y-4" style={{background:"rgba(15,12,41,0.92)",border:"1.5px solid rgba(255,255,255,0.22)",boxShadow:"0 32px 80px rgba(0,0,0,0.7)"}}>
            <div className="text-center">
              <div className="text-4xl mb-1">⏸</div>
              <h2 className="text-2xl font-black text-white">{t(lang,"Pause","Paused")}</h2>
              <p className="text-white/40 text-xs mt-1">{t(lang,"Klicke außerhalb oder P zum Fortfahren","Click outside or P to resume")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {icon:"⚔️",labelDe:"Schaden",labelEn:"Damage",value:roundStats.damage,color:"#f87171"},
                {icon:"👑",labelDe:"Feinde",labelEn:"Enemies",value:totalStats.enemies,color:"#fbbf24"},
                {icon:"🃏",labelDe:"Karten",labelEn:"Cards",value:totalStats.cards,color:"#60a5fa"},
                {icon:"⏱",labelDe:"Zeit",labelEn:"Time",value:formatTime(elapsedSeconds),color:"#34d399"},
                {icon:"🗂",labelDe:"Stapel",labelEn:"Deck",value:game.drawPile.length,color:"#a78bfa"},
                {icon:"🗑",labelDe:"Ablage",labelEn:"Discard",value:game.discardPile.length,color:"#fb923c"},
              ].map((s,i)=>(
                <div key={i} className="rounded-xl p-3 flex items-center gap-3" style={{background:"rgba(255,255,255,0.07)",border:`1px solid ${s.color}33`}}>
                  <span className="text-xl">{s.icon}</span>
                  <div><div className="font-black text-lg leading-none" style={{color:s.color}}>{s.value}</div><div className="text-white/75 text-xs mt-0.5">{lang==="de"?s.labelDe:s.labelEn}</div></div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">🤖 KI</span>
              <div className="flex gap-2">
                <button onClick={()=>setAiEnabled(false)} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${!aiEnabled?"bg-white text-gray-900":"bg-white/10 text-white/50 border border-white/20"}`}>{t(lang,"Aus","Off")}</button>
                <button onClick={()=>setAiEnabled(true)} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${aiEnabled?"bg-purple-500 text-white":"bg-white/10 text-white/50 border border-white/20"}`}>🤖 {t(lang,"An","On")}</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/85 text-sm font-semibold">🔊 {t(lang,"Sound","Sound")}</span>
              <div className="flex gap-2">
                <button onClick={()=>setSoundEnabled(false)} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${!soundEnabled?"bg-white/90 text-gray-900":glass.btn}`}>🔇 {t(lang,"Aus","Off")}</button>
                <button onClick={()=>setSoundEnabled(true)} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${soundEnabled?"bg-white/90 text-gray-900":glass.btn}`}>🔊 {t(lang,"An","On")}</button>
              </div>
            </div>
            <div className="rounded-xl px-4 py-3 space-y-1.5" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)"}}>
              <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-2">Shortcuts</p>
              {[["1–8",t(lang,"Karte wählen","Select card")],["↵",t(lang,"Spielen","Play")],["Y",t(lang,"Passen","Yield")],["Esc",t(lang,"Abwählen","Deselect")],["P",t(lang,"Pause","Pause")]].map(([key,desc],i)=>(
                <div key={i} className="flex items-center justify-between">
                  <kbd className="text-white font-mono text-xs bg-white/20 border border-white/30 px-2 py-0.5 rounded">{key}</kbd>
                  <span className="text-white/40 text-xs">{desc}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={()=>{setPaused(false);setScreen("menu");setGame(null);}} className={`flex-1 py-2.5 font-bold text-sm ${glass.btnDanger}`}>🏠 {t(lang,"Aufgeben","Quit")}</button>
              <button onClick={()=>setPaused(false)} className={`flex-1 py-2.5 font-black ${glass.btnPrimary}`}>▶ {t(lang,"Weiter","Resume")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── DASHBOARD LAYOUT ──────────────────────────────────────────────────────
  if (gameLayout === "dashboard") {
    return (
      <div className="min-h-screen p-2 md:p-3 relative overflow-hidden" style={bgStyle}>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{background:`radial-gradient(ellipse at 20% 20%, ${accentGlow}22 0%, transparent 50%)`}} />
        <SharedOverlays />
        <div style={{display:"grid",gridTemplateColumns:"260px 1fr 240px",gap:"10px",height:"calc(100vh - 24px)",maxWidth:1400,margin:"0 auto"}}>

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-2 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-1">
              <button onClick={()=>{setScreen("menu");setGame(null);}} className={`px-2 py-1.5 text-xs font-bold ${glass.btn}`}>← {t(lang,"Menü","Menu")}</button>
              <button onClick={()=>setPaused(true)} className={`px-2 py-1.5 text-xs font-bold ${glass.btn}`}>⏸</button>
              <button onClick={()=>setGameLayout("arena")} className={`px-2 py-1.5 text-xs font-bold ${glass.btn}`}>⚔️ Arena</button>
            </div>
            {/* Enemy mini card */}
            <div className="rounded-2xl p-3" style={{background:"rgba(220,50,50,0.12)",border:"1.5px solid rgba(255,120,120,0.3)"}}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{game.currentEnemy.rank}</span>
                <span className={`text-xl ${game.currentEnemy.suit==="♥"||game.currentEnemy.suit==="♦"?"text-red-400":"text-white"}`}>{game.currentEnemy.suit}</span>
                <div className="flex-1">
                  <p className="text-white font-black text-sm">{lang==="de"?(game.currentEnemy.rank==="J"?"Bube":game.currentEnemy.rank==="Q"?"Dame":"König"):(game.currentEnemy.rank==="J"?"Jack":game.currentEnemy.rank==="Q"?"Queen":"King")}</p>
                  <p className="text-red-300 text-xs">⚔️ {game.currentEnemy.attack}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-sm">{game.currentEnemy.currentHp}</p>
                  <p className="text-white/40 text-xs">/ {game.currentEnemy.hp} HP</p>
                </div>
              </div>
              <div className="w-full rounded-full h-2" style={{background:"rgba(255,255,255,0.08)"}}>
                <div className="h-2 rounded-full transition-all duration-500" style={{width:`${Math.max(0,(game.currentEnemy.currentHp/game.currentEnemy.hp)*100)}%`,background:game.currentEnemy.currentHp/game.currentEnemy.hp>0.6?"#4ade80":game.currentEnemy.currentHp/game.currentEnemy.hp>0.3?"#facc15":"#f87171"}} />
              </div>
              {game.currentEnemy.jesterCancelled && <p className="text-xs text-purple-300/80 font-bold mt-1">🃏 {t(lang,"Immunität aufgehoben","Immunity cancelled")}</p>}
              {game.tableCards.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center mt-2">
                  <span className="text-white/50 text-xs">{t(lang,"Tisch:","Table:")}</span>
                  {game.tableCards.map((c,i)=>(
                    <span key={i} className={`text-xs px-1 py-0.5 rounded font-bold ${c.suit==="♥"||c.suit==="♦"?"text-red-300 bg-red-900/30":"text-white/80 bg-white/10"}`}>{c.rank}{c.suit}</span>
                  ))}
                </div>
              )}
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {icon:"⚔️",label:t(lang,"Schaden","Damage"),value:roundStats.damage,color:"#f87171"},
                {icon:"👑",label:t(lang,"Feinde","Enemies"),value:totalStats.enemies,color:"#fbbf24"},
                {icon:"🗂",label:t(lang,"Stapel","Deck"),value:game.drawPile.length,color:"#a78bfa"},
                {icon:"🗑",label:t(lang,"Ablage","Discard"),value:game.discardPile.length,color:"#fb923c"},
              ].map((s,i)=>(
                <div key={i} className="rounded-xl p-2 text-center" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${s.color}33`}}>
                  <div className="text-base">{s.icon}</div>
                  <div className="font-black text-base leading-none mt-0.5" style={{color:s.color}}>{s.value}</div>
                  <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Log */}
            <div className="flex-1 rounded-2xl p-2 overflow-y-auto min-h-0" style={{background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <p className="text-white/30 text-xs mb-1 font-bold tracking-widest uppercase">{t(lang,"Log","Log")}</p>
              {log.map((entry,i)=>{
                const isAttack=entry.includes("⚔️")||entry.includes("👿");
                const isHeal=entry.includes("♥");
                const isDraw=entry.includes("♦");
                const isDefeat=entry.includes("besiegt")||entry.includes("defeated");
                const isDiscard=entry.includes("🗑");
                const color=isDefeat?"text-yellow-300":isAttack?"text-red-300":isHeal?"text-emerald-300":isDraw?"text-blue-300":isDiscard?"text-orange-300":"text-white/60";
                return (
                  <p key={i} className={`text-xs leading-tight ${color} ${i===0?"font-bold":""}`}
                    style={i===newLogIdx?{animation:"logSlideIn 0.35s ease-out",background:"rgba(255,255,255,0.07)",borderRadius:4,paddingLeft:4}:{}}>
                    {entry}
                  </p>
                );
              })}
            </div>
          </div>

          {/* CENTER COLUMN */}
          <div className="flex flex-col gap-2 overflow-hidden min-w-0">
            <PlayerTurnBanner game={game} lang={lang} phase={phase} numPlayers={numPlayers} lastYielded={lastYielded} />
            <ActionBar />
            <ComboPreview />
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {game.players.map((player,pi)=>(
                <PlayerHand key={pi} player={player} pi={pi} />
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-2 overflow-hidden">
            {/* Timer + version */}
            <div className="rounded-xl px-3 py-2 flex items-center justify-between" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
              <span className="text-white/50 text-xs">⏱ {formatTime(elapsedSeconds)}</span>
              <span className="font-mono bg-white text-gray-900 px-1.5 py-0.5 rounded font-black text-xs">v7.2</span>
              <button onClick={()=>setGameLayout("arena")} className={`px-2 py-1 text-xs font-bold ${glass.btn}`}>⚔️</button>
            </div>
            {/* Enemy queue */}
            <div className="rounded-2xl p-2" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
              <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">{t(lang,"Feind-Warteschlange","Enemy Queue")} ({game.enemyDeck.length+1})</p>
              <div className="space-y-1">
                {[game.currentEnemy, ...game.enemyDeck.slice(0,5)].map((e,i)=>{
                  const isRed2=e.suit==="♥"||e.suit==="♦";
                  const hpPct2=Math.max(0,Math.min(100,(e.currentHp/e.hp)*100));
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{background:i===0?"rgba(220,50,50,0.2)":"rgba(255,255,255,0.04)",border:i===0?"1px solid rgba(255,100,100,0.4)":"1px solid rgba(255,255,255,0.06)"}}>
                      <span className={`text-sm font-black ${isRed2?"text-red-300":"text-white"}`}>{e.rank}{e.suit}</span>
                      <div className="flex-1">
                        <div className="w-full rounded-full h-1" style={{background:"rgba(255,255,255,0.08)"}}>
                          <div className="h-1 rounded-full" style={{width:`${hpPct2}%`,background:hpPct2>60?"#4ade80":hpPct2>30?"#facc15":"#f87171"}} />
                        </div>
                      </div>
                      <span className="text-white/50 text-xs">{e.currentHp||e.hp}HP</span>
                      {i===0 && <span className="text-red-300 text-xs">▶</span>}
                    </div>
                  );
                })}
                {game.enemyDeck.length > 5 && <p className="text-white/30 text-xs text-center">+{game.enemyDeck.length-5} {t(lang,"weitere","more")}</p>}
              </div>
            </div>
            {/* Suit powers reference */}
            <div className="rounded-2xl p-2" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
              <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">{t(lang,"Farb-Kräfte","Suit Powers")}</p>
              {Object.entries(lang==="de"?SUIT_POWERS_DE:SUIT_POWERS_EN).map(([suit,desc])=>{
                const immune=game.currentEnemy.suit===suit&&!game.currentEnemy.jesterCancelled;
                const sColor=suit==="♥"?"#f87171":suit==="♦"?"#fb923c":suit==="♣"?"#a78bfa":"#60a5fa";
                return (
                  <div key={suit} className={`flex items-start gap-2 py-1 ${immune?"opacity-40":""}`}>
                    <span className="text-sm font-black" style={{color:sColor}}>{suit}</span>
                    <span className="text-white/60 text-xs leading-tight flex-1">{desc}{immune?` 🛡 ${t(lang,"immun","immune")}`:""}</span>
                  </div>
                );
              })}
            </div>
            {/* KI toggle */}
            <div className="rounded-xl px-3 py-2 flex items-center justify-between" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
              <span className="text-white/60 text-xs font-bold">🤖 KI</span>
              <div className="flex gap-1">
                <button onClick={()=>setAiEnabled(false)} className={`px-2 py-1 text-xs font-bold rounded-lg ${!aiEnabled?"bg-white/90 text-gray-900":"bg-white/10 text-white/50"}`}>{t(lang,"Aus","Off")}</button>
                <button onClick={()=>setAiEnabled(true)} className={`px-2 py-1 text-xs font-bold rounded-lg ${aiEnabled?"bg-purple-500 text-white":"bg-white/10 text-white/50"}`}>{t(lang,"An","On")}</button>
              </div>
            </div>
            {numPlayers===1&&soloJestersAvail>0&&(
              <div className="rounded-xl px-3 py-2 flex items-center justify-between" style={{background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.3)"}}>
                <span className="text-purple-300 text-xs font-bold">🃏 Jester</span>
                <span className="text-purple-200 font-black">{soloJestersAvail}x</span>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ── ARENA LAYOUT ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-2 md:p-4 relative overflow-hidden" style={bgStyle}>
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{background:`radial-gradient(circle, ${accentGlow}, transparent 70%)`}} />
      <div className="absolute bottom-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none" style={{background:`radial-gradient(circle, ${accentGlow}, transparent 70%)`}} />
      <SharedOverlays />
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-1.5">
            <button onClick={()=>{setScreen("menu");setGame(null);}} className={`px-2.5 py-1.5 text-sm font-bold ${glass.btn}`}>← {t(lang,"Menü","Menu")}</button>
            <button onClick={()=>setPaused(true)} className={`px-2.5 py-1.5 text-sm font-bold ${glass.btn}`}>⏸</button>
          </div>
          <div className="flex items-end gap-3">
            <DeckVisual count={game.drawPile.length} color="#a78bfa" label={t(lang,"Stapel","Deck")} />
            <DeckVisual count={game.discardPile.length} color="#fb923c" label={t(lang,"Ablage","Disc.")} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">👑</span>
              <span className="font-black text-xs" style={{color:"#a78bfa"}}>{game.enemyDeck.length+1}</span>
              <span className="opacity-50" style={{color:"#a78bfa",fontSize:9}}>{t(lang,"Feinde","Foes")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs font-mono">⏱ {formatTime(elapsedSeconds)}</span>
            <button onClick={()=>setGameLayout("dashboard")} className={`px-2.5 py-1.5 text-sm font-bold ${glass.btn}`} title="Dashboard">📊</button>
            <button onClick={()=>setAiEnabled(v=>!v)} className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${aiEnabled?"bg-purple-500/30 border border-purple-400/50 text-purple-200":"bg-white/10 border border-white/20 text-white/40"}`}>
              🤖 {aiEnabled?t(lang,"An","On"):t(lang,"Aus","Off")}
            </button>
          </div>
        </div>
        {/* Last round stats */}
        {lastRoundStats && (
          <div className="flex items-center gap-4 px-3 py-2 rounded-xl flex-wrap" style={{background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.25)"}}>
            <span className="text-yellow-300 font-black text-xs tracking-widest uppercase">{t(lang,"Letzte Runde","Last Round")}:</span>
            <span className="text-white/70 text-xs">⚔️ {lastRoundStats.damage}</span>
            <span className="text-white/70 text-xs">🃏 {lastRoundStats.cards}</span>
            <button onClick={()=>setLastRoundStats(null)} className="ml-auto text-white/30 hover:text-white/60 text-xs">×</button>
          </div>
        )}
        <EnemyCard enemy={game.currentEnemy} lang={lang} tableCards={game.tableCards} shaking={enemyShaking} dying={enemyDying} damageByPlayer={game.damageByPlayer || {}} players={game.players} />
        <ActionBar />
        <ComboPreview />
        <PlayerTurnBanner game={game} lang={lang} phase={phase} numPlayers={numPlayers} lastYielded={lastYielded} />
        <div className="space-y-2">
          {game.players.map((player,pi)=>(
            <PlayerHand key={pi} player={player} pi={pi} />
          ))}
        </div>
        {/* Log */}
        <div className="rounded-2xl p-3 max-h-32 overflow-y-auto" style={{background:"rgba(0,0,0,0.25)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)"}}>
          <p className="text-white/30 text-xs mb-1 font-bold tracking-widest uppercase">{t(lang,"Log","Log")}</p>
          {log.map((entry,i)=>{
            const isAttack=entry.includes("⚔️")||entry.includes("👿");
            const isHeal=entry.includes("♥");
            const isDraw=entry.includes("♦");
            const isDefeat=entry.includes("besiegt")||entry.includes("defeated");
            const isDiscard=entry.includes("🗑");
            const color=isDefeat?"text-yellow-300":isAttack?"text-red-300":isHeal?"text-emerald-300":isDraw?"text-blue-300":isDiscard?"text-orange-300":"text-white/60";
            return (
              <p key={i} className={`text-xs leading-tight ${color} ${i===0?"font-bold":"opacity-70"}`}
                style={i===newLogIdx?{animation:"logSlideIn 0.35s ease-out",background:"rgba(255,255,255,0.07)",borderRadius:4,paddingLeft:4}:{}}>
                {entry}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
