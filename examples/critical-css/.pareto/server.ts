import home from '/Users/zhangyuanqing/works/github/pareto/examples/critical-css/app/home/index.tsx';

import { setRuntimeConfig } from "@pareto/core/node";

;const pages = { home };

const assets = __non_webpack_require__('../webpack-assets.json');

setRuntimeConfig({ pages, assets });
