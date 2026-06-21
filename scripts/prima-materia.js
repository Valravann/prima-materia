import { PrimaMateriaOracleApp } from "../applications/oracle-app.js";
import { PrimaMateriaPortentApp } from "../applications/portent-app.js";
import { PrimaMateriaTintTracker } from "../applications/tint-tracker.js";
import { PrimaMateriaFrameSelector } from "../applications/frame-selector.js";
import { PrimaMateriaOracleSidebarTab } from "../applications/oracle-sidebar-tab.js";

const MODULE_ID = "prima-materia";
const MODULE_PATH = `modules/${MODULE_ID}`;
const JOURNAL_NAME = "Prima Materia Session Journal";

const FRAME_LABELS = Object.freeze({
  literal: "Literal",
  personal: "Personal",
  structural: "Structural",
});

const TINT_LABELS = Object.freeze({
  neutral: "Neutral",
  day: "Day",
  night: "Night",
});

const FRAME_DETAILS = Object.freeze({
  literal: {
    summary:
      "Treat the reading as something concrete: an event, object, place, clue, or plain fact in the fiction.",
    prompt: "Ask what is physically happening or obviously true right now.",
  },
  personal: {
    summary:
      "Treat the reading as inner life: motives, feelings, bonds, identity, or a difficult personal choice.",
    prompt:
      "Ask who feels this most strongly and what it asks of them emotionally.",
  },
  structural: {
    summary:
      "Treat the reading as a pattern or system: institutions, factions, customs, logistics, or wider pressures around the scene.",
    prompt: "Ask what larger force, rule, or social pattern is shaping events.",
  },
});

const TINT_DETAILS = Object.freeze({
  neutral: {
    summary:
      "Neutral tint keeps the reading balanced. Hold promise and warning together before deciding which one matters most.",
    prompt:
      "Look for ambiguity, tension, or a situation still waiting to tip one way or the other.",
  },
  day: {
    summary:
      "Day tint favors clarity, momentum, support, and outcomes that can be used constructively.",
    prompt:
      "Look for openings, honest signals, help, or the cleaner path forward.",
  },
  night: {
    summary:
      "Night tint favors pressure, concealment, cost, instability, or the shadow side of what is happening.",
    prompt:
      "Look for hidden motives, consequences, fragility, or what the scene is trying not to reveal.",
  },
});

const SOL_LABELS = [
  `${MODULE_PATH}/assets/dice/sol/01-fortune.png`,
  `${MODULE_PATH}/assets/dice/sol/02-safety.png`,
  `${MODULE_PATH}/assets/dice/sol/03-freedom.png`,
  `${MODULE_PATH}/assets/dice/sol/04-connection.png`,
  `${MODULE_PATH}/assets/dice/sol/05-body.png`,
  `${MODULE_PATH}/assets/dice/sol/06-mind.png`,
  `${MODULE_PATH}/assets/dice/sol/07-nature.png`,
  `${MODULE_PATH}/assets/dice/sol/08-society.png`,
  `${MODULE_PATH}/assets/dice/sol/09-knowledge.png`,
  `${MODULE_PATH}/assets/dice/sol/10-spirit.png`,
  `${MODULE_PATH}/assets/dice/sol/11-calm.png`,
  `${MODULE_PATH}/assets/dice/sol/12-self.png`,
];
const SYZYGY_LABELS = [
  `${MODULE_PATH}/assets/dice/syzygy/01-within.png`,
  `${MODULE_PATH}/assets/dice/syzygy/02-against.png`,
  `${MODULE_PATH}/assets/dice/syzygy/03-from.png`,
  `${MODULE_PATH}/assets/dice/syzygy/04-toward.png`,
  `${MODULE_PATH}/assets/dice/syzygy/05-over.png`,
  `${MODULE_PATH}/assets/dice/syzygy/06-between.png`,
];

const PACK_SOURCES = {
  actions: {
    label: "Actions",
    description:
      "Use the rolled symbols to decide what kind of action, impulse, or tactic is most relevant.",
  },
  "npc-reactions": {
    label: "NPC Reactions",
    description:
      "Use the symbols to frame how someone responds outwardly and what is driving that response underneath.",
  },
  landmarks: {
    label: "Landmarks",
    description:
      "Use the symbols to shape what kind of place, threshold, or environmental feature matters here.",
  },
  names: {
    label: "Names",
    description:
      "Use the symbols as the tonal axes for selecting or inventing a fitting name.",
  },
  complications: {
    label: "Complications",
    description:
      "Use the symbols to decide what pressure rises to the surface and what hidden cost travels with it.",
  },
  quests: {
    label: "Quest Prompts",
    description:
      "Use the symbols to decide the main drive of the prompt and the tension or burden attached to it.",
  },
};

const state = {
  loaded: false,
  symbols: [],
  syzygies: [],
  apps: {
    oracle: null,
    portent: null,
    tint: null,
    frame: null,
  },
  dice3d: null,
};

/**
 * @returns {Promise<void>}
 */
async function loadData() {
  if (state.loaded) return;

  const [symbols, syzygies] = await Promise.all([
    fetchJson(`${MODULE_PATH}/data/symbols.json`),
    fetchJson(`${MODULE_PATH}/data/syzygy.json`),
  ]);

  state.symbols = symbols;
  state.syzygies = syzygies;
  state.loaded = true;
}

/**
 * @param {string} path
 * @returns {Promise<any>}
 */
