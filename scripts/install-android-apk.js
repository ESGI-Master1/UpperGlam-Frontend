const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');
const { buildAndroidEnv } = require('./android-env');

const apk = path.resolve('android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const packageName = 'com.upperglam.mobile';

try {
  if (!fs.existsSync(apk)) {
    throw new Error("APK local introuvable. Lance d'abord `npm run android` pour le compiler.");
  }

  const { env, androidSdkRoot } = buildAndroidEnv();
  const adb = path.join(
    androidSdkRoot,
    'platform-tools',
    process.platform === 'win32' ? 'adb.exe' : 'adb'
  );
  const install = spawnSync(adb, ['install', '-r', apk], { env, stdio: 'inherit' });

  if (install.status !== 0) {
    process.exit(install.status || 1);
  }

  spawnSync(
    adb,
    ['shell', 'monkey', '-p', packageName, '-c', 'android.intent.category.LAUNCHER', '1'],
    { env, stdio: 'inherit' }
  );
} catch (error) {
  console.error(`Erreur: ${error.message}`);
  process.exit(1);
}
