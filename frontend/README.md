# Cytoscape Project with Shadcn UI

This project is a React-based graph visualization tool using Cytoscape.js and Shadcn UI components.

## Dependencies

The following production dependencies are required for the application to function:

| Dependency | Purpose | Why we need it |
| :--- | :--- | :--- |
| **react** | UI Framework | The core library for building the user interface component-based architecture. |
| **react-dom** | React-to-DOM Glue | Required to render React components into the web browser's DOM. |
| **cytoscape** | Graph Engine | The main library used for graph data structures, analysis, and visualization logic. |
| **react-cytoscapejs** | Cytoscape Wrapper | Provides a declarative React component interface for the imperatively-driven Cytoscape.js library. |
| **lucide-react** | Icon Library | Provides a large set of clean, consistent SVG icons used within UI components (like Breadcrumbs). |
| **clsx** | Utility | A tiny utility for constructing `className` strings conditionally (e.g., `active && "bg-blue-500"`). |
| **tailwind-merge** | Tailwind Utility | Merges conflicting Tailwind CSS classes efficiently, ensuring that custom overrides (like `p-2` over `p-4`) work correctly. |
| **class-variance-authority** | Variant Management | Used to define and manage component variants (like different button sizes or styles) in a type-safe way. |
| **shadcn-ui** | Component Registry | While components are copied locally, this package provides the management logic for shadcn components. |
| **react-resizable-panels** | Layout Utility | Provides the core logic for the resizable sidebar panels in the application. |

## UI Utilities

The project includes a `cn` utility in `src/lib/utils.ts` which combines `clsx` and `tailwind-merge`. This allows us to handle both conditional classes and CSS conflict resolution in a single function call, which is a requirement for the **shadcn/ui** design system.
