const fs = require('fs');
const os = require('os');
const path = require('path');

function fileExists(targetPath) {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

function findJavaHome() {
  const envJavaHome = process.env.JAVA_HOME;
  if (envJavaHome && fileExists(path.join(envJavaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) {
    return envJavaHome;
  }

  if (process.platform === 'win32') {
    const roots = ['C:\\Program Files\\Eclipse Adoptium', 'C:\\Program Files\\Java'];
    for (const root of roots) {
      if (!fileExists(root)) {
        continue;
      }
      const dirs = fs
        .readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(root, entry.name))
        .sort((a, b) => b.localeCompare(a));

      for (const candidate of dirs) {
        const javaBin = path.join(candidate, 'bin', 'java.exe');
        if (fileExists(javaBin)) {
          return candidate;
        }
      }
    }
  }

  return null;
}

function findAndroidSdkRoot() {
  const envCandidates = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(Boolean);
  const defaultCandidates = [path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk')];

  for (const candidate of [...envCandidates, ...defaultCandidates]) {
    const adbPath = path.join(candidate, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
    if (fileExists(adbPath)) {
      return candidate;
    }
  }

  return null;
}

function buildAndroidEnv(baseEnv = process.env) {
  const javaHome = findJavaHome();
  const androidSdkRoot = findAndroidSdkRoot();

  if (!javaHome) {
    throw new Error('JDK introuvable. Installe Java 17 et configure JAVA_HOME.');
  }

  if (!androidSdkRoot) {
    throw new Error('Android SDK introuvable. Verifie Android Studio et platform-tools.');
  }

  const env = {};
  for (const [key, value] of Object.entries(baseEnv)) {
    if (!key.startsWith('=') && typeof value === 'string') {
      env[key] = value;
    }
  }
  env.JAVA_HOME = javaHome;
  env.ANDROID_HOME = androidSdkRoot;
  env.ANDROID_SDK_ROOT = androidSdkRoot;

  const pathEntries = [
    path.join(javaHome, 'bin'),
    path.join(androidSdkRoot, 'platform-tools'),
    path.join(androidSdkRoot, 'emulator'),
    path.join(androidSdkRoot, 'cmdline-tools', 'latest', 'bin'),
  ].filter(fileExists);

  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'Path';
  const currentPath = env[pathKey] || '';
  const existing = currentPath.split(path.delimiter).filter(Boolean);
  const merged = [...pathEntries, ...existing.filter((entry) => !pathEntries.includes(entry))];

  env[pathKey] = merged.join(path.delimiter);
  if (pathKey === 'Path') {
    delete env.PATH;
  } else {
    delete env.Path;
  }

  return { env, javaHome, androidSdkRoot };
}

module.exports = {
  buildAndroidEnv,
};
