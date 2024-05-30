import * as path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Pareto',
  description: 'Pareto is an SSR (Server Side Rendering) framework centered on stream rendering.',
  icon: '/logo-icon.png',
  logo: {
    light: '/logo.png',
    dark: '/logo-dark.png',
  },
  themeConfig: {
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/childrentime/pareto' },
    ],
  },
});
