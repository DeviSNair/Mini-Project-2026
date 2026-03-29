const path = require("path");

const webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      const sourceMapRule = webpackConfig.module?.rules?.find(
        (rule) => rule?.loader && rule.loader.includes('source-map-loader')
      );

      if (sourceMapRule) {
        const existingExclude = sourceMapRule.exclude
          ? Array.isArray(sourceMapRule.exclude)
            ? sourceMapRule.exclude
            : [sourceMapRule.exclude]
          : [];

        sourceMapRule.exclude = [...existingExclude, /node_modules/];
      }

      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          '**/public/**',
        ],
      };
      return webpackConfig;
    },
  },
};

module.exports = webpackConfig;
