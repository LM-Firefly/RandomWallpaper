const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const workspaceRoot = process.cwd();
const buildDir = path.join(workspaceRoot, 'dist_electron');
const unpackedDir = path.join(buildDir, 'win-unpacked');
const outFile = path.join(buildDir, 'RandomWallpaper-portable.zip');

if (!fs.existsSync(unpackedDir)) {
  console.error('win-unpacked 目录不存在:', unpackedDir);
  process.exit(1);
}

const output = fs.createWriteStream(outFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`已生成：${outFile} (${archive.pointer()} bytes)`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
// 把 win-unpacked 整个目录压缩，保证解压后目录结构完整
archive.directory(unpackedDir, 'RandomWallpaper');
archive.finalize();
