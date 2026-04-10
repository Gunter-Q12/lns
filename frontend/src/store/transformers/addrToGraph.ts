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
    elements.push(...createVethEdges(namespace, data));
  });

  return elements;
};

export const interfaceToId = (namespace: string, ifindex: number) => `interface-${namespace}-${ifindex}`;

const createNamespaceNode = (id: string, name: string): ElementDefinition => ({
  data: { id, name, type: 'namespace' }
});


const createInterfaceAndAddressNodes = (
  namespace: string,
  namespaceId: string,
  item: AddrItem
): ElementDefinition[] => {
  const interfaceId = interfaceToId(namespace, item.ifindex);
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
    if (item.bridgeChildren) {
      const sourceId = interfaceToId(namespace, item.ifindex);
      item.bridgeChildren.forEach((childIfindex) => {
        const targetId = interfaceToId(namespace, childIfindex);
        edges.push({
          data: {
            id: `edge-${targetId}-master-${sourceId}`,
            source: targetId,
            target: sourceId,
            type: 'master-slave'
          }
        });
      });
    }
  });

  return edges;
};

const createVethEdges = (
  namespace: string,
  data: AddrResponse
): ElementDefinition[] => {
  const edges: ElementDefinition[] = [];

  data.forEach((item) => {
    if (item.vEthOtherEndNs && item.vEthOtherEndIfname && item.link_index) {
      const sourceId = interfaceToId(namespace, item.ifindex);
      const targetNamespace = item.vEthOtherEndNs;
      const targetId = interfaceToId(targetNamespace, item.link_index);

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

  return edges;
};
