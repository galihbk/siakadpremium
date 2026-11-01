/**
 * Mengubah hasil build (dist/**\/*.js) menjadi bytecode V8 (.jsc) agar isi image tidak bisa dibaca
 * dengan `cat`. Tiap .js diganti stub kecil yang memuat .jsc-nya, jadi struktur modul tidak berubah.
 *
 * Hanya dijalankan di tahap build Docker. Bytecode terikat versi Node: image runtime harus memakai
 * versi Node yang sama dengan tahap build.
 */
const fs = require('fs');
const path = require('path');
const bytenode = require('bytenode');

const root = path.resolve(process.argv[2] || 'dist');
if (!fs.existsSync(root)) {
  console.error(`Folder tidak ditemukan: ${root}`);
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

(async () => {
  const files = walk(root);
  let n = 0;
  for (const f of files) {
    if (f.endsWith('.map') || f.endsWith('.d.ts')) {
      fs.rmSync(f);
      continue;
    }
    if (!f.endsWith('.js')) continue;
    await bytenode.compileFile({ filename: f, output: f.replace(/\.js$/, '.jsc'), compileAsModule: true, loaderFilename: '%.js' });
    n++;
  }
  console.log(`Bytecode: ${n} file dikompilasi di ${root}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
