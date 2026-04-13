import { useState, useRef, useEffect } from "react";

const SUITS = ["♥", "♦", "♣", "♠"];
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
  { id: "first_blood",  icon: "⚔️", title_de: "Erster Angriff",    title_en: "First Blood",     desc_de: "Erste Karte gespielt",             desc_en: "Played your first card",           check: (s) => s.totalCards >= 1 },
  { id: "slayer",       icon: "💀", title_de: "Königsmörder",      title_en: "Regicide (Achievement)",        desc_de: "Ersten Feind besiegt",             desc_en: "Defeated your first enemy",        check: (s) => s.totalEnemies >= 1 },
  { id: "all_royals",   icon: "👑", title_de: "Alle Royals",       title_en: "All Royals",      desc_de: "Alle 12 Feinde besiegt",           desc_en: "Defeated all 12 enemies",          check: (s) => s.totalEnemies >= 12 },
  { id: "centurion",    icon: "💯", title_de: "Centurion",         title_en: "Centurion",       desc_de: "100 Gesamtschaden verursacht",      desc_en: "Dealt 100 total damage",           check: (s) => s.totalDamage >= 100 },
  { id: "combo_master", icon: "🔥", title_de: "Kombo-Meister",     title_en: "Combo Master",    desc_de: "10 Karten in einer Runde gespielt", desc_en: "Played 10 cards in one round",     check: (s) => s.maxCardsInRound >= 10 },
  { id: "speedrun",     icon: "⚡", title_de: "Blitzsieger",       title_en: "Speedrun",        desc_de: "Sieg in unter 3 Minuten",          desc_en: "Won in under 3 minutes",           check: (s) => s.wonInSeconds > 0 && s.wonInSeconds < 180 },
  { id: "pacifist",     icon: "🕊️", title_de: "Pazifist",         title_en: "Pacifist",        desc_de: "Feind mit genau 0 HP besiegt",     desc_en: "Defeated enemy with exactly 0 HP", check: (s) => s.exactKills >= 1 },
  { id: "no_jester",    icon: "🃏", title_de: "Kein Joker",        title_en: "No Joker",        desc_de: "Solo-Sieg ohne Jester",            desc_en: "Won solo without Jester",          check: (s) => s.soloWinNoJester },
  { id: "big_hit",      icon: "💥", title_de: "Megaschlag",        title_en: "Big Hit",         desc_de: "30+ Schaden in einem Angriff",     desc_en: "30+ damage in one attack",         check: (s) => s.maxSingleHit >= 30 },
  { id: "survivor",     icon: "🛡️", title_de: "Überlebender",      title_en: "Survivor",        desc_de: "Sieg mit nur 1 Karte auf der Hand", desc_en: "Won with only 1 card in hand",     check: (s) => s.wonWith1Card },
];

function getDailyChallenge() {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const rng = (n) => { let s = seed * 16807 % 2147483647; for (let i = 0; i < n; i++) s = s * 16807 % 2147483647; return s; };
  const mods = [
    { id: "double_attack", icon: "🔥", title_de: "Doppelter Feind-Angriff", title_en: "Double Enemy Attack", desc_de: "Alle Feinde greifen mit 2x Schaden an", desc_en: "All enemies deal 2x damage",    apply: (e) => ({ ...e, attack: e.attack * 2 }) },
    { id: "half_hand",     icon: "✂️", title_de: "Halbe Hand",             title_en: "Half Hand",           desc_de: "Starthand nur halb so groß",           desc_en: "Starting hand is half size",   apply: null },
    { id: "no_clubs",      icon: "♾️", title_de: "Kein Kreuz",            title_en: "No Clubs",            desc_de: "Kreuz-Karten zählen nicht doppelt",    desc_en: "Clubs don't double damage",    apply: null },
    { id: "iron_king",     icon: "🛡️", title_de: "Eisenkönig",           title_en: "Iron King",           desc_de: "Könige haben +20 HP",                  desc_en: "Kings have +20 HP",            apply: (e) => e.rank === "K" ? { ...e, hp: e.hp + 20, currentHp: e.currentHp + 20 } : e },
    { id: "fragile_jacks", icon: "💨", title_de: "Schwache Buben",        title_en: "Fragile Jacks",       desc_de: "Buben haben nur 10 HP",                desc_en: "Jacks have only 10 HP",        apply: (e) => e.rank === "J" ? { ...e, hp: 10, currentHp: 10 } : e },
    { id: "no_hearts",     icon: "💔", title_de: "Kein Heilen",           title_en: "No Healing",          desc_de: "Herz-Effekt ist deaktiviert",          desc_en: "Hearts effect is disabled",    apply: null },
    { id: "speed_mode",    icon: "⏱", title_de: "Speedrun",              title_en: "Speed Mode",          desc_de: "Sieg in unter 5 Minuten nötig",        desc_en: "Must win in under 5 minutes",  apply: null },
  ];
  const idx = rng(3) % mods.length;
  const mod = mods[idx];
  const dateStr = `${now.getDate().toString().padStart(2,"0")}.${(now.getMonth()+1).toString().padStart(2,"0")}.${now.getFullYear()}`;
  return { ...mod, date: dateStr, seed };
}

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
    <div className="w-full rounded-2xl px-3 py-2 mb-2" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
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
              <div key={pi} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-300"
                style={{ background: isDiscard ? "rgba(239,68,68,0.25)" : isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)", border: isDiscard ? "1.5px solid rgba(239,68,68,0.7)" : isActive ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)", transform: isActive ? "scale(1.05)" : "scale(1)", opacity: hasYielded && !isActive ? 0.5 : 1 }}>
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

