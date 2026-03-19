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
import { api, SubgraphNode, Change, TraceRequest } from '@/api';
import { customStylesheet } from '@/config/graph-styles';
import './App.css';

// Optional: specific overrides if needed, otherwise GraphCanvas provides defaults
// Styles moved to src/config/graph-styles.ts

function App() {
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const [subgraphs, setSubgraphs] = useState<SubgraphNode[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    const fetchSubgraphs = async () => {
      try {
        const data = await api.getSubgraphs();
        setSubgraphs(data);
      } catch (error) {
        console.error("Failed to load subgraphs:", error);
      }
    };
    fetchSubgraphs();
  }, []);

  const {
    elements,
    breadcrumbs,
    navigateToOverview,
    navigateToNode
  } = useGraphNavigation(subgraphs);

  const currentView = breadcrumbs[breadcrumbs.length - 1].nodeId;
  const shouldRunLayout = breadcrumbs.length > 1;

  const handleTrace = async (formData: TraceRequest) => {
    console.log("Tracing with data:", formData);
    try {
      setChanges([]); // Clear previous results
      const results = await api.tracePacket(formData);
      setChanges(results);
    } catch (error) {
      console.error("Failed to trace packet:", error);
    }
  };

  useGraphHighlight({ cy, elements, currentView, changes });
  useGraphInteraction({ cy, navigateToNode });

  useEffect(() => {
    if (cy && shouldRunLayout) {
      // Run layout for new elements that don't have positions
      const layout = cy.layout({
        name: 'breadthfirst',
        directed: true,
        padding: 50,
        spacingFactor: 1.5
      } as any);
      layout.run();
    }
  }, [cy, elements, shouldRunLayout]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <main className="flex-1 min-h-0 min-w-0">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize={25} minSize={15}>
            <InputPanel onTrace={handleTrace} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={75} className="relative bg-muted/20 flex flex-col">
            <BreadcrumbSection breadcrumbs={breadcrumbs} onReset={navigateToOverview} />
            <div className="flex-1 min-h-0">
              <GraphCanvas elements={elements} stylesheet={customStylesheet} cy={setCy} />
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
