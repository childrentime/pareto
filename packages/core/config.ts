import type { Configuration } from "@rspack/core";

export type ParetoConfig = {
  pageDir?: string;
  configureRspack?: (config: RspackConfiguration, options: {
    isServer: boolean;
  }) => RspackConfiguration;
};

export type RspackConfiguration = Configuration;