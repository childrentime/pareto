// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://paretojs.tech',
	integrations: [
		starlight({
			title: 'Pareto',
			favicon: '/favicon.png',
			lastUpdated: true,
			description: 'Lightweight React SSR framework with streaming, file-based routing, and built-in state management.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/childrentime/pareto' }],
			editLink: {
				baseUrl: 'https://github.com/childrentime/pareto/edit/main/website/',
			},
			customCss: [
				'@fontsource-variable/dm-sans',
				'./src/styles/custom.css',
			],
			components: {
				Hero: './src/components/Hero.astro',
				Header: './src/components/Header.astro',
				Head: './src/components/Head.astro',
			},
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				zh: { label: '简体中文', lang: 'zh-CN' },
			},
			sidebar: [
				{
					label: 'Getting Started',
					translations: { 'zh-CN': '快速上手' },
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'Core Concepts',
					translations: { 'zh-CN': '核心概念' },
					autogenerate: { directory: 'concepts' },
				},
				{
					label: 'API Reference',
					translations: { 'zh-CN': 'API 参考' },
					autogenerate: { directory: 'api' },
				},
			],
			head: [
				{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/instrument-serif-latin-400-italic.woff2', as: 'font', type: 'font/woff2', crossorigin: '' } },
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:site_name', content: 'Pareto' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://paretojs.tech/og-image.png' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://paretojs.tech/og-image.png' } },
			],
		}),
	],
});
