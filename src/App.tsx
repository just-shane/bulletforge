import { useEffect, useMemo } from "react";
import { useBallisticsStore } from "./store/store.ts";
import { trajectory, kineticEnergy } from "./lib/ballistics.ts";
import type { TrajectoryConfig } from "./lib/ballistics.ts";
import { buildConfig, simulateInternal, CARTRIDGE_INTERNAL_DATA } from "./lib/internal-ballistics.ts";
import { Header } from "./components/Layout/Header.tsx";
import { StatsBar } from "./components/StatsBar/StatsBar.tsx";
import { ControlPanel } from "./components/ControlPanel/ControlPanel.tsx";
import { TrajectoryChart } from "./components/Trajectory/TrajectoryChart.tsx";
import { TrajectoryTable } from "./components/Trajectory/TrajectoryTable.tsx";
import { InternalBallisticsPanel } from "./components/InternalBallistics/InternalBallisticsPanel.tsx";
import { InternalBallisticsStats } from "./components/InternalBallistics/InternalBallisticsStats.tsx";
import { PressureCurveChart } from "./components/InternalBallistics/PressureCurveChart.tsx";
import { BarrelLengthChart } from "./components/InternalBallistics/BarrelLengthChart.tsx";
import { BurnRateComparisonChart } from "./components/InternalBallistics/BurnRateComparisonChart.tsx";
import { TempComparisonPanel } from "./components/InternalBallistics/TempComparisonPanel.tsx";
import { SafeLoadIndicator } from "./components/InternalBallistics/SafeLoadIndicator.tsx";
import { LoadDevelopmentTab } from "./components/LoadDevelopment/LoadDevelopmentTab.tsx";

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

  // Internal ballistics state
  const activeTab = useBallisticsStore((s) => s.activeTab);
  const setActiveTab = useBallisticsStore((s) => s.setActiveTab);
  const powderName = useBallisticsStore((s) => s.powderName);
  const chargeWeight = useBallisticsStore((s) => s.chargeWeight);
  const barrelLength = useBallisticsStore((s) => s.barrelLength);
  const internalResult = useBallisticsStore((s) => s.internalResult);
  const setPowderName = useBallisticsStore((s) => s.setPowderName);
  const setChargeWeight = useBallisticsStore((s) => s.setChargeWeight);
  const setBarrelLength = useBallisticsStore((s) => s.setBarrelLength);
  const setInternalResult = useBallisticsStore((s) => s.setInternalResult);

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

  // Build internal ballistics config (memoized for use in render + simulation)
  const ibConfig = useMemo(
    () => buildConfig(cartridge.shortName, powderName, chargeWeight, bullet.weight, bullet.diameter, barrelLength),
    [cartridge.shortName, powderName, chargeWeight, bullet.weight, bullet.diameter, barrelLength],
  );

  // Compute internal ballistics when parameters change
  useEffect(() => {
    if (activeTab !== "internal") return;

    if (ibConfig) {
      const result = simulateInternal(ibConfig);
      setInternalResult(result);
    } else {
      setInternalResult(null);
    }
  }, [activeTab, ibConfig, setInternalResult]);

  // Charge range for safe load indicator
  const chargeRange = CARTRIDGE_INTERNAL_DATA[cartridge.shortName]?.typicalChargeRange;

  const muzzleEnergy = kineticEnergy(bullet.weight, muzzleVelocity);

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      {/* Tab Bar */}
      <div
        className="flex px-5 gap-0"
        style={{ borderBottom: "1px solid #2a2a2a", background: "#0a0a0a" }}
      >
        <button
          onClick={() => setActiveTab("external")}
          className="px-4 py-2.5 text-[11px] font-mono tracking-wide cursor-pointer transition-colors"
          style={{
            color: activeTab === "external" ? "#ef4444" : "#737373",
            borderBottom: activeTab === "external" ? "2px solid #ef4444" : "2px solid transparent",
            background: "transparent",
          }}
        >
          External Ballistics
        </button>
        <button
          onClick={() => setActiveTab("internal")}
          className="px-4 py-2.5 text-[11px] font-mono tracking-wide cursor-pointer transition-colors"
          style={{
            color: activeTab === "internal" ? "#ef4444" : "#737373",
            borderBottom: activeTab === "internal" ? "2px solid #ef4444" : "2px solid transparent",
            background: "transparent",
          }}
        >
          Internal Ballistics
        </button>
        <button
          onClick={() => setActiveTab("loaddev")}
          className="px-4 py-2.5 text-[11px] font-mono tracking-wide cursor-pointer transition-colors"
          style={{
            color: activeTab === "loaddev" ? "#ef4444" : "#737373",
            borderBottom: activeTab === "loaddev" ? "2px solid #ef4444" : "2px solid transparent",
            background: "transparent",
          }}
        >
          Load Development
        </button>
      </div>

      <main className="flex max-md:flex-col">
        {/* Left Panel: Controls */}
        <div
          className="w-72 min-w-72 shrink-0 overflow-y-auto max-h-[calc(100vh-105px)] max-md:w-full max-md:min-w-0"
          style={{ borderRight: "1px solid #2a2a2a" }}
        >
          <div className="p-5">
            <ControlPanel />

            {(activeTab === "internal" || activeTab === "loaddev") && (
              <InternalBallisticsPanel
                cartridgeShortName={cartridge.shortName}
                powderName={powderName}
                chargeWeight={chargeWeight}
                barrelLength={barrelLength}
                onPowderChange={setPowderName}
                onChargeWeightChange={setChargeWeight}
                onBarrelLengthChange={setBarrelLength}
              />
            )}
          </div>
        </div>

        {/* Right Panel: Visualizations */}
        <div className="flex-1 p-5 min-w-0 overflow-y-auto max-h-[calc(100vh-105px)]">
          {activeTab === "loaddev" ? (
              <LoadDevelopmentTab />
          ) : activeTab === "external" ? (
            <>
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
            </>
          ) : (
            <>
              {internalResult ? (
                <>
                  <InternalBallisticsStats
                    result={internalResult}
                    saamiMaxPressure={cartridge.maxPressure}
                  />

                  <div className="mb-4">
                    <PressureCurveChart
                      pressureCurve={internalResult.pressureCurve}
                      saamiMaxPressure={cartridge.maxPressure}
                      peakPressure={internalResult.peakPressure}
                      peakPressurePosition={internalResult.peakPressurePosition}
                      barrelLength={barrelLength}
                      burnCompletePosition={internalResult.burnCompletePosition}
                    />
                  </div>

                  {/* Safe load indicator */}
                  {chargeRange && (
                    <div className="mb-4">
                      <SafeLoadIndicator
                        chargeWeight={chargeWeight}
                        minCharge={chargeRange.min}
                        maxCharge={chargeRange.max}
                        saamiPercent={(internalResult.peakPressure / cartridge.maxPressure) * 100}
                      />
                    </div>
                  )}

                  {/* Barrel length optimization */}
                  {ibConfig && (
                    <div className="mb-4">
                      <BarrelLengthChart config={ibConfig} />
                    </div>
                  )}

                  {/* Burn rate comparison */}
                  <div className="mb-4">
                    <BurnRateComparisonChart
                      cartridgeShortName={cartridge.shortName}
                      currentPowder={powderName}
                      chargeWeight={chargeWeight}
                      bulletWeight={bullet.weight}
                      bulletDiameter={bullet.diameter}
                      barrelLength={barrelLength}
                    />
                  </div>

                  {/* Temperature comparison */}
                  {ibConfig && (
                    <div className="mb-4">
                      <TempComparisonPanel
                        config={ibConfig}
                        powderName={powderName}
                        saamiMaxPressure={cartridge.maxPressure}
                      />
                    </div>
                  )}

                  {/* Load summary */}
                  <div
                    className="rounded-md p-4 text-[10px] font-mono text-neutral-500"
                    style={{ background: "#141414", border: "1px solid #2a2a2a" }}
                  >
                    <span style={{ color: "#ef4444" }}>{cartridge.name}</span>
                    {" "}&middot;{" "}
                    {bullet.manufacturer} {bullet.name} ({bullet.weight}gr)
                    {" "}&middot;{" "}
                    {chargeWeight}gr {powderName}
                    {" "}&middot;{" "}
                    {barrelLength}" barrel
                    {" "}&middot;{" "}
                    Predicted MV: {internalResult.muzzleVelocity.toFixed(0)} fps
                  </div>

                  {/* Safety disclaimer */}
                  <div
                    className="rounded-md p-3 mt-3 text-[9px] font-mono"
                    style={{
                      background: "rgba(245, 158, 11, 0.05)",
                      border: "1px solid #2a2a2a",
                      color: "#737373",
                    }}
                  >
                    This simulator is for educational and comparative purposes only.
                    Never use simulation data as the sole basis for determining safe loads.
                    Always consult published load data from reputable sources and work up
                    from minimum starting charges with proper safety equipment.
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-neutral-600 font-mono text-sm">
                  Select a cartridge and powder to simulate internal ballistics
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