async function fetchJson(path) {
  const response = await foundry.utils.fetchJsonWithTimeout(
    path,
    {},
    {
      timeoutMs: 10000,
    },
  );

  if (!response) {
    throw new Error(`Prima Materia failed to load JSON from ${path}`);
  }

  return response;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * @param {number} face
 * @returns {any}
 */
function getSymbolByFace(face) {
  return state.symbols[clamp(face - 1, 0, state.symbols.length - 1)];
}

/**
 * @param {number} face
 * @returns {any}
 */
function getSyzygyByFace(face) {
  return state.syzygies[clamp(face - 1, 0, state.syzygies.length - 1)];
}

function getFrame() {
  return game.user?.getFlag(MODULE_ID, "frame") ?? "literal";
}

async function setFrame(frame) {
  if (!FRAME_LABELS[frame]) return;
  await game.user.setFlag(MODULE_ID, "frame", frame);
  refreshRenderedApps();
}

function getTint() {
  return game.settings.get(MODULE_ID, "currentTint") ?? "neutral";
}

async function setTint(tint, { notify = true } = {}) {
  if (!TINT_LABELS[tint]) return;
  await game.settings.set(MODULE_ID, "currentTint", tint);
  if (notify)
    ui.notifications?.info(`Prima Materia tint is now ${labelForTint(tint)}.`);
  refreshRenderedApps();
}

function labelForFrame(frame) {
  return FRAME_LABELS[frame] ?? FRAME_LABELS.literal;
}

function describeFrame(frame) {
  return FRAME_DETAILS[frame]?.summary ?? FRAME_DETAILS.literal.summary;
}

function promptForFrame(frame) {
  return FRAME_DETAILS[frame]?.prompt ?? FRAME_DETAILS.literal.prompt;
}

function labelForTint(tint) {
  return TINT_LABELS[tint] ?? TINT_LABELS.neutral;
}

function describeTint(tint) {
  return TINT_DETAILS[tint]?.summary ?? TINT_DETAILS.neutral.summary;
}

function promptForTint(tint) {
  return TINT_DETAILS[tint]?.prompt ?? TINT_DETAILS.neutral.prompt;
}

function isDiceSoNiceEnabled() {
  return Boolean(
    game.modules.get("dice-so-nice")?.active &&
    game.settings.get(MODULE_ID, "enableDiceSoNiceIntegration") &&
    game.dice3d,
  );
}

function showInterpretations() {
  return game.settings.get(MODULE_ID, "showInterpretations");
}

function getPluckOptions() {
  return Object.entries(PACK_SOURCES).map(([value, source]) => ({
    value,
    label: source.label,
    description: source.description,
  }));
}

/**
 * @param {"sol"|"nox"|"syzygy"} role
 */
function getDiceAppearance(role) {
  switch (role) {
    case "sol":
      return { colorset: "prima-materia-sol", system: MODULE_ID };
    case "nox":
      return { colorset: "prima-materia-nox", system: MODULE_ID };
    case "syzygy":
      return { colorset: "prima-materia-syzygy", system: MODULE_ID };
    default:
      return { system: MODULE_ID };
  }
}

function show3dRoll(roll, role) {
  if (!isDiceSoNiceEnabled()) return false;

  roll.options ??= {};
  roll.options.appearance = getDiceAppearance(role);

  try {
    Promise.resolve(game.dice3d.showForRoll(roll, game.user)).catch((error) => {
      console.warn(`${MODULE_ID} | Dice So Nice animation failed`, error);
    });
    return true;
  } catch (error) {
    console.warn(`${MODULE_ID} | Dice So Nice animation failed`, error);
    return false;
  }
}

async function rollSymbolDie(role) {
  await loadData();

  const roll = await new Roll("1d12").evaluate();
  show3dRoll(roll, role);

  const face = Number(roll.total);
  const symbol = getSymbolByFace(face);
  const meaning = role === "sol" ? symbol.solMeaning : symbol.noxMeaning;
  const keywords =
    role === "sol" ? [...symbol.solKeywords] : [...symbol.noxKeywords];

  return {
    die: role,
    face,
    symbol,
    meaning,
    keywords,
    roll,
  };
}

function getSymbolIconPath(face) {
  const index = Number(face) - 1;
  return SOL_LABELS[index] ?? null;
}

function getSyzygyIconPath(face) {
  const index = Number(face) - 1;
  return SYZYGY_LABELS[index] ?? null;
}

async function rollSyzygyDie() {
  await loadData();

  const roll = await new Roll("1d6").evaluate();
  show3dRoll(roll, "syzygy");

  const face = Number(roll.total);
  const relationship = getSyzygyByFace(face);

  return {
    die: "syzygy",
    face,
    relationship,
    roll,
  };
}

function capitalize(word) {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : "";
}

function stripRolls(value) {
  if (Array.isArray(value)) return value.map(stripRolls);
  if (!value || typeof value !== "object") return value;

  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === "roll") continue;
    if (typeof nested === "function") continue;
    output[key] = stripRolls(nested);
  }
  return output;
}

function joinClauses(clauses) {
  return clauses.filter(Boolean).join(" ");
}

function joinInterpretationBlocks(blocks) {
  return blocks.filter(Boolean).join("\n\n");
}

function formatKeywordFocus(keywords, count = 2) {
  if (!Array.isArray(keywords) || !keywords.length) return "";
  const focus = keywords.slice(0, count);
  if (focus.length === 1) return focus[0];
  return `${focus.slice(0, -1).join(", ")} and ${focus.at(-1)}`;
}

function buildKeywordPrompt(keywords) {
  const focus = formatKeywordFocus(keywords);
  return focus ? `Look first for ${focus}.` : "";
}

function currentReadingContext() {
  const frame = getFrame();
  const tint = getTint();

  return {
    frame,
    tint,
    frameLabel: labelForFrame(frame),
    tintLabel: labelForTint(tint),
    frameSummary: describeFrame(frame),
    framePrompt: promptForFrame(frame),
    tintSummary: describeTint(tint),
    tintPrompt: promptForTint(tint),
  };
}

