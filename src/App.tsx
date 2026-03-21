import { useEffect, useMemo } from "react";
import { useBallisticsStore } from "./store/store.ts";
import { trajectory, kineticEnergy } from "./lib/ballistics.ts";
import type { TrajectoryConfig } from "./lib/ballistics.ts";
import { Header } from "./components/Layout/Header.tsx";
import { StatsBar } from "./components/StatsBar/StatsBar.tsx";
import { ControlPanel } from "./components/ControlPanel/ControlPanel.tsx";
import { TrajectoryChart } from "./components/Trajectory/TrajectoryChart.tsx";
import { TrajectoryTable } from "./components/Trajectory/TrajectoryTable.tsx";

export default function App() {
  const cartridge = useBallisticsStore((s) => s.cartridge);
  const bullet = useBallisticsStore((s) => s.bullet);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const sightHeight = useBallisticsStore((s) => s.sightHeight);
  const zeroRange = useBallisticsStore((s) => s.zeroRange);
  const windSpeed = useBallisticsStore((s) => s.windSpeed);
  const windAngle = useBallisticsStore((s) => s.windAngle);
  const shootingAngle = useBallisticsStore((s) => s.shootingAngle);
  const altitude = useBallisticsStore((s) => s.altitude);
  const temperature = useBallisticsStore((s) => s.temperature);
  const barometricPressure = useBallisticsStore((s) => s.barometricPressure);
  const humidity = useBallisticsStore((s) => s.humidity);
  const trajectoryResults = useBallisticsStore((s) => s.trajectoryResults);
  const maxOrdinate = useBallisticsStore((s) => s.maxOrdinate);
  const transonicRange = useBallisticsStore((s) => s.transonicRange);
  const setTrajectoryResults = useBallisticsStore((s) => s.setTrajectoryResults);

  // Build trajectory config from store state
  const config: TrajectoryConfig = useMemo(
    () => ({
      muzzleVelocity,
      bulletWeight: bullet.weight,
      bulletDiameter: bullet.diameter,
      bc: bullet.bc_g7 > 0 ? bullet.bc_g7 : bullet.bc_g1,
      dragModel: bullet.bc_g7 > 0 ? "G7" as const : "G1" as const,
      sightHeight,
      zeroRange,
      windSpeed,
      windAngle,
      shootingAngle,
      altitude,
      temperature,
      barometricPressure,
      humidity,
      twistRate: 8,
      twistDirection: "right" as const,
      maxRange: 1200,
      stepSize: 25,
    }),
    [
      muzzleVelocity, bullet, sightHeight, zeroRange,
      windSpeed, windAngle, shootingAngle,
      altitude, temperature, barometricPressure, humidity,
    ]
  );

  // Compute trajectory when config changes
  useEffect(() => {
    const result = trajectory(config);
    setTrajectoryResults(
      result.points,
      result.maxOrdinate,
      result.transonicRange,
      result.subsonicRange
    );
  }, [config, setTrajectoryResults]);

  const muzzleEnergy = kineticEnergy(bullet.weight, muzzleVelocity);

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      <main className="flex max-md:flex-col">
        {/* Left Panel: Controls */}
        <div
          className="w-72 min-w-72 shrink-0 overflow-y-auto max-h-[calc(100vh-65px)] max-md:w-full max-md:min-w-0"
          style={{ borderRight: "1px solid #2a2a2a" }}
        >
          <div className="p-5">
            <ControlPanel />
          </div>
        </div>

        {/* Right Panel: Visualizations */}
        <div className="flex-1 p-5 min-w-0 overflow-y-auto max-h-[calc(100vh-65px)]">
          <StatsBar
            muzzleVelocity={muzzleVelocity}
            muzzleEnergy={muzzleEnergy}
            zeroRange={zeroRange}
            maxOrdinate={maxOrdinate}
            transonicRange={transonicRange}
          />

          <div className="mb-4">
            <TrajectoryChart points={trajectoryResults} zeroRange={zeroRange} />
          </div>

          <div className="mb-4">
            <TrajectoryTable points={trajectoryResults} zeroRange={zeroRange} />
          </div>

          {/* Cartridge info */}
          <div
            className="rounded-md p-4 text-[10px] font-mono text-neutral-500"
            style={{ background: "#141414", border: "1px solid #2a2a2a" }}
          >
            <span style={{ color: "#ef4444" }}>{cartridge.name}</span>
            {" "}&middot;{" "}
            {bullet.manufacturer} {bullet.name}
            {" "}&middot;{" "}
            {bullet.weight}gr @ {muzzleVelocity} fps
            {" "}&middot;{" "}
            BC (G7): {bullet.bc_g7} / BC (G1): {bullet.bc_g1}
            {" "}&middot;{" "}
            SAAMI MAP: {cartridge.maxPressure.toLocaleString()} psi
          </div>
        </div>
      </main>
    </div>
  );
}
