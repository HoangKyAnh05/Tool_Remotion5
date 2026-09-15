import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT_PATH = path.resolve(__dirname, 'kokoro_tts_engine.py');

export function rateToSpeed(rate = '+0%') {
  if (!rate) return 1.0;
  const str = String(rate).trim();
  if (str.includes('%')) {
    const num = parseInt(str.replace('%', ''));
    if (!isNaN(num)) {
      return Math.max(0.5, Math.min(2.0, 1.0 + num / 100));
    }
  }
  if (str.toLowerCase().endsWith('x')) {
    const mult = parseFloat(str.replace(/x/i, ''));
    if (!isNaN(mult) && mult > 0) return Math.max(0.5, Math.min(2.0, mult));
  }
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0 && num <= 3) return Math.max(0.5, Math.min(2.0, num));
  return 1.0;
}

export function synthesizeKokoro(text, voice = 'ngoc_huyen', rate = '+0%') {
  return new Promise((resolve, reject) => {
    const speed = rateToSpeed(rate);
    const cleanVoice = voice.toLowerCase().replace('kokoro:', '').replace('kokoro-', '').trim() || 'ngoc_huyen';
    
    // Spawn python process
    const proc = spawn('python', [SCRIPT_PATH, '--json'], {
      windowsHide: true
    });

    let stdoutData = '';
    let stderrData = '';

    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString('utf-8');
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString('utf-8');
    });

    proc.on('error', (err) => {
      reject(err);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Kokoro python process exited with code ${code}: ${stderrData}`));
      }
      try {
        const result = JSON.parse(stdoutData);
        if (result.error) {
          return reject(new Error(`Kokoro error: ${result.error}`));
        }
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse Kokoro output: ${e.message}\nRaw: ${stdoutData.slice(0, 200)}`));
      }
    });

    const payload = JSON.stringify({
      text,
      voice: cleanVoice,
      speed
    });

    proc.stdin.write(payload);
    proc.stdin.end();
  });
}
