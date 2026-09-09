export default {
  default: {
    paths: ['spike/bdd/**/*.feature'],
    import: [
      './spike/bdd/tsx-register.mjs',
      'spike/bdd/**/*.steps.ts',
    ],
    format: ['progress'],
  },
};
