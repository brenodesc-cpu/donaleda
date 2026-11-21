"""Paletas das quatro direções da Dona Leda e a conferência de contraste (WCAG 2).

Rodar: python3 recursos/marca/paletas.py (--css imprime o CSS, --ts grava a tabela da página /marca)
Imprime o contraste de cada par usado nas telas e as linhas de CSS (HSL) pro globals.css.
"""
import colorsys, sys

DIRECOES = {
    # Gema: a direção que o time escolheu em 21/11/2026. O disco do telefone antigo, amarelo.
    'gema': {
        'background': '#FFF8E8', 'card': '#FFFFFF', 'foreground': '#33200F',
        'muted': '#F7EDD6', 'muted-foreground': '#6A4628', 'border': '#D9C4A0',
        'primary': '#33200F', 'primary-foreground': '#FFF8E8',
        'secondary': '#FDEBB5', 'accent': '#F7B90F', 'accent-foreground': '#33200F',
        'destructive': '#B03A22', 'destructive-foreground': '#FFFFFF',
        'success': '#1B7A3D', 'success-soft': '#E0F0E2',
        'warning': '#7A4E00', 'warning-soft': '#FDEBB5', 'danger-soft': '#FBE3DC',
        'ring': '#33200F',
        'leda-pele': '#FFFFFF', 'leda-cabelo': '#FFF8E8', 'leda-roupa': '#F7B90F', 'leda-traco': '#33200F',
    },
    'varanda': {
        'background': '#FBF5EC', 'card': '#FFFFFF', 'foreground': '#2B1D14',
        'muted': '#F3E9DC', 'muted-foreground': '#5A4636', 'border': '#D9C7B1',
        'primary': '#9E3F1D', 'primary-foreground': '#FFFFFF',
        'secondary': '#F1E4D3', 'accent': '#E2A23B', 'accent-foreground': '#2B1D14',
        'destructive': '#AE2A1F', 'destructive-foreground': '#FFFFFF',
        'success': '#2D6A39', 'success-soft': '#E1EFDC',
        'warning': '#7F5100', 'warning-soft': '#FBEBC8', 'danger-soft': '#FBE3DF',
        'ring': '#9E3F1D',
        'leda-pele': '#EEC3A0', 'leda-cabelo': '#C8C2BB', 'leda-roupa': '#9E3F1D', 'leda-traco': '#2B1D14',
    },
    'radio': {
        'background': '#FFFDF4', 'card': '#FFFFFF', 'foreground': '#121212',
        'muted': '#F2EFE3', 'muted-foreground': '#3B3B3B', 'border': '#2E2E2E',
        'primary': '#FFC72C', 'primary-foreground': '#121212',
        'secondary': '#F2EFE3', 'accent': '#F26A21', 'accent-foreground': '#121212',
        'destructive': '#C0122C', 'destructive-foreground': '#FFFFFF',
        'success': '#006B3A', 'success-soft': '#DCF2E4',
        'warning': '#7A4D00', 'warning-soft': '#FFF0C2', 'danger-soft': '#FDE2E5',
        'ring': '#121212',
        'leda-pele': '#F5C9A2', 'leda-cabelo': '#121212', 'leda-roupa': '#FFC72C', 'leda-traco': '#121212',
    },
    'jardim': {
        'background': '#F2F6F0', 'card': '#FFFFFF', 'foreground': '#13281C',
        'muted': '#E5EDE2', 'muted-foreground': '#3C5144', 'border': '#C5D5C6',
        'primary': '#1E5A3E', 'primary-foreground': '#FFFFFF',
        'secondary': '#E5EDE2', 'accent': '#E8836A', 'accent-foreground': '#13281C',
        'destructive': '#B02A1A', 'destructive-foreground': '#FFFFFF',
        'success': '#26703A', 'success-soft': '#DDF0DD',
        'warning': '#835000', 'warning-soft': '#FCEDCB', 'danger-soft': '#FBE4DE',
        'ring': '#1E5A3E',
        'leda-pele': '#E7B48E', 'leda-cabelo': '#F3F1EC', 'leda-roupa': '#E8836A', 'leda-traco': '#13281C',
    },
}

# (frente, fundo, mínimo, pra que serve)
PARES = [
    ('foreground', 'background', 7.0, 'texto principal na página'),
    ('foreground', 'card', 7.0, 'texto principal no cartão'),
    ('muted-foreground', 'background', 4.5, 'texto secundário na página'),
    ('muted-foreground', 'card', 4.5, 'texto secundário no cartão'),
    ('muted-foreground', 'muted', 4.5, 'texto secundário em fundo apagado'),
    ('primary-foreground', 'primary', 4.5, 'botão principal'),
    ('#FFFFFF', 'success', 4.5, 'botão verde Atender'),
    ('destructive-foreground', 'destructive', 4.5, 'botão Encerrar'),
    ('accent-foreground', 'accent', 4.5, 'selo de destaque'),
    ('success', 'success-soft', 4.5, 'aviso bom'),
    ('warning', 'warning-soft', 4.5, 'aviso de atenção'),
    ('destructive', 'danger-soft', 4.5, 'aviso urgente'),
    ('foreground', 'muted', 7.0, 'texto em fundo apagado'),
]


def luminancia(hexa):
    r, g, b = (int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5))
    canal = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)


def contraste(a, b):
    la, lb = sorted((luminancia(a), luminancia(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hsl(hexa):
    r, g, b = (int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return f'{round(h * 360)} {round(s * 100)}% {round(l * 100)}%'


def conferir():
    falhas = 0
    tabela = {}
    for nome, p in DIRECOES.items():
        tabela[nome] = []
        for frente, fundo, minimo, uso in PARES:
            cf = frente if frente.startswith('#') else p[frente]
            cb = fundo if fundo.startswith('#') else p[fundo]
            c = contraste(cf, cb)
            ok = c >= minimo
            falhas += not ok
            tabela[nome].append((uso, c, minimo, ok))
    return tabela, falhas


def escrever_ts(tabela):
    """Grava components/marca/paletas.gerado.ts, que a página /marca lê."""
    import json, os
    dados = {
        nome: {
            'cores': DIRECOES[nome],
            'pares': [{'uso': uso, 'contraste': round(c, 2), 'minimo': minimo} for uso, c, minimo, _ in linhas],
        }
        for nome, linhas in tabela.items()
    }
    raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    destino = os.path.join(raiz, 'components', 'marca', 'paletas.gerado.ts')
    with open(destino, 'w') as f:
        f.write('// Gerado por recursos/marca/paletas.py --ts. Não edite à mão.\n')
        f.write('export const PALETAS = ' + json.dumps(dados, ensure_ascii=False, indent=2) + ' as const;\n')


if __name__ == '__main__':
    tabela, falhas = conferir()
    for nome, linhas in tabela.items():
        print(f'== {nome}')
        for uso, c, minimo, ok in linhas:
            print(f"  {'ok ' if ok else 'FALHA'} {c:5.2f}:1 (mínimo {minimo}) {uso}")
    if '--ts' in sys.argv:
        escrever_ts(tabela)
    if '--css' in sys.argv:
        for nome, p in DIRECOES.items():
            print(f'\n/* {nome} */')
            for k, v in p.items():
                print(f'  --{k}: {hsl(v)};')
    print('falhas:', falhas)
    sys.exit(1 if falhas else 0)