function appendLensShiftText(text, lensShift) {
  if (!lensShift) return text;

  return joinInterpretationBlocks([
    text,
    `Lens Shift: because Sol and Nox matched, the tint moves from ${lensShift.previousTintLabel} to ${lensShift.nextTintLabel}. Let that new tone color the rest of the reading.`,
  ]);
}

function buildPeekNarrative(dieLabel, dieResult) {
  const context = currentReadingContext();

  return joinInterpretationBlocks([
    `Read this as ${dieResult.symbol.name} through the ${context.frameLabel.toLowerCase()} frame. ${context.frameSummary}`,
    `${dieLabel} emphasizes ${dieResult.meaning}. ${context.tintSummary}`,
    joinClauses([
      buildKeywordPrompt(dieResult.keywords),
      context.framePrompt,
      context.tintPrompt,
    ]),
  ]);
}

function buildPullPassIntro(sol, nox, lensShift) {
  const context = currentReadingContext();
  const text = joinInterpretationBlocks([
    `Set ${sol.symbol.name} and ${nox.symbol.name} beside each other before deciding which thread to foreground. ${context.frameSummary}`,
    `Sol suggests ${sol.meaning}. Nox suggests ${nox.meaning}. ${context.tintSummary}`,
    `Choose the symbol you want acting in the foreground; the other becomes context, cost, or resistance. ${context.tintPrompt}`,
  ]);

  return appendLensShiftText(text, lensShift);
}

function buildPullPassNarrative(existing, pulledKey) {
  const context = currentReadingContext();
  const pulled = existing[pulledKey];
  const passed = existing[pulledKey === "sol" ? "nox" : "sol"];
  const text = joinInterpretationBlocks([
    `Pull ${pulled.symbol} into the foreground and let ${passed.symbol} recede into the background. ${context.frameSummary}`,
    `Read ${pulled.symbol} as the active thread: ${pulled.meaning}. Read ${passed.symbol} as the background pressure, tradeoff, or condition: ${passed.meaning}.`,
    `${context.tintSummary} ${context.tintPrompt}`,
    `Ask what changes if ${pulled.symbol} is treated as the priority and ${passed.symbol} as the cost of that choice.`,
  ]);

  return appendLensShiftText(text, existing.lensShift ?? null);
}

function buildPinchIntro(sol, nox, lensShift) {
  const context = currentReadingContext();
  const text = joinInterpretationBlocks([
    `Hold ${sol.symbol.name} and ${nox.symbol.name} in the same reading before deciding how they relate. ${context.frameSummary}`,
    `At first glance they suggest ${sol.meaning} alongside ${nox.meaning}. ${context.tintSummary}`,
    `Now decide whether they reinforce one another, collide, or need a Syzygy die to explain the relationship. ${context.tintPrompt}`,
  ]);

  return appendLensShiftText(text, lensShift);
}

function buildPinchNarrativeDetailed(
  sol,
  nox,
  style,
  syzygy = null,
  lensShift = null,
) {
  const context = currentReadingContext();
  const relationshipText = syzygy
    ? `The Syzygy die adds ${syzygy.relationship.name}: ${syzygy.relationship.meaning}.`
    : "";
  const styleText =
    style === "smash"
      ? `Read ${sol.symbol.name} and ${nox.symbol.name} as competing pressures. ${sol.meaning} clashes with ${nox.meaning}, so the point of the reading is the friction between them.`
      : `Read ${sol.symbol.name} and ${nox.symbol.name} as reinforcing one another. ${sol.meaning} works in tandem with ${nox.meaning}, so the point of the reading is how both can be true at once.`;
  const promptText =
    style === "smash"
      ? `Ask what must give way for one symbol to dominate, and what cost appears if the other is suppressed.`
      : `Ask where these two symbols support the same answer, and what becomes possible only when both are honored together.`;
  const text = joinInterpretationBlocks([
    joinClauses([styleText, context.frameSummary]),
    joinClauses([relationshipText, context.tintSummary, context.tintPrompt]),
    promptText,
  ]);

  return appendLensShiftText(text, lensShift);
}

