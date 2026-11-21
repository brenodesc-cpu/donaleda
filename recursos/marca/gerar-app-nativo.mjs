// Gera o ícone e a tela de abertura dos apps de iPhone e Android (Capacitor) com a marca ativa.
// Rodar na raiz do projeto, depois de gerar-icones.mjs: node recursos/marca/gerar-app-nativo.mjs
//
// O ícone sai do arquivo recursos/marca/icone-1024.png que o gerar-icones.mjs grava.
// A tela de abertura é desenhada no Google Chrome (por causa da fonte Gabarito do nome)
// e gravada nos tamanhos que o Xcode e o Android pedem.
// Depois: npx cap sync, pra o Xcode e o Android Studio pegarem os arquivos novos.

import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const raiz = process.cwd();
const require = createRequire(import.meta.url);
function carregarSharp() {
  try {
    return require('sharp');
  } catch {
    const pasta = readdirSync(path.join(raiz, 'node_modules/.pnpm')).find((n) => n.startsWith('sharp@'));
    return require(path.join(raiz, 'node_modules/.pnpm', pasta, 'node_modules/sharp'));
  }
}
const sharp = carregarSharp();

// Cores da Gema (recursos/marca/paletas.py). O ícone vai sobre Café; a abertura, sobre Casca.
const GEMA = '#F7B90F';
const CAFE = '#33200F';
const CASCA = '#FFF8E8';
const LOUCA = '#FFFFFF';

// O disco do telefone, o mesmo de components/marca/Logo.tsx (viewBox 0 0 120 120).
const FUROS = [
  [70.35, 98.65], [49.65, 98.65], [31.7, 88.3], [21.35, 70.35], [21.35, 49.65],
  [31.7, 31.7], [49.65, 21.35], [70.35, 21.35], [88.3, 31.7], [98.65, 49.65],
];
function disco({ furo, trava }) {
  return `
    <circle cx="60" cy="60" r="54" fill="${GEMA}"/>
    ${FUROS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${furo}"/>`).join('')}
    <path d="M 97.25 81.5 L 111 89.5" fill="none" stroke="${trava}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="60" cy="60" r="25" fill="${LOUCA}"/>
    <ellipse cx="52" cy="55.5" rx="2.75" ry="4.25" fill="${CAFE}"/>
    <ellipse cx="68" cy="55.5" rx="2.75" ry="4.25" fill="${CAFE}"/>
    <path d="M 49.5 65 Q 60 75 70.5 65" fill="none" stroke="${CAFE}" stroke-width="3.25" stroke-linecap="round"/>`;
}

const ios = path.join(raiz, 'ios/App/App/Assets.xcassets');
const res = path.join(raiz, 'android/app/src/main/res');
const icone1024 = path.join(raiz, 'recursos/marca/icone-1024.png');
if (!existsSync(icone1024)) {
  console.error('Falta recursos/marca/icone-1024.png. Rode antes: node recursos/marca/gerar-icones.mjs');
  process.exit(1);
}

/** PNG opaco (sem transparência), como a Apple exige no ícone. */
async function opaco(entrada, largura, altura, destino) {
  await sharp(entrada).resize(largura, altura).flatten({ background: CAFE }).removeAlpha().png().toFile(destino);
}

// --- iPhone: o ícone de 1024 sem transparência e sem cantos (o iPhone arredonda sozinho).
await opaco(icone1024, 1024, 1024, path.join(ios, 'AppIcon.appiconset/AppIcon-512@2x.png'));

// --- Android: ícone antigo (quadrado arredondado e redondo) e o ícone adaptável (frente + cor de fundo).
const DENSIDADES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [nome, fator] of Object.entries(DENSIDADES)) {
  const pasta = path.join(res, `mipmap-${nome}`);
  const lado = Math.round(48 * fator);
  const quadrado = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="22" fill="${CAFE}"/>
    <g transform="translate(60 60) scale(0.84) translate(-60 -60)">${disco({ furo: CAFE, trava: CASCA })}</g></svg>`;
  const redondo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="60" fill="${CAFE}"/>
    <g transform="translate(60 60) scale(0.78) translate(-60 -60)">${disco({ furo: CAFE, trava: CASCA })}</g></svg>`;
  await sharp(Buffer.from(quadrado)).resize(lado, lado).png().toFile(path.join(pasta, 'ic_launcher.png'));
  await sharp(Buffer.from(redondo)).resize(lado, lado).png().toFile(path.join(pasta, 'ic_launcher_round.png'));
  // A frente do ícone adaptável: tela de 108 com a área segura de 66 no meio; o disco fica dentro dela.
  const frenteLado = Math.round(108 * fator);
  const frente = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
    <g transform="translate(54 54) scale(0.5) translate(-60 -60)">${disco({ furo: CAFE, trava: CASCA })}</g></svg>`;
  await sharp(Buffer.from(frente)).resize(frenteLado, frenteLado).png().toFile(path.join(pasta, 'ic_launcher_foreground.png'));
}
writeFileSync(
  path.join(res, 'values/ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${CAFE}</color>\n</resources>\n`,
);

// --- Tela de abertura: o disco e o nome Dona Leda no fundo Casca, desenhados no Chrome.
const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((c) => existsSync(c));
if (!CHROME) {
  console.log('Ícones gravados. A tela de abertura precisa do Google Chrome instalado e ficou como estava.');
  process.exit(0);
}

const temporario = mkdtempSync(path.join(tmpdir(), 'abertura-dona-leda-'));
function htmlDaAbertura(largura, altura) {
  const menor = Math.min(largura, altura);
  const retrato = altura > largura;
  // No quadrado do iPhone (2732), só o miolo aparece no celular em pé: o conjunto fica pequeno e no centro.
  const quadrado = largura === altura;
  const lado = Math.round(menor * (quadrado ? 0.24 : retrato ? 0.42 : 0.3));
  const letra = Math.round(menor * (quadrado ? 0.062 : retrato ? 0.11 : 0.08));
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gabarito:wght@800&display=block">
<style>
  html,body{margin:0;width:${largura}px;height:${altura}px;background:${CASCA};overflow:hidden}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(letra * 0.45)}px}
  svg{width:${lado}px;height:${lado}px}
  p{margin:0;font-family:'Gabarito','Atkinson Hyperlegible Next',system-ui,sans-serif;font-weight:800;
    font-size:${letra}px;line-height:1;color:${CAFE};letter-spacing:-0.01em}
