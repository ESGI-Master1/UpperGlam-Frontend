const { spawn, spawnSync } = require('child_process');
const path = require('path');
const { buildAndroidEnv } = require('./android-env');

const packageName = 'com.upperglam.mobile';

try {
  const { env, androidSdkRoot } = buildAndroidEnv();
  const adb = path.join(
    androidSdkRoot,
    'platform-tools',
    process.platform === 'win32' ? 'adb.exe' : 'adb'
  );
  const devices = spawnSync(adb, ['devices'], { env, encoding: 'utf8' });
  const hasDevice = devices.stdout
    .split('\n')
    .map((line) => line.trim())
    .some((line) => line.endsWith('\tdevice'));

  if (!hasDevice) {
    throw new Error('Aucun telephone Android autorise detecte par ADB.');
  }

  spawnSync(adb, ['reverse', 'tcp:8081', 'tcp:8081'], { env, stdio: 'inherit' });

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const metro = spawn(command, ['expo', 'start', '--dev-client'], {
    env,
    stdio: 'inherit',
  });

  const launchTimer = setTimeout(() => {
    spawnSync(
      adb,
      ['shell', 'monkey', '-p', packageName, '-c', 'android.intent.category.LAUNCHER', '1'],
      { env, stdio: 'inherit' }
    );
  }, 5000);

  metro.on('exit', (code) => {
    clearTimeout(launchTimer);
    process.exit(code || 0);
  });
  metro.on('error', (error) => {
    clearTimeout(launchTimer);
    console.error(`Impossible de lancer Metro: ${error.message}`);
    process.exit(1);
  });
} catch (error) {
  console.error(`Erreur: ${error.message}`);
  process.exit(1);
}