function buildPortentNarrative(primary, secondary, syzygy, lensShift = null) {
  const context = currentReadingContext();
  const text = joinInterpretationBlocks([
    `Let ${primary.symbol.name} lead the reading and treat ${secondary.symbol.name} as the supporting field, cost, or counterpart. ${context.frameSummary}`,
    `${syzygy.relationship.name} says the connection between them is ${syzygy.relationship.meaning}. Read the leading symbol as the active force: ${primary.meaning}.`,
    `Read the supporting symbol as what the reading acts through, reshapes, or strains against: ${secondary.meaning}. ${context.tintSummary}`,
    `${context.tintPrompt} Ask where ${primary.symbol.name} is showing up ${syzygy.relationship.name.toLowerCase()} ${secondary.symbol.name}, and what that reveals about the scene.`,
  ]);

  return appendLensShiftText(text, lensShift);
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function determinePrimary(sol, nox) {
  const primary = pickRandom([sol, nox]);
  return {
    primary,
    secondary: primary === sol ? nox : sol,
  };
}

function resolveTintShift(currentTint, winnerDie) {
  switch (currentTint) {
    case "neutral":
      return winnerDie === "sol" ? "day" : "night";
    case "day":
      return winnerDie === "sol" ? "neutral" : "night";
    case "night":
      return winnerDie === "sol" ? "day" : "neutral";
    default:
      return currentTint;
  }
}

async function maybeTriggerLensShift(sol, nox, syzygy = null) {
  if (sol.symbol.id !== nox.symbol.id) return null;

  const lensSyzygy = syzygy ?? (await rollSyzygyDie());
  const primary = determinePrimary(sol, nox).primary;
  const previousTint = getTint();
  const nextTint = resolveTintShift(previousTint, primary.die);

  if (previousTint !== nextTint) {
    await setTint(nextTint, { notify: true });
  }

  return {
    triggered: true,
    previousTint,
    previousTintLabel: labelForTint(previousTint),
    nextTint,
    nextTintLabel: labelForTint(nextTint),
    winner: primary.die,
    winnerLabel: primary.die === "sol" ? "Sol" : "Nox",
    syzygy: {
      relationship: lensSyzygy.relationship.name,
      meaning: lensSyzygy.relationship.meaning,
    },
  };
}

async function rollPeek(kind) {
  const dieResult = await rollSymbolDie(kind);
  const dieLabel = kind === "sol" ? "Sol" : "Nox";

  return {
    mode: "peek",
    die: kind,
    dieLabel,
    cssClass: kind,
    narrative: buildPeekNarrative(dieLabel, dieResult),
    result: {
      symbol: dieResult.symbol.name,
      icon: getSymbolIconPath(dieResult.face),
      meaning: dieResult.meaning,
      keywords: dieResult.keywords,
    },
    _raw: {
      die: kind,
      face: dieResult.face,
      symbol: dieResult.symbol,
      meaning: dieResult.meaning,
      keywords: dieResult.keywords,
      roll: dieResult.roll,
    },
  };
}

async function rollPullPass() {
  const [sol, nox] = await Promise.all([
    rollSymbolDie("sol"),
    rollSymbolDie("nox"),
  ]);
  const lensShift = await maybeTriggerLensShift(sol, nox);

  return {
    mode: "pullPass",
    narrative: buildPullPassIntro(sol, nox, lensShift),
    publishReady: false,
    result: {
      sol: {
        symbol: sol.symbol.name,
        icon: getSymbolIconPath(sol.face),
        meaning: sol.meaning,
        keywords: sol.keywords,
      },
      nox: {
        symbol: nox.symbol.name,
        icon: getSymbolIconPath(nox.face),
        meaning: nox.meaning,
        keywords: nox.keywords,
      },
      pulled: null,
      passed: null,
      lensShift,
    },
    _raw: {
      sol,
      nox,
      lensShift,
    },
  };
}

function resolvePullPass(existing, choice) {
  const pulledKey = choice === "nox" ? "nox" : "sol";
  const passedKey = pulledKey === "sol" ? "nox" : "sol";

  const clone = foundry.utils.deepClone(stripRolls(existing));
  clone.publishReady = true;
  clone.result.pulled = existing.result[pulledKey].symbol;
  clone.result.passed = existing.result[passedKey].symbol;
  clone.narrative = buildPullPassNarrative(existing.result, pulledKey);
  return clone;
}

async function rollPinch() {
  const [sol, nox] = await Promise.all([
    rollSymbolDie("sol"),
    rollSymbolDie("nox"),
  ]);
  const lensShift = await maybeTriggerLensShift(sol, nox);

  return {
    mode: "pinch",
    narrative: buildPinchIntro(sol, nox, lensShift),
    publishReady: false,
    result: {
      raw: `${sol.symbol.name} + ${nox.symbol.name}`,
      style: "add",
      sol: {
        symbol: sol.symbol.name,
        icon: getSymbolIconPath(sol.face),
        meaning: sol.meaning,
        keywords: sol.keywords,
      },
      nox: {
        symbol: nox.symbol.name,
        icon: getSymbolIconPath(nox.face),
        meaning: nox.meaning,
        keywords: nox.keywords,
      },
      syzygy: null,
      lensShift,
    },
    _raw: {
      sol,
      nox,
      lensShift,
    },
  };
}

function applyPinchStyle(existing, style) {
  const clone = foundry.utils.deepClone(stripRolls(existing));
  clone.publishReady = true;
  clone.result.style = style === "smash" ? "smash" : "add";
  clone.narrative = buildPinchNarrativeDetailed(
    existing._raw.sol,
    existing._raw.nox,
    clone.result.style,
    existing._raw.syzygy ?? null,
    existing._raw.lensShift ?? null,
  );
  return clone;
}

async function addPinchSyzygy(existing) {
  const syzygy = await rollSyzygyDie();
  const clone = foundry.utils.deepClone(stripRolls(existing));

  clone.publishReady = true;
  clone.result.syzygy = {
    relationship: syzygy.relationship.name,
    icon: getSyzygyIconPath(syzygy.face),
    meaning: syzygy.relationship.meaning,
    keywords: syzygy.relationship.keywords,
  };
  clone.narrative = buildPinchNarrativeDetailed(
    existing._raw.sol,
    existing._raw.nox,
    clone.result.style,
    syzygy,
    existing._raw.lensShift ?? null,
  );
  clone._raw = {
    ...existing._raw,
    syzygy,
  };

  return clone;
}

async function drawPluck(key) {
  const source = PACK_SOURCES[key] ? key : "actions";
  const [sol, nox] = await Promise.all([
    rollSymbolDie("sol"),
    rollSymbolDie("nox"),
  ]);

  return {
    mode: "pluck",
    result: {
      tableKey: source,
      tableLabel: PACK_SOURCES[source].label,
      sol: {
        symbol: sol.symbol.name,
        icon: getSymbolIconPath(sol.face),
      },
      nox: {
        symbol: nox.symbol.name,
        icon: getSymbolIconPath(nox.face),
      },
    },
    _raw: {
      tableKey: source,
      sol,
      nox,
    },
  };
}

async function rollPortent() {
  const [sol, nox, syzygy] = await Promise.all([
    rollSymbolDie("sol"),
    rollSymbolDie("nox"),
    rollSyzygyDie(),
  ]);

  const { primary, secondary } = determinePrimary(sol, nox);
  const lensShift = await maybeTriggerLensShift(sol, nox, syzygy);
  const statement = `${primary.symbol.name} ${syzygy.relationship.name} ${secondary.symbol.name}`;

  return {
    mode: "portent",
    statement,
    narrative: buildPortentNarrative(primary, secondary, syzygy, lensShift),
    primaryMeaning: primary.meaning,
    relationshipMeaning: syzygy.relationship.meaning,
    secondaryMeaning: secondary.meaning,
    primaryCssClass: primary.die,
    secondaryCssClass: secondary.die,
    lensShift,
    result: {
      primary: primary.symbol.name,
      primaryIcon: getSymbolIconPath(primary.face),
      relationship: syzygy.relationship.name,
      relationshipIcon: getSyzygyIconPath(syzygy.face),
      secondary: secondary.symbol.name,
      secondaryIcon: getSymbolIconPath(secondary.face),
    },
    _raw: {
      sol,
      nox,
      syzygy,
      primary,
      secondary,
      lensShift,
    },
  };
}

function escapeJournal(value) {
  return foundry.utils.escapeHTML(String(value ?? "—"));
}

function formatJournalDateParts(date) {
  const pad = (value) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`,
    dateTime: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
  };
}

function formatJournalKeywords(keywords) {
  return Array.isArray(keywords) && keywords.length ? keywords.join(", ") : "—";
}

function formatLensShift(lensShift) {
  if (!lensShift) return null;
  return `${lensShift.previousTintLabel} → ${lensShift.nextTintLabel} (won by ${lensShift.winnerLabel})`;
}

function renderInterpretationBlocks(value) {
  const blocks = String(value ?? "")
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return escapeJournal(value);

  return `<span class="pm-interpretation-stack">${blocks
    .map(
      (block) =>
        `<span class="pm-interpretation-block">${escapeJournal(block)}</span>`,
    )
    .join("")}</span>`;
}

function renderInterpretationValue(value) {
  return `<details class="pm-interpretation-details"><summary>Interpretation</summary>${renderInterpretationBlocks(
    value,
  )}</details>`;
}

function renderJournalValue(value, label = "") {
  if (value && typeof value === "object" && typeof value.html === "string") {
    return value.html;
  }

  if (label === "Interpretation" && typeof value === "string") {
    return renderInterpretationValue(value);
  }

  return escapeJournal(value);
}

function renderJournalRows(rows) {
  return rows
    .filter((row) => row && row[1] != null && row[1] !== "")
    .map(([label, value]) => {
      if (label === "Interpretation") {
        return `<div class="pm-journal-row pm-journal-row-interpretation">${renderJournalValue(value, label)}</div>`;
      }

      return `<p><strong>${escapeJournal(label)}:</strong> ${renderJournalValue(value, label)}</p>`;
    })
    .join("");
}

function renderJournalSection(title, rows) {
  return [
    `<section class="prima-materia-journal-section">`,
    `<h2>${escapeJournal(title)}</h2>`,
    renderJournalRows(rows),
    `</section>`,
  ].join("");
}

function getJournalModeLabel(mode) {
  switch (mode) {
    case "pullPass":
      return "Pull/Pass";
    case "pluck":
      return "Pluck";
    case "pinch":
      return "Pinch";
    case "peek":
      return "Peek";
    case "portent":
      return "Portent";
    default:
      return capitalize(mode);
  }
}

function createJournalPageName(payload) {
  const mode = getJournalModeLabel(payload.mode);

  switch (payload.mode) {
    case "peek":
      return `[${mode}][${payload.dieLabel}: ${payload.result.symbol}]`;
    case "pullPass":
      return `[${mode}][${payload.result.sol.symbol} / ${payload.result.nox.symbol}]`;
    case "pinch":
      return `[${mode}][${payload.result.sol.symbol} + ${payload.result.nox.symbol}]`;
    case "pluck":
      return `[${mode}][${payload.result.tableLabel}: ${payload.result.sol.symbol} / ${payload.result.nox.symbol}]`;
    case "portent":
      return `[${mode}][${payload._raw.sol.symbol.name} / ${payload._raw.syzygy.relationship.name} / ${payload._raw.nox.symbol.name}]`;
    default:
      return `[${mode}]`;
  }
}

function renderSymbolWithIcon(symbol, icon, suffix = null) {
  const text = suffix ? `${symbol} — ${suffix}` : symbol;
  if (!icon) return text;

  return {
    html: `<span class="pm-inline-symbol"><img class="pm-inline-symbol-icon" src="${escapeJournal(icon)}" alt="${escapeJournal(symbol)}" /><span>${escapeJournal(text)}</span></span>`,
  };
}

function buildOracleSections(payload) {
  const sections = [];
  const includeInterpretations = showInterpretations();

  switch (payload.mode) {
    case "peek": {
      sections.push([
        "Oracle Result",
        [
          ["Die", payload.dieLabel],
          [
            "Symbol",
            renderSymbolWithIcon(payload.result.symbol, payload.result.icon),
          ],
          ["Meaning", payload.result.meaning],
          ["Keywords", formatJournalKeywords(payload.result.keywords)],
        ],
      ]);
      if (includeInterpretations) {
        sections.push([
          "Combined Meaning",
          [
            [
              "Result",
              renderSymbolWithIcon(payload.result.symbol, payload.result.icon),
            ],
            ["Interpretation", payload.narrative],
          ],
        ]);
      }
      break;
    }

    case "pullPass": {
      sections.push([
        "Oracle Results",
        [
          [
            "Sol",
            renderSymbolWithIcon(
              payload.result.sol.symbol,
              payload.result.sol.icon,
              payload.result.sol.meaning,
            ),
          ],
          ["Sol Keywords", formatJournalKeywords(payload.result.sol.keywords)],
          [
            "Nox",
            renderSymbolWithIcon(
              payload.result.nox.symbol,
              payload.result.nox.icon,
              payload.result.nox.meaning,
            ),
          ],
          ["Nox Keywords", formatJournalKeywords(payload.result.nox.keywords)],
        ],
      ]);
      sections.push([
        "Combined Meaning",
        [
          [
            "Pulled",
            payload.result.pulled
              ? renderSymbolWithIcon(
                  payload.result.pulled,
                  payload.result.pulled === payload.result.sol.symbol
                    ? payload.result.sol.icon
                    : payload.result.nox.icon,
                )
              : null,
          ],
          [
            "Passed",
            payload.result.passed
              ? renderSymbolWithIcon(
                  payload.result.passed,
                  payload.result.passed === payload.result.sol.symbol
                    ? payload.result.sol.icon
                    : payload.result.nox.icon,
                )
              : null,
          ],
          ["Lens Shift", formatLensShift(payload.result.lensShift)],
          ...(includeInterpretations
            ? [["Interpretation", payload.narrative]]
            : []),
        ],
      ]);
      break;
    }

    case "pinch": {
      sections.push([
        "Oracle Results",
        [
          [
            "Sol",
            renderSymbolWithIcon(
              payload.result.sol.symbol,
              payload.result.sol.icon,
              payload.result.sol.meaning,
            ),
          ],
          ["Sol Keywords", formatJournalKeywords(payload.result.sol.keywords)],
          [
            "Nox",
            renderSymbolWithIcon(
              payload.result.nox.symbol,
              payload.result.nox.icon,
              payload.result.nox.meaning,
            ),
          ],
          ["Nox Keywords", formatJournalKeywords(payload.result.nox.keywords)],
          [
            "Syzygy",
            payload.result.syzygy
              ? renderSymbolWithIcon(
                  payload.result.syzygy.relationship,
                  payload.result.syzygy.icon,
                  payload.result.syzygy.meaning,
                )
              : null,
          ],
        ],
      ]);
      sections.push([
        "Combined Meaning",
        [
          [
            "Sol",
            renderSymbolWithIcon(
              payload.result.sol.symbol,
              payload.result.sol.icon,
            ),
          ],
          payload.result.syzygy
            ? [
                "Syzygy",
                renderSymbolWithIcon(
                  payload.result.syzygy.relationship,
                  payload.result.syzygy.icon,
                ),
              ]
            : null,
          [
            "Nox",
            renderSymbolWithIcon(
              payload.result.nox.symbol,
              payload.result.nox.icon,
            ),
          ],
          ["Combination", payload.result.raw],
          [
            "Style",
            payload.result.style === "smash"
              ? "Smash Together"
              : "Add Together",
          ],
          ["Lens Shift", formatLensShift(payload.result.lensShift)],
          ...(includeInterpretations
            ? [["Interpretation", payload.narrative]]
            : []),
        ],
      ]);
      break;
    }

    case "pluck": {
      sections.push([
        "Oracle Results",
        [
          ["Table", payload.result.tableLabel],
          [
            "Sol",
            renderSymbolWithIcon(
              payload.result.sol.symbol,
              payload.result.sol.icon,
            ),
          ],
          [
            "Nox",
            renderSymbolWithIcon(
              payload.result.nox.symbol,
              payload.result.nox.icon,
            ),
          ],
        ],
      ]);
      break;
    }

    case "portent": {
      sections.push([
        "Oracle Results",
        [
          [
            "Sol",
            renderSymbolWithIcon(
              payload._raw.sol.symbol.name,
              getSymbolIconPath(payload._raw.sol.face),
              payload._raw.sol.meaning,
            ),
          ],
          ["Sol Keywords", formatJournalKeywords(payload._raw.sol.keywords)],
          [
            "Syzygy",
            renderSymbolWithIcon(
              payload._raw.syzygy.relationship.name,
              getSyzygyIconPath(payload._raw.syzygy.face),
              payload._raw.syzygy.relationship.meaning,
            ),
          ],
          [
            "Syzygy Keywords",
            formatJournalKeywords(payload._raw.syzygy.relationship.keywords),
          ],
          [
            "Nox",
            renderSymbolWithIcon(
              payload._raw.nox.symbol.name,
              getSymbolIconPath(payload._raw.nox.face),
              payload._raw.nox.meaning,
            ),
          ],
          ["Nox Keywords", formatJournalKeywords(payload._raw.nox.keywords)],
        ],
      ]);
      sections.push([
        "Combined Meaning",
        [
          ["Statement", payload.statement],
          [
            "Primary",
            renderSymbolWithIcon(
              `${payload.result.primary} (${capitalize(payload._raw.primary.die)})`,
              payload.result.primaryIcon,
            ),
          ],
          [
            "Syzygy",
            renderSymbolWithIcon(
              payload.result.relationship,
              payload.result.relationshipIcon,
            ),
          ],
          [
            "Secondary",
            renderSymbolWithIcon(
              `${payload.result.secondary} (${capitalize(payload._raw.secondary.die)})`,
              payload.result.secondaryIcon,
            ),
          ],
          ["Lens Shift", formatLensShift(payload.lensShift)],
          ...(includeInterpretations
            ? [["Interpretation", payload.narrative]]
            : []),
        ],
      ]);
      break;
    }

    default: {
      if (includeInterpretations) {
        sections.push([
          "Combined Meaning",
          [["Interpretation", payload.narrative]],
        ]);
      }
    }
  }

  return sections;
}

function createJournalPageContent(record) {
  const sections = [];

  sections.push(
    renderJournalSection("Session Details", [
      ["Date", record.date],
      ["Time", record.time],
      ["Frame", record.frame],
      ["Tint", record.tint],
    ]),
  );

  for (const [title, rows] of buildOracleSections(record.payload)) {
    sections.push(renderJournalSection(title, rows));
  }

  return [
    `<section class="prima-materia-journal-entry">`,
    ...sections,
    `</section>`,
  ].join("");
}

function createChatMessageContent(payload) {
  const sections = buildOracleSections(payload);
  const combinedMeaning = sections.find(
    ([title]) => title === "Combined Meaning",
  );
  const oracleDetails = sections.filter(
    ([title]) => title !== "Combined Meaning",
  );
  const modeLabel = getJournalModeLabel(payload.mode);

  const visibleSection = combinedMeaning
    ? `<section class="pm-chat-combined">${renderJournalSection(combinedMeaning[0], combinedMeaning[1])}</section>`
    : oracleDetails
        .map(([title, rows]) => renderJournalSection(title, rows))
        .join("");
  const detailSection =
    combinedMeaning && oracleDetails.length
      ? `<details class="pm-chat-details"><summary>Reveal Oracle Results</summary>${oracleDetails
          .map(([title, rows]) => renderJournalSection(title, rows))
          .join("")}</details>`
      : "";

  return [
    `<section class="prima-materia-chat-entry pm-chat-mode-${escapeJournal(payload.mode)}">`,
    `<header class="pm-chat-header">`,
    `<div class="pm-chat-kicker">Prima Materia</div>`,
    `<h2>${escapeJournal(modeLabel)}</h2>`,
    `</header>`,
    visibleSection,
    detailSection,
    `</section>`,
  ].join("");
}

async function getOrCreateSessionJournal() {
  let journal = game.journal.getName(JOURNAL_NAME);
  if (journal) return journal;

  journal = await JournalEntry.create({
    name: JOURNAL_NAME,
    pages: [
      {
        name: "Session Index",
        type: "text",
        title: { show: true, level: 1 },
        text: {
          content: "<p>Prima Materia session journal.</p>",
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
        },
      },
    ],
  });

  return journal;
}

async function postToChat(payload) {
  if (!payload) return null;
  if (payload.mode === "pinch" && !payload.publishReady) return null;
  if (payload.mode === "pullPass" && !payload.publishReady) return null;

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: createChatMessageContent(stripRolls(payload)),
  });
}

async function saveToJournal(payload, { quiet = false } = {}) {
  if (payload?.mode === "pinch" && !payload.publishReady) return null;
  if (payload?.mode === "pullPass" && !payload.publishReady) return null;

  const timestamp = new Date();
  const timestampParts = formatJournalDateParts(timestamp);
  const record = {
    date: timestampParts.date,
    time: timestampParts.time,
    frame: labelForFrame(getFrame()),
    tint: labelForTint(getTint()),
    payload: stripRolls(payload),
  };

  const journal = await getOrCreateSessionJournal();
  const existingSorts = journal.pages.contents.map((page) => page.sort ?? 0);
  const firstSort = existingSorts.length ? Math.min(...existingSorts) : 0;

  await journal.createEmbeddedDocuments("JournalEntryPage", [
    {
      name: createJournalPageName(payload),
      type: "text",
      sort: firstSort - 10,
      title: { show: true, level: 1 },
      text: {
        content: createJournalPageContent(record),
        format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
      },
    },
  ]);

  if (!quiet) {
    ui.notifications?.info(
      `Saved ${getJournalModeLabel(payload.mode)} to ${JOURNAL_NAME}.`,
    );
  }

  return journal;
}

async function maybeAutoSave(payload) {
  if (!payload) return;
  if (!game.settings.get(MODULE_ID, "autoSaveToJournal")) return;
  return saveToJournal(payload, { quiet: true });
}

function refreshRenderedApps() {
  for (const app of Object.values(state.apps)) {
    if (app?.rendered) app.render({ force: true });
  }
}

function openTintWidget() {
  state.apps.tint ??= new PrimaMateriaTintTracker();
  return state.apps.tint.render({ force: true });
}

function openFrameWidget() {
  state.apps.frame ??= new PrimaMateriaFrameSelector();
  return state.apps.frame.render({ force: true });
}

function ensureWidgets() {
  const showTintWidget = game.settings.get(MODULE_ID, "showTintWidget");
  const showFrameSelector = game.settings.get(MODULE_ID, "showFrameSelector");

  if (showTintWidget) {
    openTintWidget();
  } else if (state.apps.tint?.rendered) {
    state.apps.tint.close();
  }

  if (showFrameSelector) {
    openFrameWidget();
  } else if (state.apps.frame?.rendered) {
    state.apps.frame.close();
  }
}

function openOracle() {
  state.apps.oracle ??= new PrimaMateriaOracleApp();
  return state.apps.oracle.render({ force: true });
}

function openPortent() {
  state.apps.portent ??= new PrimaMateriaPortentApp();
  return state.apps.portent.render({ force: true });
}

function registerSettings() {
  game.settings.register(MODULE_ID, "enableDiceSoNiceIntegration", {
    name: "Enable Dice So Nice Integration",
    hint: "Animate Prima Materia oracle dice through Dice So Nice when available.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "autoSaveToJournal", {
    name: "Auto Save To Journal",
    hint: "Automatically append oracle results to the session journal.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, "showInterpretations", {
    name: "Show Interpretations",
    hint: "Display Prima Materia's generated interpretations in the apps, chat messages, and saved journal entries.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => refreshRenderedApps(),
  });

  game.settings.register(MODULE_ID, "showTintWidget", {
    name: "Show Tint Widget",
    hint: "Display the floating session tint tracker widget.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => ensureWidgets(),
  });

  game.settings.register(MODULE_ID, "showFrameSelector", {
    name: "Show Frame Selector",
    hint: "Display the floating frame selection widget.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => ensureWidgets(),
  });

  game.settings.register(MODULE_ID, "currentTint", {
    name: "Current Tint",
    scope: "world",
    config: false,
    type: String,
    choices: TINT_LABELS,
    default: "neutral",
  });
}

function registerSidebarTab() {
  const sidebarTabs = CONFIG.ui?.sidebar?.TABS;
  if (!sidebarTabs || sidebarTabs.primaMateria) return;

  const orderedTabs = {};
  let inserted = false;

  for (const [key, value] of Object.entries(sidebarTabs)) {
    orderedTabs[key] = value;
    if (key === "journal") {
      orderedTabs.primaMateria = {
        tooltip: "Prima Materia Oracle",
        icon: "fa-solid fa-sparkles",
      };
      inserted = true;
    }
  }

  if (!inserted) {
    orderedTabs.primaMateria = {
      tooltip: "Prima Materia Oracle",
      icon: "fa-solid fa-sparkles",
    };
  }

  CONFIG.ui.sidebar.TABS = orderedTabs;
  CONFIG.ui.primaMateria = PrimaMateriaOracleSidebarTab;
}

function registerSidebarLauncherBehavior() {
  Hooks.on("renderSidebar", (_app, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    const launcher = root.querySelector('[data-tab="primaMateria"]');
    if (!launcher || launcher.dataset.pmLauncherBound === "true") return;

    launcher.dataset.pmLauncherBound = "true";
    launcher.classList.add("prima-materia-sidebar-launcher-button");
    launcher.setAttribute("title", "Open Prima Materia Oracle");
    launcher.setAttribute("aria-label", "Open Prima Materia Oracle");

    const openFromLauncher = (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      openOracle();
    };

    launcher.addEventListener("pointerdown", openFromLauncher, true);
    launcher.addEventListener("click", openFromLauncher, true);
    launcher.addEventListener(
      "keydown",
      (event) => {
        if (!["Enter", " ", "Spacebar"].includes(event.key)) return;
        openFromLauncher(event);
      },
      true,
    );
  });
}

function registerDiceSoNice(dice3d) {
  state.dice3d = dice3d;

  try {
    dice3d.addSystem?.({ id: MODULE_ID, name: "Prima Materia" }, true);

    dice3d.addColorset?.({
      name: "prima-materia-sol",
      description: "Prima Materia Sol",
      category: "Prima Materia",
      foreground: "#2a1804",
      background: "#f0c56b",
      outline: "#8c5f12",
      texture: "none",
      material: "plastic",
      labelComposite: "source-over",
    });

    dice3d.addColorset?.({
      name: "prima-materia-nox",
      description: "Prima Materia Nox",
      category: "Prima Materia",
      foreground: "#f4f0ff",
      background: "#5c60b8",
      outline: "#1d214d",
      texture: "none",
      material: "plastic",
      labelComposite: "source-over",
    });

    dice3d.addColorset?.({
      name: "prima-materia-syzygy",
      description: "Prima Materia Syzygy",
      category: "Prima Materia",
      foreground: "#08231f",
      background: "#6fc3ad",
      outline: "#204f45",
      texture: "none",
      material: "plastic",
      labelComposite: "source-over",
    });

    dice3d.addDicePreset?.({
      type: "d12",
      labels: SOL_LABELS,
      labelScale: 0.95,
      scaleModifier: 1,
      system: MODULE_ID,
    });

    dice3d.addDicePreset?.({
      type: "d6",
      labels: SYZYGY_LABELS,
      labelScale: 0.95,
      scaleModifier: 1,
      system: MODULE_ID,
    });
  } catch (error) {
    console.warn(
      `${MODULE_ID} | Failed to register Dice So Nice presets`,
      error,
    );
  }
}

const api = {
  MODULE_ID,
  loadData,
  openOracle,
  openPortent,
  openTintWidget,
  openFrameWidget,
  getFrame,
  setFrame,
  getTint,
  setTint,
  labelForFrame,
  describeFrame,
  labelForTint,
  describeTint,
  showInterpretations,
  getPluckOptions,
  PACK_SOURCES,
  rollPeek,
  rollPullPass,
  resolvePullPass,
  rollPinch,
  applyPinchStyle,
  addPinchSyzygy,
  drawPluck,
  rollPortent,
  postToChat,
  saveToJournal,
  maybeAutoSave,
  isDiceSoNiceEnabled,
  registerDiceSoNice,
  ensureWidgets,
};

Hooks.once("init", () => {
  registerSettings();
  registerSidebarTab();
  registerSidebarLauncherBehavior();
  game.modules.get(MODULE_ID).api = api;
});

Hooks.once("ready", async () => {
  try {
    await loadData();
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to preload oracle data`, error);
    ui.notifications?.error(
      "Prima Materia could not load its oracle data. Check the console for details.",
    );
  }

  openOracle();
  ensureWidgets();
  refreshRenderedApps();
});

Hooks.on("updateSetting", (setting) => {
  if (setting.key === `${MODULE_ID}.currentTint`) {
    ensureWidgets();
    refreshRenderedApps();
  }
});

Hooks.on("updateUser", (user, changes) => {
  if (user.id !== game.user.id) return;
  if (foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.frame`)) {
    ensureWidgets();
    refreshRenderedApps();
  }
});

Hooks.once("diceSoNiceReady", (dice3d) => {
  registerDiceSoNice(dice3d);
});
