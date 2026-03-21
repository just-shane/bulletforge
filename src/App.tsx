import { useEffect, useMemo } from "react";
import { useBallisticsStore } from "./store/store.ts";
import { trajectory, kineticEnergy, densityAltitude } from "./lib/ballistics.ts";
import type { TrajectoryConfig } from "./lib/ballistics.ts";
import { buildConfig, simulateInternal, CARTRIDGE_INTERNAL_DATA } from "./lib/internal-ballistics.ts";
import { ThemeProvider } from "./components/Layout/ThemeProvider.tsx";
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
import { ComparisonChart } from "./components/Trajectory/ComparisonChart.tsx";
import { ComparisonTable } from "./components/Trajectory/ComparisonTable.tsx";
import { DOPECard } from "./components/Trajectory/DOPECard.tsx";
import { StabilityPanel } from "./components/Trajectory/StabilityPanel.tsx";
import { BCTruingCalculator } from "./components/Trajectory/BCTruingCalculator.tsx";
import { MultiZeroDOPE } from "./components/Trajectory/MultiZeroDOPE.tsx";
import { ArmBandDOPE } from "./components/Trajectory/ArmBandDOPE.tsx";
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

  // Comparison mode
  const comparisonEnabled = useBallisticsStore((s) => s.comparisonEnabled);
  const comparisonResults = useBallisticsStore((s) => s.comparisonResults);
  const comparisonLabel = useBallisticsStore((s) => s.comparisonLabel);
  const snapshotForComparison = useBallisticsStore((s) => s.snapshotForComparison);
  const clearComparison = useBallisticsStore((s) => s.clearComparison);

  // Advanced ballistics
  const latitude = useBallisticsStore((s) => s.latitude);
  const azimuth = useBallisticsStore((s) => s.azimuth);
  const setLatitude = useBallisticsStore((s) => s.setLatitude);
  const setAzimuth = useBallisticsStore((s) => s.setAzimuth);

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
      latitude,
      azimuth,
      maxRange: 1200,
      stepSize: 25,
    }),
    [
      muzzleVelocity, bullet, sightHeight, zeroRange,
      windSpeed, windAngle, shootingAngle,
      altitude, temperature, barometricPressure, humidity,
      latitude, azimuth,
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
  const da = useMemo(
    () => densityAltitude(altitude, temperature, barometricPressure, humidity),
    [altitude, temperature, barometricPressure, humidity],
  );
  const currentLabel = `${cartridge.shortName} ${bullet.name} @ ${muzzleVelocity} fps`;

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "external", label: "External Ballistics" },
    { key: "internal", label: "Internal Ballistics" },
    { key: "loaddev", label: "Load Development" },
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ background: "var(--c-bg)" }}>
        <Header />

        {/* Tab Bar */}
        <div
          className="flex px-5 gap-0"
          style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-bg)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-[11px] font-mono tracking-wide cursor-pointer transition-colors"
              style={{
                color: activeTab === tab.key ? "var(--c-accent)" : "var(--c-text-dim)",
                borderBottom: activeTab === tab.key ? "2px solid var(--c-accent)" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <main className="flex max-md:flex-col">
          {/* Left Panel: Controls */}
          <div
            className="w-72 min-w-72 shrink-0 overflow-y-auto max-h-[calc(100vh-105px)] max-md:w-full max-md:min-w-0"
            style={{ borderRight: "1px solid var(--c-border)" }}
          >
            <div className="p-5">
              <ControlPanel />

              {activeTab === "external" && (
                <>
                  {/* Density Altitude */}
                  <div
                    className="mt-4 pt-4"
                    style={{ borderTop: "1px solid var(--c-border)" }}
                  >
                    <div
                      className="text-[10px] tracking-[2px] font-mono uppercase mb-3"
                      style={{ color: "var(--c-accent)" }}
                    >
                      Advanced
                    </div>
                    <div
                      className="rounded-md px-3 py-2 mb-3 text-[10px] font-mono"
                      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
                    >
                      <span style={{ color: "var(--c-text-dim)" }}>Density Alt: </span>
                      <span style={{ color: "var(--c-text)" }}>{da.toLocaleString()} ft</span>
                    </div>

                    {/* Latitude */}
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] font-mono mb-0.5">
                        <span style={{ color: "var(--c-text-muted)" }}>Latitude</span>
                        <span style={{ color: "var(--c-accent)" }}>{latitude}°</span>
                      </div>
                      <input
                        type="range"
                        min={-90}
                        max={90}
                        value={latitude}
                        onChange={(e) => setLatitude(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Azimuth */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] font-mono mb-0.5">
                        <span style={{ color: "var(--c-text-muted)" }}>Azimuth (fire direction)</span>
                        <span style={{ color: "var(--c-accent)" }}>{azimuth}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={359}
                        value={azimuth}
                        onChange={(e) => setAzimuth(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Comparison button */}
                    <button
                      onClick={comparisonEnabled ? clearComparison : snapshotForComparison}
                      className="w-full rounded-md px-3 py-2 text-[10px] font-mono tracking-wide cursor-pointer transition-colors"
                      style={{
                        background: comparisonEnabled ? "var(--c-accent-dim)" : "var(--c-panel)",
                        border: `1px solid ${comparisonEnabled ? "var(--c-accent)" : "var(--c-border)"}`,
                        color: comparisonEnabled ? "var(--c-accent)" : "var(--c-text-muted)",
                      }}
                    >
                      {comparisonEnabled ? "✕ Clear Comparison" : "⇄ Snapshot for Comparison"}
                    </button>
                    {comparisonEnabled && (
                      <div className="text-[9px] font-mono mt-1 px-1" style={{ color: "var(--c-text-faint)" }}>
                        Comparing: {comparisonLabel}
                      </div>
                    )}
                  </div>
                </>
              )}

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

                {/* Comparison mode */}
                {comparisonEnabled && comparisonResults.length > 0 && (
                  <>
                    <div className="mb-4">
                      <ComparisonChart
                        pointsA={comparisonResults}
                        pointsB={trajectoryResults}
                        labelA={comparisonLabel}
                        labelB={currentLabel}
                        zeroRange={zeroRange}
                      />
                    </div>
                    <div className="mb-4">
                      <ComparisonTable
                        pointsA={comparisonResults}
                        pointsB={trajectoryResults}
                        labelA={comparisonLabel}
                        labelB={currentLabel}
                      />
                    </div>
                  </>
                )}

                {/* Cartridge info */}
                <div
                  className="rounded-md p-4 text-[10px] font-mono"
                  style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)", color: "var(--c-text-dim)" }}
                >
                  <span style={{ color: "var(--c-accent)" }}>{cartridge.name}</span>
                  {" "}&middot;{" "}
                  {bullet.manufacturer} {bullet.name}
                  {" "}&middot;{" "}
                  {bullet.weight}gr @ {muzzleVelocity} fps
                  {" "}&middot;{" "}
                  BC (G7): {bullet.bc_g7} / BC (G1): {bullet.bc_g1}
                  {" "}&middot;{" "}
                  SAAMI MAP: {cartridge.maxPressure.toLocaleString()} psi
                  {" "}&middot;{" "}
                  DA: {da.toLocaleString()} ft
                </div>

                {/* Stability Panel */}
                <div className="mt-4 mb-4">
                  <StabilityPanel
                    bulletWeight={bullet.weight}
                    bulletDiameter={bullet.diameter}
                    twistRate={8}
                    altitude={altitude}
                    temperature={temperature}
                    pressure={barometricPressure}
                  />
                </div>

                {/* DOPE Card */}
                <div className="mb-4">
                  <DOPECard
                    points={trajectoryResults}
                    cartridgeName={cartridge.name}
                    bulletName={`${bullet.manufacturer} ${bullet.name}`}
                    muzzleVelocity={muzzleVelocity}
                    zeroRange={zeroRange}
                    windSpeed={windSpeed}
                    windAngle={windAngle}
                    altitude={altitude}
                    temperature={temperature}
                  />
                </div>

                {/* Multi-Zero DOPE Cards */}
                <div className="mb-4">
                  <MultiZeroDOPE />
                </div>

                {/* Arm Band DOPE */}
                <div className="mb-4">
                  <ArmBandDOPE />
                </div>

                {/* BC Truing Calculator */}
                <div className="mb-4">
                  <BCTruingCalculator />
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
                      className="rounded-md p-4 text-[10px] font-mono"
                      style={{ background: "var(--c-panel)", border: "1px solid var(--c-border)", color: "var(--c-text-dim)" }}
                    >
                      <span style={{ color: "var(--c-accent)" }}>{cartridge.name}</span>
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
                        background: "var(--c-accent-glow)",
                        border: "1px solid var(--c-border)",
                        color: "var(--c-text-dim)",
                      }}
                    >
                      This simulator is for educational and comparative purposes only.
                      Never use simulation data as the sole basis for determining safe loads.
                      Always consult published load data from reputable sources and work up
                      from minimum starting charges with proper safety equipment.
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 font-mono text-sm" style={{ color: "var(--c-text-faint)" }}>
                    Select a cartridge and powder to simulate internal ballistics
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
