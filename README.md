# HOVERDRIFT: COSMIC EXPANSE
### 360° Open-World Cosmic Starfighter Combat Simulation

[![WebGL 2.0](https://img.shields.io/badge/WebGL-2.0-3ef0ff.svg)](https://threejs.org/)
[![60+ FPS](https://img.shields.io/badge/Performance-60--120_FPS-5cff9d.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/Audio-Procedural_WebAudio-ffc247.svg)]()
[![Responsive Controls](https://img.shields.io/badge/Controls-Mouse_%2B_WASD_%2B_Touch-ff7700.svg)]()

---

## 🚀 Overview & Upgrades Summary

Based on the original deployment at [`coal-sun-clqai.ship.place`](https://coal-sun-clqai.ship.place/), the game's architecture has been completely rewritten, upgraded, and optimized to deliver an unconstrained, high-octane 3D space combat experience:

### 1. 🌌 Boundless Cosmic Battlefield (No Rigid Boundaries)
* **Removed Confining Walls**: Completely eliminated the previous cylindrical bounding barrier ($R=56$) and box walls. The player can fly in any direction across an infinite 360° cosmic expanse.
* **Multi-Layer Cosmic Skybox & Starfields**:
  - Over 3,000 distant stars with realistic stellar color temperatures (sapphire blue, solar gold, red giants).
  - 8 volumetric procedural nebulae rendered with additive blending in deep violet, cyan, and magenta dust.
  - Distant cosmic binary star casting dynamic directional sunlight and specular highlights.
* **Boundless Procedural Asteroid Field**:
  - Dynamically streams tumbling asteroids around the player within a 450m cosmic radius.
  - Procedural jagged 3D geometries with craters and mineral veins.
  - **Destructibility**: Lasers damage and shatter asteroids into tumbling rocky fragments and release glowing **Mineral, Shield, and Energy Crystals** that can be harvested!

### 2. 🕹️ Smooth, Intuitive & Simplified Controls
* **Eliminated Jerky Movement & Snap Locks**:
  - Steering is decoupled from rigid velocity locks. Heading uses shortest-path angular damping (`Math.atan2(sin(Δθ), cos(Δθ))`) ensuring zero 180° gimbal locks, freezing, or snapping.
* **Aerodynamic Roll Banking**:
  - Turning naturally rolls the starfighter into the bank angle with smooth spring recovery when flying straight.
* **Mouse Flight Steering**:
  - The crosshair glides through 3D space and the starfighter's prow aligns smoothly with the cursor.
* **Afterburner Overdrive**:
  - Pressing `Shift` or `Right-Click` triggers an instant surge up to $110\text{ m/s}$ with roaring engine flare, dynamic camera FOV expansion ($60^\circ \to 68^\circ$), and trailing particle sparks.
* **Full Mobile & Gamepad Support**:
  - Seamless touch support with virtual analog joystick and glowing action buttons.

### 3. ⚔️ Enhanced Starfighter Combat Loop & Visuals
* **Iconic Twin-Hull Starfighter Aesthetic**:
  - Custom dark armored catamaran chassis (`#121722` stealth plating).
  - High-intensity glowing orange energy strips (`#ff7700`) along the spine, wingtips, and gun mounts.
  - Dual rear ion thrusters with animated inner cyan core and outer orange flare that scales dynamically with throttle.
  - Outboard twin plasma cannon assemblies with laser tracers and dynamic muzzle flashes.
  - Hexagonal reactive force shield that ripples with cyan energy upon laser impacts.
* **Autonomous Enemy Drone Squadrons**:
  - **Scout Drone**: Nimble delta-wing fighter with crimson energy trims that executes strafing attack runs.
  - **Heavy Assault Cruiser**: Armored hex-drone with active shield envelopes and heavy plasma turrets.
  - **Seeker Interceptor**: High-speed hunter with amber thrusters that flanks and attempts fast intercepts.
* **Target Tracking HUD**:
  - Real-time holographic lock-on brackets on the nearest enemy drone showing distance ($M$), target name, and animated health gauge.
  - Off-screen chevron indicators around screen borders pointing towards distant hostiles.
* **Satisfying Multi-Stage Explosions**:
  - Expanding shockwave rings, 3D tumbling metallic hull debris shards, fiery spark clouds, and camera trauma shake.

### 4. 🎛️ Live Cockpit Tactical HUD & 360° Radar
* **Segmented Vitals Bars**:
  - **SHIELD**: Cyan bar with damage ripple and automatic recharge after 3 seconds out of combat.
  - **HULL**: Emerald-to-crimson integrity bar with critical pulsing alarms.
  - **BOOST**: Energy capacitor gauge for afterburner overdrive.
  - **HEAT**: Weapon heat gauge with overheat safety cooldown.
* **360° Tactical Radar**:
  - Lower-left circular scanner displaying player heading, red enemy drones, grey asteroids, and yellow mineral crystals with a rotating radar sweep.
* **Score & Multipliers**:
  - Dynamic kill streak combos (`x1`, `x2`, `x3`, `x5`) with floating notifications.
* **Wave / Sector Progression**:
  - Multi-sector campaign with dynamic alert banners and escalating drone swarms.

### 5. 🔊 100% Procedural Web Audio Engine
* Zero external audio files required! Synthesizes all sounds dynamically via Web Audio API:
  - Punchy dual laser blaster PEW
  - Deep multi-stage explosions with sub-bass rumble
  - Shield impact deflection chime
  - Continuous modulating engine thruster hum & roaring afterburner
  - Collectible pickup arpeggio

---

## 🎮 Flight Controls

| Action | Keyboard / Mouse | Gamepad | Mobile Touch |
| :--- | :--- | :--- | :--- |
| **Thrust Forward** | <kbd>W</kbd> or <kbd>↑</kbd> | Left Stick Up | Virtual Stick Up |
| **Reverse / Airbrake** | <kbd>S</kbd> or <kbd>↓</kbd> | Left Stick Down | Virtual Stick Down |
| **Steer Heading** | **Mouse Cursor** / <kbd>A</kbd> <kbd>D</kbd> | Right Stick / Left Stick | Drag / Stick X |
| **Fire Dual Lasers** | <kbd>Space</kbd> or <kbd>Left Click</kbd> | <kbd>RT</kbd> / <kbd>R2</kbd> or <kbd>A</kbd> | **FIRE** Button |
| **Afterburner Boost** | <kbd>Shift</kbd> or <kbd>Right Click</kbd> | <kbd>LT</kbd> / <kbd>L2</kbd> or <kbd>B</kbd> | **BOOST** Button |

---

## 🛠️ Instant Testing & Local Deployment

### Option 1: Direct File Open (Zero Tools Needed)
Simply double-click `index.html` or open it in any web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local Node.js Server
Run the built-in zero-dependency server:
```bash
node serve.js
# or
npm start
```
Then open: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Public Deployment Guide

This game is self-contained and ready to deploy globally via any static hosting service:

### 1. Deploying to `ship.place`
1. Push this folder to your Git repository or upload the directory.
2. Select static HTML deployment.
3. Entry file: `index.html`.

### 2. Deploying to Vercel
```bash
npx vercel .
```

### 3. Deploying to Netlify
```bash
npx netlify deploy --dir . --prod
```

### 4. Deploying to GitHub Pages
1. Push to your GitHub repository.
2. Go to **Settings > Pages**.
3. Select **Branch: main** and **Folder: / (root)**.
4. Click **Save** — your public URL is generated immediately.
