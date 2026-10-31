/**
 * Smooth, Intuitive & Simplified Arcade Flight Controls
 * Handles Keyboard, Mouse Flight Steering, Gamepad, and Mobile Touch.
 * Supports Primary Weapons, Secondary Homing Missiles, EMP Shockwaves,
 * Camera View Switching, and Pause / Settings Menu.
 */
export class InputController {
  constructor(canvas, camera, THREE) {
    this.canvas = canvas;
    this.camera = camera;
    this.THREE = THREE;

    // Active Input State
    this.keys = new Set();
    this.justPressedKeys = new Set();
    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      worldX: 0,
      worldZ: 0,
      isDown: false,
      rightDown: false,
      rightJustPressed: false
    };

    // Virtual Touch Stick State
    this.touch = {
      active: false,
      thrust: 0,
      steer: 0,
      fire: false,
      boost: false,
      missile: false
    };

    // Gamepad
    this.padIndex = null;

    // Raycaster for 3D Cosmic Plane Cursor Projection
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.planeIntersect = new THREE.Vector3();

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this.justPressedKeys.add(e.code);
      }
      this.keys.add(e.code);

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyC', 'KeyQ', 'KeyE', 'KeyP', 'Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
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
      if (e.button === 2) {
        this.mouse.rightDown = true;
        this.mouse.rightJustPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('gamepadconnected', (e) => {
      this.padIndex = e.gamepad.index;
    });
  }

  _updateWorldCursor() {
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
    let fireMissile = false;
    let triggerEMP = false;
    let switchCamera = false;
    let togglePause = false;
    let weaponSelect = null;
    let targetHeading = ship.heading;

    // 1. KEYBOARD AXES
    const keyW = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    const keyS = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    const keyA = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const keyD = this.keys.has('KeyD') || this.keys.has('ArrowRight');

    if (keyW) thrust += 1.0;
    if (keyS) thrust -= 0.8;

    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) {
      boost = true;
    }
    if (this.keys.has('Space') || this.mouse.isDown) {
      fire = true;
    }

    // Secondary Weapon / Missiles (Right Click or E or F)
    if (this.mouse.rightJustPressed || this.justPressedKeys.has('KeyE') || this.justPressedKeys.has('KeyF') || this.touch.missile) {
      fireMissile = true;
      this.mouse.rightJustPressed = false;
      this.touch.missile = false;
    }

    // Special Weapon / EMP (Q or R)
    if (this.justPressedKeys.has('KeyQ') || this.justPressedKeys.has('KeyR')) {
      triggerEMP = true;
    }

    // Camera Switch (C or V)
    if (this.justPressedKeys.has('KeyC') || this.justPressedKeys.has('KeyV')) {
      switchCamera = true;
    }

    // Pause Toggle (ESC or P)
    if (this.justPressedKeys.has('Escape') || this.justPressedKeys.has('KeyP')) {
      togglePause = true;
    }

    // Weapon Selection (1, 2, 3)
    if (this.justPressedKeys.has('Digit1')) weaponSelect = 'cannons';
    if (this.justPressedKeys.has('Digit2')) weaponSelect = 'rapid';
    if (this.justPressedKeys.has('Digit3')) weaponSelect = 'missiles';

    // Clear single-frame actions
    this.justPressedKeys.clear();

    // 2. MOUSE FLIGHT STEERING
    this._updateWorldCursor();
    const dx = this.mouse.worldX - ship.position.x;
    const dz = this.mouse.worldZ - ship.position.z;
    const cursorDist = Math.hypot(dx, dz);

    if (cursorDist > 2.5) {
      targetHeading = Math.atan2(dx, dz);
    }

    if (keyA) targetHeading += 0.06;
    if (keyD) targetHeading -= 0.06;

    // 3. GAMEPAD INPUT
    if (navigator.getGamepads && this.padIndex !== null) {
      const pads = navigator.getGamepads();
      const pad = pads[this.padIndex];
      if (pad && pad.connected) {
        const stickY = pad.axes[1] || 0;
        if (Math.abs(stickY) > 0.15) thrust = -stickY;

        const aimX = Math.abs(pad.axes[2]) > 0.2 ? pad.axes[2] : (Math.abs(pad.axes[0]) > 0.2 ? pad.axes[0] : 0);
        const aimY = Math.abs(pad.axes[3]) > 0.2 ? pad.axes[3] : (Math.abs(pad.axes[1]) > 0.2 ? pad.axes[1] : 0);

        if (Math.hypot(aimX, aimY) > 0.25) {
          targetHeading = Math.atan2(aimX, -aimY);
        }

        if (pad.buttons[7]?.pressed || pad.buttons[0]?.pressed) fire = true;
        if (pad.buttons[6]?.pressed || pad.buttons[1]?.pressed) boost = true;
        if (pad.buttons[5]?.pressed) fireMissile = true; // R1
        if (pad.buttons[4]?.pressed) triggerEMP = true; // L1
        if (pad.buttons[9]?.pressed) togglePause = true; // Start
      }
    }

    // 4. TOUCH OVERRIDES
    if (this.touch.active) {
      if (Math.abs(this.touch.thrust) > 0.05) thrust = this.touch.thrust;
      if (this.touch.boost) boost = true;
      if (this.touch.fire) fire = true;
    }

    return {
      thrust,
      boost,
      fire,
      fireMissile,
      triggerEMP,
      switchCamera,
      togglePause,
      weaponSelect,
      targetHeading,
      hasMouseTarget: cursorDist > 2.5,
      targetWorldX: this.mouse.worldX,
      targetWorldZ: this.mouse.worldZ,
      mouseScreenX: this.mouse.x,
      mouseScreenY: this.mouse.y
    };
  }
}
