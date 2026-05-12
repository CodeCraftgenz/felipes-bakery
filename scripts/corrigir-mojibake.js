/**
 * Corrige mojibake (caracteres mal codificados) em arquivos do projeto.
 *
 * Mojibake comum: arquivo salvo como UTF-8 mas escrito interpretando
 * a entrada como Latin-1/Windows-1252. Resultado: "Ã¡" no lugar de "á".
 *
 * Uso: node scripts/corrigir-mojibake.js [diretório]
 * Padrão: corrige src/ e tests/ recursivamente.
 */

const fs    = require('node:fs')
const path  = require('node:path')

// ── Mapeamento mojibake → caractere correto ──────────────────
const SUBSTITUICOES = [
  // Minúsculas com acento
  ['Ã¡', 'á'], ['Ã¢', 'â'], ['Ã£', 'ã'], ['Ã ', 'à'],
  ['Ã©', 'é'], ['Ãª', 'ê'],
  ['Ã­', 'í'], ['Ã¯', 'ï'],
  ['Ã³', 'ó'], ['Ã´', 'ô'], ['Ãµ', 'õ'],
  ['Ãº', 'ú'], ['Ã¼', 'ü'],
  ['Ã§', 'ç'],
  ['Ã±', 'ñ'],

  // Maiúsculas com acento
  ['Ã€', 'À'], ['Ã', 'Á'], ['Ã‚', 'Â'], ['Ãƒ', 'Ã'],
  ['Ã‰', 'É'], ['ÃŠ', 'Ê'],
  ['Ã', 'Í'], ['ÃŒ', 'Ì'],
  ['Ã"', 'Ó'], ['Ã"', 'Ô'], ['Ã•', 'Õ'],
  ['Ãš', 'Ú'], ['Ãœ', 'Ü'],
  ['Ã‡', 'Ç'],

  // Pontuação inteligente / smart quotes
  ['â€"', '—'],   // travessão (em dash)
  ['â€"', '–'],   // hífen meio (en dash)
  ['â€™', '\''],  // aspa simples direita
  ['â€˜', '\''],  // aspa simples esquerda
  ['â€œ', '"'],   // aspa dupla esquerda
  ['â€', '"'],    // aspa dupla direita
  ['â€¦', '…'],   // reticências

  // Símbolos diversos
  ['Â°', '°'],
  ['Â§', '§'],
  ['Â®', '®'],
  ['Â©', '©'],
  ['Â¢', '¢'],
  ['Â£', '£'],
  ['Â¥', '¥'],
  ['Âª', 'ª'],
  ['Âº', 'º'],

  // "Â" sozinho antes de chars Latin-1 → quase sempre lixo, remove
  ['Â ', ' '],    // espaço não-quebra
]

// ── Coletor de arquivos ──────────────────────────────────────
function listarArquivos(dir, extensoes, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const cheio = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      listarArquivos(cheio, extensoes, acc)
    } else if (extensoes.some((e) => entry.name.endsWith(e))) {
      acc.push(cheio)
    }
  }
  return acc
}

// ── Corretor ─────────────────────────────────────────────────
function corrigir(arquivo) {
  const original = fs.readFileSync(arquivo, 'utf8')
  let corrigido = original
  for (const [errado, certo] of SUBSTITUICOES) {
    if (corrigido.includes(errado)) {
      corrigido = corrigido.split(errado).join(certo)
    }
  }
  if (corrigido !== original) {
    fs.writeFileSync(arquivo, corrigido, 'utf8')
    return true
  }
  return false
}

// ── Main ─────────────────────────────────────────────────────
function main() {
  const raizes = process.argv.slice(2)
  const diretorios = raizes.length > 0 ? raizes : ['src', 'tests']
  const extensoes  = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css']

  let alterados = 0
  let total     = 0

  for (const dir of diretorios) {
    if (!fs.existsSync(dir)) {
      console.warn(`[!] Diretório não existe: ${dir}`)
      continue
    }
    const arquivos = listarArquivos(dir, extensoes)
    for (const arq of arquivos) {
      total++
      if (corrigir(arq)) {
        console.log(`  ✓ ${arq}`)
        alterados++
      }
    }
  }

  console.log(`\n${alterados} arquivo(s) alterado(s) de ${total} verificado(s).`)
}

main()
