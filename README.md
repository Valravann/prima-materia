# Prima Materia

Prima Materia is a Foundry VTT v14 module for symbolic oracle play, solo procedures, collaborative prompting, and scene interpretation.

It provides a small family of oracle modes built around three symbolic elements:
- **Sol** — the clearer, overt, constructive, or activating side of a symbol
- **Nox** — the shadowed, costly, unstable, or resistant side of a symbol
- **Syzygy** — the relationship joining two symbols

The module is system-agnostic and is designed to stay useful whether you want lightweight prompts, richer guided interpretation, or symbol-only results for your own table methods.

## Current feature set

- `Peek`, `Pull / Pass`, `Pinch`, `Pluck`, and `Portent` oracle flows
- Sol, Nox, and Syzygy symbolic datasets
- Custom Dice So Nice symbol faces for Sol/Nox and Syzygy
- Frame and Tint context that shape how readings are interpreted
- Lens Shift handling when matching Sol/Nox results change session tone
- Chat posting for oracle results
- Journal export to `Prima Materia Session Journal`
- Optional interpretation visibility through module settings
- AppV2-based UI with dedicated oracle, portent, frame, and tint interfaces

## Structure

```text
prima-materia/
  module.json
  README.md
  .gitignore
  .gitattributes
  scripts/
    prima-materia.js
  applications/
    oracle-app.js
    portent-app.js
    tint-tracker.js
    frame-selector.js
  data/
    symbols.json
    syzygy.json
  templates/
    oracle-window.hbs
    portent-window.hbs
    tint-widget.hbs
    frame-selector.hbs
  styles/
    prima-materia.css
  assets/
    dice/
      sol/
      syzygy/
```

## Reading guide

### Frame
Frame tells you **where to aim the reading**.

- `Literal` — events, places, clues, objects, immediate facts
- `Personal` — motives, feelings, identity, relationships, internal struggle
- `Structural` — institutions, factions, customs, systems, logistics, social pressure

### Tint
Tint tells you **what tone to privilege**.

- `Neutral` — balanced, unresolved, ambiguous, mixed
- `Day` — clearer, more constructive, more usable, more direct
- `Night` — pressured, concealed, costly, unstable, shadowed

### Sol, Nox, and Syzygy
- **Sol** reveals the brighter or more overt expression of a symbol.
- **Nox** reveals the shadowed, burdened, or resistant expression of a symbol.
- **Syzygy** describes the relationship between two symbolic results.

## Oracle modes

### Peek
Use `Peek` when you want the fastest oracle answer.

- Roll either `Sol` or `Nox`
- Get one symbol, its meaning, keywords, icon, and optional interpretation
- Best for immediate prompts, yes-but/no-but style inspiration, and scene texture

### Pull / Pass
Use `Pull / Pass` when two symbolic pressures are both present, but one should take priority.

- Roll `Sol` and `Nox`
- Choose which result to **pull** into the foreground
- The other result becomes background, cost, resistance, or context
- Chat/journal publication only happens after the choice is made

### Pinch
Use `Pinch` when two symbolic pressures need to be read together.

- Roll `Sol` and `Nox`
- Choose one of three follow-ups:
  - `Add Together` — blend them
  - `Smash Together` — put them in conflict
  - `Roll Syzygy` — define the relationship explicitly
- Chat/journal publication only happens after one of those follow-ups is chosen

### Pluck
Use `Pluck` when your real table logic lives somewhere else and you only need symbolic coordinates.

- Select an external reference table category
- Roll `Sol` and `Nox`
- Read the pair against your external method
- No internal interpretation is required for this mode

### Portent
Use `Portent` when you want a full symbolic statement.

- Roll `Sol`, `Nox`, and `Syzygy`
- One of Sol or Nox is randomly chosen as **Primary**
- The other becomes **Secondary**
- Syzygy defines the relationship between them
- The result is presented as a full oracle statement with icons and optional interpretation

## Lens Shift
If Sol and Nox roll the **same symbol**, the reading triggers **Lens Shift**.

Lens Shift updates the session Tint before later readings are made:
- from `Neutral` toward `Day` or `Night`
- from `Day` back toward `Neutral` or into `Night`
- from `Night` back toward `Neutral` or into `Day`

The module explains Lens Shift in the UI, chat output, and journal entries when it occurs.

## Chat and journal behavior

- Oracle results post to chat when the roll is considered complete for that mode
- Journal saving is separate from chat posting
- Journal entries are added to `Prima Materia Session Journal`
- New journal pages are inserted at the top
- Interpretation blocks can be collapsed
- If interpretation visibility is disabled, result data still appears without generated interpretation text

## Settings

Current module settings include:

- **Enable Dice So Nice Integration**
- **Auto Save To Journal**
- **Show Interpretations** — on by default
- **Show Tint Widget** — off by default
- **Show Frame Selector** — off by default

## Dice So Nice

When `Dice So Nice` is active and Prima Materia integration is enabled, the module:

- registers custom Sol, Nox, and Syzygy colorsets
- registers image-based symbol faces for the oracle dice
- displays oracle rolls with `showForRoll`

## Installation

### Local development install

1. Copy the `prima-materia` folder into your Foundry user data `modules/` directory.
2. Launch Foundry VTT v14.
3. Enable `Prima Materia` in your world.
4. Open the Settings sidebar and use the `Prima Materia Oracle` launcher.

### Manifest install

Once hosted, provide the public `module.json` URL to Foundry's **Install Module** dialog.

## Repository notes

This repository is prepared to keep only files that matter to the module itself.

Tracked and important:
- source files
- templates
- styles
- symbolic data
- generated dice assets

Ignored by default:
- editor settings
- Python cache/virtualenv files
- Node dependency folders
- archives/build output
- generic logs/temp files
- unrelated local Foundry runtime clutter

## Development notes

### API entry points

The module exposes an API on:

```js
game.modules.get("prima-materia").api
```

Useful methods include:

- `openOracle()`
- `openPortent()`
- `getFrame()` / `setFrame(frame)`
- `getTint()` / `setTint(tint)`
- `rollPeek(kind)`
- `rollPullPass()`
- `rollPinch()`
- `drawPluck(key)`
- `rollPortent()`
- `postToChat(payload)`
- `saveToJournal(payload)`

## Compatibility

- Foundry VTT `v14`
- ES modules
- Modern Foundry document APIs
- Modern `ApplicationV2`

## Before publishing

A few metadata fields are still intentionally generic and may need updating before release:

- `module.json` versioning
- author metadata
- manifest/download/URL fields if you plan to distribute through Foundry manifests
- license choice, if you want one explicitly included in the repository
