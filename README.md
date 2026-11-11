# Page transitions (Webflow IX3)

Small script that intercepts **internal page links**, emits a **custom IX3 event** (so your exit animation runs in **reverse**), waits, then navigates. **Enter** is entirely yours: **Page load** plays the same interaction forward. This repo does not build the animation—only wiring.

Stack: **Webflow IX3** (GSAP) + vanilla JS — no Taxi/Swup.

## Your job in Webflow (required)

1. **Build the transition animation** (e.g. blinds: strips from full height → 0). Handle visibility (show/hide wrapper) inside GSAP in the interaction timeline—not in this script.

2. **Add two triggers** on that interaction:
   - **Page load** → **Play** (reveal / enter on every page load).
   - **Custom event** → **Reverse** on **Body** (cover / exit when the script emits your event).

3. **Mark the transition wrapper** with the data attributes below (one site symbol, end of `<body>`).

If triggers or event names don’t match what the wrapper declares, exit will look broken even when the script runs.

## Data attributes

Set these on the **transition wrapper** element in Webflow (Custom attributes). Values are strings in Webflow; the script parses duration as an integer.

| Attribute | Required | Example | Purpose |
|-----------|----------|---------|---------|
| `data-transition-box` | **Yes** | (no value) | Identifies the GSAP transition wrapper. **Without this element, the script does nothing** and logs a console warning. |
| `data-transition-event` | No | `Page Exit` | IX3 custom event name for exit (`ix3.emit(...)`). Default: `Page Exit`. Must match the custom-event trigger in Webflow exactly. |
| `data-transition-duration` | No | `900` | Milliseconds to wait after emit before `location.assign`. Default: `900`. Match your **reverse** timeline length (+ small buffer). |

**Links — opt out**

| Attribute | On | Purpose |
|-----------|-----|---------|
| `data-transition-ignore` | `<a>` | Normal navigation; no exit animation. |

Example wrapper in Webflow:

```html
<div
  data-transition-box
  data-transition-event="Page Exit"
  data-transition-duration="900"
  class="transition-blinds"
>
  <!-- blind strips -->
</div>
```

## Files

| File | Role |
|------|------|
| `page-transitions.js` | Link interception, read config from `[data-transition-box]`, emit, redirect delay |
| `page-transitions.css` | `pointer-events: none` on the box; block clicks while exiting |

## Custom code (Webflow)

**Head:**

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/YOUR_USER/YOUR_REPO@main/page-transitions/page-transitions.css"
/>
```

**Footer** (after Webflow’s scripts):

```html
<script
  defer
  src="https://cdn.jsdelivr.net/gh/YOUR_USER/YOUR_REPO@main/page-transitions/page-transitions.js"
></script>
```

Replace `YOUR_USER` / `YOUR_REPO` with your GitHub path. Pin a tag (e.g. `@v1.0.0`) instead of `@main` for stable production.

## Behaviour

| When | What happens |
|------|----------------|
| **No `[data-transition-box]`** | Interception **off**; `console.warn` |
| **Click internal page link** | `preventDefault` → `ix3.emit(event)` → wait `duration` → navigate |
| **`data-transition-ignore`** | Normal link behaviour |
| **Same-page `#anchor`** | Normal scroll |
| **External / `target="_blank"` / download** | Normal browser behaviour |
| **Page load** | Your IX **Play** trigger (enter) |
| **`prefers-reduced-motion: reduce`** | No interception |

## Publish

Test on the **published** URL. IX3 custom events are unreliable in the Designer canvas.

## Troubleshooting

| Issue | Check |
|-------|--------|
| Links never intercept | `[data-transition-box]` present on every template; script loads after Webflow |
| Exit does nothing | `data-transition-event` matches custom trigger; trigger uses **Reverse**; test `Webflow.require("ix3").emit("…")` in console |
| Cut-off exit | Increase `data-transition-duration` on the wrapper |
| Wrong page / flash | Duration shorter than reverse animation |
