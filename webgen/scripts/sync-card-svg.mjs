import { copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const webgenRoot = resolve(scriptDir, '..')
const repositoryRoot = resolve(webgenRoot, '..')

const files = [
  ['xdn-e-passport-card-front.svg', 'src/assets/card-front.svg'],
  ['xdn-e-passport-card-back.svg', 'src/assets/card-back.svg'],
]

for (const [source, target] of files) {
  copyFileSync(resolve(repositoryRoot, source), resolve(webgenRoot, target))
}
