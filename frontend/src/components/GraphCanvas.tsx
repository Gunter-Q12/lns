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
    const dynamicStyles: StylesheetStyle[] = [
      {
        selector: 'node',
        style: {
          'width': (node: cytoscape.NodeSingular) => {
            const label = node.data('name') || '';
            const lines = (label as string).split('\n');
            const maxLineLength = Math.max(...lines.map((line: string) => line.length));
            return Math.max(40, maxLineLength * 7 + 24);
          },
          'height': (node: cytoscape.NodeSingular) => {
            const label = node.data('name') || '';
            const lineCount = label.split('\n').length;
            return Math.max(32, lineCount * 18 + 14); // ~18px per line + padding
          },
          'text-wrap': 'wrap',
        }
      } as any
    ];
    return [...defaultStyle, ...dynamicStyles, ...stylesheet];
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
        wheelSensitivity={1}
        cy={cy}
      />
    </div>
  );
}
