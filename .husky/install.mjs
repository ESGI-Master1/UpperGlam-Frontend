if (process.env.CI === 'true' || process.env.HUSKY === '0' || process.env.NODE_ENV === 'production') {
  process.exit(0);
}

try {
  const { default: husky } = await import('husky');
  husky();
} catch {
  process.exit(0);
}
