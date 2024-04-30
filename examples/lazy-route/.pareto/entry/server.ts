
import home from '/Users/zhangyuanqing/works/github/pareto/examples/lazy-route/app/home/index.tsx';

import user from '/Users/zhangyuanqing/works/github/pareto/examples/lazy-route/app/user/index.tsx';


import { setRuntimeConfig } from "@pareto/core/node";

const pages = { home, user };

const assets = __non_webpack_require__('../client/webpack-assets.json');

setRuntimeConfig({ pages, assets });
