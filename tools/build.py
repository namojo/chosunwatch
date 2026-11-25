#!/usr/bin/env python3
import glob
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True  # tools/__pycache__ 를 남기지 않는다


def three_classic():
    src = open(os.path.join(ROOT, 'vendor', 'three.module.min.js'), encoding='utf-8').read()
    i = src.rfind('export{')
    j = src.rfind('}')
    body, names = src[:i], src[i + 7:j]
    pairs = []
    for item in names.split(','):
        item = item.strip()
        if not item:
            continue
        if ' as ' in item:
            local, public = item.split(' as ')
            pairs.append('%s:%s' % (public.strip(), local.strip()))
        else:
            pairs.append('%s:%s' % (item, item))
    out = 'var THREE=(function(){' + body + '\nreturn {' + ','.join(pairs) + '};})();'
    assert '</script' not in out
    return out


def game():
    parts = []
    for path in sorted(glob.glob(os.path.join(ROOT, 'src', '*.js'))):
        parts.append(open(path, encoding='utf-8').read())
    code = "(function(){\n'use strict';\n" + '\n'.join(parts) + '\n})();'
    assert '</script' not in code
    return code


def hangul_font():
    """한글 글리프 생성물(src/71-hangul-data.js)을 소스에 맞춰 갱신한다.

    Unifont 나 Pillow 가 없는 환경에서는 커밋된 생성물을 그대로 쓰고 경고만 낸다.
    생성 단계가 어떤 이유로 실패하더라도 빌드 자체는 계속한다(빠진 글자는 실행 시 시스템 글꼴로 대체).
    """
    try:
        import hangul
        hangul.generate()
    except Exception as e:  # noqa: BLE001 - 글꼴 문제로 빌드를 막지 않는다
        print('[hangul] 생성 실패, 기존 생성물을 사용: %r' % (e,), file=sys.stderr)


def main():
    hangul_font()
    shell = open(os.path.join(ROOT, 'src', 'shell.html'), encoding='utf-8').read()
    html = shell.replace('/*__THREE__*/', three_classic()).replace('/*__GAME__*/', game())
    # 단일 파일 원칙: 외부 글꼴·스타일을 끌어오는 흔적이 있으면 빌드를 멈춘다.
    for bad in ('@font-face', '@import', 'fonts.googleapis', '<link rel="stylesheet"'):
        assert bad not in html, 'external asset reference in bundle: ' + bad
    outs = [os.path.join(ROOT, 'index.html')] + sys.argv[1:]
    for out in outs:
        with open(out, 'w', encoding='utf-8') as f:
            f.write(html)
    print('built %d bytes -> %s' % (len(html), ', '.join(outs)))


if __name__ == '__main__':
    main()
