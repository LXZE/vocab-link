import { POS } from './const';
type SeedData = {
  lang: string
  pos: string
  means: string[]
}
export const seedData: { [key: string]: SeedData } = {
  'ผม':   { lang: 'Thai', pos: POS.Pronoun, means: ['i', '我', '僕', 'ich', 'je', '저', 'אני'] },
  'ฉัน':   { lang: 'Thai', pos: POS.Pronoun, means: ['i', '我', '私', 'ich', 'je', '저', 'אני'] },
  'กู':    { lang: 'Thai', pos: POS.Pronoun, means: ['i', '我', '俺', 'ich', 'je', '나', 'אני'] },
  'i':    { lang: 'English', pos: POS.Pronoun, means: ['我', '私', '俺', '僕', 'ich', 'je', '나', '저', 'אני'] },
  '我':   { lang: 'Chinese', pos: POS.Pronoun, means: ['私', '俺', '僕', 'ich', 'je', '나', '저', 'אני'] },
  '僕':   { lang: 'Japanese', pos: POS.Pronoun, means: ['ich', 'je', '저', 'אני'] },
  '私':   { lang: 'Japanese', pos: POS.Pronoun, means: ['ich', 'je', '저', 'אני'] },
  '俺':   { lang: 'Japanese', pos: POS.Pronoun, means: ['ich', 'je', '나', 'אני'] },
  'ich':  { lang: 'German', pos: POS.Pronoun, means: ['je', '나', '저', 'אני'] },
  'je':   { lang: 'French', pos: POS.Pronoun, means: ['나', '저', 'אני'] },
  '나':   { lang: 'Korean', pos: POS.Pronoun, means: ['אני'] },
  '저':   { lang: 'Korean', pos: POS.Pronoun, means: ['אני'] },
  'אני':  { lang: 'Hebrew', pos: POS.Pronoun, means: [] },

  'คุณ': {lang: 'Thai', pos: POS.Pronoun, means: ['you','你','あなた','貴方','du','ihr','tu','vous','너','אתה','את','אתם','אתן']},
  'เธอ': {lang: 'Thai', pos: POS.Pronoun, means: ['you','你','あなた','貴方','君','du','ihr','tu','vous','너','את','אתן']},
  'มึง': {lang: 'Thai', pos: POS.Pronoun, means: ['you','你','あなた','貴方','お前','君','du','ihr','tu','vous','너','당신','אתה','את','אתם','אתן']},
  'you': {lang: 'English', pos: POS.Pronoun, means: ['你','あなた','貴方','お前','君','du','ihr','tu','vous','너','당신','אתה','את','אתם','אתן']},
  '你': {lang: 'Chinese', pos: POS.Pronoun, means: ['あなた','貴方','お前','君','du','ihr','tu','vous','너','당신','אתה','את','אתם','אתן']},
  'あなた': {lang: 'Japanese', pos: POS.Pronoun, means: ['du','ihr','tu','vous','너','אתה','את','אתם','אתן']},
  '貴方': {lang: 'Japanese', pos: POS.Pronoun, means: ['du','ihr','tu','vous','너','אתה','את','אתם','אתן']},
  'お前': {lang: 'Japanese', pos: POS.Pronoun, means: ['du','ihr','tu','vous','너','당신','אתה','את','אתם','אתן']},
  '君': {lang: 'Japanese', pos: POS.Pronoun, means: ['du','ihr','tu','vous','너','אתה','את','אתם','אתן']},
  'du': {lang: 'German', pos: POS.Pronoun, means: ['tu','너','당신','אתה','את','אתם','אתן']},
  'ihr': {lang: 'German', pos: POS.Pronoun, means: ['vous','너','당신','אתה','את','אתם','אתן']},
  'tu': {lang: 'French', pos: POS.Pronoun, means: ['너','당신','אתה','את','אתם','אתן']},
  'vous': {lang: 'French', pos: POS.Pronoun, means: ['너','당신','אתה','את','אתם','אתן']},
  '너': {lang: 'Korean', pos: POS.Pronoun, means: ['אתה','את','אתם','אתן']},
  '당신': {lang: 'Korean', pos: POS.Pronoun, means: ['אתה','את','אתם','אתן']},
  'אתה': {lang: 'Hebrew', pos: POS.Pronoun, means: []},
  'את': {lang: 'Hebrew', pos: POS.Pronoun, means: []},
  'אתם': {lang: 'Hebrew', pos: POS.Pronoun, means: []},
  'אתן': {lang: 'Hebrew', pos: POS.Pronoun, means: []},

  'เป็น':   { lang: 'Thai', pos: POS.Verb, means: ['be', '是', 'sein', 'être', '이다'] },
  'คือ':   { lang: 'Thai', pos: POS.Verb, means: ['be', '是', 'sein', 'être', '이다'] },
  'be':   { lang: 'English', pos: POS.Verb, means: ['是', 'sein', 'être', '이다'] },
  '是':   { lang: 'Chinese', pos: POS.Verb, means: ['sein', 'être', '이다'] },
  'sein': { lang: 'German', pos: POS.Verb, means: ['être', '이다'] },
  'être': { lang: 'French', pos: POS.Verb, means: ['이다'] },
  '이다': { lang: 'Korean', pos: POS.Verb, means: [] },

  'กิน':     { lang: 'Thai', pos: POS.Verb, means: ['eat', '吃', '食べる', '食う', 'essen', 'manger', '먹다', 'לאכול'] },
  'eat':    { lang: 'English', pos: POS.Verb, means: ['吃', '食べる', '食う', 'essen', 'manger', '먹다', 'לאכול'] },
  '吃':     { lang: 'Chinese', pos: POS.Verb, means: ['食べる', '食う', 'essen', 'manger', '먹다', 'לאכול'] },
  '食べる':   { lang: 'Japanese', pos: POS.Verb, means: ['essen', 'manger', '먹다', 'לאכול'] },
  '食う':    { lang: 'Japanese', pos: POS.Verb, means: ['essen', 'manger', '먹다', 'לאכול'] },
  'essen':  { lang: 'German', pos: POS.Verb, means: ['manger', '먹다', 'לאכול'] },
  'manger': { lang: 'French', pos: POS.Verb, means: ['먹다', 'לאכול'] },
  '먹다':   { lang: 'Korean', pos: POS.Verb, means: ['לאכול'] },
  'לאכול':  { lang: 'Hebrew', pos: POS.Verb, means: [] },

  'แอปเปิ้ล': { lang: 'Thai', pos: POS.Noun, means: ['apple', '蘋果', '林檎', 'りんご', 'apfel', 'pomme', '사과', 'תפוח'] },
  'apple':  { lang: 'English', pos: POS.Noun, means: ['蘋果', '林檎', 'りんご', 'apfel', 'pomme', '사과', 'תפוח'] },
  '蘋果':   { lang: 'Chinese', pos: POS.Noun, means: ['林檎', 'りんご', 'apfel', 'pomme', '사과', 'תפוח'] },
  '林檎':   { lang: 'Japanese', pos: POS.Noun, means: ['apfel', 'pomme', '사과', 'תפוח'] },
  'りんご':  { lang: 'Japanese', pos: POS.Noun, means: ['apfel', 'pomme', '사과', 'תפוח'] },
  'apfel':  { lang: 'German', pos: POS.Noun, means: ['pomme', '사과', 'תפוח'] },
  'pomme':  { lang: 'French', pos: POS.Noun, means: ['사과', 'תפוח'] },
  '사과':   { lang: 'Korean', pos: POS.Noun, means: ['תפוח'] },
  'תפוח':   { lang: 'Hebrew', pos: POS.Noun, means: [] },

  'สีแดง':  { lang: 'Thai', pos: POS.Adjective, means: ['red', '紅色', '赤い', 'rot', 'rouge', '붉다', 'אדום'] },
  'red':   { lang: 'English', pos: POS.Adjective, means: ['紅色', '赤い', 'rot', 'rouge', '붉다', 'אדום'] },
  '紅色':   { lang: 'Chinese', pos: POS.Adjective, means: ['赤い', 'rot', 'rouge', '붉다', 'אדום'] },
  '赤い':   { lang: 'Japanese', pos: POS.Adjective, means: ['rot', 'rouge', '붉다', 'אדום'] },
  'rot':   { lang: 'German', pos: POS.Adjective, means: ['rouge', '붉다', 'אדום'] },
  'rouge': { lang: 'French', pos: POS.Adjective, means: ['붉다', 'אדום'] },
  '붉다':   { lang: 'Korean', pos: POS.Adjective, means: ['אדום'] },
  'אדום':  { lang: 'Hebrew', pos: POS.Adjective, means: [] },

  'เร็ว': { lang: 'Thai', pos: POS.Adverb, means: ['fast', 'quickly', '快'] },
  'fast': { lang: 'English', pos: POS.Adverb, means: ['quickly', '快'] },
  'quickly': { lang: 'English', pos: POS.Adverb, means: ['快'] },
  '快': { lang: 'Chinese', pos: POS.Adverb, means: [] },
};
