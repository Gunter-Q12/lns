import { ElementDefinition } from 'cytoscape';
import { AddrResponse, AddrItem } from '@/types/addr';

/**
 * Converts Map of AddrResponses into Cytoscape ElementDefinitions.
 */
export const addrToGraph = (dataMap: Map<string, AddrResponse>): ElementDefinition[] => {
  const elements: ElementDefinition[] = [];

  dataMap.forEach((data, namespace) => {
    const namespaceId = `namespace_${namespace}`;
    elements.push(createNamespaceNode(namespaceId, namespace));

    data.forEach((item) => {
      elements.push(...createInterfaceAndAddressNodes(namespace, namespaceId, item));
    });

    elements.push(...createBridgeEdges(namespace, data));
    elements.push(...createVethEdges(namespace, data, dataMap));
  });

  return elements;
};

const createNamespaceNode = (id: string, name: string): ElementDefinition => ({
  data: { id, name, type: 'namespace' }
});

const createInterfaceAndAddressNodes = (
  namespace: string,
  namespaceId: string,
  item: AddrItem
): ElementDefinition[] => {
  const interfaceId = `interface-${namespace}-${item.ifindex}`;
  const nodes: ElementDefinition[] = [
    {
      data: {
        id: interfaceId,
        name: item.ifname,
        parent: namespaceId,
        type: 'interface',
        ifindex: item.ifindex
      }
    }
  ];

  item.addr_info.forEach((info, index) => {
    nodes.push({
      data: {
        id: `addr-${namespace}-${item.ifindex}-${index}`,
        name: info.local,
        parent: interfaceId,
        type: 'address',
        family: info.family
      }
    });
  });

  return nodes;
};

const createBridgeEdges = (
  namespace: string,
  data: AddrResponse
): ElementDefinition[] => {
  const edges: ElementDefinition[] = [];

  data.forEach((item) => {
    if (item.master) {
      const sourceId = `interface-${namespace}-${item.ifindex}`;
      const masterItem = data.find(m => m.ifname === item.master);
      if (masterItem) {
        const targetId = `interface-${namespace}-${masterItem.ifindex}`;
        edges.push({
          data: {
            id: `edge-${sourceId}-master-${targetId}`,
            source: sourceId,
            target: targetId,
            type: 'master-slave'
          }
        });
      }
    }
  });

  return edges;
};

const createVethEdges = (
  namespace: string,
  data: AddrResponse,
  dataMap: Map<string, AddrResponse>
): ElementDefinition[] => {
  const edges: ElementDefinition[] = [];

  data.forEach((item) => {
    if (item.link_index) {
      const sourceId = `interface-${namespace}-${item.ifindex}`;

      // Search across all namespaces for the linked interface
      dataMap.forEach((otherData, otherNamespace) => {
        otherData.forEach((otherItem) => {
          if (otherItem.ifindex === item.link_index && otherItem.link_index === item.ifindex) {
            const targetId = `interface-${otherNamespace}-${otherItem.ifindex}`;
            // To avoid double edges, only add if sourceId < targetId
            if (sourceId < targetId) {
              edges.push({
                data: {
                  id: `edge-${sourceId}-link-${targetId}`,
                  source: sourceId,
                  target: targetId,
                  type: 'veth-link'
                }
              });
            }
          }
        });
      });
    }
  });

  return edges;
};
