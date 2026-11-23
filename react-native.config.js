/**
 * Sans EXPO_TV, aucune exclusion : l’iPhone lie comme avant.
 * Avec EXPO_TV=1, les modules sans tvOS ne sont pas proposés à use_native_modules.
 */
const { TV_AUTOLINK_EXCLUDE } = require('./scripts/tv-native.cjs');

if (process.env.EXPO_TV !== '1') {
  module.exports = {};
} else {
  const off = { platforms: { ios: null, tvos: null } };
  const dependencies = {};
  for (const name of TV_AUTOLINK_EXCLUDE) dependencies[name] = off;
  module.exports = { dependencies };
}
