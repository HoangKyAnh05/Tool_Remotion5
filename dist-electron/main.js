// Universal entry point for Node.js (Render/Cloud) and Electron Desktop
if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
  await import('./electron-main.js');
} else {
  await import('../server.mjs');
}
