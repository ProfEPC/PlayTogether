# Infiltration Powers — Detailed Reference

This document describes every power in detail: what it does, how the player interacts with it, what the server resolves, and what edge cases exist. Use this alongside the main prompt document. The main prompt has the data model and field definitions; this file explains **behavior**.

---

## How Powers Work (Brief Runtime Overview)

During the **mayhem phase**, players are prompted **one at a time in initiative order** (lower numbers go first). For each player's turn:

1. Server sends that player a prompt with their power description and valid targets.
2. Player selects targets (or auto-executes if `fixedAction` is true).
3. The power resolves immediately. **Learn** results are shown privately to the acting player only. **Reveal** results appear on all players' screens from that point forward, then are shown to everyone again during the discussion phase.
4. Player acknowledges and the next player in initiative order is prompted.

### Initiative — a design-time concept

Initiative is a category number that defines where a power sits in the execution order. Lower numbers execute first. The execution order is:

| Initiative | Category | Examples |
|---|---|---|
| 0 | Passive / voting phase | Conditions, Tamper, Settings |
| 1–4 | Pre-action (priority, protection, blocking) | Hard Priority, Shield, Nope! |
| 5 | Early reveal | Expose Role, Face Reveal |
| 10 | Pre-swap learn | Role Peek (early), Allegiance Check (early) |
| 50 | Swap | Role Swap, Self Swap, Team Shuffle |
| 60 | Post-swap reversal | Swap Reversal |
| 90 | Post-swap learn | Role Peek (late), Action Trace, Sixth Sense |
| 95 | Late reveal | Expose Role (late), Role Spotlight (late) |

When a power has two initiative values (e.g. `"10 90"`), the slot is chosen during character creation. `fixedInitiative: true` means the power is locked to its defined slot — theme settings cannot move it, and other powers that alter initiative (e.g. Priority Warp, Order Rewrite) cannot change it. `fixedInitiative: false` means the slot can be adjusted in theme settings and can be changed by initiative-altering powers during mayhem.

---

## Learn Powers (13 powers)

Learn powers let the acting player **privately discover information**. The result is shown only to them. Nobody else knows what they learned (unless a Reveal also fires).

> **Infection**: All Learn powers have `infected: true` **except** Roll Rolecall (index 6). If the player learns an infiltrator's identity and the target character has `infectedUponSight: true`, the learner's team flips to infiltrator.

> **Initiative**: All Learn powers have initiative `"10 90"` (pre-swap or post-swap slot chosen during character creation) **except** Action Trace, Action Log, Last Look, and Sixth Sense which are `"90"` only (locked post-swap).

> **Scopes**: Some powers have configurable scopes. When a power lists **Scopes** in its table, each scope is toggled on or off independently during character creation. The enabled scopes determine which targets are available to the player during mayhem.

---

### Index 1 — Role Peek

| | |
|---|---|
| **Initiative** | 10 / 90 |
| **Item** | Role |
| **Targets** | 1–3 from scope pool |
| **Complexity** | 2 |
| **Flags** | `infected` · `allowRandom` |
| **Scopes** | ☐ Players · ☐ NPCs |

**Player prompt**: "Choose 1–3 targets to learn their role."

**How it works**: Player picks 1 to 3 targets. Which targets are available depends on the scopes enabled during character creation — players, NPCs, or both. For each selected target, the server returns that target's **current character name (role)** privately. The `allowRandom` flag means the player can opt for random target selection instead of choosing manually.

---

### Index 2 — Character Peek

| | |
|---|---|
| **Initiative** | 10 / 90 |
| **Item** | Role |
| **Targets** | 1+ from a pre-defined character list |
| **Complexity** | 3 |
| **Flags** | `infected` |
| **Special field** | `validCharacters: number[]` on the PowerSlot |

**Player prompt**: "Choose a character. Learn which player holds that character."

**How it works**: Unlike other Learn powers that target *players* or *NPCs*, this one targets **character names**. The player sees a list of character names (drawn from the `validCharacters` array on their PowerSlot) and picks one or more. For each chosen character, the server returns which player currently holds that character — effectively a reverse lookup.

**Character creation**: This power requires defining the `validCharacters` array — a list of character IDs that are valid lookup targets. Configured as a multi-select from all characters in the same theme.

> ⚠️ **Warning**: The character creation UI should display a warning if any character in `validCharacters` is not part of the same theme, or if the array is empty.

---

### Index 3 — Last Look

| | |
|---|---|
| **Initiative** | 90 only |
| **Item** | Role |
| **Targets** | Self (automatic) |
| **Complexity** | 1 |
| **Flags** | `fixedAction` · `infected` |

> 🔒 `fixedInitiative: true` — locked to slot 90. Must sit after swaps so the player learns their actual final role.

**Player prompt**: "You will learn your final role."

**How it works**: No target selection — auto-executes on self. The server returns the player's own **current role** after swaps have been applied. The player might have been swapped without knowing, and Last Look tells them what they are now.

---

### Index 4 — Allegiance Check

| | |
|---|---|
| **Initiative** | 10 / 90 |
| **Item** | Team |
| **Targets** | 1–3 from scope pool |
| **Complexity** | 2 |
| **Flags** | `infected` · `allowRandom` |
| **Scopes** | ☐ Players · ☐ NPCs |

**Player prompt**: "Choose 1–3 targets to learn their team."

**How it works**: Player picks 1 to 3 targets. Which targets are available depends on the scopes enabled during character creation. For each, the server returns the target's **current team** (innocent, infiltrator, or special) privately. Returns team, not role — so the player learns allegiance but not identity.

---

### Index 6 — Roll Rolecall

