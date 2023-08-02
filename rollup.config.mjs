import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";

const bundle = (config) => ({
  ...config,
  input: "src/index.ts",
  external: (id) => !/^[./]/.test(id)
});

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: `dist/main.js`,
        format: "cjs",
        sourcemap: true
      },
      {
        file: `dist/main.mjs`,
        format: "es",
        sourcemap: true
      }
    ]
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `dist/main.d.ts`,
      format: "es"
    }
  })
];
