const { spawn, spawnSync } = require('child_process');
const path = require('path');
const { buildAndroidEnv } = require('./android-env');

function hasConnectedDevice(adbCmd, env) {
  const result = spawnSync(adbCmd, ['devices'], { env, encoding: 'utf8' });
  if (result.status !== 0) {
    return false;
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .some((line) => line.endsWith('\tdevice'));
}

function listAvds(emulatorCmd, env) {
  const result = spawnSync(emulatorCmd, ['-list-avds'], { env, encoding: 'utf8' });
  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function startFirstAvd(emulatorCmd, env) {
  const avds = listAvds(emulatorCmd, env);
  if (avds.length === 0) {
    console.warn('Aucun AVD detecte. Ouvre Android Studio > Device Manager pour en creer un.');
    return;
  }

  const avdName = avds[0];
  console.log(`Demarrage de l emulateur: ${avdName}`);
  const child = spawn(emulatorCmd, ['-avd', avdName], { env, detached: true, stdio: 'ignore' });
  child.unref();
}

try {
  const { env, javaHome, androidSdkRoot } = buildAndroidEnv();

  const adbCmd =
    process.platform === 'win32'
      ? path.join(androidSdkRoot, 'platform-tools', 'adb.exe')
      : path.join(androidSdkRoot, 'platform-tools', 'adb');
  const emulatorCmd =
    process.platform === 'win32'
      ? path.join(androidSdkRoot, 'emulator', 'emulator.exe')
      : path.join(androidSdkRoot, 'emulator', 'emulator');

  if (!hasConnectedDevice(adbCmd, env)) {
    startFirstAvd(emulatorCmd, env);
  }

  const extraArgs = process.argv.slice(2);
  let run;
  if (process.platform === 'win32') {
    const commandArgs = ['expo', 'run:android', ...extraArgs]
      .map((arg) => (arg.includes(' ') ? `"${arg.replace(/"/g, '\\"')}"` : arg))
      .join(' ');
    run = spawn('cmd.exe', ['/d', '/s', '/c', `npx ${commandArgs}`], { stdio: 'inherit', env });
  } else {
    run = spawn('npx', ['expo', 'run:android', ...extraArgs], { stdio: 'inherit', env });
  }

  run.on('exit', (code) => {
    process.exit(code || 0);
  });

  run.on('error', (error) => {
    console.error(`Impossible de lancer expo run:android: ${error.message}`);
    process.exit(1);
  });

  console.log(`JAVA_HOME: ${javaHome}`);
  console.log(`ANDROID_SDK_ROOT: ${androidSdkRoot}`);
} catch (error) {
  console.error(`Erreur: ${error.message}`);
  process.exit(1);
}
