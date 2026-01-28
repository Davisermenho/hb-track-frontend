#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Função para corrigir setState direto em useEffect
function fixSetStateInEffect(content) {
  // Padrão para identificar setState direto em useEffect
  const pattern = /useEffect\(\(\) => \{\s*if \([^)]+\) \{\s*(set\w+\([^)]+\));/g;
  
  return content.replace(pattern, (match, setState) => {
    // Envolver setState em React.startTransition
    return match.replace(setState, `React.startTransition(() => {\n        ${setState};\n      });`);
  });
}

// Função para corrigir aspas não escapadas
function fixUnescapedQuotes(content) {
  // Padrão simples para aspas em JSX text
  return content.replace(/"([^"]+)"/g, '&ldquo;$1&rdquo;');
}

// Função para corrigir Date.now() em render
function fixDateNowInRender(content) {
  // Converter Date.now() para useMemo
  const pattern = /const (\w+) = \(\(\) => \{[^}]+Date\.now\(\)[^}]+\}\)\(\);/g;
  
  return content.replace(pattern, (match, varName) => {
    return `const ${varName} = useMemo(() => {${match.slice(match.indexOf('{') + 1, match.lastIndexOf('}'))}}, []);`;
  });
}

// Processar arquivos
const files = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });

console.log(`Processando ${files.length} arquivos...`);

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Aplicar correções
  content = fixSetStateInEffect(content);
  content = fixUnescapedQuotes(content);
  content = fixDateNowInRender(content);
  
  // Salvar se houve mudanças
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Corrigido: ${file}`);
  }
});

console.log('Correções aplicadas!');