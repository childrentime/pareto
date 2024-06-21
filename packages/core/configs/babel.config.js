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
    // TODO: 看一看cra是怎么让用户自定义配置babel的
    plugins: [
      "macros",
      process.env.NODE_ENV !== "production" &&
        isWebTarget &&
        require.resolve("react-refresh/babel"),
    ].filter(Boolean),
  };
};

module.exports = babelConfig;
