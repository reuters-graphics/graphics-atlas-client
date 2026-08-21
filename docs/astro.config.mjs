import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://reuters-graphics.github.io',
  base: 'graphics-atlas-client',
  integrations: [
    starlight({
      title: 'Graphics Atlas',
      customCss: ['./src/styles/custom.css'],
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: true,
      },
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: 'https://graphics.thomsonreuters.com/style-assets/images/logos/favicon/favicon.ico',
            sizes: '32x32',
          },
        },
        { tag: 'meta', attrs: { name: 'robots', content: 'noindex' } },
      ],
      description:
        'Global country metadata client (ISO 3166) with translations, population and centroids, plus TopoJSON country + border maps.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/reuters-graphics/graphics-atlas-client' },
      ],
      sidebar: [
        { label: 'Overview', slug: 'overview' },
        {
          label: 'Guide',
          items: [
            { label: 'Metadata client', slug: 'metadata' },
            { label: 'TopoJSON maps', slug: 'topojson' },
          ],
        },
        { label: 'Explorer', slug: 'explorer' },
      ],
    }),
  ],
});
