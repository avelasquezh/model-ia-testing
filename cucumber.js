export default {
  default: {
    paths: ['spike/bdd/**/*.feature'],
    import: ['spike/bdd/**/*.steps.ts'],
    requireModule: ['tsx/esm'],
    format: ['progress'],
    publishQuiet: true
  }
};
