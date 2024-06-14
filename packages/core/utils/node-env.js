const __DEV__ = process.env.NODE_ENV !== "production";
const __ANA__ = process.env.ANALYZE === "true";

module.exports = {
  __DEV__,
  __ANA__,
};
