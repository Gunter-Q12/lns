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
import { TraceRequest } from "@/api"

interface InputPanelProps {
  onTrace: (data: TraceRequest) => void;
}

function InputPanel({ onTrace }: InputPanelProps) {
  const [protocol, setProtocol] = useState<string>("arp")
  const [formData, setFormData] = useState<Omit<TraceRequest, 'protocol'>>({
    senderMac: "",
    targetMac: "",
    srcPort: "",
    dstPort: "",
    srcIp: "",
    dstIp: ""
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleTrace = () => {
    onTrace({
      protocol,
      ...formData
    });
  };

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-semibold tracking-tight">Input packet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Input packet to trace
      </p>
      <div className="mt-4">
        <Select value={protocol} onValueChange={setProtocol}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Protocol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arp">ARP</SelectItem>
            <SelectItem value="tcp">TCP</SelectItem>
            <SelectItem value="udp">UDP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {protocol === "arp" && (
          <>
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none">
                Sender hardware address
              </label>
              <Input
                type="text"
                placeholder="00:00:00:00:00:00"
                value={formData.senderMac}
                onChange={(e) => handleInputChange("senderMac", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none">
                Target hardware address
              </label>
              <Input
                type="text"
                placeholder="00:00:00:00:00:00"
                value={formData.targetMac}
                onChange={(e) => handleInputChange("targetMac", e.target.value)}
              />
            </div>
          </>
        )}

        {(protocol === "tcp" || protocol === "udp") && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">
                  Source port
                </label>
                <Input
                  type="number"
                  placeholder="80"
                  value={formData.srcPort}
                  onChange={(e) => handleInputChange("srcPort", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">
                  Destination port
                </label>
                <Input
                  type="number"
                  placeholder="443"
                  value={formData.dstPort}
                  onChange={(e) => handleInputChange("dstPort", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none">
                Source IP
              </label>
              <Input
                type="text"
                placeholder="192.168.1.1"
                value={formData.srcIp}
                onChange={(e) => handleInputChange("srcIp", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none">
                Destination IP
              </label>
              <Input
                type="text"
                placeholder="192.168.1.2"
                value={formData.dstIp}
                onChange={(e) => handleInputChange("dstIp", e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-auto pt-4">
        <Button className="w-full" onClick={handleTrace}>
          Trace
        </Button>
      </div>
    </div>
  )
}

export default InputPanel
