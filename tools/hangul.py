#!/usr/bin/env python3
"""한글 픽셀 폰트 생성기 — src/ 에서 실제로 쓰는 글자만 GNU Unifont 16px 비트맵으로 뽑아
src/71-hangul-data.js 로 내보낸다. tools/build.py 가 빌드 첫 단계로 호출한다.

    python3 tools/hangul.py             # 생성(글꼴·Pillow 가 없으면 기존 생성물을 유지하고 경고)
    python3 tools/hangul.py --check     # 생성물에 빠진 글자가 있으면 종료 코드 1
    python3 tools/hangul.py --extra f   # f 의 글자도 포함(임시 확인용, 커밋하지 말 것). 환경 변수 HANGUL_EXTRA=f 도 같다.

- 스캔 대상: src/*.js(생성물 자신은 제외)와 src/shell.html 의 비ASCII 문자. 줄 전체가 // 주석인 줄은 건너뛴다.
- ASCII 0x20~0x7E 는 항상 포함한다(한글이 섞인 문자열은 숫자·영문도 같은 16px 격자로 그린다).
- 글자마다 폭 8(반각) 또는 16(전각), 16행 1비트 비트맵. 반각은 행당 1바이트, 전각은 행당 2바이트(왼쪽이 상위 비트).
- 결과는 코드포인트 순으로 정렬해 항상 같은 바이트가 나온다(내용이 같으면 파일을 다시 쓰지 않는다).

Unifont: SIL OFL 1.1 / GPLv2+(글꼴 내장 예외) 이중 라이선스 — vendor/LICENSE-unifont.txt
"""
import base64
import glob
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', '71-hangul-data.js')
CELL = 16
PER_LINE = 32  # 생성물 한 줄에 담는 글자 수(diff 를 읽을 수 있게)
FONT_PATHS = [
    '/usr/share/fonts/opentype/unifont/unifont.otf',
    '/usr/share/fonts/truetype/unifont/unifont.ttf',
    '/usr/share/fonts/unifont/unifont.otf',
    '/usr/share/fonts/unifont/unifont.ttf',
    '/usr/share/fonts/Unifont/Unifont.otf',
    '/usr/share/fonts/gnu-unifont/unifont.otf',
    '/usr/local/share/fonts/unifont.otf',
    '/opt/homebrew/share/fonts/unifont.otf',
    '~/Library/Fonts/unifont.otf',
    '~/.local/share/fonts/unifont.otf',
    '~/.fonts/unifont.otf',
]


def warn(msg):
    print('[hangul] ' + msg, file=sys.stderr)


def find_font():
    env = os.environ.get('UNIFONT')
    for p in ([env] if env else []) + FONT_PATHS:
        p = os.path.expanduser(p)
        if os.path.isfile(p):
            return p
    for pat in ('~/Library/Fonts/unifont-*.otf', '/usr/share/fonts/**/unifont-*.otf', '/usr/share/fonts/**/unifont.[ot]tf'):
        hits = sorted(glob.glob(os.path.expanduser(pat), recursive=True))
        if hits:
            return hits[-1]
    return None


def scan(extra=None):
    """src/ 에서 쓰이는 비ASCII 문자 집합."""
    paths = sorted(glob.glob(os.path.join(ROOT, 'src', '*.js'))) + [os.path.join(ROOT, 'src', 'shell.html')]
    paths = [p for p in paths if os.path.abspath(p) != OUT and os.path.isfile(p)]
    chars = set()
    for p in paths + list(extra or []):
        for line in open(p, encoding='utf-8'):
            if line.lstrip().startswith('//'):
                continue
            for ch in line:
                if ord(ch) > 0x7e:
                    chars.add(ch)
    keep = set()
    for ch in chars:
        cat = unicodedata.category(ch)
        if cat[0] in 'CZ' or cat in ('Mn', 'Me') or ord(ch) > 0xffff:
            continue  # 제어·공백·결합 문자와 BMP 밖(Unifont 본체에 없음)은 그리지 않는다
        keep.add(ch)
    return keep


def existing():
    """기존 생성물이 담고 있는 글자 집합(없으면 None)."""
    if not os.path.isfile(OUT):
        return None
    src = open(OUT, encoding='utf-8').read()
    have = set()
    for key in ('half', 'full'):
        m = re.search(r'^  %s: \[(.*?)^  \]' % key, src, re.S | re.M)
        if not m:
            return None
        for lit in re.findall(r'^    ("(?:[^"\\]|\\.)*"),$', m.group(1), re.M):
            have.update(json.loads(lit))
    return have


