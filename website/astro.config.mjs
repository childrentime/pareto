// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://paretojs.dev',
	integrations: [
		starlight({
			title: 'Pareto',
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
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
				{ tag: 'link', attrs: { href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap', rel: 'stylesheet' } },
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:site_name', content: 'Pareto' } },
				{
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					content: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'SoftwareApplication',
						name: 'Pareto',
						applicationCategory: 'DeveloperApplication',
						operatingSystem: 'Cross-platform',
						description: 'Lightweight React SSR framework with streaming, file-based routing, and built-in state management. Powered by Vite 7.',
						url: 'https://paretojs.dev',
						softwareVersion: '3.0.0',
						programmingLanguage: ['TypeScript', 'React'],
						license: 'https://opensource.org/licenses/MIT',
						offers: {
							'@type': 'Offer',
							price: '0',
							priceCurrency: 'USD',
						},
						codeRepository: 'https://github.com/childrentime/pareto',
					}),
				},
			],
		}),
	],
});
