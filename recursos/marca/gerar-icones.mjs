// Gera o ícone do app, os favicons e os arquivos soltos do logo de cada direção.
// Rodar na raiz do projeto: node recursos/marca/gerar-icones.mjs
// Usa o sharp que já vem com o Next. As cores são as de recursos/marca/paletas.py.

import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

const COR = {
  // Gema: no ícone o disco amarelo vai sobre Café, e os furos mostram o fundo.
  gema: { fundo: '#33200F', principal: '#F7B90F', furo: '#33200F', trava: '#FFF8E8', traco: '#33200F', claro: '#FFFFFF', destaque: '#F7B90F' },
  varanda: { fundo: '#FBF5EC', principal: '#9E3F1D', cabelo: '#C8C2BB', traco: '#2B1D14', claro: '#FFFFFF', destaque: '#E2A23B' },
  radio: { fundo: '#FFFDF4', principal: '#FFC72C', cabelo: '#121212', traco: '#121212', claro: '#FFFFFF', destaque: '#F26A21' },
  jardim: { fundo: '#F2F6F0', principal: '#1E5A3E', cabelo: '#F3F1EC', traco: '#13281C', claro: '#FFFFFF', destaque: '#E8836A' },
};

// Nos arquivos soltos (símbolo e logo), que vão sobre fundo claro, o disco da Gema troca furo e trava.
const COR_NO_CLARO = {
  gema: { ...COR.gema, furo: '#FFF8E8', trava: '#33200F' },
};
const corNoClaro = (estilo) => COR_NO_CLARO[estilo] ?? COR[estilo];

const FUROS_DA_GEMA = [
  [70.35, 98.65], [49.65, 98.65], [31.7, 88.3], [21.35, 70.35], [21.35, 49.65],
  [31.7, 31.7], [49.65, 21.35], [70.35, 21.35], [88.3, 31.7], [98.65, 49.65],
];

// Os mesmos desenhos de components/marca/Logo.tsx, com as cores escritas (viewBox 0 0 120 120).
const SIMBOLO = {
  gema: (c) => `
    <circle cx="60" cy="60" r="54" fill="${c.principal}"/>
    ${FUROS_DA_GEMA.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${c.furo}"/>`).join('')}
    <path d="M 97.25 81.5 L 111 89.5" fill="none" stroke="${c.trava}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="60" cy="60" r="25" fill="${c.claro}"/>
    <ellipse cx="52" cy="55.5" rx="2.75" ry="4.25" fill="${c.traco}"/>
    <ellipse cx="68" cy="55.5" rx="2.75" ry="4.25" fill="${c.traco}"/>
    <path d="M 49.5 65 Q 60 75 70.5 65" fill="none" stroke="${c.traco}" stroke-width="3.25" stroke-linecap="round"/>`,
  varanda: (c) => `
    <circle cx="60" cy="22" r="13" fill="${c.cabelo}" stroke="${c.traco}" stroke-width="4"/>
    <path d="M 60 30 C 90 30 104 46 104 66 C 104 88 86 102 60 102 C 52 102 45 101 39 98 L 18 108 L 24 88 C 18 81 16 74 16 66 C 16 46 30 30 60 30 Z" fill="${c.principal}" stroke="${c.traco}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="46" cy="62" r="5.5" fill="${c.claro}"/>
    <circle cx="74" cy="62" r="5.5" fill="${c.claro}"/>
    <path d="M 44 78 Q 60 90 76 78" fill="none" stroke="${c.claro}" stroke-width="5" stroke-linecap="round"/>`,
  radio: (c) => `
    <rect x="4" y="4" width="112" height="112" rx="14" fill="${c.principal}" stroke="${c.traco}" stroke-width="6"/>
    <path d="M 28 66 A 32 32 0 0 1 92 66" fill="none" stroke="${c.traco}" stroke-width="8"/>
    <rect x="20" y="58" width="14" height="24" rx="2" fill="${c.traco}"/>
    <rect x="86" y="58" width="14" height="24" rx="2" fill="${c.traco}"/>
    <circle cx="60" cy="70" r="22" fill="${c.claro}" stroke="${c.traco}" stroke-width="6"/>
    <rect x="50" y="63" width="6" height="6" fill="${c.traco}"/>
    <rect x="64" y="63" width="6" height="6" fill="${c.traco}"/>
    <path d="M 51 77 L 69 77" stroke="${c.traco}" stroke-width="5" stroke-linecap="square"/>`,
  jardim: (c) => `
    <path d="M 16 104 C 10 52 44 14 104 14 C 110 70 76 108 16 104 Z" fill="${c.principal}"/>
    <circle cx="52" cy="62" r="5.5" fill="${c.claro}"/>
    <circle cx="74" cy="52" r="5.5" fill="${c.claro}"/>
    <path d="M 50 80 Q 68 86 82 68" fill="none" stroke="${c.claro}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="98" cy="22" r="10" fill="${c.destaque}"/>`,
};

