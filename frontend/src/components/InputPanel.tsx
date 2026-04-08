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
import { Packet } from "@/types/packet"

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
  const [internetProtocol, setInternetProtocol] = useState<string>("IP")
  const [transportProtocol, setTransportProtocol] = useState<string>("UDP")

  const [packet, setPacket] = useState<any>({
    senderMac: "",
    targetMac: "",
    srcPort: "",
    dstPort: "",
    srcIp: "",
    dstIp: "",
    srcNamespace: "",
    srcInterface: "",
  });

  const handleInputChange = (key: string, value: string) => {
    setPacket((prev: any) => ({ ...prev, [key]: value }));
  };

  const onTrace = () => handleTrace(packet);

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
      setPacket((prev: any) => ({
        ...prev,
        srcNamespace: option.ns,
        srcInterface: option.iface || "",
      }));
    }
  };

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold tracking-tight">Input packet</h2>

      <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto pb-4">
        <div className="mt-4 flex flex-col gap-4">
          <SectionHeader>Link layer</SectionHeader>
          <FormGroup>
            <Label>Source Interface</Label>
            <Select
              value={packet.srcInterface
                ? `${packet.srcInterface}:${packet.srcNamespace}`
                : `process:${packet.srcNamespace}`}
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
              value={packet.senderMac}
              onChange={(e) => handleInputChange("senderMac", e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>Target MAC address</Label>
            <Input
              type="text"
              placeholder="00:00:00:00:00:00"
              value={packet.targetMac}
              onChange={(e) => handleInputChange("targetMac", e.target.value)}
            />
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
              placeholder="0.0.0.0"
              value={packet.srcIp}
              onChange={(e) => handleInputChange("srcIp", e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>Target IP address</Label>
            <Input
              type="text"
              placeholder="0.0.0.0"
              value={packet.dstIp}
              onChange={(e) => handleInputChange("dstIp", e.target.value)}
            />
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
                    value={packet.srcPort}
                    onChange={(e) => handleInputChange("srcPort", e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Destination port</Label>
                  <Input
                    type="number"
                    placeholder="443"
                    value={packet.dstPort}
                    onChange={(e) => handleInputChange("dstPort", e.target.value)}
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
