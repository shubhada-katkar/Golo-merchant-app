const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude nested projects and heavy directories from Metro bundler
config.watchFolders = [
  ...config.watchFolders.filter(folder => {
    const folderPath = path.resolve(folder);
    return !folderPath.includes('GOLO_Backend_new-main') &&
           !folderPath.includes('GOLO_Frontend_new-main') &&
           !folderPath.includes('golo-customer-app') &&
           !folderPath.includes('node_modules.bak');
  })
];

// Exclude these directories from file map
config.projectRoot = __dirname;

module.exports = config;
