## How to use the calculator

All calculations are built on **formulas** that can be edited in *Reference → Editable calculators*.

1. Open the tab you need: **Range**, **Speed**, **AOB** or **O’Kane**.
2. Pick a ship class from the dropdown — the height (mast/funnel) and length are filled in automatically. If there is no such class yet, enter the values manually.
3. For **Range**, choose the reference point (mast or funnel) and magnification (×1.5 or ×6), then enter the ticks — you get the range in meters. You can also go the other way: enter a range and get the ticks needed.
4. For **Speed**, time the target from bow to stern and enter it — speed is computed from the target length.
5. For **AOB**, enter the visible length in ticks (ticks are multiplied by the range) or the angle itself, choose the side (P/S) — you get the target angle on the bow.
6. For **O’Kane**, enter target and torpedo speeds, aiming range and AOB — you get the lead angle, the firing bearing and the torpedo run time.
7. If a stock formula is inconvenient — edit it in the reference, the result updates on the fly.

## Formula syntax

An expression is a mathematical notation built from **variables**, **operators**, **functions** and **constants**.

- Variables come from the active calculator: `h`, `k`, `r`, `d`, `l`, `t`, `spd`, `v`, `a`, `vt`, `vs`, `lead`, `c`.
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

## Working with the reference

1. The reference is stored in the browser's **localStorage** — no server needed, data survives page reloads.
2. **Ship classes** — target parameters (length, heights, draft, speed, deck gun). The “Add” button creates your own class.
3. **Range scenarios** — separate recommendations for **Surface** and **Submerged**, tick rows are clickable.
4. **Extra recommendations** — notes on TDC work and identification.
5. **Editable calculators** — formulas of all four calculators with live syntax checks and a variable list.
6. **Export/import** — “Export JSON” and “Import JSON” save the whole catalog (including formulas) to a file; “Reset data” restores factory values.