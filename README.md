# HOVERDRIFT: COSMIC EXPANSE
### Photorealistic 360° Open-World Space Combat Simulator

[![WebGL 2.0](https://img.shields.io/badge/WebGL-2.0-3ef0ff.svg)](https://threejs.org/)
[![60+ FPS](https://img.shields.io/badge/Performance-60--120_FPS-5cff9d.svg)]()
[![Multi-Ship Hangar](https://img.shields.io/badge/Hangar-3_Custom_Starfighters-ff7700.svg)]()
[![Epic Boss Battles](https://img.shields.io/badge/Bosses-Capital_Dreadnoughts-bf00ff.svg)]()

---

## 🚀 Live Global Deployment

👉 **[https://farhana-farid.github.io/hoverdrift-cosmic/](https://farhana-farid.github.io/hoverdrift-cosmic/)**

---

## 🌌 Overview & Major Upgrades

### 1. 🪐 Photorealistic Space Environment
* **Volumetric Glowing Nebulae**: Layered cosmic nebula clusters in vibrant deep violet, sapphire blue, and luminous magenta dust with realistic light absorption.
* **Cinematic Planetary Body**: Massive gas giant on the celestial horizon with layered atmospheric rim scattering and planetary rings.
* **Photorealistic Starfield & Sun Glare**: 4,200+ stars with blackbody stellar temperatures, chromatic solar corona, and anamorphic lens flare.
* **PBR Asteroid Fields**: Procedural tumbling space rocks with craters, metallic mineral veins, and destructible geometry.

### 2. 🛸 Sci-Fi Hangar & 3 Flyable Starfighters
Before launching into combat, players enter the interactive Hangar Bay featuring a 3D turntable model viewer and tactical diagnostics:
* **Ship 1: Aether Vanguard**
  - *Type*: High-Agility Interceptor
  - *Aesthetic*: Sleek aerodynamic spaceframe, cranked forward delta wings, canted dorsal stabilizers, canopy cockpit, and cyan plasma trails.
  - *Playstyle*: Blistering speed ($136\text{ m/s}$ boost), extreme roll banking, and rapid-fire blue plasma bolters.
* **Ship 2: Void Dreadnought**
  - *Type*: Heavy Twin-Hull Cruiser
  - *Aesthetic*: Dark metallic matte stealth armor, broad catamaran hulls, and recessed glowing orange energy channels.
  - *Playstyle*: Imposing armored tank ($160\text{ Hull}, 140\text{ Shield}$) armed with heavy dual plasma rail-cannons.
* **Ship 3: Crimson Interceptor**
  - *Type*: Tactical Strike Fighter
  - *Aesthetic*: Brushed titanium silver chassis, racing crimson aero-foils, and twin circular VTOL turbine rings.
  - *Playstyle*: Balanced combatant with high-precision triple pulse lasers.

### 3. 👾 Dynamic Combat Loop, Epic Bosses & Power-Ups
* **Dynamic Wave Escalation**: Scout drone swarms, Assault cruisers, and fast Interceptors.
* **Capital Ship Boss Encounters**:
  - Every 3rd Sector triggers a massive Boss Battle (e.g. *The Leviathan Dreadnought* and *Void Omega Crucible*).
  - Dedicated Boss Health & Shield Bar at the top of the HUD.
  - Multi-stage attack patterns: quad broadside plasma volleys, homing seeker missiles, and defensive shield envelopes.
* **Holographic Power-Up Drops**:
  - 🛡️ **Shield Overcharge**: Instantly restores shields to 100% and grants a temporary invulnerability forcefield.
  - ⚡ **Laser Weapon Upgrade**: Upgrades weapons to multi-spread and quad hyper-beams with enhanced damage.
  - 🔋 **Overdrive Core**: Refills boost capacitor and unlocks sustained afterburner acceleration.
  - 💎 **Cosmic Mineral Crystals**: Multiplies score and triggers combo kill streaks.

### 4. 🎛️ Live Cockpit Tactical HUD & 360° Radar
* **Real-time Target Tracking**: Holographic lock-on brackets showing target name, distance in meters, and micro health bar.
* **Off-Screen Threat Chevrons**: Directional arrows pointing around screen edges toward off-screen hostiles and capital ships.
* **360° Radar Scanner**: Bottom-left circular radar displaying player heading, enemy blips, drifting asteroids, and power-up capsules.
* **Vitals Gauges**: Dynamic segmented bars for Shields, Hull, Afterburner Energy, and Laser Heat.

---

## 🎮 Flight Controls

| Action | Keyboard / Mouse | Gamepad | Mobile Touch |
| :--- | :--- | :--- | :--- |
| **Thrust Forward** | <kbd>W</kbd> or <kbd>↑</kbd> | Left Stick Up | Virtual Stick Up |
| **Reverse / Airbrake** | <kbd>S</kbd> or <kbd>↓</kbd> | Left Stick Down | Virtual Stick Down |
| **Steer Heading** | **Mouse Cursor** / <kbd>A</kbd> <kbd>D</kbd> | Right Stick / Left Stick | Drag / Stick X |
| **Fire Lasers** | <kbd>Space</kbd> or <kbd>Left Click</kbd> | <kbd>RT</kbd> / <kbd>R2</kbd> or <kbd>A</kbd> | **FIRE** Button |
| **Afterburner Overdrive** | <kbd>Shift</kbd> or <kbd>Right Click</kbd> | <kbd>LT</kbd> / <kbd>L2</kbd> or <kbd>B</kbd> | **BOOST** Button |

---

## 🛠️ Instant Testing & Local Server

```bash
# Run local zero-dependency development server
npm start
# or
node serve.js
```
Then visit: [http://localhost:3000](http://localhost:3000)