function PlayingCard({ card, selected, suggested = false, onClick, disabled, small = false, isNew = false, lang = "de" }) {
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
        className={`relative cursor-pointer select-none transition-all duration-200 rounded-xl w-12 h-16 flex flex-col items-center justify-center`}
        style={{
          background: selected ? "rgba(255,255,255,0.28)" : suggested ? "rgba(250,204,21,0.18)" : "rgba(255,255,255,0.12)",
          border: selected ? "2px solid rgba(255,255,255,0.9)" : suggested ? "2px solid rgba(250,204,21,0.85)" : `1px solid ${borderColor}`,
          backdropFilter: "blur(12px)",
          transform: selected ? "translateY(-8px)" : suggested ? "translateY(-4px)" : undefined,
          boxShadow: suggested ? "0 0 12px rgba(250,204,21,0.4)" : undefined,
          opacity: disabled ? 0.4 : 1,
          animation: isNew ? "cardSlideIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards" : undefined,
        }}>
        <span className={`text-xs font-black ${color}`}>{card.rank}</span>
        <span className={`text-base ${color}`}>{card.suit}</span>
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 p-2 rounded-xl text-xs text-white/90 pointer-events-none"
          style={{ background: "rgba(10,10,30,0.7)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(40px)" }}>
          {tooltipContent}
        </div>
      )}
      <div onClick={!disabled ? onClick : undefined}
        className={`relative cursor-pointer select-none transition-all duration-200 rounded-2xl w-20 h-28 flex flex-col p-1.5 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        style={{
          background: selected ? "rgba(255,255,255,0.25)" : suggested ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.10)",
          border: selected ? "2px solid rgba(255,255,255,0.9)" : suggested ? "2px solid rgba(250,204,21,0.85)" : `1.5px solid ${borderColor}`,
          backdropFilter: "blur(18px)",
          transform: selected ? "translateY(-12px)" : suggested ? "translateY(-6px)" : undefined,
          boxShadow: selected ? "0 0 24px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.4)" : suggested ? "0 0 16px rgba(250,204,21,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" : "inset 0 1px 0 rgba(255,255,255,0.2)",
        }}>
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
          <div key={i} className="absolute rounded-lg" style={{ width: 28, height: 40, left: i * 1.5, top: i * -1.5, background: "rgba(255,255,255,0.08)", border: `1px solid ${color}55` }} />
        ))}
        {count === 0 && <div className="absolute rounded-lg" style={{ width: 28, height: 40, border: `1px dashed ${color}33`, opacity: 0.4 }} />}
      </div>
      <span className="font-black text-xs" style={{ color }}>{count}</span>
      <span className="opacity-50" style={{ color, fontSize: 9 }}>{label}</span>
    </div>
  );
}

const CARD_ANIM_STYLE = `@keyframes cardSlideIn{0%{opacity:0;transform:translateY(32px) scale(0.85)}60%{opacity:1;transform:translateY(-4px) scale(1.04)}100%{opacity:1;transform:translateY(0) scale(1)}} @keyframes cardGlow{0%{box-shadow:0 0 0 0 rgba(167,139,250,0.7)}50%{box-shadow:0 0 18px 6px rgba(167,139,250,0.45)}100%{box-shadow:0 0 0 0 rgba(167,139,250,0)}}`;
const SHAKE_STYLE = `@keyframes enemyShake{0%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(6px)}45%{transform:translateX(-4px)}60%{transform:translateX(4px)}75%{transform:translateX(-2px)}90%{transform:translateX(2px)}100%{transform:translateX(0)}} @keyframes enemyDie{0%{opacity:1;transform:scale(1) translateY(0)}40%{opacity:0.7;transform:scale(1.08) translateY(-6px)}70%{opacity:0.3;transform:scale(0.85) translateY(8px)}100%{opacity:0;transform:scale(0.6) translateY(20px);filter:blur(12px)}}`;

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
      <div className="rounded-2xl p-3 space-y-2"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-12px)",
          transition: dying ? "none" : "opacity 0.4s ease, transform 0.4s ease",
          background: dying ? "rgba(255,180,0,0.18)" : "rgba(220,50,50,0.12)",
          backdropFilter: "blur(32px)",
          border: dying ? "1.5px solid rgba(255,200,0,0.6)" : "1.5px solid rgba(255,120,120,0.3)",
          boxShadow: dying ? "0 0 60px rgba(255,200,0,0.5)" : "0 12px 48px rgba(220,50,50,0.2)",
          animation: dying ? "enemyDie 0.65s ease-out forwards" : shaking ? "enemyShake 0.45s ease" : undefined,
        }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{enemy.rank}</span>
            <span className={`text-2xl ${isRed ? "text-red-400" : "text-white"}`}>{enemy.suit}</span>
            <div>
              <p className="text-white font-black text-sm">{lang === "de" ? (enemy.rank === "J" ? "Bube" : enemy.rank === "Q" ? "Dame" : "König") : (enemy.rank === "J" ? "Jack" : enemy.rank === "Q" ? "Queen" : "King")}</p>
              <p className={`text-xs font-bold ${isRed ? "text-red-300" : "text-slate-200"}`}>{lang === "de" ? SUIT_NAMES_DE[enemy.suit] : SUIT_NAMES_EN[enemy.suit]}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-xs font-semibold">{lang === "de" ? "Angriff" : "Attack"}</p>
            <p className="text-red-200 font-black text-lg">⚔️ {enemy.attack}</p>
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
              <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${damagePct}%`, background: "#fb923c" }} />
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
            <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-1">{lang === "de" ? "Schaden pro Spieler" : "Damage per Player"}</p>
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
                      <span className="font-bold" style={{ color: col }}>{p.name}</span>
                      <span className="text-white/60 font-black">{dmg}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: col }} />
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
    attack:        () => { playTone(180, "sawtooth", 0.08, 0.22); playTone(120, "square", 0.12, 0.12, 0.06); },
    bigAttack:     () => { playTone(100, "sawtooth", 0.1, 0.28); playTone(70, "square", 0.18, 0.2, 0.07); playTone(140, "sawtooth", 0.08, 0.15, 0.15); },
    defeat:        () => { playTone(440, "sine", 0.12, 0.2); playTone(330, "sine", 0.15, 0.18, 0.1); playTone(220, "sine", 0.25, 0.22, 0.22); },
    heal:          () => { playTone(520, "sine", 0.1, 0.15); playTone(660, "sine", 0.12, 0.15, 0.1); playTone(780, "sine", 0.1, 0.12, 0.2); },
    draw:          () => { playTone(600, "sine", 0.07, 0.12); playTone(750, "sine", 0.07, 0.1, 0.08); },
    shield:        () => { playTone(300, "triangle", 0.1, 0.15); playTone(380, "triangle", 0.12, 0.13, 0.09); },
    victory:       () => { [523, 659, 784, 1047].forEach((f, i) => playTone(f, "sine", 0.18, 0.2, i * 0.13)); },
    gameover:      () => { [220, 185, 155, 110].forEach((f, i) => playTone(f, "sawtooth", 0.22, 0.18, i * 0.15)); },
    cardSelect:    () => playTone(800, "sine", 0.05, 0.08),
    jester:        () => { [600, 800, 1000, 800, 600].forEach((f, i) => playTone(f, "sine", 0.06, 0.1, i * 0.07)); },
    yield:         () => playTone(260, "triangle", 0.1, 0.1),
    discard:       () => playTone(200, "sawtooth", 0.08, 0.12),
    enemyDefeated: () => { [392, 523, 659, 784].forEach((f, i) => playTone(f, "sine", 0.15, 0.22, i * 0.1)); },
  };

  const [theme, setTheme] = useState("fantasy");
  const glass = {
    btn: "backdrop-blur-2xl bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1.5px_0_rgba(255,255,255,0.45)]",
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
  const [roundStats, setRoundStats] = useState({ damage: 0, cards: 0, healed: 0 });
  const [lastRoundStats, setLastRoundStats] = useState(null);
  const [roundBanner, setRoundBanner] = useState(null);
  const [totalStats, setTotalStats] = useState({ damage: 0, cards: 0, enemies: 0 });
  const [paused, setPaused] = useState(false);
  const [floatingNums, setFloatingNums] = useState([]);
  const [handSort, setHandSort] = useState("default");
  const [enemyShaking, setEnemyShaking] = useState(false);
  const [newCardIds, setNewCardIds] = useState(new Set());
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => { try { return JSON.parse(localStorage.getItem("regicide_ach") || "[]"); } catch { return []; } });
  const [newAchievement, setNewAchievement] = useState(null);
  const achievementStats = useRef({ totalCards: 0, totalEnemies: 0, totalDamage: 0, maxCardsInRound: 0, wonInSeconds: 0, exactKills: 0, soloWinNoJester: false, maxSingleHit: 0, wonWith1Card: false });

  const [dailyChallenge] = useState(() => getDailyChallenge());
  const [dailyCompleted, setDailyCompleted] = useState(() => {
    try { const s = localStorage.getItem("regicide_daily"); if (!s) return null; const d = JSON.parse(s); return d.seed === getDailyChallenge().seed ? d : null; } catch { return null; }
  });

  const unlockedAchievementsRef = useRef(unlockedAchievements);
  useEffect(() => { unlockedAchievementsRef.current = unlockedAchievements; }, [unlockedAchievements]);

  const speedModeTimerRef = useRef(null);

  const checkAchievements = (stats) => {
    const current = { ...achievementStats.current, ...stats };
    achievementStats.current = current;
    const alreadyUnlocked = unlockedAchievementsRef.current;
    const newOnes = ACHIEVEMENTS.filter(a => !alreadyUnlocked.includes(a.id) && a.check(current));
    if (newOnes.length === 0) return;
    const updated = [...alreadyUnlocked, ...newOnes.map(a => a.id)];
    unlockedAchievementsRef.current = updated;
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

  const saveDailyCompleted = (wonSeconds) => {
    try {
      const data = { seed: dailyChallenge.seed, time: wonSeconds, date: dailyChallenge.date };
      localStorage.setItem("regicide_daily", JSON.stringify(data));
      setDailyCompleted(data);
    } catch {}
  };

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

  // Stable refs for keyboard handler
  const playCardsRef = useRef(null);
  const yieldTurnRef = useRef(null);
  const soloFlipJesterRef = useRef(null);
  const toggleCardSelectionRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (screen === "game" && game) {
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (e.key >= "1" && e.key <= "8") {
          const idx = parseInt(e.key) - 1;
          if (idx < currentPlayer.hand.length && phase === "play") toggleCardSelectionRef.current && toggleCardSelectionRef.current(currentPlayer.hand[idx].id);
          return;
        }
        if ((e.key === "Enter" || e.key === " ") && phase === "play") { e.preventDefault(); if (selectedCards.length > 0) playCardsRef.current && playCardsRef.current(); return; }
        if ((e.key === "y" || e.key === "Y") && phase === "play") { yieldTurnRef.current && yieldTurnRef.current(); return; }
        if (e.key === "Escape") { setSelectedCards([]); return; }
        if ((e.key === "j" || e.key === "J") && numPlayers === 1 && soloJestersAvail > 0 && phase === "play") { soloFlipJesterRef.current && soloFlipJesterRef.current("step1"); return; }
        if ((e.key === "j" || e.key === "J") && numPlayers === 1 && soloJestersAvail > 0 && phase === "discard") { soloFlipJesterRef.current && soloFlipJesterRef.current("step4"); return; }
      }
      if (e.key === "m" || e.key === "M") { if (screen !== "game") setScreen("menu"); }
      if ((e.key === "p" || e.key === "P") && screen === "game" && phase === "play") { setPaused(prev => !prev); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, game, phase, selectedCards, numPlayers, soloJestersAvail]);

  const initDailyGame = () => {
    setNumPlayers(1);
    setTimeout(() => initGame(true, 1), 0);
  };

  const initGame = (isDaily = false, overrideNumPlayers = null) => {
    const effectivePlayers = overrideNumPlayers ?? numPlayers;
    // Reset achievement stats for new game
    achievementStats.current = { totalCards: 0, totalEnemies: 0, totalDamage: 0, maxCardsInRound: 0, wonInSeconds: 0, exactKills: 0, soloWinNoJester: false, maxSingleHit: 0, wonWith1Card: false };
    if (speedModeTimerRef.current) { clearTimeout(speedModeTimerRef.current); speedModeTimerRef.current = null; }
    const playerDeck = shuffle(createDeck(effectivePlayers));
    const enemyDeck = shuffle(createEnemyDeck());
    const jacks = shuffle(enemyDeck.filter((e) => e.rank === "J"));
    const queens = shuffle(enemyDeck.filter((e) => e.rank === "Q"));
    const kings = shuffle(enemyDeck.filter((e) => e.rank === "K"));
    const orderedEnemies = [...jacks, ...queens, ...kings];
    const effectiveHandSize = (isDaily && dailyChallenge.id === "half_hand") ? Math.max(2, Math.floor(getHandSize(effectivePlayers) / 2)) : getHandSize(effectivePlayers);
    const players = [];
    let remaining = [...playerDeck];
    for (let i = 0; i < effectivePlayers; i++) {
      players.push({ id: i, name: `${t(lang, "Spieler", "Player")} ${i + 1}`, hand: remaining.splice(0, effectiveHandSize) });
    }
    let finalEnemies = orderedEnemies;
    if (isDaily && dailyChallenge.apply) {
      finalEnemies = orderedEnemies.map(e => dailyChallenge.apply(e));
    }
    const newGame = { players, drawPile: remaining, discardPile: [], enemyDeck: finalEnemies.slice(1), currentEnemy: { ...finalEnemies[0] }, currentPlayerIndex: 0, tableCards: [], damageByPlayer: {}, won: false, lost: false, isDaily };
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
    setDiscardedSoFar(0);
    setRoundStats({ damage: 0, cards: 0, healed: 0 });
    setTotalStats({ damage: 0, cards: 0, enemies: 0 });
    setLastRoundStats(null);
    setRoundBanner(null);
    addLog(t(lang, "Spiel gestartet! Besiegt den ersten Feind.", "Game started! Defeat the first enemy."));
    setScreen("game");
    // #6: speed_mode timer
    if (isDaily && dailyChallenge.id === "speed_mode") {
      speedModeTimerRef.current = setTimeout(() => {
        addLog(t(lang, "⏱ Zeit abgelaufen! Niederlage.", "⏱ Time's up! Defeat."));
        showAnim(t(lang, "⏱ Zeit abgelaufen!", "⏱ Time's up!"), 3000);
        sfx.gameover();
        setGame(g => g ? { ...g, lost: true } : g);
        setScreen("gameover");
        speedModeTimerRef.current = null;
      }, 5 * 60 * 1000);
    }
  };

  const getCardValue = (card) => {
    if (card.type === "jester") return 0;
    if (card.rank === "A") return 1;
    if (["J","Q","K"].includes(card.rank)) return card.rank === "J" ? 10 : card.rank === "Q" ? 15 : 20;
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
  useEffect(() => { toggleCardSelectionRef.current = toggleCardSelection; });

  const calcBaseAttack = (cards) => {
    if (cards.length === 0) return 0;
    if (cards.some((c) => c.type === "jester")) return 0;
    return cards.reduce((sum, c) => sum + getCardValue(c), 0);
  };

  const calcAttack = (cards, enemy) => {
    const base = calcBaseAttack(cards);
    if (base === 0) return 0;
    const enemyToCheck = enemy || game?.currentEnemy;
    const hasClubs = cards.some((c) => c.suit === "♣");
    const enemyImmuneToClubs = enemyToCheck?.suit === "♣" && !enemyToCheck?.jesterCancelled;
    const clubsDisabled = game?.isDaily && dailyChallenge?.id === "no_clubs";
    if (hasClubs && !enemyImmuneToClubs && !clubsDisabled) return base * 2;
    return base;
  };

  const applyHearts = (g, cards, baseAttack) => {
    const heartsCards = cards.filter((c) => c.suit === "♥" && c.type !== "jester");
    if (heartsCards.length === 0) return g;
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
    setSelectedCards([]);
    addLog(t(lang, `🃏 Jester umgedreht! Hand neu gezogen (${newHand.length} Karten).`, `🃏 Jester flipped! Hand refilled (${newHand.length} cards).`));
    markNewCards(newHand.map(c => c.id));
    setGame({ ...game, players: [{ ...game.players[0], hand: newHand }], drawPile, discardPile });
    if (timing === "step4") addLog(t(lang, `⚠️ Schaden (${discardNeeded}) muss noch bezahlt werden!`, `⚠️ Damage (${discardNeeded}) still needs to be paid!`));
  };
  useEffect(() => { soloFlipJesterRef.current = soloFlipJester; });

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

  const checkCanActAndTriggerLose = (g, playerIdx, lyielded, snapshotStats = null) => {
    const player = g.players[playerIdx];
    if (player.hand.length > 0) return false;
    const others = g.players.map((_, i) => i).filter((i) => i !== playerIdx);
    const allOthersYielded = others.length > 0 && others.every((i) => lyielded.includes(i));
    if (allOthersYielded || others.length === 0) {
      sfx.gameover();
      const stats = snapshotStats || totalStats;
      saveHighscore({ date: new Date().toLocaleDateString(), players: numPlayers, won: false, enemies: stats.enemies, damage: stats.damage, cards: stats.cards, jesters: soloJestersUsed, score: stats.damage + stats.enemies * 50 });
      addLog(t(lang, "Keine Karten – Niederlage!", "No cards – defeat!"));
      if (speedModeTimerRef.current) { clearTimeout(speedModeTimerRef.current); speedModeTimerRef.current = null; }
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
    const newDiscardedSoFar = discardedSoFar + cardValue;
    addLog(`🗑 ${t(lang, `Abgeworfen: ${card.rank}${card.suit !== "🃏" ? card.suit : ""} (${cardValue}), noch ${Math.max(0, newDiscardNeeded)} nötig`, `Discarded: ${card.rank}${card.suit !== "🃏" ? card.suit : ""} (${cardValue}), need ${Math.max(0, newDiscardNeeded)} more`)}`);
    let newPlayers = game.players.map((p, i) => i === game.currentPlayerIndex ? { ...p, hand: newHand } : p);
    if (newDiscardNeeded <= 0) {
      const nextAfterDiscard = game._nextPlayerAfterDiscard ?? game.currentPlayerIndex; // Bug3 fix: winner skips Step4
      let drawPile2 = [...game.drawPile];
      let mutableNewDiscard = [...newDiscard];
      if (drawPile2.length === 0 && mutableNewDiscard.length > 0) {
        drawPile2 = shuffle([...mutableNewDiscard]);
        mutableNewDiscard = [];
        addLog(t(lang, "🔄 Nachziehstapel leer – Ablage gemischt!", "🔄 Draw pile empty – discard reshuffled!"));
      }
      const handLenBeforeDraw = newPlayers[game.currentPlayerIndex].hand.length;
      while (newPlayers[game.currentPlayerIndex].hand.length < getHandSize(numPlayers) && drawPile2.length > 0) {
        newPlayers[game.currentPlayerIndex] = { ...newPlayers[game.currentPlayerIndex], hand: [...newPlayers[game.currentPlayerIndex].hand, drawPile2.shift()] };
      }
      markNewCards(newPlayers[game.currentPlayerIndex].hand.slice(handLenBeforeDraw).map(c => c.id));
      addLog(t(lang, "✅ Schaden bezahlt! Nächster Spieler.", "✅ Damage paid! Next player."));
      const stateAfterDiscard = { ...game, players: newPlayers, discardPile: mutableNewDiscard, drawPile: drawPile2, currentPlayerIndex: nextAfterDiscard, _nextPlayerAfterDiscard: undefined };
      if (!checkCanActAndTriggerLose(stateAfterDiscard, nextAfterDiscard, lastYielded)) setGame(stateAfterDiscard);
      setPhase("play");
      setDiscardNeeded(0);
      setDiscardedSoFar(0);
    } else {
      const totalCardsLeft = newPlayers.reduce((s, p) => s + p.hand.length, 0);
      if (totalCardsLeft === 0 && newDiscardNeeded > 0) {
        if (speedModeTimerRef.current) { clearTimeout(speedModeTimerRef.current); speedModeTimerRef.current = null; }
        setGame({ ...game, players: newPlayers, discardPile: newDiscard, lost: true });
        setScreen("gameover");
        return;
      }
      setGame({ ...game, players: newPlayers, discardPile: newDiscard });
      setDiscardNeeded(newDiscardNeeded);
      setDiscardedSoFar(newDiscardedSoFar);
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
    const newDmgByPlayer = { ...g.damageByPlayer, [g.currentPlayerIndex]: (g.damageByPlayer[g.currentPlayerIndex] || 0) + attack };
    setRoundStats(prev => ({ damage: prev.damage + attack, cards: prev.cards + cards.length, healed: prev.healed }));
    checkAchievements({ totalCards: achievementStats.current.totalCards + cards.length, totalDamage: achievementStats.current.totalDamage + attack, maxSingleHit: Math.max(achievementStats.current.maxSingleHit, attack) });
    if (attack >= 20) sfx.bigAttack(); else sfx.attack();
    triggerEnemyHit();
    spawnFloat(`-${attack}`, attack >= 20 ? "#fbbf24" : attack >= 10 ? "#f87171" : "#fb923c", attack >= 20 ? "text-5xl" : attack >= 10 ? "text-4xl" : "text-3xl");
    addLog(`⚔️ ${t(lang, `Angriff: ${attack} Schaden → ${enemy.rank}${enemy.suit} (HP: ${enemy.currentHp}→${Math.max(0,newHp)})`, `Attack: ${attack} dmg → ${enemy.rank}${enemy.suit} (HP: ${enemy.currentHp}→${Math.max(0,newHp)})`)}`);
    enemy = applySpades(g, cards, enemy, baseAttack);
    g = applyHearts({ ...g, players, currentEnemy: enemy }, cards, baseAttack);
    players = g.players;
    const diamondResult = applyDiamonds(g, cards, players, baseAttack);
    g = diamondResult.g; players = diamondResult.players;

    if (newHp <= 0) {
      sfx.enemyDefeated();
      setEnemyDying(true);
      const isExactKill = newHp === 0;
      const newTotalEnemies = (achievementStats.current.totalEnemies || 0) + 1;
      checkAchievements({ totalEnemies: newTotalEnemies, exactKills: achievementStats.current.exactKills + (isExactKill ? 1 : 0) });
      const newTotalStats = { damage: totalStats.damage + attack, cards: totalStats.cards + cards.length, enemies: totalStats.enemies + 1 };
      setTotalStats(newTotalStats);
      const lrs = { ...roundStats, damage: roundStats.damage + attack, cards: roundStats.cards + cards.length };
      setLastRoundStats(lrs);
      setRoundBanner({ ...lrs, enemy: enemy.rank + enemy.suit, damageByPlayer: newDmgByPlayer });
      setRoundStats({ damage: 0, cards: 0, healed: 0 });
      setTimeout(() => {
        setEnemyDying(false);
        if (g.enemyDeck.length === 0) {
          sfx.victory();
          const wonSec = Math.floor((Date.now() - gameStartTime) / 1000);
          if (speedModeTimerRef.current) { clearTimeout(speedModeTimerRef.current); speedModeTimerRef.current = null; }
          checkAchievements({ wonInSeconds: wonSec, wonWith1Card: players[g.currentPlayerIndex].hand.length === 1, soloWinNoJester: numPlayers === 1 && soloJestersUsed === 0 });
          saveHighscore({ date: new Date().toLocaleDateString(), players: numPlayers, won: true, enemies: newTotalStats.enemies, damage: newTotalStats.damage, cards: newTotalStats.cards, jesters: soloJestersUsed, score: newTotalStats.damage + newTotalStats.enemies * 50 + 200 });
          if (game.isDaily) saveDailyCompleted(wonSec);
          setGame({ ...g, players, won: true, tableCards: [], damageByPlayer: {} });
          setScreen("victory");
        } else {
          const nextEnemy = g.enemyDeck[0];
          const remainingEnemies = g.enemyDeck.slice(1);
          const defeatedCards = [...(g.tableCards || []), ...taggedCards];
          const shuffledDefeated = shuffle(defeatedCards);
            let newDrawPile = isExactKill
              ? [{ ...enemy, _exactKill: true }, ...g.drawPile, ...shuffledDefeated]
              : [...g.drawPile, ...shuffledDefeated];
            if (isExactKill) addLog(t(lang, `⭐ Exact Kill! ${enemy.rank}${enemy.suit} oben auf den Nachziehstapel gelegt!`, `⭐ Exact Kill! ${enemy.rank}${enemy.suit} placed on top of Tavern deck!`));
          addLog(t(lang, `✅ ${enemy.rank}${enemy.suit} besiegt! Nächster Feind: ${nextEnemy.rank}${nextEnemy.suit}`, `✅ ${enemy.rank}${enemy.suit} defeated! Next: ${nextEnemy.rank}${nextEnemy.suit}`));
          const nextPlayer = (g.currentPlayerIndex + 1) % numPlayers;
          setLastYielded([]);
          setGame({ ...g, players, drawPile: newDrawPile, enemyDeck: remainingEnemies, currentEnemy: { ...nextEnemy }, currentPlayerIndex: nextPlayer, tableCards: [], damageByPlayer: {} });
          setPhase("play");
        }
      }, 700);
      return;
    }

    // Enemy survives — take damage
    const newTableCards = [...(g.tableCards || []), ...taggedCards];
    const nextPlayer = (g.currentPlayerIndex + 1) % numPlayers;
    const updatedEnemy = { ...enemy, currentHp: newHp };
    const newState = { ...g, players, currentEnemy: updatedEnemy, tableCards: newTableCards, damageByPlayer: newDmgByPlayer, currentPlayerIndex: nextPlayer };

    // Enemy counterattack
    const rawEnemyAttack = updatedEnemy.attack;
    if (rawEnemyAttack > 0) {
      setTotalStats(prev => ({ ...prev, damage: prev.damage + attack, cards: prev.cards + cards.length }));
      const dmgNeeded = rawEnemyAttack;
      const nextPlayerHand = players[nextPlayer].hand;
      const handTotal = nextPlayerHand.reduce((s, c) => s + getCardValue(c), 0);
      if (handTotal >= dmgNeeded) {
        addLog(`🔴 ${t(lang, `Feind greift ${nextPlayer + 1} mit ${dmgNeeded} Schaden an!`, `Enemy attacks player ${nextPlayer + 1} for ${dmgNeeded}!`)}`);
        spawnFloat(`👊 ${dmgNeeded}`, "#f87171", "text-3xl");
        setDiscardNeeded(dmgNeeded);
        setDiscardedSoFar(0);
        setGame({ ...newState, _nextPlayerAfterDiscard: nextPlayer });
        setPhase("discard");
        setLastYielded([]);
      } else {
        addLog(`🔴 ${t(lang, `Spieler ${nextPlayer + 1} kann Schaden nicht bezahlen – Niederlage!`, `Player ${nextPlayer + 1} can't pay damage – defeat!`)}`);
        sfx.gameover();
        if (speedModeTimerRef.current) { clearTimeout(speedModeTimerRef.current); speedModeTimerRef.current = null; }
        setGame({ ...newState, lost: true });
        setScreen("gameover");
      }
    } else {
      setTotalStats(prev => ({ ...prev, damage: prev.damage + attack, cards: prev.cards + cards.length }));
      setGame(newState);
      setLastYielded([]);
    }
  };
  useEffect(() => { playCardsRef.current = playCards; });

  const yieldTurn = () => {
    sfx.yield();
    if (!game || phase !== "play") return;
    const pi = game.currentPlayerIndex;
    const newYielded = [...lastYielded, pi];
    addLog(t(lang, `Spieler ${pi + 1} passt.`, `Player ${pi + 1} yields.`));
    const nextPlayer = (pi + 1) % numPlayers;
    const updatedGame = (prev) => ({ ...prev, currentPlayerIndex: nextPlayer });
    // Alle-Passen-Prüfung
      if (newYielded.length >= numPlayers) {
        sfx.gameover();
        addLog(t(lang, "Alle Spieler haben gepasst – Niederlage!", "All players yielded – defeat!"));
        if (speedModeTimerRef.current) { clearTimeout(speedModeTimerRef.current); speedModeTimerRef.current = null; }
        setGame({ ...game, lost: true });
        setScreen("gameover");
        return;
      }
      setLastYielded(newYielded);
    setGame(prev => ({ ...prev, currentPlayerIndex: nextPlayer }));
    checkCanActAndTriggerLose({ ...game, currentPlayerIndex: nextPlayer }, nextPlayer, newYielded);
  };
  useEffect(() => { yieldTurnRef.current = yieldTurn; });

  const getSortedHand = (hand) => {
    if (handSort === "default") return hand;
    if (handSort === "value") return [...hand].sort((a, b) => getCardValue(a) - getCardValue(b));
    if (handSort === "suit") return [...hand].sort((a, b) => a.suit.localeCompare(b.suit));
    return hand;
  };

  // ── RENDER HELPERS ────────────────────────────────────────────────────────

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 gap-6">
      <div className="text-center space-y-2">
        <style>{`@keyframes titleGlow{0%,100%{text-shadow:0 0 20px rgba(167,139,250,0.8),0 0 40px rgba(167,139,250,0.4)}50%{text-shadow:0 0 30px rgba(251,191,36,0.9),0 0 60px rgba(251,191,36,0.5)}} @keyframes titleIn{0%{opacity:0;transform:translateY(-20px) scale(0.92)}60%{opacity:1;transform:translateY(3px) scale(1.04)}100%{opacity:1;transform:translateY(0) scale(1)}} @keyframes swordBob{0%,100%{transform:rotate(-12deg) scale(1)}50%{transform:rotate(12deg) scale(1.18)}}`}</style>
            <div className="flex items-center justify-center gap-3" style={{animation:"titleIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards"}}>
              <span className="text-5xl">👑</span>
              <h1 className="text-6xl font-black tracking-tight" style={{background:"linear-gradient(135deg,#fff 0%,#ddd6fe 35%,#fbbf24 65%,#fff 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"-0.02em"}}>Coup d'État</h1>
              <span className="text-5xl">👑</span>
            </div>
        <p className="text-white text-sm tracking-widest uppercase font-bold">Kooperatives Kartenspiel</p>
      </div>

      {dailyCompleted && (
        <div className="w-full max-w-sm rounded-2xl px-4 py-3 text-center" style={{ background: "rgba(250,204,21,0.15)", border: "1.5px solid rgba(250,204,21,0.4)" }}>
          <p className="text-yellow-300 font-black text-sm">🏆 Heute geschafft!</p>
          <p className="text-yellow-200/70 text-xs mt-0.5">{dailyChallenge.date} · Zeit: {formatTime(dailyCompleted.time)}</p>
        </div>
      )}

      <div className="w-full max-w-sm space-y-3">
        <div className={`${glass.panel} p-4 space-y-3`}>
          <p className="text-white text-xs font-bold tracking-widest uppercase text-center">{lang === "de" ? "Anzahl Spieler" : "Number of Players"}</p>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(n => (
              <button key={n} onClick={() => setNumPlayers(n)} className={`py-2 rounded-xl font-black text-sm transition-all ${numPlayers === n ? "bg-white/30 text-white border border-white/60 shadow-inner" : "bg-white/5 text-white/50 border border-white/15 hover:bg-white/15 hover:text-white/80"}`}>{n}</button>
            ))}
          </div>
          <button onClick={() => initGame(false)} className={`${glass.btnPrimary} w-full py-3 text-lg`}>
            {lang === "de" ? "🎮 Spiel starten" : "🎮 Start Game"}
          </button>
        </div>

        <div className={`${glass.panel} p-4`} style={{ border: dailyCompleted ? "1.5px solid rgba(250,204,21,0.3)" : undefined }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white font-black text-sm">{dailyChallenge.icon} {lang === "de" ? dailyChallenge.title_de : dailyChallenge.title_en}</p>
              <p className="text-white text-xs">{lang === "de" ? dailyChallenge.desc_de : dailyChallenge.desc_en}</p>
            </div>
            <span className="text-white/80 text-xs">{dailyChallenge.date}</span>
          </div>
          <button onClick={initDailyGame} disabled={!!dailyCompleted} className={`${glass.btn} w-full py-2 text-sm ${dailyCompleted ? "opacity-40 cursor-not-allowed" : ""}`}>
            {dailyCompleted ? (lang === "de" ? "✅ Heute erledigt" : "✅ Done today") : (lang === "de" ? "📅 Daily spielen" : "📅 Play Daily")}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "highscores", icon: "🏆", de: "Highscores", en: "Highscores" },
            { key: "achievements", icon: "🎖", de: "Erfolge", en: "Achievements" },
            { key: "rules", icon: "📖", de: "Regeln", en: "Rules" },
          ].map(btn => (
            <button key={btn.key} onClick={() => setScreen(btn.key)} className={`${glass.btn} py-2 text-xs flex flex-col items-center gap-1`}>
              <span className="text-lg">{btn.icon}</span>
              <span>{lang === "de" ? btn.de : btn.en}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={`${glass.panel} p-3`}>
            <p className="text-white text-xs font-bold mb-2 text-center">{lang === "de" ? "Theme" : "Theme"}</p>
            <div className="space-y-1">
              {Object.entries(CARD_THEMES).map(([k, v]) => (
                <button key={k} onClick={() => setTheme(k)} className={`w-full py-1 px-2 rounded-lg text-xs font-bold transition-all ${theme === k ? "bg-white/30 text-white font-black border border-white/50 rounded-lg" : "text-white/50 hover:text-white/80 font-medium"}`}>
                  {lang === "de" ? v.name_de : v.name_en}
                </button>
              ))}
            </div>
          </div>
          <div className={`${glass.panel} p-3 flex flex-col gap-2`}>
            <button onClick={() => setLang(l => l === "de" ? "en" : "de")} className={`${glass.btn} py-2 text-xs`}>
              🌐 {lang === "de" ? "English" : "Deutsch"}
            </button>
            <button onClick={() => setSoundEnabled(s => !s)} className={`${glass.btn} py-2 text-xs`}>
              {soundEnabled ? "🔊" : "🔇"} {lang === "de" ? "Sound" : "Sound"}
            </button>
          </div>
        </div>
      </div>

      <p className="text-white/50 text-xs text-center">v8.7</p>
    </div>
  );

  const renderHighscores = () => {
    const scores = loadHighscores();
    return (
      <div className="flex flex-col items-center min-h-screen px-4 py-8 gap-4">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <button onClick={() => setScreen("menu")} className={`${glass.btn} px-3 py-2 text-sm`}>← {lang === "de" ? "Menü" : "Menu"}</button>
          <h2 className="text-white font-black text-xl flex-1 text-center">🏆 Highscores</h2>
          <button onClick={() => { clearHighscores(); setScreen("menu"); }} className={`${glass.btnDanger} px-3 py-2 text-xs`}>{lang === "de" ? "Reset" : "Reset"}</button>
        </div>
        <div className="w-full max-w-sm space-y-2">
          {scores.length === 0 && <p className="text-white/30 text-center text-sm py-8">{lang === "de" ? "Noch keine Einträge." : "No entries yet."}</p>}
          {scores.map((s, i) => (
            <div key={i} className={`${glass.card} p-3 flex items-center gap-3`}>
              <span className="text-2xl font-black text-white/30">#{i+1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm">{s.score} {lang === "de" ? "Pkt" : "pts"}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${s.won ? "text-green-300 bg-green-900/30" : "text-red-300 bg-red-900/30"}`}>{s.won ? (lang === "de" ? "Sieg" : "Win") : (lang === "de" ? "Niederlage" : "Loss")}</span>
                </div>
                <p className="text-white/40 text-xs">{s.date} · {s.players}P · {s.enemies} {lang === "de" ? "Feinde" : "enemies"} · {s.damage} dmg</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-white/50 text-xs">v8.7</p>
      </div>
    );
  };

  const renderAchievements = () => (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 gap-4">
      <div className="flex items-center gap-3 w-full max-w-sm">
        <button onClick={() => setScreen("menu")} className={`${glass.btn} px-3 py-2 text-sm`}>← {lang === "de" ? "Menü" : "Menu"}</button>
        <h2 className="text-white font-black text-xl flex-1 text-center">🎖 {lang === "de" ? "Erfolge" : "Achievements"}</h2>
      </div>
      <div className="w-full max-w-sm space-y-2">
        {ACHIEVEMENTS.map(a => {
          const unlocked = unlockedAchievements.includes(a.id);
          return (
            <div key={a.id} className={`${glass.card} p-3 flex items-center gap-3 ${unlocked ? "" : "opacity-40"}`}>
              <span className="text-2xl">{unlocked ? a.icon : "🔒"}</span>
              <div>
                <p className="text-white font-bold text-sm">{lang === "de" ? a.title_de : a.title_en}</p>
                <p className="text-white/50 text-xs">{lang === "de" ? a.desc_de : a.desc_en}</p>
              </div>
              {unlocked && <span className="ml-auto text-green-400 text-lg">✓</span>}
            </div>
          );
        })}
      </div>
      <p className="text-white/50 text-xs">v8.7</p>
    </div>
  );

  const renderRules = () => (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 gap-4">
      <div className="flex items-center gap-3 w-full max-w-sm">
        <button onClick={() => setScreen("menu")} className={`${glass.btn} px-3 py-2 text-sm`}>← {lang === "de" ? "Menü" : "Menu"}</button>
        <h2 className="text-white font-black text-xl flex-1 text-center">📖 {lang === "de" ? "Regeln" : "Rules"}</h2>
      </div>
      <div className="w-full max-w-sm space-y-3 text-white/80 text-sm">
        {[
          { icon: "🎯", title_de: "Ziel", title_en: "Goal", body_de: "Besiegt alle 12 Feinde (4 Buben, 4 Damen, 4 Könige) gemeinsam.", body_en: "Defeat all 12 enemies (4 Jacks, 4 Queens, 4 Kings) together." },
          { icon: "🃏", title_de: "Kartenspielen", title_en: "Playing Cards", body_de: "Spiele 1 Karte oder eine gültige Kombination (gleicher Rang, Summe ≤ 10) aus deiner Hand.", body_en: "Play 1 card or a valid combo (same rank, total ≤ 10) from your hand." },
          { icon: "♥", title_de: "Herz – Heilen", title_en: "Hearts – Heal", body_de: "Karten vom Ablagestapel zurück in den Nachziehstapel mischen.", body_en: "Shuffle cards from discard back into draw pile." },
          { icon: "♦", title_de: "Karo – Ziehen", title_en: "Diamonds – Draw", body_de: "Zusätzliche Karten auf die Hand ziehen.", body_en: "Draw additional cards to hand." },
          { icon: "♣", title_de: "Kreuz – Verdoppeln", title_en: "Clubs – Double", body_de: "Angriffswert der gespielten Karten verdoppeln.", body_en: "Double the attack value of played cards." },
          { icon: "♠", title_de: "Pik – Schild", title_en: "Spades – Shield", body_de: "Angriff des Feindes um den Kartenwert reduzieren.", body_en: "Reduce enemy attack by card value." },
          { icon: "⚔️", title_de: "Feind-Angriff", title_en: "Enemy Attack", body_de: "Nach deinem Zug greift der Feind den nächsten Spieler an. Karten abwerfen um Schaden zu zahlen.", body_en: "After your turn, enemy attacks next player. Discard cards to pay damage." },
          { icon: "🃏", title_de: "Jester (Solo)", title_en: "Jester (Solo)", body_de: "Tausche deine Hand gegen neue Karten. Immunität des Feindes aufheben.", body_en: "Swap your hand for new cards. Cancel enemy immunity." },
        ].map((rule, i) => (
          <div key={i} className={`${glass.card} p-3`}>
            <p className="font-black text-white mb-1">{rule.icon} {lang === "de" ? rule.title_de : rule.title_en}</p>
            <p className="text-white/60 text-xs">{lang === "de" ? rule.body_de : rule.body_en}</p>
          </div>
        ))}
      </div>
      <p className="text-white/50 text-xs">v8.7</p>
    </div>
  );

  const renderVictory = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 gap-6">
      <div className="text-center space-y-2">
        <div className="text-7xl mb-2">👑</div>
        <h2 className="text-4xl font-black text-white">{lang === "de" ? "Sieg!" : "Victory!"}</h2>
        <p className="text-white/50 text-sm">{lang === "de" ? "Alle Feinde besiegt!" : "All enemies defeated!"}</p>
      </div>
      <div className={`${glass.panel} p-4 w-full max-w-sm space-y-2`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: lang === "de" ? "Zeit" : "Time", val: formatTime(elapsedSeconds) },
            { label: lang === "de" ? "Feinde" : "Enemies", val: totalStats.enemies },
            { label: lang === "de" ? "Schaden" : "Damage", val: totalStats.damage },
          ].map((s, i) => (
            <div key={i} className={`${glass.card} p-2`}>
              <p className="text-white font-black text-lg">{s.val}</p>
              <p className="text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
        {game?.isDaily && (
          <div className="text-center py-1">
            <span className="text-yellow-300 font-black text-sm">📅 {lang === "de" ? "Daily Challenge abgeschlossen!" : "Daily Challenge completed!"}</span>
          </div>
        )}
      </div>
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={() => initGame(false)} className={`${glass.btnPrimary} flex-1 py-3`}>{lang === "de" ? "🎮 Nochmal" : "🎮 Play Again"}</button>
        <button onClick={() => setScreen("menu")} className={`${glass.btn} flex-1 py-3`}>{lang === "de" ? "🏠 Menü" : "🏠 Menu"}</button>
      </div>
      <p className="text-white/50 text-xs">v8.7</p>
    </div>
  );

  const renderGameOver = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 gap-6">
      <div className="text-center space-y-2">
        <div className="text-7xl mb-2">💀</div>
        <h2 className="text-4xl font-black text-white">{lang === "de" ? "Niederlage" : "Defeat"}</h2>
        <p className="text-white/50 text-sm">{lang === "de" ? "Das Königreich ist gefallen." : "The kingdom has fallen."}</p>
      </div>
      <div className={`${glass.panel} p-4 w-full max-w-sm`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: lang === "de" ? "Zeit" : "Time", val: formatTime(elapsedSeconds) },
            { label: lang === "de" ? "Feinde" : "Enemies", val: totalStats.enemies },
            { label: lang === "de" ? "Schaden" : "Damage", val: totalStats.damage },
          ].map((s, i) => (
            <div key={i} className={`${glass.card} p-2`}>
              <p className="text-white font-black text-lg">{s.val}</p>
              <p className="text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={() => initGame(false)} className={`${glass.btnPrimary} flex-1 py-3`}>{lang === "de" ? "🎮 Nochmal" : "🎮 Play Again"}</button>
        <button onClick={() => setScreen("menu")} className={`${glass.btn} flex-1 py-3`}>{lang === "de" ? "🏠 Menü" : "🏠 Menu"}</button>
      </div>
      <p className="text-white/50 text-xs">v8.7</p>
    </div>
  );

  const renderGame = () => {
    if (!game) return null;
    const currentPlayer = game.players[game.currentPlayerIndex];
    const sortedHand = getSortedHand(currentPlayer.hand);
    const suggestedIds = phase === "discard" ? getAutoDiscardSuggestion(currentPlayer.hand, discardNeeded) : [];
    const isDiscardTarget = phase === "discard";
    const accentColor = CARD_THEMES[theme]?.accent || "#a78bfa";

    const actionBar = phase === "discard" ? (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-red-300 font-black text-sm">⚠️ {lang === "de" ? "Schaden abwerfen" : "Discard for damage"}</span>
          <span className="text-white/60 text-xs">{lang === "de" ? `noch ${discardNeeded} nötig` : `need ${discardNeeded} more`} · {lang === "de" ? `bereits ${discardedSoFar} abgeworfen` : `${discardedSoFar} discarded`}</span>
        </div>
        {numPlayers === 1 && soloJestersAvail > 0 && (
          <button onClick={() => soloFlipJester("step4")} className={`${glass.btnPurple} w-full py-2 text-sm`}>
            🃏 {lang === "de" ? `Jester nutzen (${soloJestersAvail} übrig)` : `Use Jester (${soloJestersAvail} left)`}
          </button>
        )}
      </div>
    ) : phase === "jester" ? (
      <div className="space-y-2">
        <p className="text-purple-300 font-black text-sm text-center">🃏 {lang === "de" ? "Wer spielt als nächstes?" : "Who goes next?"}</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {game.players.map((p, pi) => (
            <button key={pi} onClick={() => chooseNextPlayer(pi)} className={`${glass.btnPurple} px-4 py-2 text-sm`}>{p.name}</button>
          ))}
        </div>
      </div>
    ) : (
      <div className="flex gap-2 flex-wrap">
        <button onClick={playCards} disabled={selectedCards.length === 0} className={`${glass.btnPrimary} flex-1 py-2 text-sm ${selectedCards.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}>
          ⚔️ {lang === "de" ? `Spielen (${selectedCards.length})` : `Play (${selectedCards.length})`}
        </button>
        <button onClick={yieldTurn} className={`${glass.btn} px-4 py-2 text-sm`}>
          {lang === "de" ? "Passen" : "Yield"}
        </button>
        {numPlayers === 1 && soloJestersAvail > 0 && (
          <button onClick={() => soloFlipJester("step1")} className={`${glass.btnPurple} px-3 py-2 text-sm`}>
            🃏 {soloJestersAvail}
          </button>
        )}
        {selectedCards.length > 0 && (
          <button onClick={() => setSelectedCards([])} className={`${glass.btnDanger} px-3 py-2 text-sm`}>✕</button>
        )}
      </div>
    );

    if (gameLayout === "dashboard") {
      return (
        <div className="min-h-screen flex flex-col" style={{ background: CARD_THEMES[theme].bg }}>
          <style>{CARD_ANIM_STYLE + SHAKE_STYLE}</style>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <button onClick={() => { setPaused(p => !p); }} className={`${glass.btn} px-3 py-1.5 text-xs`}>{paused ? "▶" : "⏸"}</button>
            <div className="flex items-center gap-3">
              <span className="text-white/50 text-xs font-mono">{formatTime(elapsedSeconds)}</span>
              {game.isDaily && <span className="text-yellow-300 text-xs font-bold">📅 {dailyChallenge.icon}</span>}
              <span className="text-white/30 text-xs">v8.7</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGameLayout("arena")} className={`${glass.btn} px-2 py-1 text-xs`}>Arena</button>
              <button onClick={() => setScreen("menu")} className={`${glass.btnDanger} px-3 py-1.5 text-xs`}>✕</button>
            </div>
          </div>
          {/* Main grid */}
          <div className="flex-1 grid grid-cols-3 gap-3 p-3 overflow-auto">
            {/* Left: enemy + log */}
            <div className="flex flex-col gap-3">
              <EnemyCard enemy={game.currentEnemy} lang={lang} tableCards={game.tableCards} shaking={enemyShaking} dying={enemyDying} damageByPlayer={game.damageByPlayer} players={game.players} />
              <div className={`${glass.panel} p-2 flex-1 overflow-auto`} style={{ maxHeight: 180 }}>
                <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-1">{lang === "de" ? "Log" : "Log"}</p>
                {log.map((l, i) => (
                  <p key={i} className="text-white/60 text-xs leading-relaxed" style={{ color: i === 0 && newLogIdx === 0 ? "#fff" : undefined }}>{l}</p>
                ))}
              </div>
            </div>
            {/* Center: hand */}
            <div className="flex flex-col gap-3">
              <PlayerTurnBanner game={game} lang={lang} phase={phase} numPlayers={numPlayers} lastYielded={lastYielded} />
              <div className={`${glass.panel} p-3 flex-1`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/60 text-xs font-bold tracking-widest uppercase">{lang === "de" ? "Hand" : "Hand"} ({currentPlayer.hand.length})</p>
                  <div className="flex gap-1">
                    {["default","value","suit"].map(s => (
                      <button key={s} onClick={() => setHandSort(s)} className={`text-xs px-2 py-0.5 rounded-lg transition-all ${handSort === s ? "bg-white/20 text-white" : "text-white/30 hover:text-white/50"}`}>{s === "default" ? "↕" : s === "value" ? "#" : "♠"}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortedHand.map(card => (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      selected={selectedCards.includes(card.id)}
                      suggested={isDiscardTarget && suggestedIds.includes(card.id)}
                      onClick={() => isDiscardTarget ? discardCardForDamage(card.id) : toggleCardSelection(card.id)}
                      disabled={paused}
                      isNew={newCardIds.has(card.id)}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
              <div>{actionBar}</div>
            </div>
            {/* Right: stats + decks */}
            <div className="flex flex-col gap-3">
              <div className={`${glass.panel} p-3`}>
                <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">{lang === "de" ? "Stapel" : "Decks"}</p>
                <div className="flex justify-around">
                  <DeckVisual count={game.drawPile.length} color={accentColor} label={lang === "de" ? "Ziehen" : "Draw"} />
                  <DeckVisual count={game.discardPile.length} color="#f87171" label={lang === "de" ? "Ablage" : "Discard"} />
                  <DeckVisual count={game.enemyDeck.length} color="#facc15" label={lang === "de" ? "Feinde" : "Enemies"} />
                </div>
              </div>
              <div className={`${glass.panel} p-3`}>
                <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">{lang === "de" ? "Runde" : "Round"}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: lang === "de" ? "Schaden" : "Damage", val: roundStats.damage },
                    { label: lang === "de" ? "Karten" : "Cards", val: roundStats.cards },
                    { label: lang === "de" ? "Geheilt" : "Healed", val: roundStats.healed },
                    { label: lang === "de" ? "Gesamt" : "Total", val: totalStats.damage },
                  ].map((s, i) => (
                    <div key={i} className={`${glass.card} p-2 text-center`}>
                      <p className="text-white font-black text-sm">{s.val}</p>
                      <p className="text-white/40 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {numPlayers > 1 && (
                <div className={`${glass.panel} p-3`}>
                  <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">{lang === "de" ? "Spieler" : "Players"}</p>
                  {game.players.map((p, pi) => (
                    <div key={pi} className="flex items-center justify-between py-1">
                      <span className="text-white/60 text-xs font-bold">{p.name}</span>
                      <span className="text-white/40 text-xs">{p.hand.length} {lang === "de" ? "Karten" : "cards"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Floating numbers */}
          <div className="fixed inset-0 pointer-events-none z-50">
            {floatingNums.map(f => (
              <div key={f.id} className={`absolute font-black ${f.size} select-none`}
                style={{ left: `${f.x}%`, top: "40%", color: f.color, textShadow: `0 0 20px ${f.color}`, animation: "floatUp 1.4s ease-out forwards" }}>
                {f.text}
              </div>
            ))}
          </div>
          <style>{`@keyframes floatUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-80px)}}`}</style>
        </div>
      );
    }

    // Arena layout (default)
    return (
      <div className="min-h-screen flex flex-col px-3 py-3 gap-3" style={{ background: CARD_THEMES[theme].bg }}>
        <style>{CARD_ANIM_STYLE + SHAKE_STYLE}</style>
        <style>{`@keyframes floatUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-80px)}}`}</style>

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button onClick={() => setScreen("menu")} className={`${glass.btnDanger} px-3 py-1.5 text-xs`}>✕</button>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs font-mono">{formatTime(elapsedSeconds)}</span>
            {game.isDaily && <span className="text-yellow-300 text-xs font-bold">📅 {dailyChallenge.icon}</span>}
            <DeckVisual count={game.drawPile.length} color={accentColor} label={lang === "de" ? "Ziehen" : "Draw"} />
            <DeckVisual count={game.discardPile.length} color="#f87171" label={lang === "de" ? "Ablage" : "Discard"} />
            <DeckVisual count={game.enemyDeck.length} color="#facc15" label={lang === "de" ? "Feinde" : "Enemies"} />
          </div>
          <div className="flex gap-1">
            <button onClick={() => setGameLayout("dashboard")} className={`${glass.btn} px-2 py-1 text-xs`}>⊞</button>
            <button onClick={() => setPaused(p => !p)} className={`${glass.btn} px-2 py-1 text-xs`}>{paused ? "▶" : "⏸"}</button>
          </div>
        </div>

        {paused && (
          <div className="rounded-2xl px-4 py-3 text-center" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <p className="text-white font-black">{lang === "de" ? "⏸ Pausiert" : "⏸ Paused"}</p>
          </div>
        )}

        {animMsg && (
          <div className="rounded-2xl px-4 py-2 text-center" style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)" }}>
            <p className="text-purple-200 font-black text-sm">{animMsg}</p>
          </div>
        )}

        {roundBanner && (
          <div className="rounded-2xl px-4 py-2" style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)" }}>
            <div className="flex items-center justify-between">
              <span className="text-green-300 font-black text-sm">✅ {roundBanner.enemy} {lang === "de" ? "besiegt!" : "defeated!"}</span>
              <button onClick={() => setRoundBanner(null)} className="text-white/30 text-xs hover:text-white/60">✕</button>
            </div>
            <p className="text-green-200/60 text-xs">{roundBanner.damage} dmg · {roundBanner.cards} {lang === "de" ? "Karten" : "cards"}</p>
          </div>
        )}

        <PlayerTurnBanner game={game} lang={lang} phase={phase} numPlayers={numPlayers} lastYielded={lastYielded} />

        <EnemyCard enemy={game.currentEnemy} lang={lang} tableCards={game.tableCards} shaking={enemyShaking} dying={enemyDying} damageByPlayer={game.damageByPlayer} players={game.players} />

        {/* Hand */}
        <div className={`${glass.panel} p-3`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs font-bold tracking-widest uppercase">{lang === "de" ? "Hand" : "Hand"} · {currentPlayer.name} ({currentPlayer.hand.length})</p>
            <div className="flex gap-1">
              {["default","value","suit"].map(s => (
                <button key={s} onClick={() => setHandSort(s)} className={`text-xs px-2 py-0.5 rounded-lg transition-all ${handSort === s ? "bg-white/20 text-white" : "text-white/30 hover:text-white/50"}`}>{s === "default" ? "↕" : s === "value" ? "#" : "♠"}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {sortedHand.map(card => (
              <PlayingCard
                key={card.id}
                card={card}
                selected={selectedCards.includes(card.id)}
                suggested={isDiscardTarget && suggestedIds.includes(card.id)}
                onClick={() => isDiscardTarget ? discardCardForDamage(card.id) : toggleCardSelection(card.id)}
                disabled={paused}
                isNew={newCardIds.has(card.id)}
                lang={lang}
              />
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className={`${glass.panel} p-3`}>{actionBar}</div>

        {/* Log */}
        <div className={`${glass.panel} p-3`}>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-1">Log</p>
          <div className="space-y-0.5" style={{ maxHeight: 80, overflowY: "auto" }}>
            {log.slice(0, 5).map((l, i) => (
              <p key={i} className="text-xs leading-relaxed" style={{ color: i === 0 && newLogIdx === 0 ? "#fff" : "rgba(255,255,255,0.4)" }}>{l}</p>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-xs text-center">v8.7</p>

        {/* Floating numbers */}
        <div className="fixed inset-0 pointer-events-none z-50">
          {floatingNums.map(f => (
            <div key={f.id} className={`absolute font-black ${f.size} select-none`}
              style={{ left: `${f.x}%`, top: "40%", color: f.color, textShadow: `0 0 20px ${f.color}`, animation: "floatUp 1.4s ease-out forwards" }}>
              {f.text}
            </div>
          ))}
        </div>

        {/* Achievement Toast */}
        {newAchievement && (
          <div className="fixed bottom-6 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl"
            style={{ background: "rgba(20,10,40,0.92)", border: "1.5px solid rgba(167,139,250,0.6)", backdropFilter: "blur(24px)", animation: "cardSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards", maxWidth: 280 }}>
            <span className="text-3xl">{newAchievement.icon}</span>
            <div>
              <p className="text-white font-black text-sm">{lang === "de" ? newAchievement.title_de : newAchievement.title_en}</p>
              <p className="text-white/50 text-xs">{lang === "de" ? newAchievement.desc_de : newAchievement.desc_en}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentTheme = CARD_THEMES[theme];

  return (
    <div style={{ minHeight: "100vh", background: currentTheme.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {screen === "menu"         && renderMenu()}
      {screen === "highscores"   && renderHighscores()}
      {screen === "achievements" && renderAchievements()}
      {screen === "rules"        && renderRules()}
      {screen === "victory"      && renderVictory()}
      {screen === "gameover"     && renderGameOver()}
      {screen === "game"         && renderGame()}
    </div>
  );
}