| | |
|---|---|
| **Initiative** | 10 / 90 |
| **Item** | Players |
| **Targets** | Select a role name → get player names |
| **Complexity** | 3 |
| **Flags** | *(none)* |
| **Special field** | `validCharacters: number[]` on the PowerSlot |

> ⚠️ **Exception**: This is the only Learn power with `infected: false`. It reveals which players hold a role, not the role of a specific player, so it cannot trigger infection.

**Player prompt**: "Name a role. Learn which players have that role."

**How it works**: Player selects a role name from a list defined by the `validCharacters` array on the PowerSlot — not all roles in the game, only the ones specified during character creation. The server returns the **names of all players and/or NPCs** that currently hold that role.

**Character creation**: Same as Character Peek — `validCharacters` is defined as a multi-select from characters in the same theme. The UI should show a warning if the array is empty.

---

### Index 7 — Beacon

| | |
|---|---|
| **Initiative** | 10 / 90 |
| **Item** | Players |
| **Targets** | All matching (automatic) |
| **Complexity** | 3 |
| **Flags** | `fixedAction` · `infected` |
| **Scopes** | ☐ Role · ☐ Team |

**Player prompt**: "Learn who shares your role and/or team."

**How it works**: Auto-executes. Based on the scopes enabled during character creation:

- **Role scope**: The server finds every player whose current role matches the acting player's role and returns their **player names** privately.
- **Team scope**: The server finds every player on the same team as the acting player and returns the **character–player pairs** (which character each teammate holds) privately.

If both scopes are enabled, the player receives both sets of results. Min and max are both 99, meaning "all matching."

---

### Index 9 — Action Trace

| | |
|---|---|
| **Initiative** | 90 only |
| **Item** | Players |
| **Targets** | Select a power type → get count |
| **Complexity** | 3 |
| **Flags** | `infected` |

> 🔒 `fixedInitiative: true` — locked to slot 90. This power must sit after swaps because it reports on actions that already happened.

**Player prompt**: "Select a power type. Learn how many players performed that type of action."

**How it works**: Player selects a power type (Learn, Reveal, Swap, Alter, Tamper) from a list. The server counts how many players/NPCs submitted an action matching that type during this mayhem and returns the **count** privately.

---

### Index 10 — Action Log

| | |
|---|---|
| **Initiative** | 90 only |
| **Item** | Players |
| **Targets** | Select action category → get count |
| **Complexity** | 3 |
| **Flags** | `infected` |

> 🔒 `fixedInitiative: true` — locked to slot 90. Must sit after swaps.

**Player prompt**: "Learn how many players moved (swapped) or learned something."

**How it works**: Player selects an action category — "moved" (any Swap-type action) or "learned" (any Learn-type action). The server counts how many players submitted an action matching that category during this mayhem and returns the **count** privately.

---

### Index 11 — Tactic Tell

| | |
|---|---|
| **Initiative** | 10 / 90 |
| **Item** | Type |
| **Targets** | 1–3 players |
| **Complexity** | 3 |
| **Flags** | `infected` |

**Player prompt**: "Choose 1–3 players to learn what type of power they have."

**How it works**: Player picks 1 to 3 players. For each target, the server returns the **type** of that player's power (e.g. "Learn", "Swap", "Alter") — not the specific power name. Tells the acting player what *kind* of action the target can perform.

---

### Index 12 — Role Tally

| | |
|---|---|
| **Initiative** | 10 / 90 |
| **Item** | Amount |
| **Targets** | Select a role name → get count |
| **Complexity** | 2 |
| **Flags** | `infected` |
| **Scopes** | ☐ Players · ☐ NPCs |

**Player prompt**: "Name a role. Learn how many of that role are among the enabled scope."

**How it works**: Player selects a role name. The server counts entities matching that role within the enabled scopes and returns the **count** privately.

---

### Index 13 — Team Tally

| | |
|---|---|
| **Initiative** | 10 / 90 |
| **Item** | Amount |
| **Targets** | Select a team → get count |
| **Complexity** | 2 |
| **Flags** | `infected` |
| **Scopes** | ☐ Players · ☐ NPCs |

**Player prompt**: "Name a team. Learn how many of that team are among the enabled scope."

**How it works**: Player selects a team (innocent, infiltrator, or special). The server counts entities on that team within the enabled scopes and returns the **count** privately.

---

### Index 16 — Sixth Sense

| | |
|---|---|
| **Initiative** | 90 only |
| **Item** | Status |
| **Targets** | 1+ players |
| **Complexity** | 2 |
| **Flags** | `infected` |

**Player prompt**: "Choose players. Learn whether they were moved (swapped) during mayhem."

**How it works**: Player picks one or more players. Sits in execution slot 90 (post-swap), so swap results are available. For each target, the server returns **yes or no** — whether that player's role was changed by a Swap power during this mayhem. Does not reveal *what* they were swapped to, only that a swap touched them.

---

## Learn Powers Index

| Idx | Name | Targets | Complexity |
|---|---|---|---|
| 1 | Role Peek | 1–3 from scope pool | 2 |
| 2 | Character Peek | 1+ from character list | 3 |
| 3 | Last Look | Self (auto) | 1 |
| 4 | Allegiance Check | 1–3 from scope pool | 2 |
| 6 | Roll Rolecall | Role name → player names | 3 |
| 7 | Beacon | All same-role/team (auto) | 3 |
| 9 | Action Trace | Power type → count | 3 |
| 10 | Action Log | Action category → count | 3 |
| 11 | Tactic Tell | 1–3 players | 3 |
| 12 | Role Tally | Role name → count | 2 |
| 13 | Team Tally | Team → count | 2 |
| 16 | Sixth Sense | 1+ players | 2 |

**12 Learn powers total.** Indices 5, 8, 14, 15 are unused.
