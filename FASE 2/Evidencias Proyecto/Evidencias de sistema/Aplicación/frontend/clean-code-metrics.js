import fs from 'fs';
import path from 'path';

const SRC_DIR = './src/app';

function getAllFiles(dir, ext, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, ext, files);
    } else if (ext.some(e => file.endsWith(e))) {
      files.push(fullPath);
    }
  });
  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('/*'));
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*'));
  const importCount = lines.filter(l => l.includes('import ')).length;
  const constructorEmpty = /constructor\s*\(\s*\)\s*{[^}]*}/.test(content);
  const unusedInjects = (content.match(/private\s+\w+\s*:\s*\w+/g) || []).filter(inj => !content.includes(inj.split(':')[0].replace('private', '').trim()));
  const methodCount = (content.match(/(public|private|protected)?\s*\w+\s*\(.*\)\s*{/g) || []).length;
  const interfaceUsage = (content.match(/:\s*\w+Interface/g) || []).length;
  const anyUsage = (content.match(/:\s*any/g) || []).length;
  return {
    filePath,
    totalLines: lines.length,
    codeLines: codeLines.length,
    commentLines: commentLines.length,
    importCount,
    constructorEmpty,
    unusedInjects: unusedInjects.length,
    methodCount,
    interfaceUsage,
    anyUsage,
  };
}

function main() {
  const files = getAllFiles(SRC_DIR, ['.ts', '.html', '.scss']);
  const results = files.map(analyzeFile);

  // Métricas globales
  const totalFiles = results.length;
  const totalLines = results.reduce((a, b) => a + b.totalLines, 0);
  const totalComments = results.reduce((a, b) => a + b.commentLines, 0);
  const totalImports = results.reduce((a, b) => a + b.importCount, 0);
  const totalEmptyConstructors = results.filter(r => r.constructorEmpty).length;
  const totalUnusedInjects = results.reduce((a, b) => a + b.unusedInjects, 0);
  const totalMethods = results.reduce((a, b) => a + b.methodCount, 0);
  const totalInterfaceUsage = results.reduce((a, b) => a + b.interfaceUsage, 0);
  const totalAnyUsage = results.reduce((a, b) => a + b.anyUsage, 0);

  console.log('--- Clean Code Metrics (Frontend src/app) ---');
  console.log(`Archivos analizados: ${totalFiles}`);
  console.log(`Líneas totales: ${totalLines}`);
  console.log(`Líneas de comentario: ${totalComments}`);
  console.log(`Cantidad de imports: ${totalImports}`);
  console.log(`Constructores vacíos: ${totalEmptyConstructors}`);
  console.log(`Inyecciones no usadas: ${totalUnusedInjects}`);
  console.log(`Métodos por clase (total): ${totalMethods}`);
  console.log(`Usos de interfaces: ${totalInterfaceUsage}`);
  console.log(`Usos de any: ${totalAnyUsage}`);
}

main();


// --- Clean Code Metrics (Frontend src/app) ---
// Archivos analizados: 112
// Líneas totales: 16987
// Líneas de comentario: 778
// Cantidad de imports: 289
// Constructores vacíos: 12
// Inyecciones no usadas: 0
// Métodos por clase (total): 572
// Usos de interfaces: 0
// Usos de any: 44
// (node:14784) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/proyecto-capstone/CAPSTONE_2025_1_SIF_GRUPO2/FASE%202/Evidencias%20Proyecto/Evidencias%20de%20sistema/Aplicaci%C3%B3n/frontend/clean-code-metrics.js is not specified and it doesn't parse as CommonJS.
// Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
// To eliminate this warning, add "type": "module" to C:\proyecto-capstone\CAPSTONE_2025_1_SIF_GRUPO2\FASE 2\Evidencias Proyecto\Evidencias de sistema\Aplicación\frontend\package.json.
// (Use `node --trace-warnings ...` to show where the warning was created)