/**
 * Smooth, Intuitive & Simplified Arcade Flight Controls
 * Handles Keyboard, Mouse Flight Steering, Gamepad, and Mobile Touch.
 * Eliminates jerky mechanics, freezes, and gimbal snapping.
 */
export class InputController {
  constructor(canvas, camera, THREE) {
    this.canvas = canvas;
    this.camera = camera;
    this.THREE = THREE;

    // Active Input State
    this.keys = new Set();
    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      worldX: 0,
      worldZ: 0,
      isDown: false,
      rightDown: false
    };

    // Virtual Touch Stick State
    this.touch = {
      active: false,
      thrust: 0,
      steer: 0,
      fire: false,
      boost: false
    };

    // Gamepad
    this.padIndex = null;

    // Raycaster for 3D Cosmic Plane Cursor Projection
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y = 0 gameplay plane
    this.planeIntersect = new THREE.Vector3();

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this._updateWorldCursor();
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Gamepad connection
    window.addEventListener('gamepadconnected', (e) => {
      this.padIndex = e.gamepad.index;
    });
  }

  _updateWorldCursor() {
    // Project mouse onto 3D horizontal cosmic plane
    const ndcX = (this.mouse.x / window.innerWidth) * 2 - 1;
    const ndcY = -(this.mouse.y / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    if (this.raycaster.ray.intersectPlane(this.plane, this.planeIntersect)) {
      this.mouse.worldX = this.planeIntersect.x;
      this.mouse.worldZ = this.planeIntersect.z;
    }
  }

  sample(ship) {
    let thrust = 0;
    let boost = false;
    let fire = false;
    let targetHeading = ship.heading;

    // 1. KEYBOARD AXES
    const keyW = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    const keyS = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    const keyA = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const keyD = this.keys.has('KeyD') || this.keys.has('ArrowRight');

    if (keyW) thrust += 1.0;
    if (keyS) thrust -= 0.8;

    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.mouse.rightDown) {
      boost = true;
    }
    if (this.keys.has('Space') || this.mouse.isDown) {
      fire = true;
    }

    // 2. MOUSE FLIGHT STEERING (Smooth & Intuitive)
    this._updateWorldCursor();
    const dx = this.mouse.worldX - ship.position.x;
    const dz = this.mouse.worldZ - ship.position.z;
    const cursorDist = Math.hypot(dx, dz);

    // If mouse is moved away from ship center, steer towards it smoothly
    if (cursorDist > 3.0) {
      targetHeading = Math.atan2(dx, dz);
    }

    // Allow keyboard A/D to provide direct turning override if pressed
    if (keyA) targetHeading += 0.05;
    if (keyD) targetHeading -= 0.05;

    // 3. GAMEPAD INPUT
    if (navigator.getGamepads && this.padIndex !== null) {
      const pads = navigator.getGamepads();
      const pad = pads[this.padIndex];
      if (pad && pad.connected) {
        // Left Stick (Y axis: throttle)
        const stickY = pad.axes[1] || 0;
        if (Math.abs(stickY) > 0.15) {
          thrust = -stickY;
        }

        // Right Stick or Left Stick (Aim direction)
        const aimX = Math.abs(pad.axes[2]) > 0.2 ? pad.axes[2] : (Math.abs(pad.axes[0]) > 0.2 ? pad.axes[0] : 0);
        const aimY = Math.abs(pad.axes[3]) > 0.2 ? pad.axes[3] : (Math.abs(pad.axes[1]) > 0.2 ? pad.axes[1] : 0);

        if (Math.hypot(aimX, aimY) > 0.25) {
          targetHeading = Math.atan2(aimX, -aimY);
        }

        // Triggers / Buttons
        if (pad.buttons[7]?.pressed || pad.buttons[0]?.pressed) fire = true; // R2 or A
        if (pad.buttons[6]?.pressed || pad.buttons[1]?.pressed) boost = true; // L2 or B
      }
    }

    // 4. TOUCH OVERRIDES (if active)
    if (this.touch.active) {
      if (Math.abs(this.touch.thrust) > 0.05) thrust = this.touch.thrust;
      if (this.touch.boost) boost = true;
      if (this.touch.fire) fire = true;
    }

    return {
      thrust,
      boost,
      fire,
      targetHeading,
      mouseWorld: { x: this.mouse.worldX, z: this.mouse.worldZ }
    };
  }
}