</style></head><body>
<svg viewBox="0 0 120 120">${disco({ furo: CASCA, trava: CAFE })}</svg>
<p>Dona Leda</p></body></html>`;
}
async function abertura(largura, altura, destinos) {
  const html = path.join(temporario, `abertura-${largura}x${altura}.html`);
  const foto = path.join(temporario, `abertura-${largura}x${altura}.png`);
  writeFileSync(html, htmlDaAbertura(largura, altura));
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=6000',
    `--window-size=${largura},${altura}`,
    `--screenshot=${foto}`,
    `file://${html}`,
  ], { stdio: 'ignore' });
  const imagem = readFileSync(foto);
  for (const destino of destinos) {
    await sharp(imagem).resize(largura, altura).flatten({ background: CASCA }).removeAlpha().png().toFile(destino);
  }
}

const splash = path.join(ios, 'Splash.imageset');
await abertura(2732, 2732, ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'].map((n) => path.join(splash, n)));

const RETRATO = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [nome, [l, a]] of Object.entries(RETRATO)) {
  await abertura(l, a, [path.join(res, `drawable-port-${nome}`, 'splash.png')]);
  await abertura(a, l, [path.join(res, `drawable-land-${nome}`, 'splash.png')]);
}
await abertura(480, 320, [path.join(res, 'drawable', 'splash.png')]);

rmSync(temporario, { recursive: true, force: true });
console.log('ícone e tela de abertura do iPhone e do Android gravados. Falta rodar: npx cap sync');
