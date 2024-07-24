import glsl from "vite-plugin-glsl"
import legacy from "@vitejs/plugin-legacy"

/** @type {import('vite').UserConfig} */
export default {
  plugins: [
    glsl(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: true,
      renderLegacyChunks: true,
      // 添加 Babel 配置
      polyfills: [
        'es.array.flat',
        'es.array.flat-map',
        'es.promise',
        'es.promise.finally',
        'es/map',
        'es/set',
        'es.object.assign',
        'es.symbol',
        'es.symbol.description',
        'es.symbol.iterator',
      ],
      babel: {
        plugins: [
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-private-methods'
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