module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['jest.setup.js', 'jest.config.js', '**/__tests__/**'],
      env: {
        jest: true,
      },
    },
  ],
};
