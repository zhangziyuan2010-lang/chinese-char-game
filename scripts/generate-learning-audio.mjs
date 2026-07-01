import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import charDB from '../src/data/charDB.js';
import { getCharSpeechText, getExampleSpeechSentences } from '../src/utils/charText.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, 'public', 'audio', 'learn');
const tempDir = join(rootDir, 'public', 'audio', '.tmp');
const voice = process.env.LEARN_AUDIO_VOICE || 'Tingting';

mkdirSync(outputDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });

function buildLearningText(charData) {
  return [
    getCharSpeechText(charData),
    ...getExampleSpeechSentences(charData),
  ]
    .filter(Boolean)
    .join('。 ');
}

let generated = 0;

for (const charData of charDB) {
  const text = buildLearningText(charData);
  if (!text) continue;

  const aiffPath = join(tempDir, `${charData.id}.aiff`);
  const audioPath = join(outputDir, `${charData.id}.m4a`);

  execFileSync('/usr/bin/say', ['-v', voice, '-o', aiffPath, text], { stdio: 'ignore' });
  execFileSync('/usr/bin/afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', aiffPath, audioPath], { stdio: 'ignore' });
  generated += 1;
}

if (existsSync(tempDir)) {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`Generated ${generated} learning audio files in ${outputDir}`);
