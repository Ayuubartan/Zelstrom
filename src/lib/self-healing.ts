// Self-Healing Engine — Anomaly detection and emergency re-wiring

import type { FactoryStation, SensorReading } from "@/lib/sdmf";

export type AnomalyType =
  | 'thermal-spike'
  | 'vibration-critical'
  | 'pressure-loss'
  | 'power-surge'
  | 'throughput-drop'
  | 'defect-cascade'
  | 'station-failure'
  | 'utilization-imbalance';

export type HealAction =
  | 'reroute-flow'
  | 'reduce-speed'
  | 'activate-backup'
  | 'cooldown-cycle'
  | 'recalibrate'
  | 'bypass-station'
  | 'rebalance-load'
  | 'emergency-shutdown';

export interface SelfHealEvent {
  id: string;
  timestamp: number;
  anomalyType: AnomalyType;
  severity: 'warning' | 'critical' | 'emergency';
  stationId: string;
  stationName: string;
  sensorId?: string;
  sensorValue?: number;
  sensorUnit?: string;
  threshold: number;
  action: HealAction;
  description: string;
  resolution: string;
  durationMs: number; // simulated heal time
  success: boolean;
}

const ANOMALY_THRESHOLDS: Record<string, { warn: number; crit: number }> = {
  temperature: { warn: 80, crit: 120 },
  vibration: { warn: 3.0, crit: 4.5 },
  pressure: { warn: 20, crit: 10 },  // below threshold = anomaly
  power: { warn: 18, crit: 22 },
};

const HEAL_ACTIONS: Record<AnomalyType, { action: HealAction; resolution: string }[]> = {
  'thermal-spike': [
    { action: 'cooldown-cycle', resolution: 'Initiated emergency cooldown — thermal paste flow increased 200%' },
    { action: 'reduce-speed', resolution: 'Throttled station to 60% speed — temperature stabilizing' },
  ],
  'vibration-critical': [
    { action: 'recalibrate', resolution: 'Auto-recalibrated spindle bearings — vibration within tolerance' },
    { action: 'emergency-shutdown', resolution: 'Emergency stop — bearing replacement queued' },
  ],
  'pressure-loss': [
    { action: 'activate-backup', resolution: 'Switched to backup pneumatic line — pressure restored' },
    { action: 'bypass-station', resolution: 'Routed material flow around depressurized station' },
  ],
  'power-surge': [
    { action: 'rebalance-load', resolution: 'Redistributed power across phases — surge absorbed' },
    { action: 'emergency-shutdown', resolution: 'Isolated circuit — backup UPS engaged' },
  ],
  'throughput-drop': [
    { action: 'reroute-flow', resolution: 'Rerouted material through parallel station path' },
    { action: 'rebalance-load', resolution: 'Rebalanced batch allocation — throughput recovering' },
  ],
  'defect-cascade': [
    { action: 'recalibrate', resolution: 'Triggered full sensor recalibration — defect source isolated' },
    { action: 'reduce-speed', resolution: 'Reduced feed rate by 40% — quality threshold restored' },
  ],
  'station-failure': [
    { action: 'bypass-station', resolution: 'Emergency bypass activated — production rerouted to backup cell' },
    { action: 'activate-backup', resolution: 'Hot-swapped to standby station — zero downtime' },
  ],
  'utilization-imbalance': [
    { action: 'rebalance-load', resolution: 'Dynamic load balancing — utilization spread equalized' },
    { action: 'reroute-flow', resolution: 'Adjusted routing priorities to distribute workload' },
  ],
};

/**
 * Scan stations for anomalies and generate self-healing events.
 * Called on each sensor update cycle.
 */
