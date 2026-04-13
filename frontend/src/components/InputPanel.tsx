import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Packet, isIpValid } from "@/types/packet"
import { Address4, Address6 } from 'ip-address';
import { AddressMac } from "@/types/mac";

interface InputPanelProps {
  handleTrace: (packet: Packet) => void;
  listInterfaces: () => Map<string, string[]>;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-medium leading-none mb-2 block">
    {children}
  </label>
);

const FormGroup = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`grid gap-2 px-1 ${className || ""}`}>
    {children}
  </div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-4 mb-2 text-sm text-muted-foreground tracking-wider ">
    {children}
  </div>
);

function InputPanel({ handleTrace, listInterfaces }: InputPanelProps) {
  const [internetProtocol, setInternetProtocol] = useState<string>("ip")
  const [transportProtocol, setTransportProtocol] = useState<string>("udp")
  // State to track source UI only
  const [source, setSource] = useState({
    ns: "",
    iface: ""
  });

  const [packet, setPacket] = useState<any>({
    network: {
      srcMac: "",
      dstMac: "",
    },
    internet: {
      srcIp: "",
      dstIp: "",
      // Placeholder for other internet types, will be handled in onTrace
    },
    transport: {
      srcPort: 0,
      dstPort: 0,
    }
  });

  const handleNetworkChange = (key: string, value: string) => {
    setPacket((prev: any) => ({
      ...prev,
      network: { ...prev.network, [key]: value }
    }));
  };

  const handleInternetChange = (key: string, value: string) => {
    setPacket((prev: any) => ({
      ...prev,
      internet: { ...prev.internet, [key]: value }
    }));
  };

  const handleTransportChange = (key: string, value: string) => {
    setPacket((prev: any) => ({
      ...prev,
      transport: { ...prev.transport, [key]: value === "" ? 0 : parseInt(value) }
    }));
  };

  const onTrace = () => {
    // Fill default values if empty
    const updatedPacket = { ...packet };
    const updatedSource = { ...source };

    // Default MACs
    if (!updatedPacket.network.srcMac) updatedPacket.network.srcMac = "00:00:00:00:00:01";
    if (!updatedPacket.network.dstMac) updatedPacket.network.dstMac = "00:00:00:00:00:02";

    // Default IPs
    if (!updatedPacket.internet.srcIp) updatedPacket.internet.srcIp = "10.0.0.1";
    if (!updatedPacket.internet.dstIp) updatedPacket.internet.dstIp = "10.0.0.2";

    // Update state to reflect defaults in UI
    setPacket(updatedPacket);

    // Validate MAC addresses
    if (!AddressMac.isValid(updatedPacket.network.srcMac) || !AddressMac.isValid(updatedPacket.network.dstMac)) {
      alert("Please enter valid MAC addresses (e.g., 00:11:22:33:44:55)");
      return;
    }

    // Construct final packet based on current protocol states
    const finalPacket: any = {
      network: {
        srcMac: new AddressMac(updatedPacket.network.srcMac),
        dstMac: new AddressMac(updatedPacket.network.dstMac),
      },
      srcInterface: updatedSource.iface,
      srcNamespace: updatedSource.ns,
      transportProtocol,
      isV6: false,
      isArp: false,
    };

    if (internetProtocol === "arp") {
      finalPacket.isArp = true;

      // Validate and instantiate IP addresses for ARP
      const srcStr = updatedPacket.internet.srcIp;
      const dstStr = updatedPacket.internet.dstIp;
      let srcIp: Address4 | Address6;
      let dstIp: Address4 | Address6;

      if (Address4.isValid(srcStr) && Address4.isValid(dstStr)) {
        srcIp = new Address4(srcStr);
        dstIp = new Address4(dstStr);
        finalPacket.isV6 = false;
      } else if (Address6.isValid(srcStr) && Address6.isValid(dstStr)) {
        srcIp = new Address6(srcStr);
        dstIp = new Address6(dstStr);
        finalPacket.isV6 = true;
      } else {
        alert("Please enter valid and matching IPv4 or IPv6 addresses for ARP");
        return;
      }

      finalPacket.internet = {
        operation: "1", // Default to Request for now
        srcMac: updatedPacket.network.srcMac,
        srcIp,
        dstMac: updatedPacket.network.dstMac,
        dstIp,
      };
    } else {
      // Validate and instantiate IP addresses
      const srcStr = updatedPacket.internet.srcIp;
      const dstStr = updatedPacket.internet.dstIp;

      if (Address4.isValid(srcStr) && Address4.isValid(dstStr)) {
        finalPacket.isV6 = false;
        finalPacket.internet = {
          srcIp: new Address4(srcStr),
          dstIp: new Address4(dstStr),
        };
      } else if (Address6.isValid(srcStr) && Address6.isValid(dstStr)) {
        finalPacket.isV6 = true;
        finalPacket.internet = {
          srcIp: new Address6(srcStr),
          dstIp: new Address6(dstStr),
        };
      } else {
        alert("Please enter valid and matching IPv4 or IPv6 addresses (e.g., 10.0.0.1 or 2001:db8::1)");
        return;
      }

      if (transportProtocol === "tcp" || transportProtocol === "udp") {
        const srcPort = updatedPacket.transport.srcPort || 12345;
        const dstPort = updatedPacket.transport.dstPort || 80;

        // Update state for ports as well
        if (updatedPacket.transport.srcPort !== srcPort || updatedPacket.transport.dstPort !== dstPort) {
          setPacket((prev: any) => ({
            ...prev,
            transport: { ...prev.transport, srcPort, dstPort }
          }));
        }

        finalPacket.transport = {
          srcPort,
          dstPort,
        };
      }
    }

    handleTrace(finalPacket);
  };

  const interfacesMap = listInterfaces();
  const sourceOptions: { label: string; value: string; ns: string; iface?: string }[] = [];

  for (const [ns, ifaces] of interfacesMap.entries()) {
    // Add process option
    sourceOptions.push({
      label: `process: ${ns}`,
      value: `process:${ns}`,
      ns: ns,
    });
    // Add interface options
    ifaces.forEach((iface) => {
      sourceOptions.push({
        label: `${iface}: ${ns}`,
        value: `${iface}:${ns}`,
        ns: ns,
        iface: iface,
      });
    });
  }

  const handleSourceChange = (val: string) => {
    const option = sourceOptions.find((o) => o.value === val);
    if (option) {
      setSource({
        ns: option.ns,
        iface: option.iface || "",
      });
    }
  };

  const srcIpValid = packet.internet.srcIp === "" || isIpValid(packet.internet.srcIp);
  const dstIpValid = packet.internet.dstIp === "" || isIpValid(packet.internet.dstIp);

  const srcMacValid = packet.network.srcMac === "" || AddressMac.isValid(packet.network.srcMac);
  const dstMacValid = packet.network.dstMac === "" || AddressMac.isValid(packet.network.dstMac);

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold tracking-tight">Input packet</h2>

      <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto pb-4">
        <div className="mt-4 flex flex-col gap-4">
          <SectionHeader>Link layer</SectionHeader>
          <FormGroup>
            <Label>Source Interface</Label>
            <Select
              value={source.iface
                ? `${source.iface}:${source.ns}`
                : `process:${source.ns}`}
              onValueChange={handleSourceChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>

          <SectionHeader>Network layer</SectionHeader>
          <FormGroup>
            <Label>Sender MAC address</Label>
            <Input
              type="text"
              placeholder="00:00:00:00:00:00"
              value={packet.network.srcMac}
              className={!srcMacValid ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => handleNetworkChange("srcMac", e.target.value)}
            />
            {!srcMacValid && (
              <p className="text-[0.8rem] font-medium text-destructive">
                Invalid MAC address
              </p>
            )}
          </FormGroup>
          <FormGroup>
            <Label>Target MAC address</Label>
            <Input
              type="text"
              placeholder="00:00:00:00:00:00"
              value={packet.network.dstMac}
              className={!dstMacValid ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => handleNetworkChange("dstMac", e.target.value)}
            />
            {!dstMacValid && (
              <p className="text-[0.8rem] font-medium text-destructive">
                Invalid MAC address
              </p>
            )}
          </FormGroup>

          <SectionHeader>Network layer</SectionHeader>
          <FormGroup>
            <Label>Protocol</Label>
            <Select value={internetProtocol} onValueChange={setInternetProtocol}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Protocol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arp">ARP</SelectItem>
                <SelectItem value="ip">IP</SelectItem>
              </SelectContent>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Sender IP address</Label>
            <Input
              type="text"
              placeholder="10.0.0.1 or 2001:db8::1"
              value={packet.internet.srcIp}
              className={!srcIpValid ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => handleInternetChange("srcIp", e.target.value)}
            />
            {!srcIpValid && (
              <p className="text-[0.8rem] font-medium text-destructive">
                Invalid IP address (v4 or v6)
              </p>
            )}
          </FormGroup>
          <FormGroup>
            <Label>Target IP address</Label>
            <Input
              type="text"
              placeholder="10.0.0.1 or 2001:db8::1"
              value={packet.internet.dstIp}
              className={!dstIpValid ? "border-destructive focus-visible:ring-destructive" : ""}
              onChange={(e) => handleInternetChange("dstIp", e.target.value)}
            />
            {!dstIpValid && (
              <p className="text-[0.8rem] font-medium text-destructive">
                Invalid IP address (v4 or v6)
              </p>
            )}
          </FormGroup>

          {internetProtocol === "arp" && (
            <FormGroup>
              <Label>ARP Operations</Label>
              <Select value="1">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Request</SelectItem>
                  <SelectItem value="2">Reply</SelectItem>
                </SelectContent>
              </Select>
            </FormGroup>
          )}

          {internetProtocol === "ip" && (
              <FormGroup>
                <Label>Transport Protocol</Label>
                <Select value={transportProtocol} onValueChange={setTransportProtocol}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                  </SelectContent>
                </Select>
              </FormGroup>
            )}

          {internetProtocol === "ip" && (
              <div className="grid grid-cols-2">
                <FormGroup>
                  <Label>Source port</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={packet.transport.srcPort || ""}
                    onChange={(e) => handleTransportChange("srcPort", e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Destination port</Label>
                  <Input
                    type="number"
                    placeholder="443"
                    value={packet.transport.dstPort || ""}
                    onChange={(e) => handleTransportChange("dstPort", e.target.value)}
                  />
                </FormGroup>
              </div>
          )}
        </div>
      </ScrollArea>

      <Button className="w-full" onClick={onTrace}>
        Trace
      </Button>
    </div>
  )
}

export default InputPanel