const NOME = {
  gema: { texto: 'Dona Leda', fonte: "'Gabarito', 'Atkinson Hyperlegible Next', sans-serif", peso: 800 },
  varanda: { texto: 'Dona Leda', fonte: "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', sans-serif", peso: 700 },
  radio: { texto: 'DONA LEDA', fonte: "'Lexend', sans-serif", peso: 900 },
  jardim: { texto: 'dona leda', fonte: "'Nunito', sans-serif", peso: 800 },
};

/** Ícone quadrado: o símbolo no fundo da direção, com folga pra máscara arredondada do celular. */
function svgDoIcone(estilo, { cantos = 0 } = {}) {
  const c = COR[estilo];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" rx="${cantos}" fill="${c.fundo}"/>
  <g transform="translate(152 ${estilo === 'gema' ? 152 : 162}) scale(6)">${SIMBOLO[estilo](c)}</g>
</svg>`;
}

function svgDoSimbolo(estilo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${SIMBOLO[estilo](corNoClaro(estilo))}</svg>`;
}

function svgDoLogo(estilo) {
  const c = corNoClaro(estilo);
  const n = NOME[estilo];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 120">
  <g>${SIMBOLO[estilo](c)}</g>
  <text x="140" y="80" font-family="${n.fonte}" font-weight="${n.peso}" font-size="58" fill="${c.traco}">${n.texto}</text>
</svg>`;
}

async function png(svg, tamanho, destino) {
  await sharp(Buffer.from(svg)).resize(tamanho, tamanho).flatten({ background: '#FFFFFF' }).png().toFile(destino);
}

const ativa = process.argv[2] || 'gema';
const publico = path.join(raiz, 'public');
const marca = path.join(raiz, 'recursos/marca');
mkdirSync(path.join(publico, 'marca'), { recursive: true });

for (const estilo of Object.keys(COR)) {
  writeFileSync(path.join(publico, 'marca', `simbolo-${estilo}.svg`), svgDoSimbolo(estilo));
  writeFileSync(path.join(publico, 'marca', `logo-${estilo}.svg`), svgDoLogo(estilo));
  await png(svgDoIcone(estilo), 1024, path.join(marca, `icone-1024-${estilo}.png`));
}

// O ícone do app sai da direção ativa: quadrado, sem transparência e sem cantos
// (o iPhone e o Android arredondam sozinhos).
await png(svgDoIcone(ativa), 1024, path.join(marca, 'icone-1024.png'));
writeFileSync(path.join(publico, 'icone.svg'), svgDoIcone(ativa, { cantos: 224 }));
await png(svgDoIcone(ativa), 180, path.join(publico, 'apple-touch-icon.png'));
await png(svgDoIcone(ativa), 192, path.join(publico, 'android-chrome-192x192.png'));
await png(svgDoIcone(ativa), 512, path.join(publico, 'android-chrome-512x512.png'));
await png(svgDoIcone(ativa, { cantos: 224 }), 32, path.join(publico, 'favicon-32x32.png'));
await png(svgDoIcone(ativa, { cantos: 224 }), 16, path.join(publico, 'favicon-16x16.png'));
const temporario = path.join(marca, '.favicon-48.png');
await png(svgDoIcone(ativa, { cantos: 224 }), 48, temporario);
execFileSync('magick', [
  path.join(publico, 'favicon-16x16.png'),
  path.join(publico, 'favicon-32x32.png'),
  temporario,
  path.join(publico, 'favicon.ico'),
]);
execFileSync('rm', ['-f', temporario]);
console.log(`ícones gerados com a direção ${ativa}`);
