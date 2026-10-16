import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const candidates = [
  'C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe',
  'C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe',
  'C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe',
  'C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe',
];

const blenderExe = candidates.find((p) => fs.existsSync(p)) || 'blender';
const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate_chrono_tourbillon.py');

console.log(`Running Blender CAD Generator via: ${blenderExe}`);
execFileSync(blenderExe, ['-b', '-P', scriptPath], { stdio: 'inherit' });
