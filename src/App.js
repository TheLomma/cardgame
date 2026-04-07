import { useState } from "react";

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
  fantasy: {
    name_de: "Fantasy",
    name_en: "Fantasy",
    accentColor: "yellow",
  },
  classic: {
    name_de: "Klassisch",
    name_en: "Classic",
    accentColor: "green",
  },
  dark: {
    name_de: "Dunkel",
    name_en: "Dark",
    accentColor: "red",
  },
};

// Two alternative GAME layouts (selectable in menu)
const GAME_LAYOUTS = {
  arena: {
    name_de: "Arena",
    name_en: "Arena",
  },
  dashboard: {
    name_de: "Dashboard",
    name_en: "Dashboard",
  },
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

function createDeck(numPlayers) {
  const deck = [];
  SUITS.forEach((suit) => {
    CARD_VALUES.forEach((cv) => {
      deck.push({ rank: cv.rank, suit, value: cv.value, attack: cv.attack, id: `${cv.rank}${suit}`, type: "number" });
    });
  });
  // Add Animal Companions (Aces) - already included above as rank "A"
  // Add Jesters based on player count
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
  // Sort: Jacks first, then Queens, then Kings
  const order = { J: 0, Q: 1, K: 2 };
  enemies.sort((a, b) => order[a.rank] - order[b.rank]);
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

// ─── Card Component ───────────────────────────────────────────────────────────
function PlayingCard({ card, selected, onClick, disabled, small = false }) {
  const isRed = card.suit === "♥" || card.suit === "♦";
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
        style={{ background: selected ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)", border: `1px solid ${borderColor}`, backdropFilter: "blur(12px)" }}
      >
        <span className={`text-xs font-black ${color}`}>{card.rank}</span>
        <span className={`text-base ${color}`}>{card.suit}</span>
      </div>
    );
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative cursor-pointer select-none transition-all duration-200 rounded-2xl w-20 h-28 flex flex-col p-1.5 ${
        selected ? "ring-2 ring-white -translate-y-3 shadow-2xl" : disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-lg"
      }`}
      style={{
        background: selected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)",
        border: `1.5px solid ${borderColor}`,
        backdropFilter: "blur(18px)",
        boxShadow: selected ? "0 0 24px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.4)" : "inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      <div className={`text-xs font-black leading-tight ${color}`}>{card.rank}<br />{card.suit}</div>
      <div className={`flex-1 flex items-center justify-center text-2xl drop-shadow ${color}`}>{card.suit}</div>
      <div className={`text-xs font-black leading-tight rotate-180 ${color}`}>{card.rank}<br />{card.suit}</div>
      {card.attack > 0 && (
        <div className="absolute bottom-0.5 left-0 right-0 text-center">
          <span className="text-xs font-bold opacity-70 text-white">⚔{card.attack}</span>
        </div>
      )}
    </div>
  );
}

// ─── Enemy Card Component ───────────────────────────────────────────────────────
function EnemyCard({ enemy, lang }) {
  const isRed = enemy.suit === "♥" || enemy.suit === "♦";
  const hpPct = Math.max(0, Math.min(100, (enemy.currentHp / enemy.hp) * 100));
  const hpColor = hpPct > 60 ? "#4ade80" : hpPct > 30 ? "#facc15" : "#f87171";
  return (
    <div className="rounded-2xl p-3 space-y-2" style={{ background: "rgba(180,30,30,0.18)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,100,100,0.25)", boxShadow: "0 8px 32px rgba(220,50,50,0.15), inset 0 1px 0 rgba(255,150,150,0.15)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl drop-shadow">{enemy.rank}</span>
          <span className={`text-2xl ${isRed ? "text-red-400" : "text-white"}`}>{enemy.suit}</span>
          <div>
            <p className="text-white/80 font-black text-sm leading-tight">
              {lang === "de" ? (enemy.rank === "J" ? "Bube" : enemy.rank === "Q" ? "Dame" : "König") : (enemy.rank === "J" ? "Jack" : enemy.rank === "Q" ? "Queen" : "King")}
            </p>
            <p className={`text-xs font-bold ${isRed ? "text-red-300" : "text-gray-300"}`}>
              {lang === "de" ? SUIT_NAMES_DE[enemy.suit] : SUIT_NAMES_EN[enemy.suit]}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/50 text-xs">{lang === "de" ? "Angriff" : "Attack"}</p>
          <p className="text-red-300 font-black text-lg">⚔️ {enemy.attack}</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>HP</span>
          <span>{enemy.currentHp} / {enemy.hp}</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${hpPct}%`, background: hpColor, boxShadow: `0 0 8px ${hpColor}` }} />
        </div>
      </div>
      {enemy.immuneSuit && (
        <p className="text-xs text-yellow-300/80 font-bold">🛡 {lang === "de" ? `Immun gegen ${SUIT_NAMES_DE[enemy.immuneSuit]}` : `Immune to ${SUIT_NAMES_EN[enemy.immuneSuit]}`}</p>
      )}
      {enemy.jesterCancelled && (
        <p className="text-xs text-purple-300/80 font-bold">🃏 {lang === "de" ? "Immunität aufgehoben" : "Immunity cancelled"}</p>
      )}
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────
export default function RegicideApp() {
  const [lang, setLang] = useState("de");
  const [theme, setTheme] = useState("fantasy");
  const [gameLayout, setGameLayout] = useState("arena");
  const [screen, setScreen] = useState("menu"); // menu, setup, game, gameover, victory
  const [numPlayers, setNumPlayers] = useState(1);
  const [game, setGame] = useState(null);
  const [soloJestersUsed, setSoloJestersUsed] = useState(0);
  const [soloJestersAvail, setSoloJestersAvail] = useState(2);
  const [lastYielded, setLastYielded] = useState([]); // tracks which players yielded last turn
  const [selectedCards, setSelectedCards] = useState([]);
  const [log, setLog] = useState([]);
  const [animMsg, setAnimMsg] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [phase, setPhase] = useState("play"); // play, discard
  const [discardNeeded, setDiscardNeeded] = useState(0);
  const [discardedSoFar, setDiscardedSoFar] = useState(0);
  const [pendingNextPlayerIndex, setPendingNextPlayerIndex] = useState(null);

  const addLog = (msg) => setLog((prev) => [msg, ...prev].slice(0, 20));

  const showAnim = (msg) => {
    setAnimMsg(msg);
    setTimeout(() => setAnimMsg(""), 2000);
  };

  const initGame = () => {
    const playerDeck = shuffle(createDeck(numPlayers));
    const enemyDeck = shuffle(createEnemyDeck());
    // Actually enemies should be ordered J first, Q second, K last but shuffled within ranks
    const jacks = shuffle(enemyDeck.filter((e) => e.rank === "J"));
    const queens = shuffle(enemyDeck.filter((e) => e.rank === "Q"));
    const kings = shuffle(enemyDeck.filter((e) => e.rank === "K"));
    const orderedEnemies = [...jacks, ...queens, ...kings];

    const handSize = getHandSize(numPlayers);
    const players = [];
    let remaining = [...playerDeck];

    for (let i = 0; i < numPlayers; i++) {
      players.push({
        id: i,
        name: `${t(lang, "Spieler", "Player")} ${i + 1}`,
        hand: remaining.splice(0, handSize),
      });
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
    if (phase !== "play") return;
    const currentHand = game.players[game.currentPlayerIndex].hand;
    const clickedCard = currentHand.find((c) => c.id === cardId);
    if (!clickedCard) return;

    setSelectedCards((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length === 0) return [cardId];

      const firstCard = currentHand.find((c) => c.id === prev[0]);
      if (!firstCard) return [cardId];

      // Jester must always be played alone
      if (clickedCard.type === "jester" || firstCard.type === "jester") return [cardId];

      // Animal Companion (A) can be paired with ONE other non-jester card
      const isFirstAnimal = firstCard.rank === "A";
      const isClickedAnimal = clickedCard.rank === "A";

      if (isFirstAnimal || isClickedAnimal) {
        // Animal can pair with exactly 1 other card (including another animal)
        if (prev.length === 1) return [...prev, cardId];
        return [cardId]; // already have 2 selected
      }

      // Combo: same rank, combined value <= 10
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

  // Base attack = card values WITHOUT clubs doubling (used for suit powers)
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

  // Full attack = base * 2 if clubs present and enemy not immune (used for DAMAGE only)
  const calcAttack = (cards, enemy) => {
    const base = calcBaseAttack(cards);
    if (base === 0) return 0;
    const enemyToCheck = enemy || game?.currentEnemy;
    const hasClubs = cards.some((c) => c.suit === "♣");
    const enemyImmuneToClubs = enemyToCheck?.suit === "♣" && !enemyToCheck?.jesterCancelled;
    if (hasClubs && !enemyImmuneToClubs) return base * 2;
    return base;
  };

  // Cumulative damage already dealt to current enemy (from tableCards)
  const calcCumulativeDamage = (tableCards, enemy) => {
    return tableCards.reduce((total, card) => {
      if (card.type === "jester") return total;
      const cardVal = getCardValue(card);
      // Was clubs doubled when this card was played? We store it on the card
      return total + (card._dealtDamage || cardVal);
    }, 0);
  };

  // Helper: count distinct suits among cards (for same-suit Animal Companion dedup)
  const countDistinctSuits = (cards, suit) => cards.filter((c) => c.suit === suit).length;

  // Suit powers use BASE attack value (not doubled by clubs) per the rules:
  // "3 of Diamonds, Spades and Clubs → draw 9 cards, reduce by 9, deal 18"
  // Rule: Animal Companion + same-suit card → suit power only applied ONCE
  const applyHearts = (g, cards, baseAttack) => {
    const heartsCards = cards.filter((c) => c.suit === "♥" && c.type !== "jester");
    if (heartsCards.length === 0) return g;
    // Rule: Animal Companion + same-suit card → power only once (already baseAttack covers this)
    const enemyImmuneToHearts = g.currentEnemy.suit === "♥" && !g.currentEnemy.jesterCancelled;
    if (enemyImmuneToHearts) { addLog(t(lang, "♥ Immunität – Heilung blockiert", "♥ Immune – heal blocked")); return g; }
    const healValue = baseAttack; // base value, not clubs-doubled
    const shuffledDiscard = shuffle([...g.discardPile]);
    const toHeal = shuffledDiscard.slice(0, healValue);
    const newDiscard = shuffledDiscard.slice(healValue);
    const newDraw = [...g.drawPile, ...toHeal]; // facedown under deck
    addLog(`♥ ${t(lang, `Heilt ${toHeal.length} Karten zurück`, `Healed ${toHeal.length} cards back`)}`);
    return { ...g, discardPile: newDiscard, drawPile: newDraw };
  };

  const applyDiamonds = (g, cards, players, baseAttack) => {
    const diamondCards = cards.filter((c) => c.suit === "♦" && c.type !== "jester");
    if (diamondCards.length === 0) return { g, players };
    // Rule: Animal Companion + same-suit ♦ card → power only once (baseAttack already sums values once)
    const enemyImmuneToD = g.currentEnemy.suit === "♦" && !g.currentEnemy.jesterCancelled;
    if (enemyImmuneToD) { addLog(t(lang, "♦ Immunität – Ziehen blockiert", "♦ Immune – draw blocked")); return { g, players }; }
    const drawCount = baseAttack; // base value, not clubs-doubled
    let drawPile = [...g.drawPile];
    let newPlayers = players.map((p) => ({ ...p, hand: [...p.hand] }));
    let drawn = 0;
    const maxHand = getHandSize(numPlayers);
    for (let i = 0; i < numPlayers && drawn < drawCount; i++) {
      const pi = (g.currentPlayerIndex + i) % numPlayers;
      const player = newPlayers[pi];
      const canDraw = maxHand - player.hand.length;
      const toDraw = Math.min(canDraw, drawCount - drawn);
      if (toDraw > 0 && drawPile.length > 0) {
        const drawnCards = drawPile.splice(0, Math.min(toDraw, drawPile.length));
        player.hand = [...player.hand, ...drawnCards];
        drawn += drawnCards.length;
        newPlayers[pi] = player;
      }
    }
    addLog(`♦ ${t(lang, `${drawn} Karten gezogen`, `${drawn} cards drawn`)}`);
    return { g: { ...g, drawPile }, players: newPlayers };
  };

  const applySpades = (g, cards, enemy, baseAttack) => {
    const spadeCards = cards.filter((c) => c.suit === "♠" && c.type !== "jester");
    if (spadeCards.length === 0) return enemy;
    const enemyImmuneToS = enemy.suit === "♠" && !enemy.jesterCancelled;
    if (enemyImmuneToS) { addLog(t(lang, "♠ Immunität – Schild blockiert", "♠ Immune – shield blocked")); return enemy; }
    // Rule: Animal Companion + same-suit ♠ card → shield power only once (use baseAttack, which sums all card values once)
    const shieldValue = baseAttack;
    const newAttack = Math.max(0, enemy.attack - shieldValue);
    addLog(`♠ ${t(lang, `Schild: Feind-Angriff ${enemy.attack} → ${newAttack} (kumulativ)`, `Shield: Enemy attack ${enemy.attack} → ${newAttack} (cumulative)`)}`);
    return { ...enemy, attack: newAttack };
  };

  // Solo jester flip
  const soloFlipJester = (timing) => {
    if (numPlayers !== 1 || soloJestersAvail <= 0 || !game) return;
    if (timing === "step1" && phase !== "play") return;
    if (timing === "step4" && phase !== "discard") return;
    const maxHand = 8;
    let drawPile = [...game.drawPile];
    // Discard current hand, refill to 8 — enemy immunity stays unchanged
    const discardPile = [...game.discardPile, ...game.players[0].hand];
    const newHand = drawPile.splice(0, maxHand);
    const newPlayers = [{ ...game.players[0], hand: newHand }];
    setSoloJestersUsed((p) => p + 1);
    setSoloJestersAvail((p) => p - 1);
    addLog(t(lang,
      `🃏 Jester umgedreht! Hand neu gezogen (${newHand.length} Karten). Immunität bleibt! Zählt nicht als Karten ziehen (♦).`,
      `🃏 Jester flipped! Hand refilled (${newHand.length} cards). Immunity unchanged! Does not count as drawing (♦).`
    ));
    if (timing === "step1") {
      // Step 1: just swap hand, continue playing normally
      setGame({ ...game, players: newPlayers, drawPile, discardPile });
    } else {
      // Step 4: swap hand, but player still needs to pay the damage with the new hand!
      setGame({ ...game, players: newPlayers, drawPile, discardPile });
      // phase stays "discard", discardNeeded stays — player pays damage with new hand
      addLog(t(lang,
        `⚠️ Schaden (${discardNeeded}) muss noch mit der neuen Hand bezahlt werden!`,
        `⚠️ Damage (${discardNeeded}) still needs to be paid with the new hand!`
      ));
    }
  };

  // Jester power: cancel enemy immunity
  const playJester = () => {
    if (!game) return;
    const selectedIds = [...selectedCards];
    // Remove jester from hand
    let players = game.players.map((p, i) =>
      i === game.currentPlayerIndex
        ? { ...p, hand: p.hand.filter((c) => !selectedIds.includes(c.id)) }
        : p
    );
    // Rule: Jester vs ♠ enemy → spades played BEFORE jester start reducing attack now
    // Rule: Jester vs ♣ enemy → clubs played BEFORE jester do NOT count double (already handled: clubs damage was 0 before jesterCancelled)
    // jesterCancelled = true means future cards of same suit WILL trigger power
    const enemy = { ...game.currentEnemy, jesterCancelled: true };
    addLog(`\ud83c\udccf ${t(lang, "Jester gespielt! Gegner-Immunit\u00e4t aufgehoben. W\u00e4hle n\u00e4chsten Spieler.", "Jester played! Enemy immunity cancelled. Choose next player.")}`);
    showAnim(t(lang, "\ud83c\udccf Jester! Immunit\u00e4t aufgehoben!", "\ud83c\udccf Jester! Immunity cancelled!"));
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
    if (phase !== "discard" || !game) return;
    const currentPlayer = game.players[game.currentPlayerIndex];
    const card = currentPlayer.hand.find((c) => c.id === cardId);
    if (!card) return;

    const cardValue = getCardValue(card);

    const newHand = currentPlayer.hand.filter((c) => c.id !== cardId);
    const newDiscard = [...game.discardPile, card];
    const newDiscardNeeded = discardNeeded - cardValue;

    addLog(`🗑 ${t(lang, `Abgeworfen: ${card.rank}${card.suit !== "🃏" ? card.suit : ""} (Wert: ${cardValue}), noch ${Math.max(0, newDiscardNeeded)} nötig`, `Discarded: ${card.rank}${card.suit !== "🃏" ? card.suit : ""} (value: ${cardValue}), still need ${Math.max(0, newDiscardNeeded)}`)}`);

    let newPlayers = game.players.map((p, i) =>
      i === game.currentPlayerIndex ? { ...p, hand: newHand } : p
    );

    if (newDiscardNeeded <= 0) {
      let drawPile = [...game.drawPile];
      const maxHand = getHandSize(numPlayers);
      const currP = { ...newPlayers[game.currentPlayerIndex] };
      while (currP.hand.length < maxHand && drawPile.length > 0) {
        currP.hand.push(drawPile.shift());
      }
      newPlayers[game.currentPlayerIndex] = currP;
      // Move to next player after discard
      const nextAfterDiscard = game._nextPlayerAfterDiscard ?? (game.currentPlayerIndex + 1) % numPlayers;
      addLog(t(lang, "✅ Schaden bezahlt! Nächster Spieler.", "\u2705 Damage paid! Next player."));
      const stateAfterDiscard = { ...game, players: newPlayers, discardPile: newDiscard, drawPile, currentPlayerIndex: nextAfterDiscard, _nextPlayerAfterDiscard: undefined };
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
        showAnim(t(lang, "💀 Niederlage! Schaden kann nicht bezahlt werden!", "💀 Defeat! Cannot pay damage!"));
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

    // Jester: always alone
    if (cards.some((c) => c.type === "jester")) {
      playJester();
      return;
    }

    // Validate combos
    if (cards.length > 1) {
      const animals = cards.filter((c) => c.rank === "A");
      if (animals.length > 0) {
        // Animal companion: max 1 animal + 1 other card (or 2 animals)
        if (cards.length > 2) { addLog(t(lang, "Ungültig: Tier-Begleiter nur mit 1 weiteren Karte!", "Invalid: Animal companion can only pair with 1 other card!")); return; }
      } else {
        // Combo: all same rank, total <= 10
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

    players[g.currentPlayerIndex] = {
      ...players[g.currentPlayerIndex],
      hand: players[g.currentPlayerIndex].hand.filter((c) => !selectedIds.includes(c.id)),
    };

    const baseAttack = calcBaseAttack(cards);
    const attack = calcAttack(cards, enemy); // attack = base*2 if clubs (for damage only)
    // Cumulative damage: sum of previous tableCards + this attack
    const prevDamage = g.tableCards.reduce((s, c) => s + (c._dealtDamage || 0), 0);
    const totalDamageNow = prevDamage + attack;
    const newHp = enemy.currentHp - attack;
    // Tag cards with their total dealt damage (stored on first card for simplicity)
    const taggedCards = cards.map((c, idx) => ({ ...c, _dealtDamage: idx === 0 ? attack : 0 }));
    addLog(`⚔️ ${t(lang, `Angriff: ${attack} Schaden → ${enemy.rank}${enemy.suit} (HP: ${enemy.currentHp} → ${Math.max(0, newHp)})`, `Attack: ${attack} damage → ${enemy.rank}${enemy.suit} (HP: ${enemy.currentHp} → ${Math.max(0, newHp)})`)}`);

    // Step 2: Suit powers use BASE attack (not clubs-doubled)
    g = applyHearts({ ...g, players }, cards, baseAttack);
    players = g.players || players;
    const diamondResult = applyDiamonds(g, cards, players, baseAttack);
    g = diamondResult.g;
    players = diamondResult.players;
    enemy = applySpades(g, cards, enemy, baseAttack);

    let tableCards = [...g.tableCards, ...taggedCards];

    // Step 3: check defeat (based on cumulative damage)
    if (newHp <= 0) {
      showAnim(t(lang, `${enemy.rank}${enemy.suit} besiegt! 🎉`, `${enemy.rank}${enemy.suit} defeated! 🎉`));
      addLog(t(lang, `Feind besiegt: ${enemy.rank}${enemy.suit}`, `Enemy defeated: ${enemy.rank}${enemy.suit}`));

      let newDiscard = [...g.discardPile];
      let newDraw = [...g.drawPile];

      if (newHp === 0) {
        // Exact kill: enemy face-down on TOP of tavern deck
        newDraw = [{ ...enemy }, ...newDraw];
        newDiscard = [...newDiscard, ...tableCards];
        addLog(t(lang, "Genau besiegt – Feind oben auf Nachziehstapel!", "Exactly defeated – enemy placed on top of draw pile!"));
      } else {
        // Overkill: table cards to discard, enemy to discard
        newDiscard = [...newDiscard, ...tableCards, { ...enemy }];
        addLog(t(lang, "Overkill – Karten auf Ablage.", "Overkill – cards to discard."));
      }

      if (g.enemyDeck.length === 0) {
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
      // Defeating player starts new turn (skips step 4); reset yield tracking
      setLastYielded([]);
      const newGameStateAfterDefeat = { ...g, players, drawPile, discardPile: newDiscard, enemyDeck: remainingEnemies, currentEnemy: nextEnemy, tableCards: [] };
      // Check if defeating player can act on new turn
      if (!checkCanActAndTriggerLose(newGameStateAfterDefeat, g.currentPlayerIndex, [])) {
        setGame(newGameStateAfterDefeat);
      }
      setPhase("play");
    } else {
      // Step 4: enemy attacks
      enemy.currentHp = newHp;
      const incomingDamage = enemy.attack; // already reduced by spades above
      const nextPlayerIndex = (g.currentPlayerIndex + 1) % numPlayers;

      if (incomingDamage <= 0) {
        // Spades fully blocked damage — current player refills hand, then next player goes
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
        addLog(`👿 ${t(lang, `${enemy.rank}${enemy.suit} greift an: ${incomingDamage} Schaden!`, `${enemy.rank}${enemy.suit} attacks for ${incomingDamage} damage!`)}`);
        showAnim(t(lang, `⚠️ ${incomingDamage} Schaden – Karten abwerfen!`, `⚠️ ${incomingDamage} damage – discard cards!`));
        setGame({ ...g, players, currentEnemy: enemy, currentPlayerIndex: nextPlayerIndex, tableCards });
        setPhase("discard");
        setDiscardNeeded(incomingDamage);
        setDiscardedSoFar(0);
        setPendingNextPlayerIndex(nextPlayerIndex);
      }
    }
  };

  const yieldTurn = () => {
    if (!game || phase !== "play") return;
    // Cannot yield if ALL other players yielded last turn
    const otherPlayers = game.players.map((_, i) => i).filter((i) => i !== game.currentPlayerIndex);
    const allOthersYielded = otherPlayers.length > 0 && otherPlayers.every((i) => lastYielded.includes(i));
    if (allOthersYielded && numPlayers > 1) {
      addLog(t(lang, "Passen nicht m\u00f6glich \u2013 alle anderen haben bereits gepasst!", "Cannot yield \u2013 all others already yielded!"));
      return;
    }
    // Check: if hand is empty, cannot yield either → lose
    if (game.players[game.currentPlayerIndex].hand.length === 0) {
      addLog(t(lang, "Keine Karten und kein Passen m\u00f6glich \u2013 Niederlage!", "No cards and cannot yield \u2013 defeat!"));
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
      addLog(`\ud83d\udc7f ${t(lang, `${enemy.rank}${enemy.suit} greift an: ${incomingDamage} Schaden!`, `${enemy.rank}${enemy.suit} attacks for ${incomingDamage} damage!`)}`);
      showAnim(t(lang, `\u26a0\ufe0f ${incomingDamage} Schaden \u2013 Karten abwerfen!`, `\u26a0\ufe0f ${incomingDamage} damage \u2013 discard cards!`));
      setGame({ ...game, currentPlayerIndex: nextPlayerIndex });
      setPhase("discard");
      setDiscardNeeded(incomingDamage);
      setDiscardedSoFar(0);
      setPendingNextPlayerIndex(nextPlayerIndex);
    }
  };

  // Check if current player can play or yield (game-end condition)
  // Returns true if game over was triggered
  const checkCanActAndTriggerLose = (g, playerIdx, lyielded) => {
    const player = g.players[playerIdx];
    if (player.hand.length > 0) return false; // has cards → can play
    // Empty hand: check if yield is possible
    const others = g.players.map((_, i) => i).filter((i) => i !== playerIdx);
    const allOthersYielded = others.length > 0 && others.every((i) => lyielded.includes(i));
    if (allOthersYielded || others.length === 0) {
      // Cannot play AND cannot yield → game over
      addLog(t(lang, "Keine Karten und kein Passen m\u00f6glich \u2013 Niederlage!", "No cards and cannot yield \u2013 defeat!"));
      setGame({ ...g, lost: true });
      setScreen("gameover");
      return true;
    }
    return false;
  };

  // ── Menu Screen ──────────────────────────────────────────────────────────────
  if (screen === "menu") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
        {/* Blurred blobs for liquid glass background */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(ellipse, #f472b6, transparent 70%)" }} />

        <div className="text-center mb-8 relative">
          <h1 className="text-7xl md:text-8xl font-black mb-2 drop-shadow-2xl" style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 0 40px rgba(255,255,255,0.3)" }}>⚔️ Coup d'État <span className="text-xs font-normal align-middle opacity-50">v. 1.1</span></h1>
          <p className="text-white/60 text-lg">{t(lang, "Das kooperative Kartenspiel", "The cooperative card game")}</p>
        </div>

        <div className="relative w-full max-w-md space-y-5 p-8 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 8px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}>

          {/* Language */}
          <div className="flex gap-2 justify-center">
            <button onClick={() => setLang("de")} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${lang === "de" ? "bg-white/90 text-gray-900 shadow-lg" : `${glass.btn} text-white/80`}`}>🇩🇪 Deutsch</button>
            <button onClick={() => setLang("en")} className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${lang === "en" ? "bg-white/90 text-gray-900 shadow-lg" : `${glass.btn} text-white/80`}`}>🇬🇧 English</button>
          </div>

          {/* Theme */}
          <div>
            <p className="text-white/50 text-xs mb-2 text-center tracking-widest uppercase">{t(lang, "Kartenstil", "Card Style")}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.entries(CARD_THEMES).map(([key, th]) => (
                <button key={key} onClick={() => setTheme(key)} className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${theme === key ? "bg-white/90 text-gray-900 shadow-lg" : `${glass.btn} text-white/70`}`}>
                  {lang === "de" ? th.name_de : th.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* Game Layout */}
          <div>
            <p className="text-white/50 text-xs mb-2 text-center tracking-widest uppercase">{t(lang, "Layout", "Layout")}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.entries(GAME_LAYOUTS).map(([key, lo]) => (
                <button key={key} onClick={() => setGameLayout(key)} className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${gameLayout === key ? "bg-white/90 text-gray-900 shadow-lg" : `${glass.btn} text-white/70`}`}>
                  {lang === "de" ? lo.name_de : lo.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* Players */}
          <div>
            <p className="text-white/50 text-xs mb-2 text-center tracking-widest uppercase">{t(lang, "Anzahl Spieler", "Number of Players")}</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => setNumPlayers(n)} className={`w-12 h-12 rounded-xl font-black text-lg transition-all ${numPlayers === n ? "bg-white/90 text-gray-900 scale-110 shadow-lg" : `${glass.btn} text-white/80`}`}>{n}</button>
              ))}
            </div>
            <p className="text-white/40 text-xs text-center mt-1">
              {t(lang, `Handgröße: ${getHandSize(numPlayers)} Karten`, `Hand size: ${getHandSize(numPlayers)} cards`)}
            </p>
          </div>

          <button onClick={initGame} className={`w-full py-4 font-black text-xl ${glass.btnPrimary}`}>
            {t(lang, "Spiel Starten ⚔️", "Start Game ⚔️")}
          </button>

          <button onClick={() => setShowRules(!showRules)} className={`w-full py-2 font-bold text-sm ${glass.btn}`}>
            {t(lang, "📖 Regeln", "📖 Rules")}
          </button>

          {showRules && (
            <div className="rounded-2xl p-4 text-white/70 text-xs space-y-2 max-h-64 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="font-bold text-white/90">{t(lang, "Ziel:", "Goal:")}</p>
              <p>{t(lang, "Besiege alle 12 royalen Feinde (4 Buben, 4 Damen, 4 Könige).", "Defeat all 12 royal enemies (4 Jacks, 4 Queens, 4 Kings).")}</p>
              <p className="font-bold text-white/90">{t(lang, "Reihenfolge:", "Order:")}</p>
              <p>{t(lang, "Buben → Damen → Könige. Besiege alle, um zu gewinnen.", "Jacks → Queens → Kings. Defeat all to win.")}</p>
              <p className="font-bold text-white/90">{t(lang, "Karten spielen:", "Playing cards:")}</p>
              <p>{t(lang, "Spiele 1 Karte oder mehrere Karten gleichen Rangs (Animal Gang).", "Play 1 card or multiple cards of the same rank (Animal Gang).")}</p>
              <p className="font-bold text-white/90">{t(lang, "Kräfte:", "Powers:")}</p>
              {Object.entries(SUIT_POWERS_DE).map(([suit, desc]) => (
                <p key={suit}>{suit} {lang === "de" ? desc : SUIT_POWERS_EN[suit]}</p>
              ))}
              <p className="font-bold text-white/90">{t(lang, "Gegner-Immunität:", "Enemy Immunity:")}</p>
              <p>{t(lang, "Könige sind immun gegen die Kraft ihrer eigenen Farbe.", "Kings are immune to the power of their own suit.")}</p>
              <p className="font-bold text-white/90">{t(lang, "Schaden:", "Damage:")}</p>
              <p>{t(lang, "Überlebende Feinde greifen zurück. Karten müssen abgeworfen werden (nach Wert).", "Surviving enemies attack back. Cards must be discarded (by value).")}</p>
              <p className="font-bold text-white/90">{t(lang, "Sieg / Niederlage:", "Win / Lose:")}</p>
              <p>{t(lang, "Sieg: Alle Feinde besiegt. Niederlage: Kein Feind kann bezahlt werden.", "Win: All enemies defeated. Lose: Can't pay full enemy damage.")}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Game Over / Victory ──────────────────────────────────────────────────────
  if (screen === "gameover" || screen === "victory") {
    const won = screen === "victory";
    const soloRank = soloJestersUsed === 0 ? "🥇 Gold" : soloJestersUsed === 1 ? "🥈 Silber/Silver" : "🥉 Bronze";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: won ? "linear-gradient(135deg,#1a1000,#3d2800,#1a1000)" : "linear-gradient(135deg,#1a0000,#3d0000,#0a0a0a)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: won ? "radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, transparent 70%)" : "radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, transparent 70%)" }} />
        <div className="text-center space-y-6 relative">
          <div className="text-8xl drop-shadow-2xl">{won ? "👑" : "💀"}</div>
          <h2 className={`text-5xl font-black drop-shadow-lg`} style={{ color: won ? "rgba(251,191,36,0.95)" : "rgba(239,68,68,0.95)", textShadow: won ? "0 0 40px rgba(251,191,36,0.5)" : "0 0 40px rgba(239,68,68,0.5)" }}>
            {won ? t(lang, "SIEG!", "VICTORY!") : t(lang, "NIEDERLAGE!", "DEFEAT!")}
          </h2>
          {won && numPlayers === 1 && (
            <div className="text-2xl font-black text-white/80">{soloRank} {t(lang, "Sieg!", "Victory!")}</div>
          )}
          <p className="text-white/60 text-lg">
            {won
              ? t(lang, "Ihr habt alle Könige besiegt! Das Königreich ist gerettet!", "You defeated all kings! The kingdom is saved!")
              : t(lang, "Das Königreich ist gefallen. Versucht es erneut!", "The kingdom has fallen. Try again!")}
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => { setScreen("menu"); setGame(null); }} className={`px-8 py-3 font-bold ${glass.btn}`}>
              {t(lang, "Hauptmenü", "Main Menu")}
            </button>
            <button onClick={initGame} className={`px-8 py-3 font-bold ${glass.btnPrimary}`}>
              {t(lang, "Nochmal spielen", "Play Again")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Game Screen ──────────────────────────────────────────────────────────────
  if (screen !== "game" || !game) return null;

  const currentPlayer = game.players[game.currentPlayerIndex];
  const selectedCardObjs = selectedCards.map((id) => currentPlayer.hand.find((c) => c.id === id)).filter(Boolean);
  const attackValue = calcAttack(selectedCardObjs, game.currentEnemy);
  const prevDamageDisplay = game.tableCards.reduce((s, c) => s + (c._dealtDamage || 0), 0);
  const totalDamageDisplay = prevDamageDisplay + attackValue;
  const enemyImmuneSuit = game.currentEnemy.jesterCancelled ? null : game.currentEnemy.suit;
  const enemyRemainingHp = game.currentEnemy.currentHp;
  const remainingEnemies = game.enemyDeck.length + 1;
  const totalEnemies = 12;

  const ActionBar = () => (
    <div className="p-2 md:p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }}>
      <div className="flex items-center gap-2 flex-wrap">
        {phase === "jester" && (
          <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}>
            <p className="text-purple-200 font-bold text-sm">🃏 {t(lang, "Jester! Wähle nächsten Spieler:", "Jester! Choose next player:")}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {game.players.map((_, pi) => (
                <button key={pi} onClick={() => chooseNextPlayer(pi)} className={"px-3 py-1 text-white/90 text-sm font-bold rounded-lg " + glass.btnPurple}>
                  {t(lang, "Spieler " + (pi + 1), "Player " + (pi + 1))}
                </button>
              ))}
            </div>
          </div>
        )}
        {phase === "discard" && (
          <div className="flex-1 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <p className="text-red-300 font-bold text-sm">⚠️ {t(lang, "Schaden abdecken!", "Cover damage!")}</p>
            <p className="text-white/70 text-xs">{t(lang, "Noch " + Math.ceil(discardNeeded) + " Schaden zu decken", "Still " + Math.ceil(discardNeeded) + " damage to cover")}</p>
          </div>
        )}
        {phase === "play" && selectedCards.length > 0 && (
          <div className="text-sm text-white/70">
            {selectedCards.length} {t(lang, "Karte(n)", "card(s)")} · <span className="text-white font-bold">⚔️ {attackValue}</span>
            {" ("}<span className="text-orange-400">{t(lang, "Gesamt: " + totalDamageDisplay, "Total: " + totalDamageDisplay)}</span>{")"}
            {totalDamageDisplay >= enemyRemainingHp && (
              <span className="ml-2 text-emerald-300 text-xs font-bold">✓ {t(lang, "Reicht!", "Enough!")}</span>
            )}
          </div>
        )}
        <div className="flex gap-2 ml-auto flex-wrap">
          {phase === "play" && selectedCards.length > 0 && (
            <button onClick={() => setSelectedCards([])} className={"px-3 py-2 text-white/80 text-sm " + glass.btn}>{t(lang, "Abwählen", "Deselect")}</button>
          )}
          {numPlayers === 1 && soloJestersAvail > 0 && phase === "play" && (
            <button onClick={() => soloFlipJester("step1")} className={"px-3 py-2 text-sm font-bold " + glass.btnPurple}>
              🃏 {t(lang, "Jester (" + soloJestersAvail + "x)", "Jester (" + soloJestersAvail + "x)")}
            </button>
          )}
          {numPlayers === 1 && soloJestersAvail > 0 && phase === "discard" && (
            <button onClick={() => soloFlipJester("step4")} className={"px-3 py-2 text-sm font-bold " + glass.btnPurple}>
              🃏 {t(lang, "Jester Hand tauschen (" + soloJestersAvail + "x)", "Jester swap hand (" + soloJestersAvail + "x)")}
            </button>
          )}
          {phase === "play" && (
            <>
              <button onClick={yieldTurn} className={"px-4 py-2 font-bold text-sm " + glass.btn}>{t(lang, "Passen", "Yield")}</button>
              <button
                onClick={playCards}
                disabled={selectedCards.length === 0}
                className={"px-6 py-2 font-bold text-sm rounded-xl transition-all " + (selectedCards.length > 0 ? glass.btnPrimary : "opacity-30 cursor-not-allowed bg-white/10 text-white/30 border border-white/10 rounded-xl")}
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

  const PlayerHand = ({ player, pi, small }) => {
    const isActive = pi === game.currentPlayerIndex;
    return (
      <div className="rounded-2xl p-2 md:p-3 transition-all" style={{ background: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: isActive ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)", boxShadow: isActive ? "0 0 24px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.2)" : "none" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ") + (isActive ? "bg-white/90 text-gray-900" : "bg-white/15 text-white")}>{pi + 1}</span>
            <span className={("font-bold text-sm ") + (isActive ? "text-white" : "text-white/50")}>{player.name} {isActive ? "(" + t(lang, "am Zug", "active") + ")" : ""}</span>
          </div>
          <span className="text-white/40 text-xs">{player.hand.length} {t(lang, "Karten", "cards")}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {player.hand.map((card) => (
            <PlayingCard
              key={card.id}
              card={card}
              selected={selectedCards.includes(card.id)}
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

  const SuitPowers = () => (
    <div className="p-2 rounded-xl text-xs space-y-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-white/70 font-bold text-xs tracking-wider">{t(lang, "Kräfte:", "Powers:")}</p>
      {Object.entries(SUIT_POWERS_DE).map(([suit, desc]) => {
        const isImmune = suit === enemyImmuneSuit;
        return (
          <div key={suit} className={("flex gap-1 text-white/60 ") + (isImmune ? "line-through opacity-30" : "")}>
            <span>{suit}</span>
            <span className="text-xs leading-tight">{lang === "de" ? desc.split(":")[0] : SUIT_POWERS_EN[suit].split(":")[0]}</span>
            {isImmune && <span className="text-red-400">🛡</span>}
          </div>
        );
      })}
    </div>
  );

  const EnemyInfo = () => (
    <div className="flex flex-col gap-2">
      <EnemyCard enemy={{ ...game.currentEnemy, immuneSuit: enemyImmuneSuit }} lang={lang} />
      <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <p className="text-white/40 text-xs mb-2">{t(lang, "Nächste Feinde:", "Next enemies:")}</p>
        <div className="flex flex-wrap gap-1">
          {game.enemyDeck.slice(0, 6).map((e) => (
            <span key={e.id} className={("text-sm ") + (e.suit === "♥" || e.suit === "♦" ? "text-red-400" : "text-gray-300")}>{e.rank}{e.suit}</span>
          ))}
          {game.enemyDeck.length > 6 && <span className="text-white/30 text-xs">+{game.enemyDeck.length - 6}</span>}
        </div>
      </div>
      {game.tableCards.length > 0 && (
        <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <p className="text-white/40 text-xs mb-1">{t(lang, "Tischkarten:", "Table cards:")}</p>
          <div className="flex flex-wrap gap-1">
            {game.tableCards.map((c) => (
              <span key={c.id} className={("text-sm ") + (c.suit === "♥" || c.suit === "♦" ? "text-red-400" : "text-gray-300")}>{c.rank}{c.suit}</span>
            ))}
          </div>
        </div>
      )}
      <SuitPowers />
    </div>
  );

  const GameLog = ({ className }) => (
    <div className={("p-3 rounded-2xl overflow-y-auto ") + (className || "")} style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-white/60 font-bold text-xs mb-2 tracking-wider">{t(lang, "Spiellog", "Game Log")}</p>
      <div className="space-y-1">
        {log.map((entry, i) => (
          <p key={i} className={("text-xs leading-tight ") + (i === 0 ? "text-white/90" : "text-white/35")}>{entry}</p>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
      <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }} />

      {animMsg && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-white text-2xl font-black px-8 py-4 rounded-2xl animate-bounce" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.3)", textShadow: "0 0 20px rgba(255,255,255,0.5)" }}>
            {animMsg}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-2 md:p-3 relative z-10" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <button onClick={() => setScreen("menu")} className="text-white/50 hover:text-white text-sm transition-colors">← {t(lang, "Menü", "Menu")}</button>
        <div className="text-center">
          <span className="text-white/90 font-bold text-sm tracking-widest">Coup d’État</span>
          <div className="text-white/40 text-xs">{t(lang, "Feinde übrig: " + remainingEnemies + "/" + totalEnemies, "Enemies left: " + remainingEnemies + "/" + totalEnemies)}</div>
        </div>
        <div className="text-xs text-white/40">{t(lang, "Stapel: " + game.drawPile.length, "Deck: " + game.drawPile.length)}</div>
      </div>

      {gameLayout === "arena" ? (
        <div className="flex flex-1 gap-2 p-2 md:gap-3 md:p-3 overflow-hidden relative z-10">
          <div className="flex flex-col gap-2 w-36 md:w-52 shrink-0">
            <EnemyInfo />
          </div>
          <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0">
            <div className="flex-1 overflow-y-auto space-y-2">
              {game.players.map((player, pi) => <PlayerHand key={pi} player={player} pi={pi} />)}
            </div>
            <ActionBar />
          </div>
          <GameLog className="hidden md:block w-44 shrink-0" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2 p-2 md:gap-3 md:p-3 overflow-hidden relative z-10">
          <div className="flex gap-2 md:gap-3">
            <div className="w-36 md:w-48 shrink-0">
              <EnemyCard enemy={{ ...game.currentEnemy, immuneSuit: enemyImmuneSuit }} lang={lang} />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="text-white/40 text-xs mb-1">{t(lang, "Nächste Feinde:", "Next enemies:")}</p>
                <div className="flex flex-wrap gap-1">
                  {game.enemyDeck.slice(0, 8).map((e) => (
                    <span key={e.id} className={("text-sm ") + (e.suit === "♥" || e.suit === "♦" ? "text-red-400" : "text-gray-300")}>{e.rank}{e.suit}</span>
                  ))}
                  {game.enemyDeck.length > 8 && <span className="text-white/30 text-xs">+{game.enemyDeck.length - 8}</span>}
                </div>
              </div>
              {game.tableCards.length > 0 && (
                <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <p className="text-white/40 text-xs mb-1">{t(lang, "Tischkarten:", "Table cards:")}</p>
                  <div className="flex flex-wrap gap-1">
                    {game.tableCards.map((c) => (
                      <span key={c.id} className={("text-sm ") + (c.suit === "♥" || c.suit === "♦" ? "text-red-400" : "text-gray-300")}>{c.rank}{c.suit}</span>
                    ))}
                  </div>
                </div>
              )}
              <SuitPowers />
            </div>
          </div>
          <ActionBar />
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
            {game.players.map((player, pi) => <PlayerHand key={pi} player={player} pi={pi} small={false} />)}
          </div>
          <GameLog className="max-h-28" />
        </div>
      )}
    </div>
  );
}
