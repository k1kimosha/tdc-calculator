## How to use the calculator

All calculations are built on **formulas** that can be edited in *Reference → Calculators*.

1. The tabs on top match the **list of calculators** from the reference. By default they are **Range**, **Speed**, **AOB** and **O’Kane**; calculators you create appear as separate tabs.
2. Pick a ship class from the dropdown — the height (mast/funnel) and length are filled in automatically. If there is no such class yet, enter the values manually.
3. For **Range**, choose the reference point (mast or funnel) and magnification (×1.5 or ×6), then enter the ticks — you get the range in meters. You can also go the other way: enter a range and get the ticks needed.
4. For **Speed**, time the target from bow to stern and enter it — speed is computed from the target length.
5. For **AOB**, enter the visible length in ticks (ticks are multiplied by the range) or the angle itself, choose the side (P/S) — you get the target angle on the bow.
6. For **O’Kane**, enter target and torpedo speeds, aiming range and AOB — you get the lead angle, the firing bearing and the torpedo run time.
7. If a stock formula is inconvenient — edit it in the reference, the result updates on the fly.

## Formula syntax

An expression is a mathematical notation built from **variables**, **operators**, **functions** and **constants**.

- Variables are set by the **calculator controls**: numeric fields (`h`, `k`, `r`, `l`, `t`, `vt`, `vs`, …), select options and the length/height of the picked ship. The constant `c` = 0.5144444 converts knots to meters per second. Results of previous formulas are available as variables by formula name (for example, `lead`).
- Operators: `+` `−` `*` `/` `%` `^`. Exponentiation `^` is right-associative: `2^3^2` = 512.
- Parentheses `( )` change the order of operations, a comma separates function arguments.
- Constants: `pi` (π), `e`, `tau` (2π).
- Functions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`, `cosh`, `tanh`, `sqrt`, `cbrt`, `abs`, `floor`, `ceil`, `round`, `trunc`, `sign`, `ln`, `log`, `log2`, `exp`, `min`, `max`, `clamp`, `rad`, `deg`.
- Trigonometry uses **radians**: 45° can be written as `pi/4` or `rad(45)`.
- Variable and function names are **case-insensitive**: `H*K/r` equals `h*k/R`.
- Decimals use a dot (`1.5`), and scientific notation is supported: `1e3` = 1000.

Example — torpedo run time: the distance in meters divided by the torpedo speed converted to meters per second:

```js
d / (vs * c)
```

## Math basics

**Range:**

```formula
D = H × K ÷ R
```

```js
h*k/r
```

**Ticks for a known range:**

```formula
R = H × K ÷ D
```

```js
h*k/d
```

**Target speed:**

```formula
V = L × 1.94 ÷ T
```

```js
l/t*1.94
```

**Visible length:**

```formula
Lv = R × D ÷ 1000
```

```js
r*d/1000
```

**AOB from visible length:**

```formula
AOB = arcsin(Lv ÷ L)
```

```js
asin(v/l)*180/pi
```

**Lead angle (O’Kane method):**

```formula
β = arctan(Vt ÷ Vs)
```

```js
atan(vt/vs)*180/pi
```

**General lead case:**

```formula
β = arcsin((Vt ÷ Vs) × sin(AOB))
```

```js
asin(vt/vs*sin(aob*pi/180))*180/pi
```

**Torpedo run time:**

```formula
t = D ÷ (Vs × 0.5144444)
```

```js
d/(vs*c)
```

## Editable calculators

Each calculator is a set of **controls** (variables) and **formulas**. The tabs on top are built automatically from the calculator list: every entry gets its own tab.

### Creating and removing

1. Open *Reference → Calculators* and press **“Add calculator”**.
2. Enter a name in English and Russian (at least one) and an optional subtitle.
3. Add controls and formulas, then press **“Save”** — a new calculator tab appears on top.
4. The **“Delete”** button removes the calculator and its tab disappears. **“Reset data”** in the reference restores the standard set of four calculators.

### Variables and controls

- **Number** — a numeric field: variable name, default value and a unit.
- **Select** — a dropdown of options (RU/EN label + a number), one of them is marked as the default. The picked option is written into the variable.
- **Ship** — the list of saved target classes: the length, mast or funnel height of the selected ship are written into the bound variables. You can bind a reference point — then the mast or funnel height is taken depending on the user's choice.
- **Cheat sheet** — a live table: rows (label + expression) are recomputed from the current variables, so hints are always up to date.

### Formulas

- Each formula has a label (RU/EN), an expression and a unit. The order matters: **results of previous formulas are available as variables by their name** (for example, `lead`).
- The **“Add formula”** button creates a new row, the “×” icon removes it.
- An invalid expression is highlighted, and the calculator shows the error instead of the result.

## Working with the reference

1. The reference is stored in the browser's **localStorage** — no server needed, data survives page reloads.
2. **Ship classes** — target parameters (length, heights, draft, speed, deck gun). The “Add” button creates your own class.
3. **Range scenarios** — separate recommendations for **Surface** and **Submerged**, tick rows are clickable.
4. **Extra recommendations** — notes on TDC work and identification.
5. **Calculators** — full calculator creation and editing, see the “Editable calculators” section.
6. **Export/import** — “Export JSON” and “Import JSON” save the whole catalog (including formulas) to a file; “Reset data” restores factory values.

## Version history

### 1.2

- Added the **“Editable calculators”** section: creating and removing calculators, variable and control types, formula order and labels.
- App tabs are now built from the calculator list.

### 1.1

- Documentation moved to **Markdown**: sources are `public/docs/ru.md` and `public/docs/en.md`.
- On the production build the sections are compiled into ready HTML (`docs/ru.html`, `docs/en.html`) — the page opens instantly even on weak devices, with no Markdown parsing in the browser.
- Added the **Contents** navigation above the text: expand the list and click a section to jump to it.

### 1.0

- First version of the documentation: step-by-step calculator usage, formula syntax, math basics, working with the reference (the "Documentation" tab, introduced in 0.1.1).