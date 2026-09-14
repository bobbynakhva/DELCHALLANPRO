# Foundry — first-class melt

Prompt 06b. Heat is a document. Charge is by **lot**, never anonymous kg. Stock only through `postStockMove`.

## Switch

`foundry_enabled` defaults **true**. If false: Foundry nav is hidden; journeys 1–21 stay green. Melt posts throw.

## Heat

Series `HT/26-27/0001`. Furnace + target alloy. Status:

`DRAFT → CHARGED → HOLD_SPECTRO | RELEASED_POUR → POURED → CLOSED`

Shop runs **one heat at a time** (any CHARGED / HOLD / RELEASED / POURED blocks a new heat). Planning may spawn extra DRAFT heats via `CREATE_MELT`.

Recipe is snapshotted on the heat at charge confirm.

## Stock (MELT_* via postStockMove)

| Move | What |
|---|---|
| `MELT_CHARGE` | Charge lot kg → WIP-MELT (dest silent in journals; source Dr 1130 Cr inv) |
| `MELT_POUR` | WIP → SFG casting lot with `heatNo` |
| `MELT_RUNNER` | WIP → `SC-{ALLOY}-RUNNER` same alloy + heatNo |
| `MELT_DROSS` | WIP → dross stock (default) |
| `MELT_REJECT` | WIP → reject |
| `MELT_YIELD_LOSS` | Remainder to variance (Dr 5120 Cr 1130) on close |

`chargedKg − (good + runner + dross + reject) = lossKg`. Close blocked if loss > 3% unless Owner override.

## Isolation

Refuse:

- `JW_IN_CUSTOMER` / `owner_type = CUSTOMER`
- lots in an `is_outside_factory` warehouse (JW-OUT)
- CW617N (or any other alloy) lot into a C360 heat

Journeys 22–26 use dedicated `ADJUST_PLUS` lots. Journey-1 rod and 137.1000 kg JW-OUT must not move.

## Spectro

Reading vs alloy min/max (Cu ±1.5, Zn ±2, Pb ±0.5, or explicit columns). FAIL → `HOLD_SPECTRO` (blocks pour). PASS → `RELEASED_POUR`. **Not a BIS / NABL certificate.**

## Genealogy

Casting lot → heat (`heat_no`) → charge lots (`genealogy_link`). Journey 9 rod-only path is unchanged.

## Slips

Pour slip and knockout slip are A4 shop documents. Titles **POUR SLIP** / **KNOCKOUT SLIP**. Not a tax invoice. No IRN.

## Planning

When foundry is on, CAST-C360 kg shortfall (safety / min kg) drafts `CREATE_MELT` → a DRAFT heat. No furnace APS. Mix solver is out of scope.

## Journals

Same path as Prompt 05: `linesForStockMove` in the same transaction as the stock move.
