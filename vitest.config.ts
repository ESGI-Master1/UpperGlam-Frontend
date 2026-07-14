import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@theme': path.resolve(__dirname, 'src/theme'),
      '@analytics': path.resolve(__dirname, 'src/analytics'),
      '@assets': path.resolve(__dirname, 'assets'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
