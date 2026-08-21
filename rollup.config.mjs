import externals from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

const plugins = [
  resolve({ preferBuiltins: true, modulesOnly: true }),
  json(),
  externals({ deps: true }),
];

// Dual build: CommonJS (require) + ES module (import).
export default [{
  input: 'lib/index.js',
  output: [
    { file: 'dist/index.js', format: 'cjs', exports: 'default' },
    { file: 'dist/index.mjs', format: 'es' },
  ],
  plugins,
}];
