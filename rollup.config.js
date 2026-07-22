import externals from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

const plugins = [
  resolve({ preferBuiltins: true, modulesOnly: true }),
  json(),
  externals({ deps: true }),
];

const output = {
  dir: 'dist',
  format: 'cjs',
  paths: { '@reuters-graphics/graphics-atlas-client': './index.js' },
};

export default [{
  input: 'lib/index.js',
  output,
  plugins,
}];
