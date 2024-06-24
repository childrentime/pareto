/* eslint-disable */
const crypto = require('crypto')

function createHash(source) {
  const hash = crypto.createHash('md5')
  hash.update(source)
  return hash.digest('hex')
}

function stringifyRequest(loaderContext, request) {
  return JSON.stringify(
    loaderContext.utils.contextify(loaderContext.context, request),
  )
}

module.exports = function loader() {}
module.exports.pitch = function pitch(request) {
  if (this.cacheable) {
    this.cacheable()
  }

  const insertCss = require.resolve('./insertCss.js')
  const filePath = this.resourcePath
  const hash = createHash(filePath)

  return `
    var refs = 0;
    var css = require(${stringifyRequest(this, `!!${request}`)});
    var insertCss = require(${stringifyRequest(this, `!${insertCss}`)});
    var content = typeof css === 'string' ? [['${hash}', css, '']] : [['${hash}',...css[0].slice(1)]];

    exports = module.exports = css.locals || {};
    exports._getContent = function() { return content[0][1]; };
    exports._getCss = function() { return '' + css; };
    exports._getHash = function() { return '${hash}'; };
    exports._insertCss = function(options) { return insertCss(content, options) };

    // Hot Module Replacement
    // https://webpack.github.io/docs/hot-module-replacement
    // Only activated in browser context
    if (module.hot && typeof window !== 'undefined' && window.document) {
      var removeCss = function() {};
      module.hot.accept(${stringifyRequest(this, `!!${request}`)}, function() {
        css = require(${stringifyRequest(this, `!!${request}`)});
        content = typeof css === 'string' ? [['${hash}', css, '']] : [['${hash}',...css[0].slice(1)]];
        removeCss = insertCss(content, { replace: true });
      });
      module.hot.dispose(function() { removeCss(); });
    }
  `
}
