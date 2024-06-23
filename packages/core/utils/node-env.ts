const __DEV__ = process.env.NODE_ENV !== "production";
const __ANA__ = process.env.ANALYZE === "true";

export {
  __DEV__,
  __ANA__,
};
