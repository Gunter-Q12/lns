import type { StylesheetStyle } from 'cytoscape';

export const customStylesheet: StylesheetStyle[] = [
  {
    selector: '#a',
    style: {
      'background-color': '#3b82f6',
      'color': '#fff'
    }
  },
  {
    selector: '.decision-drop',
    style: {
      'background-color': '#fef2f2', // red-50
      'border-color': '#ef4444',    // red-500
      'border-width': 2,
      'color': '#dc2626'            // red-600
    }
  },
  {
    selector: '.decision-accept',
    style: {
      'background-color': '#f0fdf4', // green-50
      'border-color': '#22c55e',     // green-500
      'color': '#16a34a'             // green-600
    }
  },
  {
    selector: '.decision-start, .decision-finish',
    style: {
      'background-color': '#eff6ff', // blue-50
      'border-color': '#3b82f6',     // blue-500
      'color': '#2563eb'             // blue-600
    }
  },
  {
    selector: '.decision-change',
    style: {
      'background-color': '#fff7ed', // orange-50
      'border-color': '#f97316',     // orange-500
      'color': '#ea580c'             // orange-600
    }
  },
  {
    selector: '.decision',
    style: {
      'background-color': '#faf5ff', // purple-50
      'border-color': '#a855f7',     // purple-500
      'color': '#9333ea'             // purple-600
    }
  },
  {
    selector: 'edge.path-highlight',
    style: {
      'line-color': '#94a3b8',       // slate-400
      'target-arrow-color': '#94a3b8',
      'width': 3
    }
  }
];
