import { useState, useEffect } from 'react';
import type cytoscape from 'cytoscape';
import cytoscapeInstance from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { TooltipProvider } from "@/components/ui/tooltip"

// Register the cose-bilkent layout extension
cytoscapeInstance.use(coseBilkent);

import { GraphCanvas } from './components/GraphCanvas';
import InputPanel from './components/InputPanel';
import RoutePanel from './components/RoutePanel';
import { BreadcrumbSection } from './components/BreadcrumbSection';
import { fetchNft, fetchAddr, fetchRoute, fetchLsns } from '@/api';
import { useNftActions } from './store/useNftStore';
import { useAddrActions } from './store/useAddrStore';
import { useIpActions } from './store/useIpStore';
import { customStylesheet } from '@/config/graph-styles';
import './App.css';
import { Change, Packet } from '@/types/packet';
import { ElementDefinition } from 'cytoscape';
import { ViewElement } from './types/view';
import elementsData from '@/data/elements.json';
import { NftResponse } from './types/nft';
import { AddrResponse } from './types/addr';
import { IpResponse } from './types/ip';

// Optional: specific overrides if needed, otherwise GraphCanvas provides defaults
// Styles moved to src/config/graph-styles.ts

function App() {
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const [graph, setGraph] = useState<ElementDefinition[]>( [] );
  const [view, setView] = useState<ViewElement[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const { setData: setNftData, getGraph: getNftGraph, tracePacket: traceNftPacket } = useNftActions();
  const { setData: setAddrData, getGraph: getAddrGraph, tracePacket: traceAddrPacket, listInterfaces, isBridge, doesGoToNamespace } = useAddrActions();
  const { setData: setIpData, getGraph: getIpGraph, tracePacket: traceIpPacket, isLocal} = useIpActions();

  function appendView(element: ViewElement) {
    setView(prev => {
      const nextView = [...prev, element];
      window.history.pushState(nextView, '', `${element.id}`);
      return nextView;
    });
  }

  function resetView(pushHistory: boolean = true) {
    setView(() => {
      const initialView = [{id: "namespace_host", label: "Host"}];
      if (pushHistory) {
        window.history.pushState(initialView, '', `namespace_host`);
      } else {
        window.history.replaceState(initialView, '', `namespace_host`);
      }
      return initialView;
    });
  }

  function getCurrentNamespace(view: ViewElement[]): string {
    for (let i = view.length - 1; i >= 0; i--) {
      if (view[i].id.startsWith("namespace_")) {
        return view[i].id.replace("namespace_", "");
      }
    }
    return "host";
  }


  // Popstate handler
  useEffect(() => {
    console.log("Popstate handler started");
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
    console.log("Load data into zustand started");
    const fetchData = async () => {
      const lsnsResponse = await fetchLsns();

      // Collect namespaces that have nsfs
      const namespaces = lsnsResponse.namespaces
          .filter(ns => ns.nsfs)
          .map(ns => ns.nsfs!);

      // Add 'host' (no namespace)
      const targetNamespaces = [undefined, ...namespaces];

      const nftMap = new Map<string, NftResponse>();
      const addrMap = new Map<string, AddrResponse>();
      const ipMap = new Map<string, IpResponse>();

      await Promise.all(targetNamespaces.map(async (ns) => {
          const key = ns === undefined ? "host" : ns;
          const [nft, addr, ip] = await Promise.all([
              fetchNft(ns),
              fetchAddr(ns),
              fetchRoute(ns)
          ]);
          nftMap.set(key, nft);
          addrMap.set(key, addr);
          ipMap.set(key, ip);
      }));

      setNftData(nftMap);
      setAddrData(addrMap);
      setIpData(ipMap);
      resetView(false);
    };
    fetchData();
  }, []);

  // Set graph based on view
  const initialElements = elementsData as unknown as ElementDefinition[];
  useEffect(() => {
    console.log("Set graph based on view started");
    const currentViewId = view.at(-1)?.id || "";
    const currentNamespace = getCurrentNamespace(view);
    if (currentViewId.startsWith("namespace_")) {  // TODO: probaly should check agains a set of namespaces or sth
      setGraph(initialElements)
    } else if (currentViewId.startsWith("interfaces_")) {
      setGraph(getAddrGraph(currentNamespace))
    } else if (currentViewId === "ip_routing_decision" || currentViewId === "ip_routing_decision_local") {
      setGraph(getIpGraph(currentNamespace))
    } else {
      setGraph(getNftGraph(currentNamespace, currentViewId))
    }
  }, [view])

  // Highlight nodes in graph
  useEffect(() => {
    console.log("Highlight nodes in graph started", cy, changes, view);
    if (!cy) return;

    const currentViewId = view.at(-1)?.id;

    // Clear previous classes
    cy.elements().removeClass('decision-drop decision-accept decision-change decision-other path-highlight');

    // Identify and highlight nodes based on changes
    const highlightedNodes: cytoscape.CollectionReturnValue[] = [];

    // const isHostView = `namespace_${changes.at(0)?.namespace}` === currentViewId && highlightedNodes.length > 0;
    // if (isHostView) {
    //   highlightedNodes.push(cy.getElementById("ingress"))
    // }

    changes.forEach(change => {
      let targetNode: cytoscape.CollectionReturnValue | null = null;

      if (`namespace_${change.namespace}` === currentViewId) {
        targetNode = cy.getElementById(change.hook);
      } else if (change.hook === currentViewId) {
        targetNode = cy.getElementById(change.id);
      }

      if (targetNode && targetNode.nonempty()) {
        targetNode.addClass(`decision-${change.decision}`);
        highlightedNodes.push(targetNode);
      }
    });
    console.log("Highlighted and all nodes", highlightedNodes, graph)

    // if (isHostView) {
    //   highlightedNodes.push(cy.getElementById("egress"))
    // }

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

  // Add interactions to graph
  useEffect(() => {
    console.log("Add interactions to graph started");
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

    cy.on('tap', 'node[^noninteractive]', handleTap);
    cy.on('mouseover', 'node[^noninteractive]', handleMouseOver);
    cy.on('mouseout', 'node[^noninteractive]', handleMouseOut);

    return () => {
      cy.removeListener('tap', 'node[^noninteractive]', handleTap);
      cy.removeListener('mouseover', 'node[^noninteractive]', handleMouseOver);
      cy.removeListener('mouseout', 'node[^noninteractive]', handleMouseOut);
    };
  }, [cy]);


  // TODO: this we need to add somewhere
  useEffect(() => {
    const currentViewId = view.at(-1)?.id || "";
    console.log("Layout effect started", currentViewId);
    if (cy && !currentViewId.startsWith("namespace_")) {  // TODO: probaly should check agains a set of namespaces or sth
      const layout = cy.layout({
        name: 'cose-bilkent',
        animate: false,
        randomize: false,
        nodeDimensionsIncludeLabels: true,
        padding: 50,
      } as any);
      layout.run();
    } else {
      cy?.resize();
      cy?.fit("", 10);
    }
  }, [graph]);


  function handleTrace(packet: Packet) {
    let finish = false;
    let currentPacket = packet;
    const allChanges: Change[] = [];

    function currentNamespace(): string {
      return allChanges.at(-1)?.namespace || "host";
    }


    function callNftTrace(hook: string) {
      const [nextPacket, changes] = traceNftPacket(currentPacket, hook, currentNamespace());
      currentPacket = nextPacket;
      allChanges.push(...changes);
      console.log(`nft changes at hook ${hook}:`, changes)
    }

    function callIpTrace(hook: string) {
      const [nextPacket, changes] = traceIpPacket(currentPacket, currentNamespace(), hook);
      currentPacket = nextPacket;
      allChanges.push(...changes);
    }

    function endTrace() {
      callNftTrace("egress");
      const [goesNextNamespace, nextPacket, changes] = doesGoToNamespace(currentPacket, currentNamespace());
      currentPacket = nextPacket;
      allChanges.push(...changes);
      if (!goesNextNamespace) {
        finish = true;
      }
    }

    function ingressIpPacketTrace() {
        callNftTrace("ip_prerouting")
        callIpTrace("ip_routing_decision");
        if (isLocal(packet, currentNamespace())) {
          callNftTrace("ip_input")
          if (allChanges.at(-1)?.decision !== "drop") {
            allChanges.push({
              namespace: currentNamespace(),
              hook: "local_process",
              id: "Local process",
              decision: "finish"
            });
          }
          finish = true;
          return;
        }
        callNftTrace("ip_forward")
        callNftTrace("ip_postrouting")


        if (isBridge(packet.dstInterface, currentNamespace())) {
          callNftTrace("bridge_output");
          callNftTrace("bridge_postrouting");
          endTrace();
        }
    }

    function localIpPacketTrace() {
        callIpTrace("ip_routing_decision_local");
        callNftTrace("ip_output");
        callNftTrace("ip_postrouting");

        if (isBridge(packet.dstInterface, currentNamespace())) {
          callNftTrace("bridge_output");
          callNftTrace("bridge_postrouting");
        }
        endTrace();
    }

    function bridgePacketTrace() {
        callNftTrace("bridge_prerouting");
        if (isLocal(packet, currentNamespace())) {
            callNftTrace("bridge_input")
            localIpPacketTrace();
        } else {
          callNftTrace("bridge_forward")
          callNftTrace("bridge_postrouting");
          endTrace()
        }
    }


    const [nextPacket, changes] = traceAddrPacket(currentPacket);
    currentPacket = nextPacket;
    allChanges.push(...changes);
    console.log("All changes", allChanges)

    let cnt = 0;
    while (!finish && cnt < 100) {
      cnt += 1;

      if (allChanges.at(-1)?.id == "local_process") {
        localIpPacketTrace();
        continue;
      }

      callNftTrace("ingress")
      if (isBridge(packet.srcInterface, packet.srcNamespace)) {
        bridgePacketTrace();
        continue;
      }

      if (packet.isArp) {
        callNftTrace("arp_input");
        finish = true;
        continue;
      }

      ingressIpPacketTrace();
      continue;

    }
    if (cnt >= 100) {
      console.error("INFINITE LOOP DETECTED")
    }



    // if (isBridge(packet)) {
    //   const [nextPacket, changes] = traceIpPacket(currentPacket);
    //   currentPacket = nextPacket;
    //   allChanges.push(...changes);

    // }


    // traceFunctions.forEach(traceFn => {
    //   const [nextPacket, changes] = traceFn(currentPacket);
    //   currentPacket = nextPacket;
    //   allChanges.push(...changes);
    // });

    setChanges(allChanges);
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <main className="flex-1 min-h-0 min-w-0">
          <ResizablePanelGroup orientation="horizontal" className="h-full">
            <ResizablePanel defaultSize={25} minSize={15}>
              <InputPanel handleTrace={handleTrace} listInterfaces={listInterfaces} />
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
              <RoutePanel changes={changes} setView={setView} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default App;
