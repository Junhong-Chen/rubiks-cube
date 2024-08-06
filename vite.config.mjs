import glsl from "vite-plugin-glsl"
import babel from 'vite-plugin-babel'

/** @type {import('vite').UserConfig} */
export default {
  plugins: [
    glsl(),
    babel({
      babelConfig: {
        plugins: [
          ['@babel/plugin-proposal-class-properties', { loose: true, legacy: true }],
          ['@babel/plugin-proposal-private-methods', { loose: true }]
        ]
      }
    })
  ],
  build: {
    target: 'es2015'
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
}