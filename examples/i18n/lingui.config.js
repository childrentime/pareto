/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en', 'zh'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/app/{name}/locales/{locale}/messages',
      include: ['<rootDir>/app/{name}/'],
    },
  ],
  format: 'po',
}
