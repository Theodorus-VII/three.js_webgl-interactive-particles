export default {
  root: "src/",
  publicDir: "../static/",
  base: "./",
  server: {
    host: true, // Open to local network and display URL
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true
  },
};