export function detectAnomalies(stations: FactoryStation[]): SelfHealEvent[] {
  const events: SelfHealEvent[] = [];
  const now = Date.now();

  stations.forEach(station => {
    // Check sensor readings
    station.sensors.forEach(sensor => {
      const event = checkSensor(station, sensor, now);
      if (event) events.push(event);
    });

    // Check station-level anomalies
    if (station.status === 'offline' || station.status === 'maintenance') {
      if (Math.random() > 0.7) {
        const actions = HEAL_ACTIONS['station-failure'];
        const heal = actions[Math.floor(Math.random() * actions.length)];
        events.push({
          id: `heal-${now}-${station.id}-fail`,
          timestamp: now,
          anomalyType: 'station-failure',
          severity: 'emergency',
          stationId: station.id,
          stationName: station.name,
          threshold: 0,
          action: heal.action,
          description: `Station ${station.name} entered ${station.status} state — production halted`,
          resolution: heal.resolution,
          durationMs: Math.floor(Math.random() * 3000) + 500,
          success: Math.random() > 0.1,
        });
      }
    }

    // Throughput drop detection
    if (station.throughput < 10 && station.status === 'online' && Math.random() > 0.8) {
      const actions = HEAL_ACTIONS['throughput-drop'];
      const heal = actions[Math.floor(Math.random() * actions.length)];
      events.push({
        id: `heal-${now}-${station.id}-tput`,
        timestamp: now,
        anomalyType: 'throughput-drop',
        severity: 'warning',
        stationId: station.id,
        stationName: station.name,
        threshold: 15,
        sensorValue: station.throughput,
        sensorUnit: 'u/h',
        action: heal.action,
        description: `Throughput at ${station.name} dropped to ${station.throughput}/h (threshold: 15/h)`,
        resolution: heal.resolution,
        durationMs: Math.floor(Math.random() * 2000) + 300,
        success: true,
      });
    }

    // Utilization imbalance
    const avgUtil = stations.reduce((s, st) => s + st.utilization, 0) / stations.length;
    if (Math.abs(station.utilization - avgUtil) > 35 && Math.random() > 0.85) {
      const actions = HEAL_ACTIONS['utilization-imbalance'];
      const heal = actions[Math.floor(Math.random() * actions.length)];
      events.push({
        id: `heal-${now}-${station.id}-util`,
        timestamp: now,
        anomalyType: 'utilization-imbalance',
        severity: 'warning',
        stationId: station.id,
        stationName: station.name,
        threshold: 35,
        sensorValue: Math.round(station.utilization),
        sensorUnit: '%',
        action: heal.action,
        description: `${station.name} utilization at ${Math.round(station.utilization)}% vs avg ${Math.round(avgUtil)}%`,
        resolution: heal.resolution,
        durationMs: Math.floor(Math.random() * 1500) + 200,
        success: true,
      });
    }
  });

  return events;
}

function checkSensor(station: FactoryStation, sensor: SensorReading, now: number): SelfHealEvent | null {
  if (sensor.status === 'normal') return null;

  let anomalyType: AnomalyType;
  let threshold: number;

  if (sensor.name === 'Temperature' || sensor.name.toLowerCase().includes('temp')) {
    anomalyType = 'thermal-spike';
    threshold = sensor.status === 'critical' ? ANOMALY_THRESHOLDS.temperature.crit : ANOMALY_THRESHOLDS.temperature.warn;
  } else if (sensor.name === 'Vibration' || sensor.name.toLowerCase().includes('vib')) {
    anomalyType = 'vibration-critical';
    threshold = sensor.status === 'critical' ? ANOMALY_THRESHOLDS.vibration.crit : ANOMALY_THRESHOLDS.vibration.warn;
  } else if (sensor.name === 'Pressure' || sensor.name.toLowerCase().includes('psi')) {
    anomalyType = 'pressure-loss';
    threshold = sensor.status === 'critical' ? ANOMALY_THRESHOLDS.pressure.crit : ANOMALY_THRESHOLDS.pressure.warn;
  } else if (sensor.name === 'Power Draw' || sensor.name.toLowerCase().includes('pwr')) {
    anomalyType = 'power-surge';
    threshold = sensor.status === 'critical' ? ANOMALY_THRESHOLDS.power.crit : ANOMALY_THRESHOLDS.power.warn;
  } else {
    return null;
  }

  const actions = HEAL_ACTIONS[anomalyType];
  const heal = actions[Math.floor(Math.random() * actions.length)];
  const severity = sensor.status === 'critical' ? 'critical' : 'warning';

  return {
    id: `heal-${now}-${sensor.id}`,
    timestamp: now,
    anomalyType,
    severity,
    stationId: station.id,
    stationName: station.name,
    sensorId: sensor.id,
    sensorValue: Math.round(sensor.value * 10) / 10,
    sensorUnit: sensor.unit,
    threshold,
    action: heal.action,
    description: `${sensor.name} anomaly at ${station.name}: ${sensor.value.toFixed(1)}${sensor.unit} (threshold: ${threshold}${sensor.unit})`,
    resolution: heal.resolution,
    durationMs: Math.floor(Math.random() * 2000) + 200,
    success: Math.random() > 0.05,
  };
}
