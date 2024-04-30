const babelConfig = (isWebTarget) => {
  return {
    presets: [
      [
        "@babel/preset-env",
        {
          useBuiltIns: "usage",
          modules: "commonjs",
          corejs: 2,
          targets: {
            node: "current",
          },
        },
      ],
      [
        "@babel/preset-react",
        {
          runtime: "automatic",
        },
      ],
      "@babel/preset-typescript",
    ],
    plugins: [
      process.env.NODE_ENV !== "production" &&
        isWebTarget &&
        require.resolve("react-refresh/babel"),
    ].filter(Boolean),
  };
};

module.exports = babelConfig;
