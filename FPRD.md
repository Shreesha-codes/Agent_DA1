# Agent_DA — Retro-Futuristic Frontend Redesign PRD
**Version:** 1.0  
**Prepared for:** AI Coding Agent  
**Stack:** Next.js 14 · TypeScript · Tailwind CSS 3 · Clerk · Supabase · Plotly

---

## 1. OBJECTIVE

Redesign the Agent_DA frontend from its current black-border retro-newspaper aesthetic into a **retro-futuristic terminal/CRT aesthetic** inspired by [smfs.ai](https://smfs.ai). The application is a conversational data analysis tool that lets users upload CSVs/Excel files or connect to PostgreSQL and ask questions in plain English — getting back Python-executed results, narratives, and Plotly charts.

The new design must feel like a **1990s unix workstation terminal crossed with a modern development IDE**: deep dark backgrounds, phosphor-green and cyan accents, monospace typography, technical schematic layouts, subtle scan-line effects, and prompt-style interactivity cues.

**No layout rewrites.** Every existing page and component retains its routing, data-fetching, and functional logic. This PRD is a **pure styling and copy pass**.

---

## 2. CURRENT STATE SUMMARY

| File | Current role |
|---|---|
| `tailwind.config.ts` | Defines `retro.*` and `cohere.*` color tokens, custom fonts, zero border-radius |
| `src/app/globals.css` | Sets white bg, black body text, 8px page frame border, scrollbar styles |
| `src/app/layout.tsx` | ClerkProvider with black/white appearance, wraps in `page-frame` div |
| `src/app/page.tsx` | Public landing page (Dell-ad retro style) |
| `src/app/dashboard/page.tsx` | Authenticated workspace dashboard |
| `src/app/data/upload/page.tsx` | File upload / PostgreSQL connector page |
| `src/app/session/[id]/page.tsx` | Chat analysis session page |
| `src/components/layout/PageShell.tsx` | TopNav + Sidebar wrapper |
| `src/components/layout/TopNav.tsx` | Header bar with logo and auth controls |
| `src/components/layout/Sidebar.tsx` | Collapsible session list sidebar |
| `src/components/chat/MessageList.tsx` | Renders user/assistant message bubbles |
| `src/components/chat/MessageInput.tsx` | Textarea + send button for queries |
| `src/components/agent/ChartRenderer.tsx` | Plotly chart wrapper |
| `src/components/agent/ExecutionConsole.tsx` | Collapsible code/stdout/stderr log |
| `src/components/data/DataProfileCard.tsx` | Schema/stats/anomalies tabs for a data source |
| `src/components/data/FileUploader.tsx` | Drag-and-drop file upload zone |
| `src/components/data/SQLConnector.tsx` | PostgreSQL connection form |

---

## 3. DESIGN LANGUAGE

### 3.1 Aesthetic Concept

**"Deep Scan"** — the terminal of a machine that has been running analysis jobs since 1994 and has never been rebooted. Text glows faintly. Borders feel etched. Every section has a layer number. Prompts precede interactive elements. Code output looks like it came out of a real TTY.

### 3.2 Color Palette

Replace ALL existing `retro.*` and `cohere.*` tokens in `tailwind.config.ts` with the following:

```ts
// tailwind.config.ts → theme.extend.colors
colors: {
  // Background layers
  "bg-base":    "#08080d",   // deepest background (page root)
  "bg-surface": "#0f0f17",   // card / panel surface
  "bg-raised":  "#161620",   // raised element (input, hover)
  "bg-overlay": "#1c1c28",   // modal / tooltip overlay

  // Borders
  "border-dim":    "#1e1e2a", // subtle structural border
  "border-normal": "#2a2a3a", // default visible border
  "border-bright": "#3a3a52", // highlighted/active border

  // Text
  "text-primary": "#e2e2f0",  // main readable text
  "text-muted":   "#5a5a78",  // secondary / dimmed
  "text-faint":   "#2e2e42",  // barely-visible decorative
  "text-code":    "#a8ffb2",  // terminal green output

  // Accents
  "accent-cyan":   "#00d9ff",  // primary interactive accent (links, active states)
  "accent-green":  "#00ff88",  // success / ready / running
  "accent-red":    "#ff3366",  // error / danger / delete
  "accent-yellow": "#ffc832",  // warning / pending
  "accent-purple": "#9b60ff",  // info / neutral highlight

  // Legacy aliases (keep these so any missed class doesn't break)
  "retro-red":    "#ff3366",
  "retro-sage":   "#00ff88",
  "retro-link":   "#00d9ff",
},
```

### 3.3 Typography

```ts
// tailwind.config.ts → theme.extend.fontFamily
fontFamily: {
  display: ['"Space Grotesk"', '"Arial Black"', 'Arial', 'sans-serif'],
  heading: ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
  body:    ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
  mono:    ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
  sans:    ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
},
```

> **Note:** JetBrains Mono and Space Grotesk are available via Google Fonts. Add them to `src/app/layout.tsx` using `next/font/google`:

```ts
// src/app/layout.tsx — add at top of file
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "700"],
});
```

Apply both `variable` props to the `<body>` or `<html>` tag:
```tsx
<body className={`${jetbrainsMono.variable} ${spaceGrotesk.variable} ...`}>
```

Then update tailwind fontFamily to use CSS vars:
```ts
fontFamily: {
  display: ['var(--font-display)', '"Arial Black"', 'sans-serif'],
  heading: ['var(--font-mono)', '"Courier New"', 'monospace'],
  body:    ['var(--font-mono)', '"Courier New"', 'monospace'],
  mono:    ['var(--font-mono)', '"Courier New"', 'monospace'],
},
```

### 3.4 Global CSS (`src/app/globals.css`)

Replace entirely with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Root defaults ── */
:root {
  --scan-line-opacity: 0.03;
  --glow-cyan: 0 0 8px rgba(0, 217, 255, 0.4);
  --glow-green: 0 0 8px rgba(0, 255, 136, 0.4);
  --glow-red: 0 0 8px rgba(255, 51, 102, 0.4);
}

html, body {
  background-color: #08080d;
  color: #e2e2f0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}

/* ── Page frame: thin phosphor border ── */
.page-frame {
  min-height: 100vh;
  border: 1px solid #1e1e2a;
  position: relative;
}

/* CRT scan-line overlay on page-frame */
.page-frame::before {
  content: "";
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0, var(--scan-line-opacity)) 2px,
    rgba(0,0,0, var(--scan-line-opacity)) 4px
  );
}

