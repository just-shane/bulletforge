import { useBallisticsStore } from "../../store/store.ts";
import { CARTRIDGES, cartridgesByType } from "../../lib/cartridges.ts";
import { Slider } from "./Slider.tsx";

const ZERO_RANGES = [25, 50, 100, 150, 200, 250, 300, 400, 500];
const grouped = cartridgesByType();

export function ControlPanel() {
  const cartridge = useBallisticsStore((s) => s.cartridge);
  const bullet = useBallisticsStore((s) => s.bullet);
  const availableBullets = useBallisticsStore((s) => s.availableBullets);
  const muzzleVelocity = useBallisticsStore((s) => s.muzzleVelocity);
  const sightHeight = useBallisticsStore((s) => s.sightHeight);
  const zeroRange = useBallisticsStore((s) => s.zeroRange);
  const windSpeed = useBallisticsStore((s) => s.windSpeed);
  const windAngle = useBallisticsStore((s) => s.windAngle);
  const altitude = useBallisticsStore((s) => s.altitude);
  const temperature = useBallisticsStore((s) => s.temperature);
  const barometricPressure = useBallisticsStore((s) => s.barometricPressure);

  const setCartridge = useBallisticsStore((s) => s.setCartridge);
  const setBullet = useBallisticsStore((s) => s.setBullet);
  const setVelocity = useBallisticsStore((s) => s.setVelocity);
  const setSightHeight = useBallisticsStore((s) => s.setSightHeight);
  const setZero = useBallisticsStore((s) => s.setZero);
  const setWindSpeed = useBallisticsStore((s) => s.setWindSpeed);
  const setWindAngle = useBallisticsStore((s) => s.setWindAngle);
  const setAltitude = useBallisticsStore((s) => s.setAltitude);
  const setTemperature = useBallisticsStore((s) => s.setTemperature);
  const setBarometricPressure = useBallisticsStore((s) => s.setBarometricPressure);

  return (
    <>
      {/* Cartridge Selection */}
      <div className="text-[10px] tracking-[2px] font-mono uppercase mb-3" style={{ color: "#ef4444" }}>
        Cartridge
      </div>
      <div className="mb-4">
        <select
          value={cartridge.shortName}
          onChange={(e) => {
            const c = CARTRIDGES.find((c) => c.shortName === e.target.value);
            if (c) setCartridge(c);
          }}
          className="w-full rounded-md px-2 py-1.5 text-[11px] font-mono cursor-pointer"
          style={{
            background: "#141414",
            border: "1px solid #2a2a2a",
            color: "#e5e5e5",
          }}
        >
          {grouped.rifle.length > 0 && (
            <optgroup label="Rifle">
              {grouped.rifle.map((c) => (
                <option key={c.shortName} value={c.shortName}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
          {grouped.rimfire.length > 0 && (
            <optgroup label="Rimfire">
              {grouped.rimfire.map((c) => (
                <option key={c.shortName} value={c.shortName}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
          {grouped.pistol.length > 0 && (
            <optgroup label="Pistol">
              {grouped.pistol.map((c) => (
                <option key={c.shortName} value={c.shortName}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <div className="text-[9px] font-mono mt-1 px-1 text-neutral-500">
          {cartridge.description}
        </div>
      </div>

      {/* Bullet Selection */}
      <div className="text-[10px] tracking-[2px] font-mono uppercase mb-3" style={{ color: "#ef4444" }}>
        Bullet
      </div>
      <div className="mb-4">
        <select
          value={`${bullet.manufacturer}-${bullet.name}`}
          onChange={(e) => {
            const b = availableBullets.find(
              (b) => `${b.manufacturer}-${b.name}` === e.target.value
            );
            if (b) setBullet(b);
          }}
          className="w-full rounded-md px-2 py-1.5 text-[11px] font-mono cursor-pointer"
          style={{
            background: "#141414",
            border: "1px solid #2a2a2a",
            color: "#e5e5e5",
          }}
        >
          {availableBullets.map((b) => (
            <option key={`${b.manufacturer}-${b.name}`} value={`${b.manufacturer}-${b.name}`}>
              {b.manufacturer} {b.name}
            </option>
          ))}
        </select>
        <div className="text-[9px] font-mono mt-1 px-1 text-neutral-500">
          BC G7: {bullet.bc_g7} &middot; BC G1: {bullet.bc_g1} &middot; SD: {bullet.sectionalDensity.toFixed(3)}
        </div>
      </div>

      {/* Muzzle Velocity */}
      <div className="text-[10px] tracking-[2px] font-mono uppercase mb-3 mt-2" style={{ color: "#ef4444" }}>
        Ballistic Parameters
      </div>

      <Slider
        label="Muzzle Velocity"
        value={muzzleVelocity}
        min={800}
        max={4500}
        step={10}
        unit=" fps"
        onChange={setVelocity}
      />

      <Slider
        label="Sight Height"
        value={sightHeight}
        min={1.0}
        max={3.0}
        step={0.1}
        unit={'"'}
        onChange={setSightHeight}
      />

      {/* Zero Range */}
      <div className="mb-3">
        <div className="text-[11px] mb-1 text-neutral-400">
          Zero Range
        </div>
        <div className="flex gap-1 flex-wrap">
          {ZERO_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setZero(r)}
              className="px-2 py-1 rounded text-[9px] font-mono cursor-pointer transition-all"
              style={{
                background: zeroRange === r ? "rgba(239,68,68,0.15)" : "#141414",
                border: `1px solid ${zeroRange === r ? "#ef4444" : "#2a2a2a"}`,
                color: zeroRange === r ? "#ef4444" : "#737373",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Wind */}
      <div className="text-[10px] tracking-[2px] font-mono uppercase mb-3 mt-4 pt-4" style={{ color: "#ef4444", borderTop: "1px solid #2a2a2a" }}>
        Wind
      </div>

      <Slider
        label="Wind Speed"
        value={windSpeed}
        min={0}
        max={30}
        step={1}
        unit=" mph"
        onChange={setWindSpeed}
      />

      <Slider
        label="Wind Angle"
        value={windAngle}
        min={0}
        max={360}
        step={5}
        unit="°"
        onChange={setWindAngle}
      />

      <div className="text-[9px] font-mono mb-3 px-1 text-neutral-500">
        {windAngle === 0 || windAngle === 360 ? "Headwind" :
         windAngle === 90 ? "Full cross (R)" :
         windAngle === 180 ? "Tailwind" :
         windAngle === 270 ? "Full cross (L)" :
         `${windAngle}° from right`}
      </div>

      {/* Environment */}
      <div className="text-[10px] tracking-[2px] font-mono uppercase mb-3 mt-4 pt-4" style={{ color: "#ef4444", borderTop: "1px solid #2a2a2a" }}>
        Environment
      </div>

      <Slider
        label="Altitude"
        value={altitude}
        min={0}
        max={12000}
        step={100}
        unit=" ft"
        onChange={setAltitude}
      />

      <Slider
        label="Temperature"
        value={temperature}
        min={-20}
        max={120}
        step={1}
        unit="°F"
        onChange={setTemperature}
      />

      <Slider
        label="Barometric Pressure"
        value={barometricPressure}
        min={25.0}
        max={31.5}
        step={0.01}
        unit=" inHg"
        onChange={setBarometricPressure}
      />
    </>
  );
}
