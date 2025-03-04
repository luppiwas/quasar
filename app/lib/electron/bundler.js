const fs = require('fs')
const
  appPath = require('../app-paths'),
  getPackageJson = require('../helpers/get-package-json'),
  getPackage = require('../helpers/get-package'),
  log = require('../helpers/logger')('app:electron-bundle')

const versions = {
  packager: '13.1.0',
  builder: '21.0.0'
}

function isValidName (bundlerName) {
  return ['packager', 'builder'].includes(bundlerName)
}

function installBundler (bundlerName) {
  const
    { spawnSync } = require('../helpers/spawn'),
    nodePackager = require('../helpers/node-packager'),
    cmdParam = nodePackager === 'npm'
      ? ['install', '--save-dev']
      : ['add', '--dev']

  log(`Installing required Electron bundler (electron-${bundlerName})...`)
  spawnSync(
    nodePackager,
    cmdParam.concat([`electron-${bundlerName}@${'^' + versions[bundlerName]}`]),
    appPath.appDir,
    () => warn(`⚠️  Failed to install electron-${bundlerName}`)
  )
}

function bundlerIsInstalled (bundlerName) {
  return getPackageJson(`electron-${bundlerName}`) !== void 0
}

module.exports.bundlerIsInstalled = bundlerIsInstalled

function bundlerVersionIsOk (bundlerName) {
  const
    semver = require('semver'),
    pkg = getPackageJson(`electron-${bundlerName}`)

  if (semver.satisfies(pkg.version, `>= ${versions[bundlerName]}`)) {
    return true
  }
}

module.exports.ensureInstall = function (bundlerName) {
  if (!isValidName(bundlerName)) {
    warn(`⚠️  Unknown bundler "${ bundlerName }" for Electron`)
    warn()
    process.exit(1)
  }

  if (!bundlerIsInstalled(bundlerName) || !bundlerVersionIsOk(bundlerName)) {
    installBundler(bundlerName)
  }
}

module.exports.getDefaultName = function () {
  if (bundlerIsInstalled('packager')) {
    return 'packager'
  }

  if (bundlerIsInstalled('builder')) {
    return 'builder'
  }

  return 'packager'
}

module.exports.getBundler = function (bundlerName) {
  return getPackage(`electron-${bundlerName}`)
}

module.exports.ensureBuilderCompatibility = function () {
  if (fs.existsSync(appPath.resolve.electron('icons/linux-256x256.png'))) {
    console.log()
    console.log(`\n⚠️  electron-builder requires a change to your src-electron/icons folder:
  * replace linux-256x256.png with a 512x512 px png file named "linux-512x512.png"
  * make sure to delete the old linux-256x256.png file
`)
    console.log()
    process.exit(1)
  }
}
