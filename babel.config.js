module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@ui': './src/ui',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@api': './src/api',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@theme': './src/theme',
            '@analytics': './src/analytics',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};
