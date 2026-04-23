import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Change } from '@/types/packet';
import { cn } from "@/lib/utils";
import { ViewElement } from "@/types/view";

interface RoutePanelProps {
  changes: Change[];
  setView: (view: ViewElement[]) => void;
}

function RoutePanel({ changes, setView }: RoutePanelProps) {
  return (
    <div className="flex h-full flex-col p-4 w-full overflow-hidden">
      <h2 className="text-lg font-semibold tracking-tight">Route</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Rules affecting packet route
      </p>
      <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto pb-4">
        <div className="mt-4 flex-1 overflow-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-full">Rule</TableHead>
                <TableHead className="w-[100px]">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.filter(change => !change.highlightOnly).map((change, i) => (
                <TableRow
                  key={i}
                  className="cursor-pointer"
                  onClick={() => {
                    const newView = [
                      { id: change.namespace, label: change.namespace },
                      { id: change.hook, label: change.hook },
                    ];
                    setView(newView)
                    window.history.pushState(newView, '', change.decision);
                  }
                  }
                >
                  <TableCell className="font-medium truncate overflow-hidden">
                    {change.description ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted underline-offset-4 decoration-muted-foreground/50 truncate block">
                            {change.name || change.id}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side={"left"}>
                          <p className="whitespace-pre-wrap">{change.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="truncate block">
                        {change.name || change.id}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                      change.decision === 'drop' && "bg-red-50 text-red-700 ring-red-600/20",
                      change.decision === 'accept' && "bg-green-50 text-green-700 ring-green-600/20",
                      change.decision === 'change' && "bg-orange-50 text-orange-700 ring-orange-600/20",
                      (change.decision === 'start' || change.decision === 'finish') && "bg-blue-50 text-blue-700 ring-blue-600/20",
                      !['drop', 'accept', 'change', 'start', 'finish'].includes(change.decision) && "bg-purple-50 text-purple-700 ring-purple-600/20"
                    )}>
                      {change.decision}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}

export default RoutePanel;
