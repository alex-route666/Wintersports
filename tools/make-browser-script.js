#!/usr/bin/env node
/* Génère tools/photos-browser.js : script à coller dans la console du navigateur, sur firstskisport.com.
   Il télécharge les photos (même origine, donc non bloqué), les recadre en 240 px et les rend dans un zip. */
const fs = require('fs'), path = require('path');
const d = require('../js/athletes.js');
const map = {};
d.M.forEach((a) => { if (a.fss) map[a.id] = a.fss; });
d.W.forEach((a) => { if (a.fss) map[a.id] = a.fss + 'w'; });
const code = `/* Ski game – à coller dans la console du navigateur, sur une page de https://firstskisport.com (générée : ne pas modifier) */
(async () => {
  const MAP = ${JSON.stringify(map)};
  const YEARS = [2026, 2025, 2024, 2023, 2022, 2021], SIZE = 240;
  const crc = (() => { const t = new Uint32Array(256).map((_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
    return (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
  const enc = new TextEncoder(), files = [], missing = [];
  const u16 = (v) => [v & 255, v >> 8 & 255], u32 = (v) => [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24];
  const DELAY = 6000, WAIT = 60000, STOP = { stop: true }, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let last = 0;
  async function get(u) { // une requête à la fois, espacée ; si le site dit « trop de requêtes » (429), on patiente puis on réessaie
    for (let k = 1; k <= 3; k++) {
      const gap = DELAY - (Date.now() - last); if (gap > 0) await sleep(gap);
      last = Date.now();
      try {
        const r = await fetch(u);
        if (r.status === 429 || r.status === 403) { console.log('Le site demande de ralentir (' + r.status + '), pause de ' + (WAIT * k / 1000) + ' s…'); await sleep(WAIT * k); continue; }
        return r;
      } catch (e) { await sleep(2000); }
    }
    throw STOP; // le site refuse toujours : on s'arrête proprement
  }
  async function viaPage(key) {
    const w = key.endsWith('w'), id = key.replace('w', '');
    const r = await get('/alpine/athlete.php?id=' + id + (w ? '&g=w' : ''));
    if (!r || !r.ok) return null;
    const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    const hit = [...doc.querySelectorAll('img')].map((i) => i.getAttribute('src') || '').find((x) => /img\\/alpine\\/\\d{4}\\/\\d+\\.(png|jpe?g|webp)/i.test(x));
    if (!hit) return null;
    const ir = await get(new URL(hit, location.origin + '/alpine/').href);
    return ir && ir.ok ? await ir.blob() : null;
  }
  async function grab(key) { return await viaPage(key); }
  async function square(blob) {
    const bmp = await createImageBitmap(blob), s = Math.min(bmp.width, bmp.height);
    const c = document.createElement('canvas'); c.width = c.height = SIZE;
    const x = c.getContext('2d'); x.fillStyle = '#eee5cf'; x.fillRect(0, 0, SIZE, SIZE);
    x.drawImage(bmp, (bmp.width - s) / 2, 0, s, s, 0, 0, SIZE, SIZE);
    return new Uint8Array(await (await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82))).arrayBuffer());
  }
  const ids = Object.keys(MAP); let n = window.SKI_START || 0, stoppedAt = -1;
  for (let i = n; i < ids.length; i++) {
    const id = ids[i]; let b;
    try { b = await grab(MAP[id]); } catch (e) { if (e === STOP) { stoppedAt = i; break; } b = null; }
    if (b) { try { files.push({ name: id + '.jpg', data: await square(b) }); } catch (e) { missing.push(id); } } else missing.push(id);
    if ((i + 1) % 10 === 0) console.log((i + 1) + ' / ' + ids.length + ' traités, ' + files.length + ' photos');
  }
  const parts = [], central = []; let off = 0;
  files.forEach((f) => {
    const nm = enc.encode(f.name), c = crc(f.data);
    const head = new Uint8Array([0x50, 0x4B, 3, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(c), ...u32(f.data.length), ...u32(f.data.length), ...u16(nm.length), 0, 0, ...nm]);
    central.push(new Uint8Array([0x50, 0x4B, 1, 2, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(c), ...u32(f.data.length), ...u32(f.data.length), ...u16(nm.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off), ...nm]));
    parts.push(head, f.data); off += head.length + f.data.length;
  });
  const csize = central.reduce((s, a) => s + a.length, 0);
  parts.push(...central, new Uint8Array([0x50, 0x4B, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(csize), ...u32(off), 0, 0]));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(parts, { type: 'application/zip' })); a.download = 'photos.zip';
  document.body.appendChild(a); a.click();
  if (stoppedAt >= 0) console.log('ARRÊT : le site refuse. Pour reprendre plus tard, tape  window.SKI_START = ' + stoppedAt + '  puis recolle le script (et envoie ce zip à Claude).');
  console.log('TERMINÉ : ' + files.length + ' photos dans photos.zip. Introuvables (' + missing.length + ') : ' + missing.join(', '));
})();
`;
fs.writeFileSync(path.join(__dirname, 'photos-browser.js'), code);
console.log('photos-browser.js :', Object.keys(map).length, 'skieurs,', code.length, 'octets');
