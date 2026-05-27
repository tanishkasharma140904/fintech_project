// ============================================================
// FILE: src/App.jsx
// PURPOSE: The ROOT component — the "blueprint" of your entire app.
//
// WHY THIS FILE EXISTS:
//   App.jsx does ONE job: define the overall page layout.
//   It doesn't know what's inside the sidebar or dashboard —
//   it just decides WHERE they sit. This is called "composition"
//   and it's the core pattern of React development.
//
// HOW IT CONNECTS:
//   1. main.jsx renders <App /> into the browser DOM
//   2. App.jsx imports and arranges Sidebar, Navbar, Dashboard
//   3. React renders them all together as one page
//
// IMPORT PATHS EXPLAINED:
//   "./main.css"              → file in the SAME folder (src/)
//   "./components/Sidebar"   → file inside src/components/
//   You never need .jsx extension — React/Vite handles it
// ============================================================

// Step 1: Import global styles FIRST
// This ensures CSS variables and Tailwind are available everywhere
import "./main.css";

// Step 2: Import the three layout components
// The path starts with "./" which means "start from THIS file's folder"
import Sidebar   from "./components/Sidebar";
import Navbar    from "./components/Navbar";
import Dashboard from "./components/Dashboard";

// Step 3: Define and export the App component
// "export default" means this is what other files get when they import App
export default function App() {
  return (
    // The outermost div is the full-page container.
    // "flex h-screen" = horizontal flexbox, full viewport height
    // This creates the classic sidebar-left / content-right layout.
    <div className="flex h-screen overflow-hidden">

      {/* ── LEFT: Sidebar ──────────────────────────────────────
          The Sidebar component handles its own width (w-60 = 240px).
          It takes up the left side and is always visible on desktop. */}
      <Sidebar />

      {/* ── RIGHT: Main Area ───────────────────────────────────
          "flex-1" means "take up ALL remaining horizontal space"
          after the sidebar. This is how the layout splits 240px | rest.
          "flex flex-col" stacks Navbar on top, Dashboard below. */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── TOP: Navbar ──
            Sits at the very top of the right column.
            sticky positioning is handled inside Navbar.jsx */}
        <Navbar />

        {/* ── BOTTOM: Dashboard (scrollable content) ──
            flex-1 means it fills all space below the navbar.
            overflow-y-auto (set inside Dashboard.jsx) allows scrolling. */}
        <Dashboard />

      </div>
    </div>
  );
}

// ============================================================
// HOW THE COMPONENT TREE WORKS (read this!):
//
//   main.jsx
//   └── <App />
//       ├── <Sidebar />      ← left panel
//       └── <div>            ← right panel wrapper
//           ├── <Navbar />   ← top bar
//           └── <Dashboard> ← content area
//               └── <AnalyticsCard /> × 3  ← cards inside
//
// React renders from top to bottom, inside to outside.
// If data needs to flow between siblings (e.g., Sidebar → Dashboard),
// you "lift state" to App.jsx and pass it down as props.
// That's the next concept you'll learn!
// ============================================================
