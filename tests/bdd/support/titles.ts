// Named title fixtures so feature files stay readable and never contain raw invisible characters.

export const GLYPHS: Record<string, string> = {
  'letter a': 'a',
  'grinning emoji': '\u{1F600}', // 1 code point, 2 UTF-16 code units
  'red heart with variation selector': '\u2764\uFE0F', // 2 code points
  'CJK character': '\u65E5',
};

export const TITLE_KINDS: Record<string, string> = {
  'whitespace only': '   \t  ',
  'zero-width space only': '\u200B\u200B',
  'zero-width joiner only': '\u200D',
  'word joiner only': '\u2060',
  'byte order mark only': '\uFEFF',
  'variation selector only': '\uFE0F',
  'two variation selectors only': '\uFE0F\uFE0F',
  'variation selector supplement only': '\u{E0100}',
  'whitespace and invisible characters': ' \uFE0F\u200B \uFE0F ',
  'NUL only': '\u0000',
  'newline inside': 'line one\nline two',
  'tab inside': 'col1\tcol2',
  'NUL at start': '\u0000abc',
  'BEL at end': 'abc\u0007',
  'DEL at end': 'abc\u007F',
  'NEL at start': '\u0085abc',
  'C1 control inside': 'a\u0090b',
  'leading and trailing newlines': '\nTrimmed me\n',
  'heart with variation selector': 'I \u2764\uFE0F tasks',
  'lone heart with variation selector': '\u2764\uFE0F',
  'family emoji with joiners': '\u{1F468}\u200D\u{1F469}\u200D\u{1F467} family',
  'zero-width non-joiner inside': 'a\u200Cb',
};

export function titleOfKind(kind: string): string {
  const v = TITLE_KINDS[kind];
  if (v === undefined) throw new Error(`Unknown title kind "${kind}". Known: ${Object.keys(TITLE_KINDS).join(', ')}`);
  return v;
}

export function repeatGlyph(count: number, glyphName: string): string {
  const g = GLYPHS[glyphName];
  if (g === undefined) throw new Error(`Unknown glyph "${glyphName}". Known: ${Object.keys(GLYPHS).join(', ')}`);
  return g.repeat(count);
}

export const codePoints = (s: string): number => [...s].length;