/* ── Scrollbars ── */
::-webkit-scrollbar       { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: #08080d; }
::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #00d9ff; }

/* ── Cursor blink for prompt UIs ── */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
.cursor-blink::after {
  content: "▋";
  display: inline-block;
  animation: cursor-blink 1s step-end infinite;
  color: #00d9ff;
  margin-left: 2px;
}

/* ── Glow utilities (apply with Tailwind @apply or class) ── */
.glow-cyan   { box-shadow: var(--glow-cyan); }
.glow-green  { box-shadow: var(--glow-green); }
.glow-red    { box-shadow: var(--glow-red); }
.text-glow-cyan  { text-shadow: 0 0 8px rgba(0,217,255,0.6); }
.text-glow-green { text-shadow: 0 0 8px rgba(0,255,136,0.6); }

/* ── Grid background pattern (for landing/dashboard) ── */
.grid-bg {
  background-image:
    linear-gradient(rgba(0,217,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,217,255,0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* ── Pulse animation (used on loading states) ── */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }

/* ── Plotly overrides ── */
.js-plotly-plot .plotly .modebar { background-color: transparent !important; }
.js-plotly-plot .plotly .main-svg { background: transparent !important; }

/* ── Input / form focus ── */
input:focus, textarea:focus {
  outline: none;
  border-color: #00d9ff !important;
  box-shadow: 0 0 0 1px #00d9ff22;
}
```

### 3.5 Design Micro-Patterns

These patterns should appear consistently across components:

| Pattern | Usage | Example class combo |
|---|---|---|
| **Layer labels** | Section eyebrows: `// 01`, `// 02` | `font-mono text-[9px] text-text-muted uppercase` |
| **Prompt prefix** | Before input placeholders: `>` | Prepend in JSX or use `::before` |
| **Status badges** | Pill with left dot | `flex items-center gap-1.5 font-mono text-[9px]` |
| **Divider lines** | Horizontal rules with label | `border-t border-border-dim` + centered label |
| **Hover glow** | Buttons and links | `hover:border-accent-cyan hover:text-glow-cyan` |
| **Active neon** | Selected/active state | `border-accent-cyan text-accent-cyan glow-cyan` |

---

## 4. COMPONENT REDESIGNS

Apply each of the following changes. Components not listed require only the global color token substitution (swap `bg-white → bg-bg-surface`, `border-black → border-border-normal`, `text-black → text-text-primary`, `text-black/50 → text-text-muted`).

---

### 4.1 `TopNav` (`src/components/layout/TopNav.tsx`)

**Visual goal:** Thin terminal status bar. Logo glows cyan. Version tag is a bright badge.

```tsx
// Replace entire return block with:
<header className="bg-bg-base border-b border-border-normal">
  <div className="flex h-10 items-center justify-between px-4 md:px-6">
    
    <Link href="/dashboard" className="flex items-center gap-2.5 group">
      <BarChart3 className="h-4 w-4 text-accent-cyan" />
      <span className="font-display text-xs font-bold uppercase tracking-widest text-text-primary group-hover:text-accent-cyan transition-colors">
        Agent_DA
      </span>
      <span className="font-mono text-[8px] font-bold text-bg-surface bg-accent-cyan px-1.5 py-0.5 leading-none">
        v1.0
      </span>
    </Link>

    {/* Right: decorative status + nav */}
    <nav className="flex items-center gap-4">
      {/* Live indicator */}
      <div className="hidden md:flex items-center gap-1.5 font-mono text-[9px] text-text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
        <span>SYS.ONLINE</span>
      </div>

      <Link
        href="/data/upload"
        className="flex items-center gap-1.5 border border-border-normal bg-bg-surface text-text-primary font-mono text-[10px] uppercase px-3 py-1.5 hover:border-accent-cyan hover:text-accent-cyan transition-colors leading-none"
      >
        <Database className="h-3 w-3" />
        <span>+ Connect</span>
      </Link>

      {isSignedIn && (
        <div className="pl-3 border-l border-border-normal">
          <UserButton appearance={{
            elements: { avatarBox: "h-6 w-6 border border-border-bright rounded-none" }
          }} />
        </div>
      )}
    </nav>
  </div>
</header>
```

---

### 4.2 `Sidebar` (`src/components/layout/Sidebar.tsx`)

**Visual goal:** Dark terminal file-tree panel. Sessions listed like filesystem entries.

Key class changes:
- Root `<aside>`: `bg-bg-base border-r border-border-normal`
- "New Analysis" button: `bg-accent-cyan text-bg-base font-mono text-[10px] uppercase` with `hover:bg-accent-cyan/80`
- Section label: Add `// recent` as layer label above sessions list: `font-mono text-[9px] text-text-faint uppercase tracking-widest`
- Each session link (inactive): `border-transparent text-text-muted hover:border-border-normal hover:text-text-primary`
- Each session link (active): `border-border-bright bg-bg-raised text-accent-cyan`
- Delete button: `text-text-faint hover:text-accent-red`
- Collapse toggle: `border-border-dim bg-bg-surface hover:border-accent-cyan hover:text-accent-cyan`

---

### 4.3 `MessageInput` (`src/components/chat/MessageInput.tsx`)

**Visual goal:** Terminal prompt with `>_` prefix feel.

```tsx
// Replace <form> and interior with:
<form onSubmit={handleSubmit} className="relative bg-bg-surface border border-border-normal focus-within:border-accent-cyan transition-colors px-3 py-2.5">
  {/* Prompt glyph */}
  <span className="absolute left-3 top-3 font-mono text-xs text-accent-cyan select-none pointer-events-none">
    &gt;
  </span>
  <textarea
    ref={textareaRef}
    rows={1}
    placeholder="ask anything about your dataset..."
    value={text}
    onChange={(e) => setText(e.target.value)}
    onKeyDown={handleKeyDown}
    disabled={disabled}
    className="w-full resize-none bg-transparent font-mono text-xs text-text-primary placeholder-text-faint outline-none disabled:opacity-40 pl-5 pr-10 min-h-[22px] max-h-[160px] overflow-y-auto"
  />
  <div className="absolute right-2.5 bottom-2.5">
    <button
      type="submit"
      disabled={!text.trim() || disabled}
      className="flex h-6 w-6 items-center justify-center bg-accent-cyan text-bg-base hover:bg-accent-cyan/80 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
    >
      <ArrowUp className="h-3 w-3" />
    </button>
  </div>
</form>
```

---

### 4.4 `MessageList` (`src/components/chat/MessageList.tsx`)

**Visual goal:** Chat messages look like terminal I/O sessions.

Key changes per message bubble:
- User message container: `border border-border-dim bg-bg-raised` (dimmer)
- Assistant message container: `border border-border-normal bg-bg-surface`
- User avatar: `bg-bg-raised border-border-bright text-accent-cyan`
- Assistant avatar: `bg-accent-cyan/10 border-accent-cyan text-accent-cyan`
- Role label (user): `font-mono text-[9px] text-text-muted`
- Role label (assistant): `font-mono text-[9px] text-accent-cyan text-glow-cyan`
- Body text: `font-mono text-xs text-text-primary leading-relaxed`
- Inline `<code>`: `bg-bg-overlay border border-border-bright text-text-code px-1 font-mono text-[10px]`
- Loading skeleton lines: `bg-border-normal animate-pulse-slow`

Loading indicator text: Change "Anton Agent is analyzing..." → `"// executing analysis"` with `.cursor-blink` class.

---

### 4.5 `ExecutionConsole` (`src/components/agent/ExecutionConsole.tsx`)

This component already has a dark theme. Make the following adjustments:

- Outer border: `border border-border-normal`  
- Toggle button bar: `bg-bg-surface hover:bg-bg-raised` 
- Status badges: Keep existing logic but change color classes:
  - success: `text-accent-green border-accent-green bg-accent-green/10`
  - timeout: `text-accent-yellow border-accent-yellow bg-accent-yellow/10`
  - failed: `text-accent-red border-accent-red bg-accent-red/10`
- Inner dark block (code/stdout/stderr): `bg-[#04040a]` (slightly deeper than surface)
- Generated code label: `text-[9px] uppercase tracking-widest text-text-muted`
- The `pre` block for code: Keep `text-text-code` (already #a8ffb2)
- Stdout text: `text-text-primary`
- Stderr section label: `text-accent-red` + `text-[9px] uppercase tracking-widest`

---

### 4.6 `ChartRenderer` (`src/components/agent/ChartRenderer.tsx`)

Update Plotly theme layout object inside `useEffect`:

```ts
const themeLayout = {
  ...layout,
  paper_bgcolor: "transparent",
  plot_bgcolor:  "#0f0f17",
  font: {
    family: "'JetBrains Mono', 'Courier New', monospace",
    size: 10,
    color: "#e2e2f0",
  },
  title: {
    text: visualization.title,
    font: { family: "'Space Grotesk','Arial Black',sans-serif", size: 13, color: "#e2e2f0" },
    x: 0.0,
  },
  margin: { t: 40, r: 16, b: 48, l: 48 },
  colorway: ["#00d9ff", "#00ff88", "#ff3366", "#ffc832", "#9b60ff", "#ff9966"],
  gridcolor:    "#1e1e2a",
  zerolinecolor: "#2a2a3a",
  height: 380,
  autosize: true,
  xaxis: { gridcolor: "#1e1e2a", zerolinecolor: "#2a2a3a" },
  yaxis: { gridcolor: "#1e1e2a", zerolinecolor: "#2a2a3a" },
};
```

Outer wrapper: `border border-border-normal bg-bg-surface`

---

### 4.7 `DataProfileCard` (`src/components/data/DataProfileCard.tsx`)

- Root border: `border border-border-normal bg-bg-surface`
- Header bar: `border-b border-border-normal bg-bg-base px-4 py-3`
- Dataset name: `font-mono text-xs font-bold text-text-primary`
- Metadata row: `font-mono text-[9px] text-text-muted`
- Tab buttons (inactive): `bg-bg-base text-text-muted hover:text-text-primary hover:bg-bg-raised`
- Tab buttons (active): `bg-bg-raised text-accent-cyan border-b-2 border-accent-cyan`  
  *(change the existing border+bg logic to border-bottom active indicator)*
- Anomaly badge counter: `bg-accent-red text-bg-base`
- Profiling spinner: `border-accent-cyan border-t-transparent`
- Schema table header row: `text-[9px] uppercase text-text-muted font-mono`
- Schema table rows: `font-mono text-[11px] text-text-primary hover:bg-bg-raised`
- Dtype values: `text-accent-cyan`
- Stat cards: `border border-border-dim bg-bg-base`
- Stat card label: `font-mono text-[8px] uppercase text-text-muted`
- Stat card value: `font-mono text-xs font-bold text-text-primary`

---

### 4.8 `FileUploader` (`src/components/data/FileUploader.tsx`)

- Drop zone border: Change `border-2 border-black` → `border border-dashed border-border-bright`
- Drop zone active: `border-accent-cyan bg-accent-cyan/5`
- Drop zone default: `bg-bg-surface hover:bg-bg-raised`
- Upload icon: `text-text-muted`
- Primary text: `font-mono text-sm text-text-primary`
- "browse" link text: `text-accent-cyan hover:text-glow-cyan`
- Constraint label: `font-mono text-[9px] uppercase text-text-faint`
- File selected — filename: `font-mono text-sm text-accent-green`
- Upload progress bar: `bg-accent-cyan` (track: `bg-bg-raised border border-border-dim`)
- Error block: `border border-accent-red bg-accent-red/5 text-accent-red`

---

### 4.9 `SQLConnector` (`src/components/data/SQLConnector.tsx`)

- Form labels: `font-mono text-[9px] uppercase text-text-muted`
- All inputs: `bg-bg-raised border border-border-normal text-text-primary font-mono text-xs placeholder-text-faint focus:border-accent-cyan`
- "Verify Connection" button: `border border-border-bright bg-bg-surface text-text-primary font-mono text-[10px] uppercase hover:border-accent-cyan hover:text-accent-cyan`
- "Save Data Source" button: `border border-accent-cyan bg-accent-cyan text-bg-base font-mono text-[10px] uppercase hover:bg-accent-cyan/80`
- Success result block: `border border-accent-green bg-accent-green/5 text-accent-green`
- Failure result block: `border border-accent-red bg-accent-red/5 text-accent-red`

---

## 5. PAGE REDESIGNS

### 5.1 Landing Page (`src/app/page.tsx`)

**Visual goal:** Full-screen terminal hero with grid-bg, followed by feature sections in schematic-layer style.

**Key layout changes:**

#### Remove:
- The Dell ad top banner
- The icon-label nav grid (Search/Home/Store/Service)
- The "PC Mag Readers Choice" seal
- The bottom footer icon-nav row
- The "browser compat note"

#### Add:
- `grid-bg` class on `<div className="bg-bg-base grid-bg min-h-screen">`
- Hero section with blinking cursor on headline

#### New landing page structure:

```
┌─────────────────────────────────────────────────────────┐
│  [header bar — logo left, signin right]  dark, h-10     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  // 01                            [STATUS: ONLINE ●]   │
│                                                         │
│  AGENT_DA                                              │
│  Conversational Data Analysis ▋                        │
│                                                         │
│  Ask your database anything in plain english.          │
│  Python executes in an isolated sandbox. Charts render. │
│                                                         │
│  > [  Get Started — free  ]  [ View on GitHub ]        │
│                                                         │
│  ─── SUPPORTED FORMATS ─────────────────────────────   │
│  .csv  .xlsx  .json  PostgreSQL                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  // 02  HOW IT WORKS                                    │
│                                                         │
│  [01 INGEST]  [02 PROFILE]  [03 QUERY]  [04 RENDER]    │
│   Upload file  Schema+stats  Natural lang  Plotly chart  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  // 03  FEATURE CARDS (3-col grid)                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│   │ FLEXIBLE     │  │ CONVERSATIONAL│  │ SANDBOXED    │ │
│   │ INGESTION    │  │ CONTEXT       │  │ EXECUTION    │ │
│   └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Exact JSX changes to `page.tsx`:**

1. Wrap entire return in `<div className="bg-bg-base grid-bg min-h-screen font-mono">`.
2. Replace header bar:
   ```tsx
   <div className="flex h-10 items-center justify-between border-b border-border-normal px-6">
     <div className="flex items-center gap-2.5">
       <BarChart3 className="h-4 w-4 text-accent-cyan" />
       <span className="font-display text-xs font-bold uppercase tracking-widest text-text-primary">Agent_DA</span>
       <span className="font-mono text-[8px] bg-accent-cyan text-bg-base px-1.5 py-0.5">v1.0</span>
     </div>
     <div className="flex items-center gap-3">
       {!isSignedIn ? (
         <>
           <SignInButton mode="modal">
             <button className="font-mono text-[10px] text-text-muted hover:text-accent-cyan">sign_in</button>
           </SignInButton>
           <SignUpButton mode="modal">
             <button className="border border-accent-cyan text-accent-cyan font-mono text-[10px] px-3 py-1.5 hover:bg-accent-cyan/10">get_started</button>
           </SignUpButton>
         </>
       ) : (
         <Link href="/dashboard" className="border border-accent-cyan text-accent-cyan font-mono text-[10px] px-3 py-1.5 hover:bg-accent-cyan/10">
           dashboard →
         </Link>
       )}
     </div>
   </div>
   ```
3. Replace hero with:
   ```tsx
   <div className="max-w-4xl mx-auto px-6 pt-20 pb-16">
     <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest mb-6">// 01 · INIT</div>
     <h1 className="font-display text-5xl md:text-7xl font-bold text-text-primary leading-[0.9] mb-4">
       AGENT_DA
     </h1>
     <p className="font-mono text-base text-accent-cyan mb-2 cursor-blink">
       conversational data analysis
     </p>
     <p className="font-mono text-sm text-text-muted max-w-xl leading-relaxed mb-10">
       Upload a CSV or connect PostgreSQL. Ask anything in plain English. The agent writes Python, runs it in a locked sandbox, and returns charts + narrative.
     </p>
     <div className="flex flex-wrap gap-3">
       {/* Primary CTA */}
       <SignUpButton mode="modal">
         <button className="border border-accent-cyan bg-accent-cyan/10 text-accent-cyan font-mono text-xs px-5 py-2.5 hover:bg-accent-cyan/20 transition-colors">
           &gt; get_started()
         </button>
       </SignUpButton>
       {/* Secondary */}
       <a href="#features" className="border border-border-normal text-text-muted font-mono text-xs px-5 py-2.5 hover:border-border-bright hover:text-text-primary transition-colors">
         learn_more →
       </a>
     </div>
     {/* Format pills */}
     <div className="flex flex-wrap gap-2 mt-8">
       {[".csv", ".xlsx", ".json", "PostgreSQL"].map((f) => (
         <span key={f} className="font-mono text-[9px] border border-border-dim text-text-muted px-2 py-1">
           {f}
         </span>
       ))}
     </div>
   </div>
   ```
4. Replace the two-column feature section with a horizontal "how it works" pipeline:
   ```tsx
   <div className="border-t border-border-dim px-6 py-16 max-w-4xl mx-auto">
     <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest mb-8">// 02 · PIPELINE</div>
     <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-dim border border-border-dim">
       {[
         { n: "01", title: "INGEST", desc: "CSV · XLSX · JSON · PostgreSQL" },
         { n: "02", title: "PROFILE", desc: "Schema, stats, anomaly detection" },
         { n: "03", title: "QUERY",   desc: "Plain English → Python code" },
         { n: "04", title: "RENDER",  desc: "Interactive Plotly charts" },
       ].map((step) => (
         <div key={step.n} className="bg-bg-surface p-5">
           <div className="font-mono text-[9px] text-text-faint mb-2">{step.n}</div>
           <div className="font-mono text-xs font-bold text-accent-cyan mb-1">{step.title}</div>
           <div className="font-mono text-[10px] text-text-muted leading-relaxed">{step.desc}</div>
         </div>
       ))}
     </div>
   </div>
   ```
5. Replace feature ribbon cards with a 3-col card grid (id="features"):
   ```tsx
   <div id="features" className="border-t border-border-dim px-6 py-16 max-w-4xl mx-auto">
     <div className="font-mono text-[9px] text-text-muted uppercase tracking-widest mb-8">// 03 · CAPABILITIES</div>
     <div className="grid md:grid-cols-3 gap-px bg-border-dim border border-border-dim">
       {[
         {
           icon: Database,
           title: "FLEXIBLE INGESTION",
           body: "CSV, Excel, and JSON files or live read-only PostgreSQL. Automatic schema profiling on load.",
           accent: "text-accent-cyan",
         },
         {
           icon: MessageSquare,
           title: "CONVERSATIONAL CTX",
           body: "Follow-up questions work naturally. Agent remembers schema, prior code, and findings.",
           accent: "text-accent-green",
         },
         {
           icon: ShieldCheck,
           title: "SANDBOXED EXEC",
           body: "All code runs in a locked, network-less Docker container. Memory-capped. No data leakage.",
           accent: "text-accent-purple",
         },
       ].map((f) => (
         <div key={f.title} className="bg-bg-surface p-6 hover:bg-bg-raised transition-colors">
           <f.icon className={`h-5 w-5 mb-3 ${f.accent}`} />
           <div className="font-mono text-[10px] font-bold text-text-primary mb-2">{f.title}</div>
           <div className="font-mono text-[10px] text-text-muted leading-relaxed">{f.body}</div>
         </div>
       ))}
     </div>
   </div>
   ```
6. Footer:
   ```tsx
   <footer className="border-t border-border-dim px-6 py-6 font-mono text-[9px] text-text-faint flex justify-between items-center">
     <span>© {new Date().getFullYear()} Agent_DA</span>
     <span>SYSTEM READY</span>
   </footer>
   ```

---

### 5.2 Dashboard (`src/app/dashboard/page.tsx`)

**Visual goal:** Workstation command-center. Grid layout feels like a filesystem browser.

Key changes:
1. Page root background: ensure `bg-bg-base` (applied by PageShell body)
2. Page header: 
   - Title: `font-display text-xl font-bold uppercase text-text-primary`
   - Subtitle: `font-mono text-[10px] text-text-muted`
   - "Connect New Data" button: `border border-accent-cyan text-accent-cyan bg-transparent font-mono text-[10px] px-4 py-2 hover:bg-accent-cyan/10`
3. Section label "Connected Datasets": `font-mono text-[9px] uppercase text-text-faint` with `// ds` prefix
4. Each data source row:
   - Container: `border border-border-dim bg-bg-surface hover:bg-bg-raised hover:border-border-normal`
   - Icon box: `bg-bg-overlay border border-border-dim`
   - Name: `font-mono text-xs font-bold text-text-primary`
   - Metadata: `font-mono text-[9px] text-text-muted`
5. Status badges:
   - `complete` → `text-accent-green border-accent-green bg-accent-green/10` + `● READY`
   - `running`  → `text-accent-yellow border-accent-yellow bg-accent-yellow/10 animate-pulse` + `● PROFILING`
   - `failed`   → `text-accent-red border-accent-red bg-accent-red/10` + `● FAILED`
   - `pending`  → `text-text-muted border-border-dim` + `○ PENDING`
6. "Analyze" button: `border border-accent-cyan text-accent-cyan bg-transparent font-mono text-[10px] hover:bg-accent-cyan/10`
7. Delete button: `text-text-faint hover:text-accent-red`
8. Empty state: Dark panel with `font-mono text-xs text-text-muted` and cyan CTA button

---

### 5.3 Upload Page (`src/app/data/upload/page.tsx`)

**Visual goal:** Terminal configuration panel. Tabs look like CLI flags.

Key changes:
1. Page header background: `bg-bg-base border-b border-border-dim`
2. "← Back" link: `font-mono text-[10px] text-text-muted hover:text-accent-cyan border border-border-dim px-2 py-1`
3. Tab buttons:
   - Inactive: `border-transparent text-text-muted bg-bg-surface hover:text-text-primary`
   - Active: `border-t border-l border-r border-border-normal text-accent-cyan bg-bg-raised -mb-px`
   - Font: `font-mono text-[10px] uppercase`
4. Tab content wrapper: `border border-border-normal bg-bg-surface`
5. Error block: Replace with `border border-accent-red bg-accent-red/5 text-accent-red font-mono text-[10px]`

---

### 5.4 Session Page (`src/app/session/[id]/page.tsx`)

**Visual goal:** Split-pane terminal IDE. Left = I/O feed, right = schema inspector.

Key changes:
1. Session header: `bg-bg-base border-b border-border-dim`
2. Dataset name: `font-mono text-[10px] text-text-muted`
3. Session title: `font-mono text-xs font-bold text-text-primary`
4. "Toggle Profile" button: `border border-border-dim font-mono text-[9px] uppercase px-2.5 py-1 text-text-muted hover:border-accent-cyan hover:text-accent-cyan`
5. Message feed area: `bg-bg-base`
6. Empty state copy: Change "Anton Sandbox Ready" to `// sandbox initialized` and update suggestion buttons to `border border-border-dim bg-bg-surface text-text-muted font-mono text-[10px] hover:border-accent-cyan hover:text-accent-cyan`
7. Sidebar panel: `bg-bg-surface border-l border-border-dim`
8. "Dataset Introspection" label: `font-mono text-[9px] uppercase text-text-muted`

---

## 6. CLERK APPEARANCE OVERRIDES

In `src/app/layout.tsx`, update ClerkProvider appearance:

```tsx
appearance={{
  variables: {
    colorPrimary: "#00d9ff",
    colorBackground: "#0f0f17",
    colorInputBackground: "#161620",
    colorInputText: "#e2e2f0",
    colorText: "#e2e2f0",
    colorTextSecondary: "#5a5a78",
    borderRadius: "0px",
  },
  elements: {
    card: "border border-[#2a2a3a] shadow-none bg-[#0f0f17]",
    formButtonPrimary: "bg-[#00d9ff] text-[#08080d] font-bold text-xs py-2.5 px-4 hover:bg-[#00d9ff]/80",
    footerActionLink: "text-[#00d9ff]",
    input: "bg-[#161620] border-[#2a2a3a] text-[#e2e2f0] font-mono text-xs focus:border-[#00d9ff]",
  }
}}
```

---

## 7. IMPLEMENTATION CHECKLIST

Execute in this exact order to minimize broken states:

- [ ] **Step 1**: Update `tailwind.config.ts` — replace color tokens and font families
- [ ] **Step 2**: Update `src/app/globals.css` — full replacement with new version above
- [ ] **Step 3**: Update `src/app/layout.tsx` — add Google Fonts, update Clerk appearance, update `<html>/<body>` classnames
- [ ] **Step 4**: Update `TopNav` — dark header, cyan accent, status indicator
- [ ] **Step 5**: Update `Sidebar` — dark panel, session entries
- [ ] **Step 6**: Update `PageShell` — ensure `bg-bg-base` on main
- [ ] **Step 7**: Update `MessageInput` — terminal prompt style
- [ ] **Step 8**: Update `MessageList` — terminal I/O bubbles
- [ ] **Step 9**: Update `ExecutionConsole` — keep dark, update badge colors
- [ ] **Step 10**: Update `ChartRenderer` — new Plotly theme object
- [ ] **Step 11**: Update `DataProfileCard` — dark panels, cyan active tab
- [ ] **Step 12**: Update `FileUploader` — dashed border, cyan drop zone
- [ ] **Step 13**: Update `SQLConnector` — dark inputs, cyan CTA
- [ ] **Step 14**: Rewrite `src/app/page.tsx` — full landing page redesign
- [ ] **Step 15**: Update `src/app/dashboard/page.tsx` — dark status badges, layout polish
- [ ] **Step 16**: Update `src/app/data/upload/page.tsx` — terminal tabs
- [ ] **Step 17**: Update `src/app/session/[id]/page.tsx` — split-pane terminal IDE feel
- [ ] **Step 18**: Run `next build` and fix any TypeScript/ESLint errors
- [ ] **Step 19**: Visual QA — open each route, verify no white backgrounds leak, no broken borders

---

## 8. COPY / MICROCOPY CHANGES

Replace all user-visible button/label copy from retro-print style to terminal-command style:

| Current | New |
|---|---|
| "Connect New Data" | "+ connect_data()" |
| "Get Started" | "> get_started()" |
| "Analyze" | "run →" |
| "Upload File" | "upload.file" |
| "PostgreSQL Database" | "postgres.connect" |
| "Verify Connection" | "test_conn()" |
| "Save Data Source" | "save_source()" |
| "New Analysis" | "+ new_session" |
| "Anton Agent is analyzing..." | "// executing analysis" |
| "Anton Sandbox Ready" | "// sandbox initialized" |
| "No datasets connected" | "// no data sources found" |
| "No active analyses." | "// no active sessions" |
| "Sandbox Log" | "// exec.log" |
| "Dataset Introspection" | "// schema.inspect" |

---

## 9. WHAT NOT TO CHANGE

- **All TypeScript types** in `src/lib/types.ts` — unchanged
- **All API call logic** in `src/lib/api.ts` — unchanged  
- **All hooks** in `src/hooks/` — unchanged
- **All routing** — unchanged
- **Middleware** in `src/middleware.ts` — unchanged
- **Supabase client** in `src/lib/supabase.ts` — unchanged
- **Functional logic** inside any component (handlers, useEffects for data, etc.) — unchanged

---

## 10. KNOWN EDGE CASES

1. **Tailwind purge**: New token names (`bg-bg-base`, `text-text-primary`, etc.) must exactly match tailwind config keys. Double-check naming.
2. **`bg-*` collision**: Tailwind has a built-in `bg-*` namespace. Use `"bg-base"`, `"bg-surface"` etc. as the *key names* under `colors`, not `bg-bg-base`. So in tailwind config: `colors: { "bg-base": "#08080d" }` → class is `bg-bg-base`. This is fine.
3. **Font variables**: The `var(--font-mono)` approach requires `jetbrainsMono.variable` to be applied to `<html>` or `<body>`, not just `<main>`.
4. **Scan-line z-index**: The `::before` overlay is `position:fixed; z-index:9999`. If Clerk modal or any other overlay has a lower z-index, they'll appear behind the scan lines. Apply `z-index:10000` on Clerk's modal if needed, or lower scan-line z-index to `9000`.
5. **Plotly height on mobile**: The `height: 380` in themeLayout may cause overflow on small screens. Conditionally set `height: 280` if `window.innerWidth < 640`.

---

*End of PRD — v1.0*