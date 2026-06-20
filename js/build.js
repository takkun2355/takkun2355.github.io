// build.js
require('esbuild').build({
  entryPoints: ['js/typing.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  platform: 'browser',
  target: ['es2020'],
  sourcemap: true,
}).catch(() => process.exit(1));