def render(font_path, chars):
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype(font_path, CELL)

    def bitmap(ch):
        w = int(round(font.getlength(ch)))
        if w not in (8, 16):
            return None
        im = Image.new('1', (w, CELL), 0)
        d = ImageDraw.Draw(im)
        d.fontmode = '1'  # 안티앨리어싱 없이
        d.text((0, 0), ch, font=font, fill=1)
        return w, im.tobytes()

    notdef = {bitmap(c) for c in ('￿', '\U0010ffff')}
    half, full, missing = [], [], []
    for ch in sorted(chars):
        g = bitmap(ch)
        if g is None or (g in notdef and ch != '￿'):
            missing.append(ch)
            continue
        (half if g[0] == 8 else full).append((ch, g[1]))
    return half, full, missing, '%s %s' % font.getname()


def emit(half, full, font_name):
    def block(items):
        rows = []
        for i in range(0, len(items), PER_LINE):
            part = items[i:i + PER_LINE]
            rows.append('    ' + json.dumps(''.join(c for c, _ in part), ensure_ascii=False) + ',')
        bits = []
        for i in range(0, len(items), PER_LINE):
            part = items[i:i + PER_LINE]
            bits.append("    '" + base64.b64encode(b''.join(b for _, b in part)).decode('ascii') + "',")
        return '\n'.join(rows), '\n'.join(bits)

    hc, hb = block(half)
    fc, fb = block(full)
    return '\n'.join([
        '// 자동 생성물 — 직접 고치지 말 것. `python3 tools/hangul.py`(빌드가 호출)로 다시 만든다.',
        '// src/ 에서 쓰는 글자만 뽑은 16px 1비트 글리프. 반각 %d자 + 전각 %d자.' % (len(half), len(full)),
        '// Glyph bitmaps derived from GNU Unifont (%s), (c) Unifoundry and contributors.' % font_name,
        '// Dual-licensed SIL OFL 1.1 / GPL-2.0-or-later with font embedding exception. See vendor/LICENSE-unifont.txt',
        'const hg_DATA = {',
        '  cell: %d,' % CELL,
        '  half: [', hc, '  ],',
        '  halfBits: [', hb, '  ],',
        '  full: [', fc, '  ],',
        '  fullBits: [', fb, '  ],',
        '};',
        '',
    ])


def generate(extra=None, check=False):
    """생성물을 최신으로 맞춘다. 반환값: (포함된 글자 수, 빠진 글자 목록)."""
    extra = list(extra or [])
    if os.environ.get('HANGUL_EXTRA'):  # 빌드를 거쳐 임시 문구를 시험할 때: HANGUL_EXTRA=파일 python3 tools/build.py
        extra += os.environ['HANGUL_EXTRA'].split(os.pathsep)
    want = scan(extra) | {chr(c) for c in range(0x20, 0x7f)}
    have = existing()
    font_path = find_font()
    try:
        import PIL  # noqa: F401
        pillow = True
    except ImportError:
        pillow = False
    if check or not font_path or not pillow:
        lack = sorted(want - (have or set()))
        if not check:
            why = 'Pillow 가 없어' if not pillow else 'Unifont 글꼴 파일을 찾지 못해(UNIFONT=경로 로 지정 가능)'
            if have is None:
                warn('%s 생성하지 못했고 기존 생성물도 없다 — 한글은 실행 시 시스템 글꼴로 대체된다.' % why)
            else:
                warn('%s 기존 src/71-hangul-data.js(%d자)를 그대로 쓴다.' % (why, len(have)))
        if lack:
            warn('생성물에 없는 글자 %d개: %s' % (len(lack), ''.join(lack)))
        return len(have or ()), lack
    half, full, missing, font_name = render(font_path, want)
    if missing:
        warn('Unifont 에 없는 글자 %d개(실행 시 시스템 글꼴로 대체): %s' % (len(missing), ''.join(missing)))
    out = emit(half, full, font_name)
    old = open(OUT, encoding='utf-8').read() if os.path.isfile(OUT) else None
    if out != old:
        with open(OUT, 'w', encoding='utf-8') as f:
            f.write(out)
    added = sorted(want - have - set(missing)) if have is not None else []
    print('[hangul] %d glyphs (half %d, full %d), %d bytes%s%s' % (
        len(half) + len(full), len(half), len(full), len(out.encode('utf-8')),
        '' if out != old else ' (unchanged)',
        (' +' + ''.join(added)) if added and len(added) <= 80 else (' +%d new' % len(added) if added else '')))
    return len(half) + len(full), missing


def main(argv):
    extra, check = [], False
    it = iter(argv)
    for a in it:
        if a == '--check':
            check = True
        elif a == '--extra':
            extra.append(next(it))
        else:
            sys.exit('usage: hangul.py [--check] [--extra FILE]...')
    _, lack = generate(extra, check)
    return 1 if check and lack else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
