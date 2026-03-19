import { useEffect } from 'react';
import type cytoscape from 'cytoscape';
import type { ElementDefinition } from 'cytoscape';
import { Change } from '@/api';

interface UseGraphHighlightProps {
  cy: cytoscape.Core | null;
  elements: ElementDefinition[];
  currentView: string;
  changes: Change[];
}

export function useGraphHighlight({ cy, elements, currentView, changes }: UseGraphHighlightProps) {
  useEffect(() => {
    if (!cy) return;

    // Clear previous classes
    cy.elements().removeClass('decision-drop decision-accept decision-change decision-other path-highlight');

    // Identify and highlight nodes based on changes
    const highlightedNodes: cytoscape.CollectionReturnValue[] = [];

    changes.forEach(change => {
      let targetNode: cytoscape.CollectionReturnValue | null = null;

      if (currentView === 'overview') {
        targetNode = cy.getElementById(change.pin);
      } else if (currentView === change.pin) {
        targetNode = cy.getElementById(change.id.toString());
      }

      if (targetNode && targetNode.nonempty()) {
        targetNode.addClass(`decision-${change.decision}`);
        highlightedNodes.push(targetNode);
      }
    });

    // Highlight paths between consecutive highlighted nodes
    if (highlightedNodes.length > 1) {
      for (let i = 0; i < highlightedNodes.length - 1; i++) {
        const source = highlightedNodes[i];
        const target = highlightedNodes[i + 1];

        // Check availability of A* method (it's standard in cytoscape.js)
        const aStar = cy.elements().aStar({ root: source, goal: target, directed: true });

        if (aStar.found) {
          aStar.path.addClass('path-highlight');
        }
      }
    }

  }, [cy, elements, currentView, changes]);
}
