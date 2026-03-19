import { useEffect } from 'react';
import type cytoscape from 'cytoscape';

interface UseGraphInteractionProps {
  cy: cytoscape.Core | null;
  navigateToNode: (nodeId: string, pushState?: boolean) => void;
}

export function useGraphInteraction({ cy, navigateToNode }: UseGraphInteractionProps) {
  useEffect(() => {
    if (!cy) return;

    const handleTap = (evt: cytoscape.EventObject) => {
      const node = evt.target;
      const nodeId = node.id();
      // label logic is handled inside navigateToNode
      navigateToNode(nodeId);
    };

    const handleMouseOver = () => {
      if (cy.container()) cy.container()!.style.cursor = 'pointer';
    };

    const handleMouseOut = () => {
      if (cy.container()) cy.container()!.style.cursor = 'default';
    };

    cy.on('tap', 'node', handleTap);
    cy.on('mouseover', 'node', handleMouseOver);
    cy.on('mouseout', 'node', handleMouseOut);

    return () => {
      cy.removeListener('tap', 'node', handleTap);
      cy.removeListener('mouseover', 'node', handleMouseOver);
      cy.removeListener('mouseout', 'node', handleMouseOut);
    };
  }, [cy, navigateToNode]);
}
