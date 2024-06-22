const os = require("os");

/**
 * Transform the OS path separator in the content based on the platform, while writing to files.
 * in windows the path should be replaced with \\ in files, for example, "D:\\test"
 *
 * @param {string} content - The content with OS path separators.
 * @return {string} Transformed content with updated path separators.
 */
function transformSepOfPath(content) {
  switch (os.platform()) {
    case "win32":
      return content.replace(/\\/g, "\\\\");
    default:
      return content;
  }
}

module.exports = {
  transformSepOfPath,
};
