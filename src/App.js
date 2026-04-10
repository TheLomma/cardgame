// v5.8 – Stabil (Doppel-Banner, doppelter Return, newDiscard-Fix)
// v5.7 – Bugfixes: Feind-Schaden-Spieler (Fix#1), Royal-Handkarten (Fix#2), doppeltes style (Fix#3)
import { useState, useRef, useEffect } from "react";

const SUITS = ["♥", "♦", "♣", "♠"];
const SUIT_COLORS = { "♥": "#e53e3e", "♦": "#e53e3e", "♣": "#1a202c", "♠": "#1a202c" };
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

// BUG FIX #2: Royals als Handkarten spielbar machen.
// Besiegte Royals kommen per newDraw auf den Stapel und können gezogen werden.
// getCardValue() gibt J=10, Q=15, K=20 zurück – Suit-Power wird normal angewendet.
// Damit toggleCardSelection und playCards korrekt funktionieren,
// behandeln wir Royals (type undefined) wie normale Karten (kein Jester, kein Animal).
function getRoyalHandValue(card) {
  if (card.rank === "J") return { value: 10, attack: 10 };
  if (card.rank === "Q") return { value: 15, attack: 15 };
  if (card.rank === "K") return { value: 20, attack: 20 };
  return null;
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
      <div className="flex items-center justify-between mb-1">
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
              <div key={pi} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: isDiscard ? "rgba(239,68,68,0.25)" : isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)", border: isDiscard ? "1.5px solid rgba(239,68,68,0.7)" : isActive ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)", transform: isActive ? "scale(1.05)" : "scale(1)", opacity: hasYielded && !isActive ? 0.5 : 1 }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ background: isActive ? "#fff" : "rgba(255,255,255,0.15)", color: isActive ? "#111" : "rgba(255,255,255,0.5)" }}>{pi + 1}</span>
                <span className="text-xs font-bold" style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.4)" }}>{player.name}</span>
                {isActive && <span style={{ color: phaseColor }}>▶</span>}
                {hasYielded && !isActive && <span className="text-white/30 text-xs">✓</span>}
                <span className="text-white/30 text-xs">({player.hand.length})</span>
              </div>
            );
          })}
        </div>
      )}
      {numPlayers === 1 && (
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: "#fff", color: "#111" }}>1</span>
          <span className="text-white font-bold text-sm">{game.players[0].name}</span>
          <span style={{ color: phaseColor }}>▶ {phaseLabel}</span>
          <span className="ml-auto text-white/30 text-xs">{game.players[0].hand.length} {lang === "de" ? "Karten" : "cards"}</span>
        </div>
      )}
    </div>
  );
}

// === FEATURE 1: Spieler-Rundenübersicht Banner – DUPE ===
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
// === END FEATURE 1 ===

