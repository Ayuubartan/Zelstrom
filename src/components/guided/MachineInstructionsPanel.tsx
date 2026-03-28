import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useZelstromStore } from "@/store/zelstromStore";
import {
  Cpu, Download, Copy, Check, ChevronDown, ChevronUp,
  Cog, Thermometer, Gauge, Ruler,
} from "lucide-react";
import { toast } from "sonner";

interface MachineInstruction {
  machineType: string;
  machineName: string;
  gcode: string[];
  parameters: Record<string, string | number>;
}

export function MachineInstructionsPanel() {
  const [generated, setGenerated] = useState<MachineInstruction[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const activePlan = useZelstromStore(s => s.activePlan);
  const sdmf = useZelstromStore(s => s.sdmf);
  const factorySettings = useZelstromStore(s => s.factorySettings);

  const generateInstructions = () => {
    const activeStations = sdmf.stations.filter(
      s => s.status === "online" || s.status === "running"
    );

    const speedMult = factorySettings.productionParams.speedMultiplier;
    const costPerUnit = factorySettings.productionParams.costPerUnit;

    const instructions: MachineInstruction[] = activeStations.map(station => {
      const params: Record<string, string | number> = {};
      const gcode: string[] = [];

      switch (station.type) {
        case "cnc":
          params["Feed Rate"] = `${Math.round(200 * speedMult)} mm/min`;
          params["Spindle Speed"] = `${Math.round(8000 * speedMult)} RPM`;
          params["Depth of Cut"] = "2.5 mm";
          params["Coolant"] = "Flood";
          params["Tool"] = "T01 (Carbide End Mill Ø10)";
          gcode.push(
            "G90 G21 ; Absolute mode, mm",
            `G28 ; Home all axes`,
            `M06 T01 ; Tool change`,
            `S${Math.round(8000 * speedMult)} M03 ; Spindle ON`,
            `G01 X0 Y0 Z5 F${Math.round(200 * speedMult)} ; Rapid position`,
            `G01 Z-2.5 F100 ; Plunge`,
            `G01 X100 Y0 F${Math.round(200 * speedMult)} ; Cut path`,
            "G01 X100 Y50",
            "G01 X0 Y50",
            "G01 X0 Y0",
            "G00 Z50 ; Retract",
            "M05 ; Spindle OFF",
            "M30 ; Program end",
          );
          break;
        case "laser":
          params["Power"] = `${Math.round(80 * speedMult)}%`;
          params["Speed"] = `${Math.round(1500 * speedMult)} mm/min`;
          params["Focus"] = "0 mm (surface)";
          params["Gas Assist"] = "N2 @ 8 bar";
          params["Kerf"] = "0.15 mm";
          gcode.push(
            "G90 G21",
            `G28`,
            `M62 P0 ; Laser ON`,
            `G01 X0 Y0 F${Math.round(1500 * speedMult)}`,
            "G01 X200 Y0",
            "G01 X200 Y150",
            "G01 X0 Y150",
            "G01 X0 Y0",
            "M63 P0 ; Laser OFF",
            "M30",
          );
          break;
        case "welding":
          params["Current"] = `${Math.round(180 + costPerUnit * 0.5)} A`;
          params["Voltage"] = "24 V";
          params["Wire Feed"] = `${Math.round(6 * speedMult)} m/min`;
          params["Gas Flow"] = "15 L/min (Ar/CO2)";
          params["Travel Speed"] = `${Math.round(300 * speedMult)} mm/min`;
          gcode.push(
            "; Weld sequence - MIG",
            `G01 X0 Y0 Z10 F500`,
            `M64 ; Gas pre-flow ON`,
            "G04 P1.0 ; Dwell 1s",
            `M62 ; Arc ON`,
            `G01 X150 F${Math.round(300 * speedMult)} ; Weld path`,
            "G01 X150 Y80",
            "M63 ; Arc OFF",
            "G04 P0.5 ; Post-flow",
            "M65 ; Gas OFF",
            "M30",
          );
          break;
        default:
          params["Cycle Time"] = `${Math.round(15 / speedMult)}s`;
          params["Pressure"] = `${Math.round(8 * speedMult)} bar`;
          params["Temperature"] = `${Math.round(180 + station.temperature)}°C`;
          params["Force"] = `${Math.round(50 * speedMult)} kN`;
          gcode.push(
            `; ${station.name} - Auto cycle`,
            "G28 ; Home",
            `G01 Z-20 F${Math.round(100 * speedMult)}`,
            "G04 P3.0 ; Hold",
            "G00 Z50 ; Release",
            "M30",
          );
      }

      return {
        machineType: station.type,
        machineName: station.name,
        gcode,
        parameters: params,
      };
    });

    setGenerated(instructions);
    if (instructions.length > 0) setExpanded(instructions[0].machineName);
    toast.success(`Generated instructions for ${instructions.length} machines`);
  };

  const copyGcode = (inst: MachineInstruction) => {
    navigator.clipboard.writeText(inst.gcode.join("\n"));
    setCopied(inst.machineName);
    toast.success("G-code copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadGcode = (inst: MachineInstruction) => {
    const blob = new Blob([inst.gcode.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inst.machineName.replace(/\s+/g, "_")}.nc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MACHINE_ICONS: Record<string, React.ElementType> = {
    cnc: Cog,
    laser: Gauge,
    welding: Thermometer,
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold font-mono text-foreground">
          Machine Instructions
        </span>
        <Badge variant="secondary" className="text-[7px] font-mono h-4 px-1.5 ml-auto">
          CAD → G-CODE
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[9px] font-mono text-muted-foreground">
          Generate CNC/laser/press machine instructions from the deployed production strategy and factory settings.
        </p>

        <Button
          onClick={generateInstructions}
          className="w-full gap-2 font-mono text-xs"
          variant={generated.length > 0 ? "outline" : "default"}
        >
          <Cpu className="w-3.5 h-3.5" />
          {generated.length > 0 ? "Regenerate Instructions" : "Generate Machine Instructions"}
        </Button>

        {/* Generated instructions */}
        {generated.map(inst => {
          const isExp = expanded === inst.machineName;
          const isCopied = copied === inst.machineName;
          const MIcon = MACHINE_ICONS[inst.machineType] || Ruler;

          return (
            <div key={inst.machineName} className="bg-secondary/50 rounded-md overflow-hidden">
              <button
                onClick={() => setExpanded(isExp ? null : inst.machineName)}
                className="w-full flex items-center gap-2 p-2.5 hover:bg-secondary/80 transition-colors"
              >
                <MIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[10px] font-mono font-semibold text-foreground flex-1 text-left">
                  {inst.machineName}
                </span>
                <Badge variant="secondary" className="text-[7px] font-mono h-3.5 px-1 shrink-0">
                  {inst.machineType.toUpperCase()}
                </Badge>
                {isExp ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </button>

              {isExp && (
                <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/30 pt-2">
                  {/* Parameters */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(inst.parameters).map(([key, val]) => (
                      <div key={key} className="bg-background/50 rounded px-2 py-1">
                        <p className="text-[7px] font-mono text-muted-foreground uppercase">{key}</p>
                        <p className="text-[10px] font-mono font-bold text-foreground">{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* G-code */}
                  <div className="bg-background rounded-md p-2 max-h-40 overflow-y-auto">
                    <pre className="text-[9px] font-mono text-muted-foreground whitespace-pre leading-relaxed">
                      {inst.gcode.join("\n")}
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyGcode(inst)}
                      className="flex-1 gap-1 text-[9px] font-mono h-7"
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {isCopied ? "Copied!" : "Copy G-Code"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadGcode(inst)}
                      className="flex-1 gap-1 text-[9px] font-mono h-7"
                    >
                      <Download className="w-3 h-3" />
                      Download .nc
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
