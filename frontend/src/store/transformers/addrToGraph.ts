import { ElementDefinition } from 'cytoscape';
import { AddrResponse } from '@/types/addr';

/**
 * Converts AddrResponse into Cytoscape ElementDefinitions.
 *
 * AddrItem: Each interface is a node (ID based on ifindex or ifname).
 * AddrInfo: Each IP address is a node with the corresponding interface as its parent.
 */
export const addrToGraph = (data: AddrResponse): ElementDefinition[] => {
  const elements: ElementDefinition[] = [];

  data.forEach((item) => {
    const parentId = `interface-${item.ifindex}`;

    // 1. Add Interface node (AddrItem)
    elements.push({
      data: {
        id: parentId,
        name: item.ifname,
        type: 'interface',
        ifindex: item.ifindex
      }
    });

    // 2. Add Address nodes (AddrInfo) as children
    item.addr_info.forEach((info, index) => {
      const addrId = `addr-${item.ifindex}-${index}`;
      elements.push({
        data: {
          id: addrId,
          name: info.local,
          parent: parentId,
          type: 'address',
          family: info.family
        }
      });
    });
  });

  // 3. Add edges for master-slave relationships
  data.forEach((item) => {
    if (item.master) {
      const sourceId = `interface-${item.ifindex}`;
      // Find the master interface by ifname
      const masterItem = data.find(m => m.ifname === item.master);
      if (masterItem) {
        const targetId = `interface-${masterItem.ifindex}`;
        elements.push({
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

  return elements;
};
