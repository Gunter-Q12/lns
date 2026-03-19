import CytoscapeComponent from 'react-cytoscapejs';
import { cn } from "@/lib/utils";
import type cytoscape from 'cytoscape';
import type { StylesheetStyle } from 'cytoscape';
import { useMemo } from 'react';
import defaultStyle from '@/data/graph-style.json';

interface GraphCanvasProps {
  elements: cytoscape.ElementDefinition[];
  stylesheet?: StylesheetStyle[] | any[];
  className?: string;
  cy?: (cy: cytoscape.Core) => void;
}

export function GraphCanvas({ elements, stylesheet = [], className, cy }: GraphCanvasProps) {
  const finalStylesheet = useMemo(() => {
    return [...defaultStyle, ...stylesheet];
  }, [stylesheet]);

  return (
    <div className={cn("h-full w-full relative overflow-hidden bg-background", className)}>
      <CytoscapeComponent
        className="absolute inset-0"
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={finalStylesheet}
        boxSelectionEnabled={false}
        zoom={0.7}
        cy={cy}
      />
    </div>
  );
}
