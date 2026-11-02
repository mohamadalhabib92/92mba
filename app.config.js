// baseUrl n'est utile que pour la PWA (GitHub Pages). Sur les builds natifs EAS,
// il préfixe les assets par "<slug>/", ce qui entre en collision avec
// l'exécutable de même nom (système de fichiers insensible à la casse).
// Il reste donc réservé au web : on ne le retire que lorsque EAS_BUILD est défini.
module.exports = ({ config }) => {
  if (!process.env.EXPO_NO_CAPABILITY_SYNC) {
    process.env.EXPO_NO_CAPABILITY_SYNC = '1';
  }
  config.ios = { ...(config.ios ?? {}), appleTeamId: 'Y9XF9RY2BU' };
  if (process.env.EAS_BUILD && config.experiments) {
    const { baseUrl, ...rest } = config.experiments;
    config.experiments = rest;
  }
  return config;
};
