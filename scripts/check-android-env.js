const { spawnSync } = require('child_process');
const path = require('path');
const { buildAndroidEnv } = require('./android-env');

try {
  const { env, javaHome, androidSdkRoot } = buildAndroidEnv();

  const javaCmd = process.platform === 'win32' ? path.join(javaHome, 'bin', 'java.exe') : path.join(javaHome, 'bin', 'java');
  const adbCmd =
    process.platform === 'win32'
      ? path.join(androidSdkRoot, 'platform-tools', 'adb.exe')
      : path.join(androidSdkRoot, 'platform-tools', 'adb');

  console.log(`JAVA_HOME: ${javaHome}`);
  console.log(`ANDROID_SDK_ROOT: ${androidSdkRoot}`);

  const javaVersion = spawnSync(javaCmd, ['-version'], { env, encoding: 'utf8' });
  if (javaVersion.status !== 0) {
    throw new Error(javaVersion.stderr || 'Impossible d executer java -version');
  }

  const adbVersion = spawnSync(adbCmd, ['--version'], { env, encoding: 'utf8' });
  if (adbVersion.status !== 0) {
    throw new Error(adbVersion.stderr || 'Impossible d executer adb --version');
  }

  const avds = spawnSync(
    process.platform === 'win32'
      ? path.join(androidSdkRoot, 'emulator', 'emulator.exe')
      : path.join(androidSdkRoot, 'emulator', 'emulator'),
    ['-list-avds'],
    { env, encoding: 'utf8' }
  );
  if (avds.status !== 0) {
    throw new Error(avds.stderr || 'Impossible de lister les AVD Android');
  }

  const avdList = avds.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (avdList.length === 0) {
    throw new Error('Aucun emulateur Android (AVD) trouve. Cree un device dans Android Studio.');
  }

  console.log(`AVD detecte: ${avdList[0]}`);
  console.log('Environnement Android pret');
} catch (error) {
  console.error(`Erreur: ${error.message}`);
  process.exit(1);
}