function PlayingCard({ card, selected, onClick, disabled, small = false }) {
  const [hovered, setHovered] = useState(false);
  const isRed2 = card.suit === "\u2665" || card.suit === "\u2666";
  const suitPower = card.type !== "jester" ? (isRed2 ? (card.suit === "\u2665" ? SUIT_POWERS_DE["\u2665"] : SUIT_POWERS_DE["\u2666"]) : (card.suit === "\u2663" ? SUIT_POWERS_DE["\u2663"] : SUIT_POWERS_DE["\u2660"])) : null;
  const tooltipContent = card.type === "jester" ? "Jester: Immunität aufheben / Hand tauschen" : `${card.rank}${card.suit} | Wert: ${card.value} | Angriff: ${card.attack}${suitPower ? " | " + suitPower : ""}`;
  const ignored_isRed = isRed2; // suppress lint
  const isRed = card.suit === "\u2665" || card.suit === "\u2666";
  const isJester = card.type === "jester";
  const color = isJester ? "text-yellow-300" : isRed ? "text-red-300" : "text-white";
  const borderColor = isRed ? "rgba(252,165,165,0.5)" : "rgba(255,255,255,0.25)";

  if (small) {
    return (
      <div
        onClick={!disabled ? onClick : undefined}
        className={`relative cursor-pointer select-none transition-all duration-200 rounded-xl w-12 h-16 flex flex-col items-center justify-center ${
          selected ? "ring-2 ring-white -translate-y-2 shadow-lg" : disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1"
        }`}
        style={{
          background: selected ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)",
          border: `1px solid ${borderColor}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <span className={`text-xs font-black ${color}`}>{card.rank}</span>
        <span className={`text-base ${color}`}>{card.suit}</span>
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered && !small && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 p-2 rounded-xl text-xs text-white/90 pointer-events-none"
          style={{ background: "rgba(10,10,30,0.7)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(40px) saturate(180%)" }}>
          {tooltipContent}
        </div>
      )}
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative cursor-pointer select-none transition-all duration-200 rounded-2xl w-20 h-28 flex flex-col p-1.5 ${
        selected ? "ring-2 ring-white -translate-y-3 shadow-2xl" : disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-lg"
      }`}
      style={{
        background: selected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)",
        border: `1.5px solid ${borderColor}`,
        backdropFilter: "blur(18px)",
        boxShadow: selected
          ? "0 0 24px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.4)"
          : "inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
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

// Schritt 12 – Deck-Visualisierung
function DeckVisual({ count, color = "#a78bfa", label }) {
  const max = 5;
  const shown = Math.min(count, max);
  const cards = Array.from({ length: shown });
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 32, height: 44 }}>
        {cards.map((_, i) => (
          <div key={i} className="absolute rounded-lg border"
            style={{
              width: 28, height: 40,
              left: i * 1.5,
              top: i * -1.5,
              background: `rgba(255,255,255,0.08)`,
              border: `1px solid ${color}55`,
              boxShadow: i === shown - 1 ? `0 0 6px ${color}66` : undefined,
            }}
          />
        ))}
        {count === 0 && (
          <div className="absolute rounded-lg" style={{ width: 28, height: 40, border: `1px dashed ${color}33`, opacity: 0.4 }} />
        )}
      </div>
      <span className="font-black text-xs" style={{ color }}>{count}</span>
      <span className="text-xs opacity-50" style={{ color, fontSize: 9 }}>{label}</span>
    </div>
  );
}

// Schritt 11 – Animierter Feind-Übergang
function EnemyCard({ enemy, lang, tableCards = [] }) {
  const isRed = enemy.suit === "♥" || enemy.suit === "♦";
  const hpPct = Math.max(0, Math.min(100, (enemy.currentHp / enemy.hp) * 100));
  const hpColor = hpPct > 60 ? "#4ade80" : hpPct > 30 ? "#facc15" : "#f87171";

  const cumulativeDamage = (tableCards || []).reduce((s, c) => s + (c._dealtDamage || 0), 0);
  const damagePct = Math.max(0, Math.min(100, (cumulativeDamage / enemy.hp) * 100));

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [enemy.id]);

  return (
    <div className="rounded-2xl p-3 space-y-2 TURNORDER_ANCHOR"
      style={{
        transition: "opacity 0.4s ease, transform 0.4s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        background: "rgba(220,50,50,0.12)",
        backdropFilter: "blur(32px) saturate(180%)",
        border: "1.5px solid rgba(255,120,120,0.3)",
        boxShadow: "0 12px 48px rgba(220,50,50,0.2), inset 0 2px 0 rgba(255,180,180,0.35), inset 0 -1px 0 rgba(0,0,0,0.15)",
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl drop-shadow">{enemy.rank}</span>
          <span className={`text-2xl ${isRed ? "text-red-400" : "text-white"}`}>{enemy.suit}</span>
          <div>
            <p className="text-white font-black text-sm leading-tight">
              {lang === "de"
                ? enemy.rank === "J" ? "Bube" : enemy.rank === "Q" ? "Dame" : "König"
                : enemy.rank === "J" ? "Jack" : enemy.rank === "Q" ? "Queen" : "King"}
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
        <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${hpPct}%`, background: hpColor, boxShadow: `0 0 8px ${hpColor}` }} />
        </div>
      </div>
      {tableCards.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-white/70 text-xs font-semibold">{lang === "de" ? "Tisch:" : "Table:"}</span>
          {tableCards.map((c, i) => (
            <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-bold ${c.suit === "\u2665" || c.suit === "\u2666" ? "text-red-300 bg-red-900/30" : "text-white/80 bg-white/10"}`}>{c.rank}{c.suit}</span>
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
    attack: () => {
      playTone(180, "sawtooth", 0.08, 0.22);
      playTone(120, "square", 0.12, 0.12, 0.06);
    },
    bigAttack: () => {
      playTone(100, "sawtooth", 0.1, 0.28);
      playTone(70, "square", 0.18, 0.2, 0.07);
      playTone(140, "sawtooth", 0.08, 0.15, 0.15);
    },
    defeat: () => {
      playTone(440, "sine", 0.12, 0.2);
      playTone(330, "sine", 0.15, 0.18, 0.1);
      playTone(220, "sine", 0.25, 0.22, 0.22);
    },
    heal: () => {
      playTone(520, "sine", 0.1, 0.15);
      playTone(660, "sine", 0.12, 0.15, 0.1);
      playTone(780, "sine", 0.1, 0.12, 0.2);
    },
    draw: () => {
      playTone(600, "sine", 0.07, 0.12);
      playTone(750, "sine", 0.07, 0.1, 0.08);
    },
    shield: () => {
      playTone(300, "triangle", 0.1, 0.15);
      playTone(380, "triangle", 0.12, 0.13, 0.09);
    },
    victory: () => {
      [523, 659, 784, 1047].forEach((f, i) => playTone(f, "sine", 0.18, 0.2, i * 0.13));
    },
    gameover: () => {
      [220, 185, 155, 110].forEach((f, i) => playTone(f, "sawtooth", 0.22, 0.18, i * 0.15));
    },
    cardSelect: () => playTone(800, "sine", 0.05, 0.08),
    jester: () => {
      [600, 800, 1000, 800, 600].forEach((f, i) => playTone(f, "sine", 0.06, 0.1, i * 0.07));
    },
    yield: () => playTone(260, "triangle", 0.1, 0.1),
    discard: () => playTone(200, "sawtooth", 0.08, 0.12),
    enemyDefeated: () => {
      [392, 523, 659, 784].forEach((f, i) => playTone(f, "sine", 0.15, 0.22, i * 0.1));
    },
  };
  const [theme, setTheme] = useState("fantasy");
  const glass = {
    // Liquid Glass – stark transluzent, starker Blur, lebendige Innen-Highlights
    btn: "backdrop-blur-2xl bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1.5px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.3),inset_0_1.5px_0_rgba(255,255,255,0.55)]",
    btnPrimary: "backdrop-blur-2xl bg-white/25 border border-white/60 hover:bg-white/35 text-white font-black rounded-2xl transition-all duration-300 shadow-[0_8px_32px_rgba(255,255,255,0.15),inset_0_2px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:scale-105 hover:shadow-[0_12px_40px_rgba(255,255,255,0.25),inset_0_2px_0_rgba(255,255,255,0.8)]",
    btnDanger: "backdrop-blur-2xl bg-red-500/20 border border-red-400/40 hover:bg-red-500/30 text-white font-semibold rounded-2xl transition-all duration-300 shadow-[0_4px_24px_rgba(239,68,68,0.2),inset_0_1.5px_0_rgba(255,150,150,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)]",
    btnPurple: "backdrop-blur-2xl bg-purple-500/20 border border-purple-400/40 hover:bg-purple-500/30 text-white font-semibold rounded-2xl transition-all duration-300 shadow-[0_4px_24px_rgba(168,85,247,0.2),inset_0_1.5px_0_rgba(200,150,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)]",
    panel: "backdrop-blur-2xl bg-white/8 border border-white/20 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.35),inset_0_1.5px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.15)]",
    card: "backdrop-blur-xl bg-white/10 border border-white/25 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.1)]",
  };
  // Schritt 15 – Log-Animationen: neue Einträge tracken
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
  const [showRules, setShowRules] = useState(false);
  const [phase, setPhase] = useState("play");
  const [discardNeeded, setDiscardNeeded] = useState(0);
  const [discardedSoFar, setDiscardedSoFar] = useState(0);
  const [pendingNextPlayerIndex, setPendingNextPlayerIndex] = useState(null);
  const [roundStats, setRoundStats] = useState({ damage: 0, cards: 0, healed: 0 });
  const [lastRoundStats, setLastRoundStats] = useState(null);
  const [totalStats, setTotalStats] = useState({ damage: 0, cards: 0, enemies: 0 });

  // v3.7 – Highscores
  const [showHighscores, setShowHighscores] = useState(false);
  const loadHighscores = () => {
    try { return JSON.parse(localStorage.getItem("coupdeta_hs") || "[]"); } catch { return []; }
  };
  const saveHighscore = (entry) => {
    try {
      const list = loadHighscores();
      list.push(entry);
      list.sort((a, b) => b.score - a.score);
      localStorage.setItem("coupdeta_hs", JSON.stringify(list.slice(0, 10)));
    } catch {}
  };
  const clearHighscores = () => {
    try { localStorage.removeItem("coupdeta_hs"); } catch {}
  };

  // v3.4 – floating damage numbers
  const [floatingNums, setFloatingNums] = useState([]);
  const [enemyHit, setEnemyHit] = useState(false);
  const floatIdRef = useRef(0);

  const spawnFloat = (text, color = "#f87171", size = "text-3xl") => {
    const id = floatIdRef.current++;
    const x = 40 + Math.random() * 20;
    setFloatingNums(prev => [...prev, { id, text, color, size, x }]);
    setTimeout(() => setFloatingNums(prev => prev.filter(f => f.id !== id)), 1400);
  };

  const triggerEnemyHit = () => {
    setEnemyHit(true);
    setTimeout(() => setEnemyHit(false), 400);
  };

  const addLog = (msg) => {
    setLog((prev) => [msg, ...prev].slice(0, 20));
    setNewLogIdx(0);
    setTimeout(() => setNewLogIdx(-1), 600);
  };

  // v4.0 – Pause Menu
  const [paused, setPaused] = useState(false);

  // v3.8 – Keyboard Shortcuts
  useEffect(() => {
    const handler = (e) => {
      // ignore when typing in inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (screen === "game" && game) {
        const currentPlayer = game.players[game.currentPlayerIndex];

        // 1–8: toggle card by index
        if (e.key >= "1" && e.key <= "8") {
          const idx = parseInt(e.key) - 1;
          if (idx < currentPlayer.hand.length && phase === "play") {
            toggleCardSelection(currentPlayer.hand[idx].id);
          }
          return;
        }

        // Enter or Space: play selected cards
        if ((e.key === "Enter" || e.key === " ") && phase === "play") {
          e.preventDefault();
          if (selectedCards.length > 0) playCards();
          return;
        }

        // Y or P: yield / pass
        if ((e.key === "y" || e.key === "Y" || e.key === "p" || e.key === "P") && phase === "play") {
          yieldTurn();
          return;
        }

        // Escape: deselect all
        if (e.key === "Escape") {
          setSelectedCards([]);
          return;
        }

        // J: use solo jester (phase play)
        if ((e.key === "j" || e.key === "J") && numPlayers === 1 && soloJestersAvail > 0 && phase === "play") {
          soloFlipJester("step1");
          return;
        }

        // J: use solo jester (phase discard)
        if ((e.key === "j" || e.key === "J") && numPlayers === 1 && soloJestersAvail > 0 && phase === "discard") {
          soloFlipJester("step4");
          return;
        }
      }

      // M: back to menu from any non-game screen
      if (e.key === "m" || e.key === "M") {
        if (screen !== "game") setScreen("menu");
      }

      // P: pause toggle in game
      if ((e.key === "Escape" || e.key === "p" || e.key === "P") && screen === "game" && phase === "play") {
        if (e.key === "Escape" && selectedCards.length > 0) { setSelectedCards([]); return; }
        if (e.key === "p" || e.key === "P") { setPaused(prev => !prev); return; }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, game, phase, selectedCards, numPlayers, soloJestersAvail]);

  const showAnim = (msg, duration = 2000) => {
    setAnimMsg(msg);
    setTimeout(() => setAnimMsg(""), duration);
  };

  const initGame = () => {
    const playerDeck = shuffle(createDeck(numPlayers));
    const enemyDeck = shuffle(createEnemyDeck());
    const jacks = shuffle(enemyDeck.filter((e) => e.rank === "J"));
    const queens = shuffle(enemyDeck.filter((e) => e.rank === "Q"));
    const kings = shuffle(enemyDeck.filter((e) => e.rank === "K"));
    const orderedEnemies = [...jacks, ...queens, ...kings];
    const handSize = getHandSize(numPlayers);
    const players = [];
    let remaining = [...playerDeck];
    for (let i = 0; i < numPlayers; i++) {
      players.push({ id: i, name: `${t(lang, "Spieler", "Player")} ${i + 1}`, hand: remaining.splice(0, handSize) });
    }
    const newGame = {
      players,
      drawPile: remaining,
      discardPile: [],
      enemyDeck: orderedEnemies.slice(1),
      currentEnemy: { ...orderedEnemies[0] },
      currentPlayerIndex: 0,
      tableCards: [],
      won: false,
      lost: false,
    };
    setSoloJestersUsed(0);
    setSoloJestersAvail(numPlayers === 1 ? 2 : 0);
    setLastYielded([]);
    setGame(newGame);
    setSelectedCards([]);
    setLog([]);
    setPhase("play");
    setDiscardNeeded(0);
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
      // Jester immer allein
      if (clickedCard.type === "jester" || firstCard.type === "jester") return [cardId];
      const isFirstAnimal = firstCard.rank === "A";
      const isClickedAnimal = clickedCard.rank === "A";
      // BUG FIX #2: Royals (J/Q/K) können nicht in Combos kombiniert werden (Wert > 10)
      const isFirstRoyal = ["J","Q","K"].includes(firstCard.rank);
      const isClickedRoyal = ["J","Q","K"].includes(clickedCard.rank);
      if (isFirstRoyal || isClickedRoyal) return [cardId]; // Royals immer allein spielen
      if (isFirstAnimal || isClickedAnimal) {
        if (prev.length === 1) return [...prev, cardId];
        return [cardId];
      }
      if (firstCard.rank !== clickedCard.rank) return [cardId];
      const allSelected = [...prev, cardId];
      const comboTotal = allSelected.reduce((s, id) => {
        const c = currentHand.find((x) => x.id === id);
        return s + (c ? getCardValue(c) : 0);
      }, 0);
      if (comboTotal > 10) {
        addLog(t(lang, "Kombo-Gesamtwert darf 10 nicht überschreiten!", "Combo total value must not exceed 10!"));
        return prev;
      }
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
    if (hasClubs && !enemyImmuneToClubs) return base * 2;
    return base;
  };

  const applyHearts = (g, cards, baseAttack) => {
    const heartsCards = cards.filter((c) => c.suit === "♥" && c.type !== "jester");
    if (heartsCards.length === 0) return g;
    const enemyImmuneToHearts = g.currentEnemy.suit === "♥" && !g.currentEnemy.jesterCancelled;
    if (enemyImmuneToHearts) { addLog(t(lang, "♥ Immunität – Heilung blockiert", "♥ Immune – heal blocked")); return g; }
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
    const enemyImmuneToD = g.currentEnemy.suit === "♦" && !g.currentEnemy.jesterCancelled;
    if (enemyImmuneToD) { addLog(t(lang, "♦ Immunität – Ziehen blockiert", "♦ Immune – draw blocked")); return { g, players }; }
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
      }
    }
    if (drawn > 0) sfx.draw();
    if (drawn > 0) spawnFloat(`+${drawn} ♦`, "#60a5fa", "text-3xl");
    addLog(`♦ ${t(lang, `${drawn} Karten gezogen`, `${drawn} cards drawn`)}`);
    return { g: { ...g, drawPile }, players: newPlayers };
  };

  const applySpades = (g, cards, enemy, baseAttack) => {
    const spadeCards = cards.filter((c) => c.suit === "♠" && c.type !== "jester");
    if (spadeCards.length === 0) return enemy;
    const enemyImmuneToS = enemy.suit === "♠" && !enemy.jesterCancelled;
    if (enemyImmuneToS) { addLog(t(lang, "♠ Immunität – Schild blockiert", "♠ Immune – shield blocked")); return enemy; }
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
    const maxHand = 8;
    let drawPile = [...game.drawPile];
    const discardPile = [...game.discardPile, ...game.players[0].hand];
    const newHand = drawPile.splice(0, maxHand);
    const newPlayers = [{ ...game.players[0], hand: newHand }];
    setSoloJestersUsed((p) => p + 1);
    setSoloJestersAvail((p) => p - 1);
    addLog(t(lang, `🃏 Jester umgedreht! Hand neu gezogen (${newHand.length} Karten).`, `🃏 Jester flipped! Hand refilled (${newHand.length} cards).`));
    setGame({ ...game, players: newPlayers, drawPile, discardPile });
    if (timing === "step4") {
      addLog(t(lang, `⚠️ Schaden (${discardNeeded}) muss noch mit der neuen Hand bezahlt werden!`, `⚠️ Damage (${discardNeeded}) still needs to be paid with the new hand!`));
    }
  };

  const playJester = () => {
    sfx.jester();
    if (!game) return;
    const selectedIds = [...selectedCards];
    let players = game.players.map((p, i) =>
      i === game.currentPlayerIndex ? { ...p, hand: p.hand.filter((c) => !selectedIds.includes(c.id)) } : p
    );
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
    addLog(`🗑 ${t(lang, `Abgeworfen: ${card.rank}${card.suit !== "🃏" ? card.suit : ""} (Wert: ${cardValue}), noch ${Math.max(0, newDiscardNeeded)} nötig`, `Discarded: ${card.rank}${card.suit !== "🃏" ? card.suit : ""} (value: ${cardValue}), still need ${Math.max(0, newDiscardNeeded)}`)}`);
    let newPlayers = game.players.map((p, i) => i === game.currentPlayerIndex ? { ...p, hand: newHand } : p);
    if (newDiscardNeeded <= 0) {
      let drawPile = [...game.drawPile];
      const maxHand = getHandSize(numPlayers);
      const currP = { ...newPlayers[game.currentPlayerIndex] };
      while (currP.hand.length < maxHand && drawPile.length > 0) currP.hand.push(drawPile.shift());
      newPlayers[game.currentPlayerIndex] = currP;
      const nextAfterDiscard = game._nextPlayerAfterDiscard ?? (game.currentPlayerIndex + 1) % numPlayers;
      let drawPile2 = [...game.drawPile];
      if (drawPile2.length === 0 && game.discardPile.length > 0) {
        drawPile2 = shuffle([...newDiscard]);
        newDiscard = [];
        addLog(t(lang, "🔄 Nachziehstapel leer – Ablage gemischt!", "🔄 Draw pile empty – discard reshuffled!"));
      }
      while (newPlayers[game.currentPlayerIndex].hand.length < getHandSize(numPlayers) && drawPile2.length > 0) {
        newPlayers[game.currentPlayerIndex] = { ...newPlayers[game.currentPlayerIndex], hand: [...newPlayers[game.currentPlayerIndex].hand, drawPile2.shift()] };
      }
      addLog(t(lang, "✅ Schaden bezahlt! Nächster Spieler.", "✅ Damage paid! Next player."));
      const stateAfterDiscard = { ...game, players: newPlayers, discardPile: newDiscard, drawPile: drawPile2, currentPlayerIndex: nextAfterDiscard, _nextPlayerAfterDiscard: undefined };
      if (!checkCanActAndTriggerLose(stateAfterDiscard, nextAfterDiscard, lastYielded)) {
        setGame(stateAfterDiscard);
      }
      setPhase("play");
      setDiscardNeeded(0);
      setDiscardedSoFar(0);
      setPendingNextPlayerIndex(null);
    } else {
      const totalCardsLeft = newPlayers.reduce((s, p) => s + p.hand.length, 0);
      if (totalCardsLeft === 0 && newDiscardNeeded > 0) {
        setGame({ ...game, players: newPlayers, discardPile: newDiscard, lost: true });
        setScreen("gameover");
        return;
      }
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
      // BUG FIX #2: Royals dürfen nicht kombiniert werden
      const hasRoyal = cards.some((c) => ["J","Q","K"].includes(c.rank));
      if (hasRoyal) { addLog(t(lang, "Ungültig: Royals müssen allein gespielt werden!", "Invalid: Royals must be played alone!")); return; }
      const animals = cards.filter((c) => c.rank === "A");
      if (animals.length > 0) {
        if (cards.length > 2) { addLog(t(lang, "Ungültig: Tier-Begleiter nur mit 1 weiteren Karte!", "Invalid: Animal companion can only pair with 1 other card!")); return; }
      } else {
        const ranks = [...new Set(cards.map((c) => c.rank))];
        if (ranks.length > 1) { addLog(t(lang, "Ungültig: Nur Karten gleichen Rangs!", "Invalid: Only same-rank cards!")); return; }
        const comboTotal = cards.reduce((s, c) => s + getCardValue(c), 0);
        if (comboTotal > 10) { addLog(t(lang, "Ungültig: Kombo-Gesamtwert > 10!", "Invalid: Combo total > 10!")); return; }
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
    if (attack >= 20) sfx.bigAttack(); else sfx.attack();
    triggerEnemyHit();
    spawnFloat(`-${attack}`, attack >= 20 ? "#fbbf24" : attack >= 10 ? "#f87171" : "#fb923c", attack >= 20 ? "text-5xl" : attack >= 10 ? "text-4xl" : "text-3xl");
    addLog(`⚔️ ${t(lang, `Angriff: ${attack} Schaden → ${enemy.rank}${enemy.suit} (HP: ${enemy.currentHp} → ${Math.max(0, newHp)})`, `Attack: ${attack} damage → ${enemy.rank}${enemy.suit} (HP: ${enemy.currentHp} → ${Math.max(0, newHp)})`)}`);
    g = applyHearts({ ...g, players }, cards, baseAttack);
    players = g.players || players;
    const diamondResult = applyDiamonds(g, cards, players, baseAttack);
    g = diamondResult.g;
    players = diamondResult.players;
    enemy = applySpades(g, cards, enemy, baseAttack);
    let tableCards = [...g.tableCards, ...taggedCards];
    if (newHp <= 0) {
      const finishedStats = { damage: roundStats.damage + attack, cards: roundStats.cards, healed: roundStats.healed };
      setLastRoundStats(finishedStats);
      setTotalStats(prev => ({ damage: prev.damage + finishedStats.damage, cards: prev.cards + finishedStats.cards, enemies: prev.enemies + 1 }));
      setRoundStats({ damage: 0, cards: 0, healed: 0 });
      sfx.enemyDefeated();
      spawnFloat("👑 BESIEGT!", "#fbbf24", "text-4xl");
      showAnim(t(lang, `🎉 ${enemy.rank}${enemy.suit} BESIEGT! 👑✨`, `🎉 ${enemy.rank}${enemy.suit} DEFEATED! 👑✨`), 2500);
      addLog(t(lang, `Feind besiegt: ${enemy.rank}${enemy.suit}`, `Enemy defeated: ${enemy.rank}${enemy.suit}`));
      let newDiscard = [...g.discardPile];
      let newDraw = [...g.drawPile];
      if (newHp === 0) {
        newDraw = [{ ...enemy }, ...newDraw];
        newDiscard = [...newDiscard, ...tableCards];
        addLog(t(lang, "Genau besiegt – Feind oben auf Nachziehstapel!", "Exactly defeated – enemy placed on top of draw pile!"));
      } else {
        newDiscard = [...newDiscard, ...tableCards, { ...enemy }];
        addLog(t(lang, "Overkill – Karten auf Ablage.", "Overkill – cards to discard."));
      }
      if (g.enemyDeck.length === 0) {
        sfx.victory();
        const finalStats = { ...totalStats, damage: totalStats.damage + (roundStats.damage + attack), cards: totalStats.cards + (roundStats.cards), enemies: totalStats.enemies + 1 };
        const hsEntry = {
          date: new Date().toLocaleDateString(lang === "de" ? "de-DE" : "en-GB"),
          players: numPlayers,
          won: true,
          enemies: finalStats.enemies,
          damage: finalStats.damage,
          cards: finalStats.cards,
          jesters: soloJestersUsed,
          score: finalStats.damage + finalStats.enemies * 50 + (soloJestersUsed === 0 ? 100 : 0),
        };
        saveHighscore(hsEntry);
        setGame({ ...g, players, discardPile: newDiscard, drawPile: newDraw, tableCards: [], won: true });
        setScreen("victory");
        return;
      }
      const nextEnemy = { ...g.enemyDeck[0], currentHp: g.enemyDeck[0].hp };
      const remainingEnemies = g.enemyDeck.slice(1);
      const maxHand = getHandSize(numPlayers);
      let drawPile = [...newDraw];
      for (let i = 0; i < numPlayers; i++) {
        const pi = (g.currentPlayerIndex + i) % numPlayers;
        const p = { ...players[pi] };
        while (p.hand.length < maxHand && drawPile.length > 0) p.hand.push(drawPile.shift());
        players[pi] = p;
      }
      setLastYielded([]);
      const newGameStateAfterDefeat = { ...g, players, drawPile, discardPile: newDiscard, enemyDeck: remainingEnemies, currentEnemy: nextEnemy, tableCards: [] };
      if (!checkCanActAndTriggerLose(newGameStateAfterDefeat, g.currentPlayerIndex, [])) {
        setGame(newGameStateAfterDefeat);
      }
      setPhase("play");
    } else {
      enemy.currentHp = newHp;
      const incomingDamage = enemy.attack;
      const nextPlayerIndex = (g.currentPlayerIndex + 1) % numPlayers;
      if (incomingDamage <= 0) {
        let drawPile = [...g.drawPile];
        const maxHand = getHandSize(numPlayers);
        const currP = { ...players[g.currentPlayerIndex] };
        while (currP.hand.length < maxHand && drawPile.length > 0) currP.hand.push(drawPile.shift());
        players[g.currentPlayerIndex] = currP;
        const stateNoAttack = { ...g, players, drawPile, currentEnemy: enemy, currentPlayerIndex: nextPlayerIndex, tableCards };
        if (!checkCanActAndTriggerLose(stateNoAttack, nextPlayerIndex, lastYielded)) {
          setGame(stateNoAttack);
        }
        setPhase("play");
        setDiscardNeeded(0);
        setDiscardedSoFar(0);
      } else {
        // FIX #1: Aktueller Spieler leidet Schaden – currentPlayerIndex bleibt beim Abwerfenden
        addLog(`👿 ${t(lang, `${enemy.rank}${enemy.suit} greift an: ${incomingDamage} Schaden!`, `${enemy.rank}${enemy.suit} attacks for ${incomingDamage} damage!`)}`);
        showAnim(t(lang, `⚠️ ${incomingDamage} Schaden – Karten abwerfen!`, `⚠️ ${incomingDamage} damage – discard cards!`));
        setGame({ ...g, players, currentEnemy: enemy, currentPlayerIndex: g.currentPlayerIndex, tableCards, _nextPlayerAfterDiscard: nextPlayerIndex });
        setPhase("discard");
        setDiscardNeeded(incomingDamage);
        setDiscardedSoFar(0);
        setPendingNextPlayerIndex(nextPlayerIndex);
      }
    }
  };

  const yieldTurn = () => {
    if (!game || phase !== "play") return;
    sfx.yield();
    const otherPlayers = game.players.map((_, i) => i).filter((i) => i !== game.currentPlayerIndex);
    const allOthersYielded = otherPlayers.length > 0 && otherPlayers.every((i) => lastYielded.includes(i));
    // Yield-Loop-Schutz: verhindere Endlosschleife wenn alle gepasst haben
    if (numPlayers === 1) { addLog(t(lang, "Solo: kein Passen möglich!", "Solo: cannot yield!")); return; }
    if (allOthersYielded && numPlayers > 1) {
      addLog(t(lang, "Passen nicht möglich – alle anderen haben bereits gepasst!", "Cannot yield – all others already yielded!"));
      return;
    }
    if (game.players[game.currentPlayerIndex].hand.length === 0) {
      addLog(t(lang, "Keine Karten und kein Passen möglich – Niederlage!", "No cards and cannot yield – defeat!"));
      setGame({ ...game, lost: true });
      setScreen("gameover");
      return;
    }
    setLastYielded((prev) => [...prev.filter((i) => i !== game.currentPlayerIndex), game.currentPlayerIndex]);
    addLog(t(lang, `Spieler ${game.currentPlayerIndex + 1} passt.`, `Player ${game.currentPlayerIndex + 1} yields.`));
    const enemy = game.currentEnemy;
    const incomingDamage = enemy.attack;
    const nextPlayerIndex = (game.currentPlayerIndex + 1) % numPlayers;
    setSelectedCards([]);
    if (incomingDamage <= 0) {
      setGame({ ...game, currentPlayerIndex: nextPlayerIndex });
      setPhase("play");
    } else {
      addLog(`👿 ${t(lang, `${enemy.rank}${enemy.suit} greift an: ${incomingDamage} Schaden!`, `${enemy.rank}${enemy.suit} attacks for ${incomingDamage} damage!`)}`);
      showAnim(t(lang, `⚠️ ${incomingDamage} Schaden – Karten abwerfen!`, `⚠️ ${incomingDamage} damage – discard cards!`));
      setGame({ ...game, currentPlayerIndex: nextPlayerIndex });
      setPhase("discard");
      setDiscardNeeded(incomingDamage);
      setDiscardedSoFar(0);
      setPendingNextPlayerIndex(nextPlayerIndex);
    }
  };

  const getAutoDiscardSuggestion = (hand, needed) => {
    // find minimal set of cards that covers 'needed' damage
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

  const PauseOverlay = () => !paused ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(0,0,0,0.75)",backdropFilter:"blur(12px)"}}
      onClick={(e)=>{if(e.target===e.currentTarget)setPaused(false);}}>
      <div className="w-full max-w-md rounded-3xl p-6 space-y-4"
        style={{background:"rgba(15,12,41,0.55)",backdropFilter:"blur(48px) saturate(200%)",border:"1.5px solid rgba(255,255,255,0.22)",boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)"}}>
        <div className="text-center">
          <div className="text-4xl mb-1">⏸</div>
          <h2 className="text-2xl font-black text-white">{t(lang,"Pause","Paused")}</h2>
          <p className="text-white/40 text-xs mt-1">{t(lang,"Drücke P oder klicke außerhalb zum Fortfahren","Press P or click outside to resume")}</p>
        </div>
        {game && <div className="grid grid-cols-2 gap-2">
          {[
            {icon:"⚔️",labelDe:"Schaden (Runde)",labelEn:"Damage (round)",value:roundStats.damage,color:"#f87171"},
            {icon:"👑",labelDe:"Feinde besiegt",labelEn:"Enemies defeated",value:totalStats.enemies,color:"#fbbf24"},
            {icon:"🃏",labelDe:"Karten gespielt",labelEn:"Cards played",value:totalStats.cards,color:"#60a5fa"},
            {icon:"💚",labelDe:"Geheilt",labelEn:"Healed",value:totalStats.healed||0,color:"#34d399"},
            {icon:"🗂",labelDe:"Stapel",labelEn:"Draw pile",value:game.drawPile.length,color:"#a78bfa"},
            {icon:"🗑",labelDe:"Ablage",labelEn:"Discard",value:game.discardPile.length,color:"#fb923c"},
          ].map((s,i)=>(
            <div key={i} className="rounded-xl p-3 flex items-center gap-3"
              style={{background:"rgba(255,255,255,0.07)",backdropFilter:"blur(16px)",border:`1px solid ${s.color}33`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.2)`}}>
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="font-black text-lg leading-none" style={{color:s.color}}>{s.value}</div>
                <div className="text-white/75 text-xs mt-0.5">{lang==="de"?s.labelDe:s.labelEn}</div>
              </div>
            </div>
          ))}
        </div>}
        {game && <div className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{background:"rgba(220,50,50,0.15)",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,100,100,0.3)",boxShadow:"inset 0 1.5px 0 rgba(255,150,150,0.25), 0 4px 20px rgba(220,50,50,0.15)"}}>
          <span className="text-2xl">{game.currentEnemy.rank}{game.currentEnemy.suit}</span>
          <div className="flex-1">
            <div className="text-white font-bold text-sm">{lang==="de"?(game.currentEnemy.rank==="J"?"Bube":game.currentEnemy.rank==="Q"?"Dame":"König"):(game.currentEnemy.rank==="J"?"Jack":game.currentEnemy.rank==="Q"?"Queen":"King")} · ⚔️ {game.currentEnemy.attack}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 rounded-full h-1.5" style={{background:"rgba(255,255,255,0.1)"}}>
                <div className="h-1.5 rounded-full" style={{width:`${Math.max(0,(game.currentEnemy.currentHp/game.currentEnemy.hp)*100)}%`,background:"#f87171"}} />
              </div>
              <span className="text-white/50 text-xs">{game.currentEnemy.currentHp}/{game.currentEnemy.hp} HP</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/75 text-xs font-semibold">{t(lang,"Feinde","Enemies")}</div>
            <div className="text-white font-bold">{game.enemyDeck.length+1}</div>
          </div>
        </div>}
        <div className="flex items-center justify-between">
          <span className="text-white/85 text-sm font-semibold">{t(lang,"Sound","Sound")}</span>
          <div className="flex gap-2">
            <button onClick={()=>setSoundEnabled(false)} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${!soundEnabled?"bg-white/90 text-gray-900":glass.btn}`}>🔇 {t(lang,"Aus","Off")}</button>
            <button onClick={()=>setSoundEnabled(true)} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${soundEnabled?"bg-white/90 text-gray-900":glass.btn}`}>🔊 {t(lang,"An","On")}</button>
          </div>
        </div>
        <div className="rounded-xl px-4 py-3 space-y-1.5" style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.15)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.12)"}}>
          <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-2">Shortcuts</p>
          {[["1–8",t(lang,"Karte wählen","Select card")],["↵",t(lang,"Spielen","Play")],["Y",t(lang,"Passen","Yield")],["Esc",t(lang,"Abwählen","Deselect")],["P",t(lang,"Pause","Pause")],...(numPlayers===1&&soloJestersAvail>0?[["J","Jester"]]:[])].map(([key,desc],i)=>(
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
  );

  const checkCanActAndTriggerLose = (g, playerIdx, lyielded) => {
    const player = g.players[playerIdx];
    if (player.hand.length > 0) return false;
    const others = g.players.map((_, i) => i).filter((i) => i !== playerIdx);
    const allOthersYielded = others.length > 0 && others.every((i) => lyielded.includes(i));
    if (allOthersYielded || others.length === 0) {
      sfx.gameover();
      const hsEntryLoss = {
        date: new Date().toLocaleDateString(lang === "de" ? "de-DE" : "en-GB"),
        players: numPlayers,
        won: false,
        enemies: totalStats.enemies,
        damage: totalStats.damage,
        cards: totalStats.cards,
        jesters: soloJestersUsed,
        score: totalStats.damage + totalStats.enemies * 50,
      };
      saveHighscore(hsEntryLoss);
      addLog(t(lang, "Keine Karten und kein Passen möglich – Niederlage!", "No cards and cannot yield – defeat!"));
      setGame({ ...g, lost: true });
      setScreen("gameover");
      return true;
    }
    return false;
  };

  if (screen === "game" && game) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    const selectedCardObjs = selectedCards.map((id) => currentPlayer.hand.find((c) => c.id === id)).filter(Boolean);
    const attackValue = calcAttack(selectedCardObjs, game.currentEnemy);
    const enemiesLeft = game.enemyDeck.length + 1;

    return (
      <div className="min-h-screen p-2 md:p-4 relative overflow-hidden" style={{ background: (CARD_THEMES[theme]||CARD_THEMES.fantasy).bg }}>
        <PauseOverlay />
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => { setScreen("menu"); setGame(null); }} className={`px-3 py-1.5 text-sm font-bold ${glass.btn}`}>← {t(lang,"Menü","Menu")}</button>
              <button onClick={() => setPaused(true)} className={`px-3 py-1.5 text-sm font-bold ${glass.btn}`}>⏸ {t(lang,"Pause","Pause")}</button>
            </div>
            <div className="flex gap-2 text-xs flex-wrap justify-center">
              <span className="text-white/90 font-semibold">👑 <span className="text-yellow-300 font-black">{enemiesLeft}</span></span>
              <span className="text-white/90 font-semibold">🃏 <span className="text-blue-200 font-black">{game.drawPile.length}</span></span>
              <span className="text-white/90 font-semibold">🗑 <span className="text-orange-200 font-black">{game.discardPile.length}</span></span>
            </div>
            <div className="text-white/70 text-xs font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-lg">{phase}</div>
          </div>
          <EnemyCard enemy={game.currentEnemy} lang={lang} tableCards={game.tableCards} />
          <div className="p-2 md:p-3 rounded-xl" style={{background:"rgba(26,26,60,0.4)",backdropFilter:"blur(32px) saturate(180%)",border:"1.5px solid rgba(201,168,76,0.35)",borderRadius:16,boxShadow:"0 8px 40px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,220,100,0.15), inset 0 -1px 0 rgba(0,0,0,0.15)"}}>
            <div className="flex items-center gap-2 flex-wrap">
              {phase==="jester" && (
                <div className="flex-1 px-3 py-2 rounded-xl" style={{background:"rgba(168,85,247,0.15)",backdropFilter:"blur(20px)",border:"1.5px solid rgba(168,85,247,0.35)",boxShadow:"inset 0 1.5px 0 rgba(220,180,255,0.25), 0 4px 20px rgba(168,85,247,0.15)"}}>
                  <p className="text-purple-200 font-bold text-sm">🃏 {t(lang,"Jester! Wähle nächsten Spieler:","Jester! Choose next player:")}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {game.players.map((_,pi)=>(<button key={pi} onClick={()=>chooseNextPlayer(pi)} className={`px-3 py-1 text-white/90 text-sm font-bold rounded-lg ${glass.btnPurple}`}>{t(lang,`Spieler ${pi+1}`,`Player ${pi+1}`)}</button>))}
                  </div>
                </div>
              )}
              {phase==="discard" && (
                <div className="flex-1 px-3 py-2 rounded-xl" style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)"}}>
                  <p className="text-red-300 font-bold text-sm">⚠️ {t(lang,"Schaden abdecken!","Cover damage!")}</p>
                  <p className="text-white/70 text-xs">{t(lang,`Noch ${Math.ceil(discardNeeded)} Schaden zu decken`,`Still ${Math.ceil(discardNeeded)} damage to cover`)}</p>
                </div>
              )}
              {phase==="play" && selectedCards.length>0 && (
                <div className="text-sm text-white/70">
                  {selectedCards.length} {t(lang,"Karte(n)","card(s)")} · <span className="text-white font-bold">⚔️ {attackValue}</span>
                </div>
              )}
              <div className="flex gap-2 ml-auto flex-wrap">
                {phase==="play" && selectedCards.length>0 && (<button onClick={()=>setSelectedCards([])} className={`px-3 py-2 text-white/80 text-sm ${glass.btn}`}>{t(lang,"Abwählen","Deselect")} <kbd className="opacity-40 text-xs">Esc</kbd></button>)}
                {numPlayers===1&&soloJestersAvail>0&&phase==="play" && (<button onClick={()=>soloFlipJester("step1")} className={`px-3 py-2 text-sm font-bold ${glass.btnPurple}`}>🃏 {t(lang,`Jester (${soloJestersAvail}x)`,`Jester (${soloJestersAvail}x)`)}</button>)}
                {numPlayers===1&&soloJestersAvail>0&&phase==="discard" && (<button onClick={()=>soloFlipJester("step4")} className={`px-3 py-2 text-sm font-bold ${glass.btnPurple}`}>🃏 {t(lang,`Jester tauschen (${soloJestersAvail}x)`,`Jester swap (${soloJestersAvail}x)`)}</button>)}
                {phase==="play" && (<><button onClick={yieldTurn} className={`px-4 py-2 font-bold text-sm ${glass.btn}`}>{t(lang,"Passen","Yield")} <kbd className="opacity-40 text-xs ml-1">Y</kbd></button><button onClick={playCards} disabled={selectedCards.length===0} className={`px-6 py-2 font-bold text-sm rounded-xl transition-all ${selectedCards.length>0?glass.btnPrimary:"opacity-30 cursor-not-allowed bg-white/10 text-white/30 border border-white/10 rounded-xl"}`}>⚔️ {t(lang,"Spielen","Play")} <kbd className="opacity-40 text-xs ml-1">↵</kbd></button></>)}
                {phase==="discard" && (<span className="text-red-300 text-sm font-bold animate-pulse">👆 {t(lang,"Karte anklicken","Click a card")}</span>)}
              </div>
            </div>
          </div>
          {/* Schritt 17 – Mobile: Shortcut-Bar nur auf md+ */}
          {phase==="play"&&(<div className="hidden md:flex gap-1.5 flex-wrap px-1 items-center" style={{opacity:0.38}}>{currentPlayer.hand.slice(0,8).map((_,i)=>(<kbd key={i} className="text-xs font-mono px-1.5 py-0.5 rounded text-white bg-white/10">{i+1}</kbd>))}<span className="text-xs ml-1 text-white/50">· {t(lang,"wählen","select")}</span><span className="mx-2 text-white/20">|</span><kbd className="text-xs font-mono px-1.5 py-0.5 rounded text-white bg-white/10">↵</kbd><span className="text-xs text-white/50">{t(lang,"spielen","play")}</span><kbd className="text-xs font-mono px-1.5 py-0.5 rounded text-white bg-white/10">Y</kbd><span className="text-xs text-white/50">{t(lang,"passen","yield")}</span><kbd className="text-xs font-mono px-1.5 py-0.5 rounded text-white bg-white/10">P</kbd><span className="text-xs text-white/50">{t(lang,"pause","pause")}</span></div>)}
          <div className="space-y-2">
            {game.players.map((player,pi)=>{
              const isActive=pi===game.currentPlayerIndex;
              const isDiscardTarget=phase==="discard"&&isActive;
              const suggestedIds=isDiscardTarget?getAutoDiscardSuggestion(player.hand,discardNeeded):[];
              return(
                <div key={pi} className="rounded-2xl p-2 md:p-3 transition-all" style={{background:isDiscardTarget?"rgba(239,68,68,0.18)":isActive?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.05)",backdropFilter:"blur(20px)",border:isDiscardTarget?"2px solid rgba(239,68,68,0.6)":isActive?"1px solid rgba(255,255,255,0.4)":"1px solid rgba(255,255,255,0.1)"}}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive?"bg-white/90 text-gray-900":"bg-white/15 text-white"}`}>{pi+1}</span>
                      <span className={`font-bold text-sm ${isActive?"text-white":"text-white/50"}`}>{player.name}{isActive?` (${t(lang,"am Zug","active")})`:""}</span>
                    </div>
                    <span className="text-white/40 text-xs">{player.hand.length} {t(lang,"Karten","cards")}</span>
                    {isDiscardTarget&&<span className="text-red-300 text-xs font-black animate-pulse">⚠️ {t(lang,"Abwerfen!","Discard!")}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                    {player.hand.map((card,cardIdx)=>(
                      <div key={card.id} className="relative">
                        {isActive&&phase==="play"&&cardIdx<8&&(<span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-white/40 font-black pointer-events-none" style={{fontSize:9}}>{cardIdx+1}</span>)}
                        <PlayingCard card={card} selected={selectedCards.includes(card.id)||(isDiscardTarget&&suggestedIds.includes(card.id))} onClick={()=>{if(phase==="discard"&&isActive)discardCardForDamage(card.id);else if(phase==="play"&&isActive)toggleCardSelection(card.id);}} disabled={!isActive||(phase!=="play"&&phase!=="discard")} small={!isActive} />
                      </div>
                    ))}
                    {player.hand.length===0&&<span className="text-white/30 text-sm italic">{t(lang,"Keine Karten","No cards")}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Schritt 15 – Animierter Log */}
          <div className="rounded-lg p-3 max-h-32 overflow-y-auto" style={{background:"rgba(0,0,0,0.5)",border:"1px solid rgba(201,168,76,0.2)"}}>
          <p className="text-xs mb-1 font-bold tracking-widest uppercase" style={{color:"rgba(201,168,76,0.7)"}}>{t(lang,"Log","Log")}</p>
            {log.map((entry,i)=>{
              const isDefeat=entry.includes("besiegt")||entry.includes("defeated");
              const isAttack=entry.includes("⚔")||entry.includes("👿");
              const isHeal=entry.includes("♥");
              const isDraw=entry.includes("♦");
              const isDiscard=entry.includes("🗑");
              const color = isDefeat ? "text-yellow-300" : isAttack ? "text-red-300" : isHeal ? "text-emerald-300" : isDraw ? "text-blue-300" : isDiscard ? "text-orange-300" : "text-white/60";
              const isNew = i === 0 && newLogIdx === 0;
              return <p key={entry+i} className={`text-xs leading-tight ${color} ${i===0?"font-bold":"opacity-70"}`}
                style={{ transition: "opacity 0.3s, transform 0.3s", opacity: isNew ? 1 : undefined, animation: isNew ? "logSlideIn 0.35s ease" : undefined }}>{entry}</p>;
            })}
          </div>
          <style>{`@keyframes logSlideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}`}</style>
          <div className="text-center pb-2"><span style={{fontFamily:"monospace",background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.4)",color:"#c9a84c",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:900}}>v5.8</span></div>
        </div>
      </div>
    );
  }

  if (screen === "highscores") {
    const scores = loadHighscores();
    return (
      <div className="min-h-screen p-4 md:p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)" }}>
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle,#fbbf24,transparent 70%)" }} />
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setScreen("menu")} className={`px-4 py-2 font-bold text-sm ${glass.btn}`}>← {t(lang, "Zurück", "Back")}</button>
            <h1 className="text-3xl font-black text-white drop-shadow">🏆 {t(lang, "Bestenliste", "Highscores")}</h1>
            <button onClick={() => { clearHighscores(); setScreen("menu"); setScreen("highscores"); }} className={`px-3 py-1.5 text-xs font-bold ${glass.btnDanger}`}>{t(lang, "Löschen", "Clear")}</button>
          </div>
          {scores.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-white/40 text-lg">{t(lang, "Noch keine Einträge. Spiel ein Spiel!", "No entries yet. Play a game!")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((s, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`;
                const rankCol = i === 0 ? "#fbbf24" : i === 1 ? "#d1d5db" : i === 2 ? "#b45309" : "rgba(255,255,255,0.3)";
                return (
                  <div key={i} className="rounded-2xl p-4" style={{ background: i < 3 ? `rgba(255,255,255,0.09)` : "rgba(255,255,255,0.05)", border: `1px solid ${i < 3 ? rankCol + "44" : "rgba(255,255,255,0.1)"}`, boxShadow: i === 0 ? `0 0 24px ${rankCol}22` : undefined }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center">{medal}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white text-lg" style={{ color: rankCol }}>{s.score} {t(lang, "Pkt", "pts")}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${s.won ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>{s.won ? (lang==="de"?"SIEG":"WIN") : (lang==="de"?"NIEDERLAGE":"LOSS")}</span>
                          <span className="text-white/30 text-xs">{s.date}</span>
                          <span className="text-white/30 text-xs">👤 {s.players}P</span>
                        </div>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          <span className="text-white/50 text-xs">⚔️ {s.damage} {t(lang,"Schaden","dmg")}</span>
                          <span className="text-white/50 text-xs">👑 {s.enemies}/12 {t(lang,"Feinde","enemies")}</span>
                          <span className="text-white/50 text-xs">🃏 {s.cards} {t(lang,"Karten","cards")}</span>
                          {s.players === 1 && <span className="text-white/50 text-xs">🃏 Jester: {s.jesters}x</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-center py-6 space-y-2">
            <p className="text-white/30 text-xs">{t(lang, "Score = Schaden + Feinde×50 + Bonus für Jester-freien Solo-Sieg (+100)", "Score = damage + enemies×50 + bonus for Jester-free solo win (+100)")}</p>
            <button onClick={() => setScreen("menu")} className={`px-8 py-3 font-black text-lg ${glass.btnPrimary}`}>{t(lang, "Zurück zum Menü", "Back to Menu")}</button>
          </div>
          <div className="text-center pb-4">
            <span className="font-mono bg-white text-gray-900 px-2 py-0.5 rounded-lg font-black text-xs">v5.8</span>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "rules") {
    const sections = [
      {
        icon: "🎯",
        titleDe: "Ziel des Spiels",
        titleEn: "Goal",
        bodyDe: "Besiegt gemeinsam alle 12 royalen Feinde – 4 Buben, 4 Damen und 4 Könige – bevor euch die Karten ausgehen. Ihr spielt kooperativ: entweder gewinnt ihr alle, oder ihr verliert alle.",
        bodyEn: "Together defeat all 12 royal enemies – 4 Jacks, 4 Queens and 4 Kings – before you run out of cards. You play cooperatively: either everyone wins, or everyone loses.",
      },
      {
        icon: "🃏",
        titleDe: "Aufbau",
        titleEn: "Setup",
        bodyDe: "Mischt die 4 Buben, legt sie unten hin. Dann die 4 Damen darauf, dann die 4 Könige obenauf – der erste Feind ist also ein Bube. Jeder Spieler zieht seine Startkarten (Solo: 8, 2 Spieler: 7, 3 Spieler: 6, 4 Spieler: 5). Der Rest ist der Nachziehstapel.",
        bodyEn: "Shuffle the 4 Jacks and place them at the bottom. Then the 4 Queens, then the 4 Kings on top – so the first enemy is a Jack. Each player draws their starting hand (Solo: 8, 2p: 7, 3p: 6, 4p: 5). The rest is the draw pile.",
      },
      {
        icon: "⚔️",
        titleDe: "Ablauf eines Zuges",
        titleEn: "Turn Structure",
        bodyDe: "1. Spiele 1 oder mehrere Karten (Kombo-Regeln beachten!).\n2. Wende die Farb-Kräfte an.\n3. Füge Schaden dem Feind zu.\n4. Falls der Feind überlebt, greift er zurück an – decke seinen Angriffswert mit Handkarten ab (Abwerfen).\n5. Ziehe Karten auf deine Handgröße auf.\n6. Nächster Spieler ist dran.",
        bodyEn: "1. Play 1 or more cards (follow combo rules!).\n2. Apply suit powers.\n3. Deal damage to the enemy.\n4. If the enemy survives, it counter-attacks – cover its attack value by discarding hand cards.\n5. Draw back up to hand size.\n6. Next player takes their turn.",
      },
      {
        icon: "🔗",
        titleDe: "Kombos",
        titleEn: "Combos",
        bodyDe: "Mehrere Karten gleichzeitig spielen:\n• Gleicher Rang + Gesamtwert ≤ 10\n• Tier-Begleiter: Ein Ass (A) mit genau 1 weiteren Karte (beliebiger Rang)\n• Nur 1 Jester alleine spielbar\nDer Angriffswert ist die Summe aller gespielten Karten.",
        bodyEn: "Play multiple cards at once:\n• Same rank + total value ≤ 10\n• Animal companion: An Ace (A) paired with exactly 1 other card (any rank)\n• Only 1 Jester can be played alone\nAttack value is the sum of all played cards.",
      },
      {
        icon: "✨",
        titleDe: "Farb-Kräfte",
        titleEn: "Suit Powers",
        bodyDe: "♥ Herz – Heilung: Lege so viele Karten vom Ablagestapel zurück in den Nachziehstapel wie der Angriffswert.\n♦ Karo – Ziehen: Alle Spieler ziehen zusammen so viele Karten wie der Angriffswert (bis zur Handgrenze).\n♣ Kreuz – Verdoppeln: Der Angriffswert wird verdoppelt.\n♠ Pik – Schild: Reduziere den Angriff des aktuellen Feindes dauerhaft um den Angriffswert.",
        bodyEn: "♥ Hearts – Heal: Move as many cards as the attack value from the discard pile back to the draw pile.\n♦ Diamonds – Draw: All players collectively draw cards equal to the attack value (up to hand limit).\n♣ Clubs – Double: The attack value is doubled.\n♠ Spades – Shield: Permanently reduce the current enemy's attack by the attack value.",
      },
      {
        icon: "🛡",
        titleDe: "Immunität",
        titleEn: "Immunity",
        bodyDe: "Jeder Feind ist immun gegen die Farbe seiner eigenen Karte. Zum Beispiel: Der Herz-Bube (J♥) ist immun gegen Herz-Kräfte – Heilung hat keine Wirkung. Ein Jester hebt diese Immunität auf.",
        bodyEn: "Each enemy is immune to the power of its own suit. For example: the Jack of Hearts (J♥) is immune to Hearts – healing has no effect. A Jester cancels this immunity.",
      },
      {
        icon: "💀",
        titleDe: "Feind besiegt",
        titleEn: "Enemy Defeated",
        bodyDe: "Genau 0 HP: Der Feind kommt oben auf den Nachziehstapel (nützlich!).\nOverkill (HP < 0): Feind und alle Tischkarten kommen auf den Ablagestapel.\nDer nächste Feind wird sofort aufgedeckt. Alle Spieler ziehen Karten auf ihre Handgröße auf.",
        bodyEn: "Exactly 0 HP: The enemy goes on top of the draw pile (useful!).\nOverkill (HP < 0): Enemy and all table cards go to the discard pile.\nThe next enemy is immediately revealed. All players draw back up to hand size.",
      },
      {
        icon: "🃏",
        titleDe: "Jester (Solo)",
        titleEn: "Jester (Solo)",
        bodyDe: "Im Solo-Spiel gibt es keine Jester-Karten im Deck. Stattdessen habt ihr 2 Jester-Marker. Ihr könnt einen Jester jederzeit einsetzen um: (a) vor eurem Zug die Hand komplett zu tauschen, oder (b) nach dem Angriff des Feindes die Hand zu tauschen (statt Karten abzuwerfen).",
        bodyEn: "In solo play there are no Jester cards in the deck. Instead you have 2 Jester tokens. You can use one at any time to: (a) swap your entire hand before your turn, or (b) swap your hand after an enemy attack (instead of discarding cards).",
      },
      {
        icon: "🏆",
        titleDe: "Sieg & Niederlage",
        titleEn: "Win & Loss",
        bodyDe: "Sieg: Ihr besiegt den letzten König.\nNiederlage: Ein Spieler muss Karten abwerfen, hat aber keine mehr – und alle anderen haben bereits gepasst. Oder: Niemand kann mehr spielen oder passen.",
        bodyEn: "Win: You defeat the last King.\nLoss: A player must discard cards but has none left – and all others have already yielded. Or: Nobody can play or yield anymore.",
      },
    ];
    return (
      <div className="min-h-screen p-4 md:p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)" }}>
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)" }} />
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setScreen("menu")} className={`px-4 py-2 font-bold text-sm ${glass.btn}`}>← {t(lang, "Zurück", "Back")}</button>
            <h1 className="text-3xl font-black text-white drop-shadow">{t(lang, "📖 Regelwerk", "📖 Rules")}</h1>
          </div>
          <div className="space-y-4">
            {sections.map((s, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <h2 className="text-white font-black text-lg">{lang === "de" ? s.titleDe : s.titleEn}</h2>
                </div>
                <p className="text-white/65 text-sm leading-relaxed whitespace-pre-line">{lang === "de" ? s.bodyDe : s.bodyEn}</p>
              </div>
            ))}
          </div>
          <div className="text-center py-6">
            <button onClick={() => { setScreen("menu"); }} className={`px-8 py-3 font-black text-lg ${glass.btnPrimary}`}>{t(lang, "Verstanden – Spiel starten! ⚔️", "Got it – Start Game! ⚔️")}</button>
          </div>
          <div className="text-center pb-4">
            <span className="font-mono bg-white text-gray-900 px-2 py-0.5 rounded-lg font-black text-xs">v5.8</span>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "menu") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "#0a0a0f", backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(45,27,105,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,0,0,0.2) 0%, transparent 50%)" }}>
        <div className="text-center mb-8 relative">
          <div className="text-6xl mb-2" style={{ animation: "bounce 2s ease-in-out infinite" }}>👑</div>
          <h1 className="font-black mb-2" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(36px,8vw,80px)", color: "#c9a84c", textShadow: "0 0 30px rgba(201,168,76,0.8), 2px 2px 0 #000", letterSpacing: 8, animation: "glow 3s ease-in-out infinite alternate" }}>
            COUP D'ÉTAT
          </h1>
          <style>{`@keyframes glow { from { text-shadow: 0 0 20px rgba(201,168,76,0.6), 2px 2px 0 #000; } to { text-shadow: 0 0 50px rgba(201,168,76,1), 0 0 100px rgba(201,168,76,0.4), 2px 2px 0 #000; } } @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
            <p style={{ color: "#e8d5a3", letterSpacing: 5, fontSize: 14, opacity: 0.8, fontFamily: "Georgia, serif" }}>{t(lang, "Das Kooperative Kartenspiel", "The Cooperative Card Game")}</p>
        </div>
        <div className="relative w-full max-w-md space-y-5 p-8"
          style={{ background: "linear-gradient(135deg,rgba(26,26,46,0.95),rgba(22,33,62,0.95))", border: "2px solid #c9a84c", borderRadius: 16, boxShadow: "0 0 40px rgba(201,168,76,0.2)" }}>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setLang("de")} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${lang === "de" ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>🇩🇪 Deutsch</button>
            <button onClick={() => setLang("en")} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${lang === "en" ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>🇬🇧 English</button>
          </div>
          <div>
            <p className="text-xs mb-2 text-center tracking-widest uppercase text-white/50">{t(lang, "Kartenstil", "Card Style")}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.entries(CARD_THEMES).map(([key, th]) => (
                <button key={key} onClick={() => setTheme(key)} className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${theme === key ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>
                  {lang === "de" ? th.name_de : th.name_en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs mb-2 text-center tracking-widest uppercase text-white/50">{t(lang, "Layout", "Layout")}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.entries(GAME_LAYOUTS).map(([key, lo]) => (
                <button key={key} onClick={() => setGameLayout(key)} className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${gameLayout === key ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>
                  {lang === "de" ? lo.name_de : lo.name_en}
                </button>
              ))}
            </div>
          </div>
          <div>
            {/* Schritt 18 – Dark/Light Mode Toggle im Menü */}
            <p className="text-xs mb-2 text-center tracking-widest uppercase text-white/50">{t(lang, "Modus", "Mode")}</p>
              <div className="flex gap-2 justify-center mb-4">
                {Object.entries(GAME_LAYOUTS).map(([key, val]) => (
                  <button key={key} onClick={() => setGameLayout(key)}
                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                      gameLayout === key ? "bg-white/90 text-gray-900 scale-105 shadow-lg" : glass.btn
                    }`}>
                    {key === "arena" ? "⚔️" : "📊"} {lang === "de" ? val.name_de : val.name_en}
                  </button>
                ))}
              </div>
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
              <button onClick={() => setSoundEnabled(false)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${!soundEnabled ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>🔇 {t(lang, "Aus", "Off")}</button>
              <button onClick={() => setSoundEnabled(true)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${soundEnabled ? "bg-white/90 text-gray-900 shadow-lg" : glass.btn}`}>🔊 {t(lang, "An", "On")}</button>
              </div>
            </div>
          <button onClick={initGame} className={`w-full py-3 ${glass.btnPrimary}`}>{t(lang, "⚔️ Spiel Starten", "⚔️ Start Game")}</button>
          <button onClick={() => setScreen("rules")} className={`w-full py-2.5 ${glass.btn}`}>📖 {t(lang, "Regelwerk lesen", "Read Rules")}</button>
          <button onClick={() => setScreen("highscores")} className={`w-full py-2.5 ${glass.btn}`}>🏆 {t(lang, "Bestenliste", "Highscores")}</button>
          {showRules && (
            <div className="rounded-2xl p-4 text-white/70 text-xs space-y-2 max-h-64 overflow-y-auto" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="font-bold text-white/90">{t(lang, "Ziel:", "Goal:")}</p>
              <p>{t(lang, "Besiege alle 12 royalen Feinde (4 Buben, 4 Damen, 4 Könige).", "Defeat all 12 royal enemies (4 Jacks, 4 Queens, 4 Kings).")}</p>
              <p className="font-bold text-white/90">{t(lang, "Kräfte:", "Powers:")}</p>
              {Object.entries(SUIT_POWERS_DE).map(([suit, desc]) => (
                <p key={suit}>{suit} {lang === "de" ? desc : SUIT_POWERS_EN[suit]}</p>
              ))}
            </div>
          )}
        </div>

          <div className="text-center py-3">
            <span className="font-mono px-2 py-0.5 rounded-lg font-black text-xs bg-white text-gray-900">v5.8</span>
          </div>
      </div>
    );
  }

  if (screen === "gameover" || screen === "victory") {
    const won = screen === "victory";
    const soloRank = soloJestersUsed === 0 ? "🥇 Gold" : soloJestersUsed === 1 ? "🥈 Silber" : "🥉 Bronze";
    const multiRank = totalStats.enemies >= 12 ? (totalStats.damage >= 300 ? "🥇 Gold" : totalStats.damage >= 200 ? "🥈 Silber" : "🥉 Bronze") : "🥉 Bronze";
    const rankLabel = numPlayers === 1 ? soloRank : multiRank;

    const copyStats = () => {
      const text = `Coup d'État v3.2 – ${won ? (lang==="de"?"SIEG":"VICTORY") : (lang==="de"?"NIEDERLAGE":"DEFEAT")}
⚔️ ${totalStats.damage} ${lang==="de"?"Schaden":"damage"}  🃏 ${totalStats.cards} ${lang==="de"?"Karten":"cards"}  👑 ${totalStats.enemies} ${lang==="de"?"Feinde":"enemies"}  💚 ${totalStats.healed||0} ${lang==="de"?"Heilung":"healed"}
${rankLabel}`;
      navigator.clipboard?.writeText(text).catch(()=>{});
      showAnim(lang==="de"?"📋 Kopiert!":"📋 Copied!", 1500);
    };

    // Confetti particles (CSS keyframes injected once)
    const confettiColors = ["#fbbf24","#f87171","#34d399","#60a5fa","#a78bfa","#f472b6"];
    const particles = won ? Array.from({length:24},(_,i)=>i) : [];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: won ? "linear-gradient(135deg,#1a1000,#3d2800,#1a1000)" : "linear-gradient(135deg,#1a0000,#3d0000,#0a0a0a)" }}>

        {/* Confetti */}
        {particles.map((i) => {
          const left = (i * 37 + 7) % 100;
          const delay = (i * 0.17) % 2;
          const dur = 2.5 + (i % 5) * 0.4;
          const color = confettiColors[i % confettiColors.length];
          const size = 8 + (i % 4) * 4;
          return (
            <div key={i} className="absolute top-0 pointer-events-none" style={{
              left: `${left}%`,
              width: size, height: size,
              background: color,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
              opacity: 0.85,
              animation: `confettiFall ${dur}s ${delay}s ease-in infinite`,
              transform: `rotate(${i*23}deg)`,
            }} />
          );
        })}
        <style>{`@keyframes confettiFall{0%{transform:translateY(-40px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>

        <div className="text-center space-y-5 relative max-w-lg w-full z-10">
          <div className="text-8xl drop-shadow-2xl" style={{filter: won?"drop-shadow(0 0 32px #fbbf24)":undefined}}>{won ? "👑" : "💀"}</div>
          <h2 className="text-5xl font-black" style={{ color: won ? "rgba(251,191,36,0.95)" : "rgba(239,68,68,0.95)", textShadow: won?"0 0 40px rgba(251,191,36,0.5)":"0 0 40px rgba(239,68,68,0.4)" }}>
            {won ? t(lang, "SIEG!", "VICTORY!") : t(lang, "NIEDERLAGE!", "DEFEAT!")}
          </h2>

          {won && <div className="text-3xl font-black" style={{textShadow:"0 0 20px rgba(255,255,255,0.3)"}}>{rankLabel} {t(lang,"Sieg!","Victory!")}</div>}

          <p className="text-white/60 text-base">
            {won ? t(lang, "Ihr habt alle Könige besiegt! Das Königreich ist gerettet.", "You defeated all kings! The kingdom is saved.") : t(lang, "Das Königreich ist gefallen. Versucht es erneut!", "The kingdom has fallen. Try again!")}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon:"⚔️", labelDe:"Schaden", labelEn:"Damage", value: totalStats.damage, color:"#f87171" },
              { icon:"🃏", labelDe:"Karten gespielt", labelEn:"Cards played", value: totalStats.cards, color:"#60a5fa" },
              { icon:"👑", labelDe:"Feinde besiegt", labelEn:"Enemies defeated", value: totalStats.enemies, color:"#fbbf24" },
              { icon:"💚", labelDe:"Geheilt", labelEn:"Healed", value: totalStats.healed||0, color:"#34d399" },
            ].map((s,i)=>(
              <div key={i} className="rounded-2xl p-4 text-center" style={{background:"rgba(255,255,255,0.07)",border:`1px solid ${s.color}33`,boxShadow:`0 0 16px ${s.color}22`}}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-3xl font-black" style={{color:s.color,textShadow:`0 0 12px ${s.color}88`}}>{s.value}</div>
                <div className="text-white/40 text-xs mt-1">{lang==="de"?s.labelDe:s.labelEn}</div>
              </div>
            ))}
          </div>

          {/* Last round stats if available */}
          {lastRoundStats && (
            <div className="rounded-xl px-4 py-2 text-xs text-yellow-200/70" style={{background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)"}}>
              🏅 {t(lang,`Letzter Kampf: ${lastRoundStats.damage} Schaden, ${lastRoundStats.cards} Karten`,`Last fight: ${lastRoundStats.damage} damage, ${lastRoundStats.cards} cards`)}
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={copyStats} className={`px-5 py-2.5 font-bold text-sm ${glass.btn}`}>📋 {t(lang,"Stats kopieren","Copy Stats")}</button>
            <button onClick={() => { setScreen("menu"); setGame(null); }} className={`px-6 py-2.5 font-bold ${glass.btn}`}>{t(lang, "Hauptmenü", "Main Menu")}</button>
            <button onClick={initGame} className={`px-8 py-2.5 font-bold ${glass.btnPrimary}`}>{t(lang, "Nochmal spielen", "Play Again")}</button>
          </div>

          <div className="text-center py-1">
            <span className="font-mono bg-white text-gray-900 px-2 py-0.5 rounded-lg font-black text-xs">v5.8</span>
          </div>
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

  // Schritt 14 – Combo-Vorschau verbessern (Farb-Kräfte anzeigen)
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
    const prevDmg = game.tableCards.reduce((s,c)=>s+(c._dealtDamage||0),0);
    const totalAfter = prevDmg + atk;
    const willKill = totalAfter >= game.currentEnemy.currentHp;
    const enemy = game.currentEnemy;
    const powers = suits.map(suit => {
      const immune = enemy.suit === suit && !enemy.jesterCancelled;
      if (suit === "♥") return { suit, label: t(lang,`♥ Heilt ${base} Karten`,`♥ Heal ${base} cards`), color:"#34d399", blocked: immune };
      if (suit === "♦") return { suit, label: t(lang,`♦ Zieht ${base} Karten`,`♦ Draw ${base} cards`), color:"#60a5fa", blocked: immune };
      if (suit === "♣") return { suit, label: t(lang,`♣ Verdoppelt → ${atk}`,`♣ Double → ${atk}`), color:"#c084fc", blocked: immune };
      if (suit === "♠") return { suit, label: t(lang,`♠ Schild -${base}`,`♠ Shield -${base}`), color:"#a78bfa", blocked: immune };
      return null;
    }).filter(Boolean);
    return (
      <div className="px-3 py-2 rounded-xl text-xs font-bold flex flex-col gap-1.5 bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={isValid ? "text-emerald-400" : "text-red-400"}>{isValid ? "✅" : "❌"}</span>
          <span className="text-white/80">{cards.length} {t(lang,"Karte(n)","card(s)")} · <span className="font-black">⚔️ {atk}</span></span>
          {cards.length > 1 && <span className="text-white/40">({t(lang,`Basis: ${base}`,`Base: ${base}`)})</span>}
          {willKill && <span className="text-emerald-300 font-black animate-pulse">💀 {t(lang,"Tötet!","Kills!")}</span>}
          {!willKill && <span className="text-white/40">{t(lang,`Gesamt: ${totalAfter}/${game.currentEnemy.currentHp}`,`Total: ${totalAfter}/${game.currentEnemy.currentHp}`)}</span>}
        </div>
        {powers.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {powers.map((p,i) => (
              <span key={i} className={`px-2 py-0.5 rounded-lg text-xs ${p.blocked ? "line-through opacity-40" : ""}`}
                style={{ background: p.color+"22", color: p.color, border: `1px solid ${p.color}44` }}>
                {p.label}{p.blocked ? " 🛡" : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ActionBar = () => (
    <div className="p-2 md:p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.15)" }}>
      <div className="flex items-center gap-2 flex-wrap">
        {phase === "jester" && (
          <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}>
            <p className="text-purple-200 font-bold text-sm">🃏 {t(lang, "Jester! Wähle nächsten Spieler:", "Jester! Choose next player:")}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {game.players.map((_, pi) => (
                <button key={pi} onClick={() => chooseNextPlayer(pi)} className={`px-3 py-1 text-white/90 text-sm font-bold rounded-lg ${glass.btnPurple}`}>
                  {t(lang, `Spieler ${pi + 1}`, `Player ${pi + 1}`)}
                </button>
              ))}
            </div>
          </div>
        )}
        {phase === "discard" && (
          <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <p className="text-red-300 font-bold text-sm">⚠️ {t(lang, "Schaden abdecken!", "Cover damage!")}</p>
            <p className="text-white/70 text-xs">{t(lang, `Noch ${Math.ceil(discardNeeded)} Schaden zu decken`, `Still ${Math.ceil(discardNeeded)} damage to cover`)}</p>
            {(() => {
              const sug = getAutoDiscardSuggestion(currentPlayer.hand, discardNeeded);
              if (sug.length === 0) return null;
              const sugTotal = sug.reduce((s, id) => { const c = currentPlayer.hand.find(x => x.id === id); return s + (c ? getCardValue(c) : 0); }, 0);
              return (
                <p className="text-yellow-300/80 text-xs mt-1 font-bold">✨ {t(lang, `Vorschlag: ${sug.length} Karte(n) (Wert: ${sugTotal}) sind markiert`, `Suggestion: ${sug.length} card(s) (value: ${sugTotal}) highlighted`)}</p>
              );
            })()}
          </div>
        )}
        {phase === "play" && selectedCards.length > 0 && (
          <div className="text-sm text-white/70">
            {selectedCards.length} {t(lang, "Karte(n)", "card(s)")} · <span className="text-white font-bold">⚔️ {attackValue}</span>
            {" · "}<span className="text-orange-400">{t(lang, `Gesamt: ${totalDamageDisplay}`, `Total: ${totalDamageDisplay}`)}</span>
            {totalDamageDisplay >= enemyRemainingHp && <span className="ml-2 text-emerald-300 text-xs font-bold">✓ {t(lang, "Reicht!", "Enough!")}</span>}
          </div>
        )}
        <div className="flex gap-2 ml-auto flex-wrap">
          {phase === "play" && selectedCards.length > 0 && (
            <button onClick={() => setSelectedCards([])} className={`px-3 py-2 text-white/80 text-sm ${glass.btn}`}>{t(lang, "Abwählen", "Deselect")}</button>
          )}
          {numPlayers === 1 && soloJestersAvail > 0 && phase === "play" && currentPlayer.hand.length < getHandSize(numPlayers) && (
            <button onClick={() => soloFlipJester("step1")} className={`px-3 py-2 text-sm font-bold ${glass.btnPurple}`}>
              🃏 {t(lang, `Jester (${soloJestersAvail}x)`, `Jester (${soloJestersAvail}x)`)}
            </button>
          )}
          {numPlayers === 1 && soloJestersAvail > 0 && phase === "discard" && (
            <button onClick={() => soloFlipJester("step4")} className={`px-3 py-2 text-sm font-bold ${glass.btnPurple}`}>
              🃏 {t(lang, `Jester tauschen (${soloJestersAvail}x)`, `Jester swap (${soloJestersAvail}x)`)}
            </button>
          )}
          {phase === "play" && (
            <>
              <button onClick={yieldTurn} className={`px-4 py-2 font-bold text-sm ${glass.btn}`}>{t(lang, "Passen", "Yield")} <kbd className="opacity-40 text-xs ml-1">Y</kbd></button>
              <button
                onClick={playCards}
                disabled={selectedCards.length === 0}
                className={`px-6 py-2 font-bold text-sm rounded-xl transition-all ${selectedCards.length > 0 ? glass.btnPrimary : "opacity-30 cursor-not-allowed bg-white/10 text-white/30 border border-white/10 rounded-xl"}`}
              >
                ⚔️ {t(lang, "Spielen", "Play")}
              </button>
            </>
          )}
          {phase === "discard" && (
            <span className="text-red-300 text-sm font-bold animate-pulse">👆 {t(lang, "Karte anklicken", "Click a card")}</span>
          )}
        </div>
      </div>
    </div>
  );

  const _TurnOrder_UNUSED = () => numPlayers <= 1 ? null : (
    <div className="flex items-center gap-2 flex-wrap px-1">
      <span className="text-white/30 text-xs tracking-widest uppercase">{t(lang, 'Reihenfolge', 'Order')}:</span>
      {Array.from({ length: numPlayers }, (_, i) => {
        const pi = (game.currentPlayerIndex + i) % numPlayers;
        const p = game.players[pi];
        const isActive = i === 0;
        return (
          <div key={pi} className="flex items-center gap-1">
            {i > 0 && <span className="text-white/20 text-xs">›</span>}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-white/90 text-gray-900 shadow scale-105' : 'bg-white/10 text-white/50'}`}>
              {isActive && <span>▶ </span>}<span>{p.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const PlayerHand = ({ player, pi, small }) => {
    const isActive = pi === game.currentPlayerIndex;
    const isDiscardTarget = phase === "discard" && isActive;
    const suggestedIds = isDiscardTarget ? getAutoDiscardSuggestion(player.hand, discardNeeded) : [];
    return (
      // Schritt 17 – Mobile: overflow-x-auto für Kartenhand
      <div className="rounded-xl p-2 md:p-3 transition-all" style={{ background: isDiscardTarget ? "rgba(139,0,0,0.2)" : isActive ? "linear-gradient(135deg,rgba(13,40,74,0.3),rgba(26,26,46,0.8))" : "rgba(26,26,46,0.5)", border: isDiscardTarget ? "2px solid #cc2200" : isActive ? "2px solid #1a4a8a" : "1px solid rgba(201,168,76,0.15)", boxShadow: isDiscardTarget ? "0 0 20px rgba(204,34,0,0.3)" : undefined }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-white/90 text-gray-900" : "bg-white/15 text-white"}`}>{pi + 1}</span>
            <span className={`font-bold text-sm ${isActive ? "text-white" : "text-white/50"}`}>{player.name} {isActive ? `(${t(lang, "am Zug", "active")})` : ""}</span>
          </div>
          <span className="text-white/40 text-xs">{player.hand.length} {t(lang, "Karten", "cards")}</span>
          {isDiscardTarget && <span className="text-red-300 text-xs font-black animate-pulse">⚠️ {t(lang, "Abwerfen!", "Discard!")}</span>}
        </div>
        {/* Schritt 17 – Mobile: flex-nowrap + horizontales Scrollen für aktive Hand */}
        <div className={`flex gap-1.5 pb-1 ${isActive ? "overflow-x-auto flex-nowrap" : "flex-wrap"}`}>
          {player.hand.map((card, cardIdx) => (
            <PlayingCard
              key={card.id}
              card={card}
              selected={selectedCards.includes(card.id) || (isDiscardTarget && suggestedIds.includes(card.id))}
              onClick={() => {
                if (phase === "discard" && isActive) discardCardForDamage(card.id);
                else if (phase === "play" && isActive) toggleCardSelection(card.id);
              }}
              disabled={!isActive || (phase !== "play" && phase !== "discard")}
              small={small !== undefined ? small : !isActive}
            />
          ))}
          {player.hand.length === 0 && <span className="text-white/30 text-sm italic">{t(lang, "Keine Karten", "No cards")}</span>}
        </div>
      </div>
    );
  };

  // v3.8 – Keyboard shortcuts active (useEffect registered above)
    // Shortcut hint bar rendered below TurnOrder in JSX

  const themeConfig = CARD_THEMES[theme] || CARD_THEMES.fantasy;
  const bgStyle = { background: themeConfig.bg, backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(45,27,105,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,0,0,0.2) 0%, transparent 50%)" };
  const accentGlow = themeConfig.accent;
  // Schritt 18 – Light Mode: Header-Textfarben
  const headerText = "text-white/60";
  const headerTextStrong = "text-white";

  return (
    <div className="min-h-screen p-2 md:p-4 relative overflow-hidden" style={bgStyle}>
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: `radial-gradient(circle, ${accentGlow}, transparent 70%)` }} />
      <div className="absolute bottom-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: `radial-gradient(circle, ${accentGlow}, transparent 70%)` }} />

      {animMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl font-black text-xl text-white shadow-2xl animate-bounce text-center"
          style={{ background: animMsg.includes("BESIEGT") || animMsg.includes("DEFEATED") ? "rgba(120,80,0,0.95)" : "rgba(30,0,60,0.85)", backdropFilter: "blur(20px)", border: `1px solid ${animMsg.includes("BESIEGT") || animMsg.includes("DEFEATED") ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.2)"}`, boxShadow: animMsg.includes("BESIEGT") || animMsg.includes("DEFEATED") ? "0 0 40px rgba(251,191,36,0.4)" : undefined }}>
          {animMsg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-1.5"><button onClick={() => { setScreen("menu"); setGame(null); }} className={`px-2.5 py-1.5 text-sm font-bold ${glass.btn}`}>← {t(lang, "Menü", "Menu")}</button><button onClick={() => setPaused(true)} className={`px-2.5 py-1.5 text-sm font-bold ${glass.btn}`}>⏸</button></div>
          {/* Schritt 12 – Deck-Visualisierung */}
          <div className="flex items-end gap-3">
            <DeckVisual count={game.drawPile.length} color="#a78bfa" label={t(lang,"Stapel","Deck")}  />
            <DeckVisual count={game.discardPile.length} color="#fb923c" label={t(lang,"Ablage","Disc.")}  />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">👑</span>
              <span className="font-black text-xs" style={{ color: "#a78bfa" }}>{game.enemyDeck.length + 1}</span>
              <span className="opacity-50" style={{ color: "#a78bfa", fontSize: 9 }}>{t(lang,"Feinde","Foes")}</span>
            </div>
          </div>
          <div className={`text-xs ${headerText} text-center`}>
            <span className={`font-bold ${headerTextStrong}`}>{t(lang, "Phase", "Phase")}: </span>
            <span className={`font-bold ${headerTextStrong}`}>{phase}</span>
          </div>
          <div className={`text-xs text-white/40`}>{t(lang, "Feinde", "Foes")}: <span className={`font-bold text-white/70`}>{game.enemyDeck.length+1}</span></div>
        </div>

        {/* Enemy */}
        {lastRoundStats && (
          <div className="flex items-center gap-4 px-3 py-2 rounded-xl flex-wrap" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <span className="text-yellow-300 font-black text-xs tracking-widest uppercase">{t(lang, "Letzte Runde", "Last Round")}:</span>
            <span className="text-white/70 text-xs">⚔️ {t(lang, `Schaden: ${lastRoundStats.damage}`, `Damage: ${lastRoundStats.damage}`)}</span>
            <span className="text-white/70 text-xs">🃏 {t(lang, `Karten: ${lastRoundStats.cards}`, `Cards: ${lastRoundStats.cards}`)}</span>
            <button onClick={() => setLastRoundStats(null)} className="ml-auto text-white/30 hover:text-white/60 text-xs">×</button>
          </div>
        )}
        <EnemyCard enemy={game.currentEnemy} lang={lang} tableCards={game.tableCards} />

        {/* Action Bar */}
        <ActionBar />

        {/* Schritt 14 – Combo-Vorschau (verbessert) */}
          <ComboPreview />

          {/* Feature 1: Spieler-Rundenübersicht Banner */}
          <PlayerTurnBanner game={game} lang={lang} phase={phase} numPlayers={numPlayers} lastYielded={lastYielded} />

                <div className="space-y-2">
          {game.players.map((player, pi) => (
            <PlayerHand key={pi} player={player} pi={pi} />
          ))}
        </div>

        {/* Log */}
        <div className="rounded-2xl p-3 max-h-32 overflow-y-auto" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-white/30 text-xs mb-1 font-bold tracking-widest uppercase">{t(lang, "Log", "Log")}</p>
          {log.map((entry, i) => {
            const isAttack = entry.includes("\u2694") || entry.includes("\ud83d\udc7f");
            const isHeal = entry.includes("♥");
            const isDraw = entry.includes("♦");
            const isDefeat = entry.includes("besiegt") || entry.includes("defeated");
            const isDiscard = entry.includes("🗑");
            const color = isDefeat ? "text-yellow-300" : isAttack ? "text-red-300" : isHeal ? "text-emerald-300" : isDraw ? "text-blue-300" : isDiscard ? "text-orange-300" : "text-white/60";
            return <p key={i} className={`text-xs leading-tight ${color} ${i === 0 ? "font-bold" : "opacity-70"}`}>{entry}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
