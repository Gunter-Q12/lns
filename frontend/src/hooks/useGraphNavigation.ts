import { useState, useEffect, useCallback } from 'react';
import type { ElementDefinition } from 'cytoscape';
import elementsData from '@/data/elements.json';
import { SubgraphNode } from '@/api/types';

const initialElements = elementsData as unknown as ElementDefinition[];

export function useGraphNavigation(subgraphs: SubgraphNode[] = []) {
  const [elements, setElements] = useState<ElementDefinition[]>(initialElements);
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; nodeId: string }[]>([
    { label: 'Overview', nodeId: 'overview' }
  ]);

  const navigateToOverview = useCallback((pushState = true) => {
    setElements(initialElements);
    setBreadcrumbs([{ label: 'Overview', nodeId: 'overview' }]);
    if (pushState) {
      window.history.pushState({ view: 'overview' }, '', window.location.pathname);
    }
  }, []);

  const navigateToNode = useCallback((nodeId: string, pushState = true) => {
    const label = initialElements.find((el) => el.data.id === nodeId)?.data.label || nodeId;
    const matchingNodes = subgraphs.filter(node => node.pin === nodeId);
    if (matchingNodes.length == 0) {
      console.log("Empty");
      return;
    }

    const newElements: ElementDefinition[] = [];

    matchingNodes.forEach(node => {
      // Add node
      newElements.push({
        data: {
          id: node.id.toString(),
          name: node.info.matcher,
          decision: node.info.decision
        }
      });

      // Add edges
      node.next.forEach(nextId => {
        newElements.push({
          data: {
            id: `${node.id}->${nextId}`,
            source: node.id.toString(),
            target: nextId.toString()
          }
        });
      });
    });

    setElements(newElements);

    setBreadcrumbs([
      { label: 'Overview', nodeId: 'overview' },
      { label, nodeId: nodeId }
    ]);

    if (pushState) {
      window.history.pushState({ view: nodeId, label }, '', `?view=${nodeId}`);
    }

  }, [subgraphs]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state?.view && state.view !== 'overview') {
        navigateToNode(state.view, false);
      } else {
        navigateToOverview(false);
      }
    };

    // Initial check for URL params
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');

    if (viewParam && viewParam !== 'overview') {
      navigateToNode(viewParam, false);
      // We don't want to replace state if we just loaded the page, but here we are syncing state
      // window.history.replaceState({ view: viewParam, label }, '', `?view=${viewParam}`);
    } else {
      window.history.replaceState({ view: 'overview' }, '', window.location.pathname);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateToNode, navigateToOverview]);

  return {
    elements,
    breadcrumbs,
    navigateToOverview,
    navigateToNode
  };
}
