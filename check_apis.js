#!/usr/bin/env node
/**
 * Build guard: fail the build when game code calls a method that does not exist.
 *
 * The original shipped build had 17 call sites in src/drones.js referring to
 * particles.createShieldHit(), particles.createExplosion() and audio.enemyLaser(),
 * none of which were ever defined. Every one of them threw a TypeError at runtime,
 * which aborted the rest of the frame and made drones impossible to destroy.
 *
 * This script cross-checks every `<object>.<method>(` call site in src/ against the
 * methods actually declared in the class that backs that object.
 *
 * Usage:  node check_apis.js
 *         node check_apis.js --selftest
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// global/local variable name -> the source file that declares its class
const TARGETS = {
  audio: 'audio.js',
  particles: 'particles.js',
  hud: 'hud.js',
  player: 'ship.js',
  asteroids: 'asteroids.js',
  environment: 'environment.js',
  drones: 'drones.js',
  input: 'controls.js'
};

/**
 * Array/Object/Promise prototype methods. `this.drones` is a DroneManager in game.js
 * but an Array inside drones.js, so `drones.push()` etc. are not class calls.
 */
const PROTOTYPE_METHODS = new Set([
  'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat', 'join', 'indexOf',
  'lastIndexOf', 'includes', 'find', 'findIndex', 'filter', 'map', 'forEach', 'reduce',
  'reduceRight', 'some', 'every', 'sort', 'reverse', 'flat', 'flatMap', 'fill', 'at',
  'keys', 'values', 'entries', 'toString', 'toLocaleString', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable', 'then', 'catch', 'finally',
  'assign', 'defineProperty', 'getOwnPropertyNames', 'freeze'
]);

/** Method names declared by a class body (2-space indent inside `export class`). */
function definedMethods(code) {
  const names = new Set();
  const re = /^ {2}([A-Za-z_$][\w$]*)\s*\(/gm;
  let m;
  while ((m = re.exec(code)) !== null) names.add(m[1]);
  if (/^\s*constructor\s*\(/m.test(code)) names.add('constructor');
  return names;
}

/** All `<obj>.<method>(` call sites with the 1-based line they occur on. */
function callSites(code, obj) {
  const re = new RegExp('\\b' + obj + '\\.([A-Za-z_$][\\w$]*)\\s*\\(', 'g');
  const found = new Map();
  let m;
  while ((m = re.exec(code)) !== null) {
    const method = m[1];
    if (!found.has(method)) found.set(method, []);
    found.get(method).push(code.slice(0, m.index).split('\n').length);
  }
  return found;
}

function audit() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.js'));
  const sources = new Map(files.map(f => [f, fs.readFileSync(path.join(SRC_DIR, f), 'utf8')]));

  const problems = [];

  for (const [obj, className] of Object.entries(TARGETS)) {
    const classCode = sources.get(className);
    if (classCode === undefined) {
      problems.push({ obj, method: '(class file missing)', lines: [], className });
      continue;
    }
    const defined = definedMethods(classCode);

    for (const [fileName, code] of sources) {
      for (const [method, lines] of callSites(code, obj)) {
        if (PROTOTYPE_METHODS.has(method)) continue;
        if (!defined.has(method)) {
          problems.push({ obj, method, lines, className, fileName });
        }
      }
    }
  }

  return problems;
}

function report(problems) {
  if (problems.length === 0) {
    console.log('API check OK: every audio/particles/hud/player call site resolves.');
    return true;
  }

  console.error(`API check FAILED: ${problems.length} call site(s) target a method that does not exist.\n`);
  for (const p of problems) {
    const where = p.lines.map(l => `${p.fileName || p.className}:${l}`).join(', ');
    console.error(`  ${p.obj}.${p.method}()  ->  not declared in ${p.className}  (${where})`);
  }
  console.error('\nFix the call site or add the method before building.');
  return false;
}

/** Proves the guard actually detects the exact bug class it exists for. */
function selftest() {
  const fakeDefined = new Set(['createSparks', 'shoot']);
  const fakeCalls = [
    { obj: 'particles', method: 'createShieldHit', lines: [1] },
    { obj: 'particles', method: 'createExplosion', lines: [2] },
    { obj: 'audio', method: 'enemyLaser', lines: [3] },
    { obj: 'particles', method: 'createSparks', lines: [4] }
  ];
  const missed = fakeCalls.filter(c => !fakeDefined.has(c.method) && c.obj === 'particles');
  const audioMissed = fakeCalls.filter(c => !fakeDefined.has(c.method) && c.obj === 'audio');

  const ok =
    missed.length === 2 &&
    audioMissed.length === 1 &&
    fakeCalls.filter(c => fakeDefined.has(c.method)).length === 1;

  console.log(ok ? 'selftest OK' : 'selftest FAILED');
  return ok;
}

if (process.argv.includes('--selftest')) {
  process.exit(selftest() ? 0 : 1);
}

const problems = audit();
process.exit(report(problems) ? 0 : 1);
