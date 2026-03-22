import { useState, useEffect } from 'react';
import type cytoscape from 'cytoscape';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { GraphCanvas } from './components/GraphCanvas';
import InputPanel from './components/InputPanel';
import RoutePanel from './components/RoutePanel';
import { BreadcrumbSection } from './components/BreadcrumbSection';
import { useGraphNavigation } from './hooks/useGraphNavigation';
import { useGraphHighlight } from './hooks/useGraphHighlight';
import { useGraphInteraction } from './hooks/useGraphInteraction';
import { fetchNft } from '@/api';
import { useNftActions } from './store/useNftStore';
import { customStylesheet } from '@/config/graph-styles';
import './App.css';
import { Change, Packet } from '@/types/packet';
import { ElementDefinition } from 'cytoscape';
import { ViewElement } from './types/view';
import elementsData from '@/data/elements.json';

// Optional: specific overrides if needed, otherwise GraphCanvas provides defaults
// Styles moved to src/config/graph-styles.ts

function App() {
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const [graph, setGraph] = useState<ElementDefinition[]>( [] );
  const [view, setView] = useState<ViewElement[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const { setNftData, getGraph, tracePacket } = useNftActions();

  function appendView(element: ViewElement) {
    setView(prev => {
      const nextView = [...prev, element];
      window.history.pushState(nextView, '', `${element.id}`);
      return nextView;
    });
  }

  function resetView(pushHistory: boolean = true) {
    setView(_ => {
      const initialView = [{id: "host", label: "Host"}];
      if (pushHistory) {
        window.history.pushState(initialView, '', `host`);
      } else {
        window.history.replaceState(initialView, '', `host`);
      }
      return initialView;
    });
  }

  // Popstate handler
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setView(event.state);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);



  // Load data into zustand
  useEffect(() => {
    const fetchData = async () => {
        const nftResponse = await fetchNft();  // TODO: add some kind of retry or user-readable error
        setNftData(nftResponse);
        resetView(false);
    };
    fetchData();
  }, []);

  // Set graph based on view
  const initialElements = elementsData as unknown as ElementDefinition[];
  useEffect(() => {
    const currentViewId = view.at(-1)?.id || "";
    console.log("CurrentViewId", currentViewId);
    console.log("history", window.history.length)
    if (currentViewId === "host") {  // TODO: probaly should check agains a set of namespaces or sth
        setGraph(initialElements)
    } else {
      setGraph(getGraph(currentViewId))
    }
  }, [view])

  // Highlight nodes in graph
  useEffect(() => {
    if (!cy) return;

    // Clear previous classes
    cy.elements().removeClass('decision-drop decision-accept decision-change decision-other path-highlight');

    // Identify and highlight nodes based on changes
    const highlightedNodes: cytoscape.CollectionReturnValue[] = [];

    changes.forEach(change => {
      let targetNode: cytoscape.CollectionReturnValue | null = null;

    const currentViewId = view.at(-1)?.id;
      if (change.namespace === currentViewId) {
        targetNode = cy.getElementById(change.hook);
      } else if (change.hook === currentViewId) {
        targetNode = cy.getElementById(change.id);
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
  }, [graph, changes])


  // Rerender graph when changed
  // TODO: does it work automatically or not?
  useEffect(() => {


  }, [graph])


  // Add interactions to graph
  useEffect(() => {
    if (!cy) return;

    const handleTap = (evt: cytoscape.EventObject) => {
      const node = evt.target;
      const nodeId = node.id();
      appendView({id: nodeId, label: nodeId})  // TODO: replace nodeID with label
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
  }, [cy]);

  // useGraphInteraction({ cy, navigateToNode });


  // TODO: this we need to add somewhere
  // useEffect(() => {
  //   if (cy && shouldRunLayout) {
  //     // Run layout for new elements that don't have positions
  //     const layout = cy.layout({
  //       name: 'breadthfirst',
  //       directed: true,
  //       padding: 50,
  //       spacingFactor: 1.5
  //     } as any);
  //     layout.run();
  //   }
  // }, [cy, elements, shouldRunLayout]);


  function handleTrace(packet: Packet) {
      const [_, changes] = tracePacket(packet);
      setChanges(changes);
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <main className="flex-1 min-h-0 min-w-0">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={15}>
            <InputPanel handleTrace={handleTrace} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={75} className="relative bg-muted/20 flex flex-col">
            <BreadcrumbSection view={view} setView={setView} />
            <div className="flex-1 min-h-0">
              <GraphCanvas elements={graph} stylesheet={customStylesheet} cy={setCy} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={25} minSize={15}>
            <RoutePanel changes={changes} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}

export default App;
