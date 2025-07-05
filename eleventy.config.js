/**
 * @typedef {import("@11ty/eleventy/src/UserConfig")} EleventyConfig

 *
 * @type {(eleventyConfig: EleventyConfig) => void}
 */

import { HtmlBasePlugin, InputPathToUrlTransformPlugin } from '@11ty/eleventy';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';
import pluginNavigation from '@11ty/eleventy-navigation';
import pluginSyntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import pluginWebc from '@11ty/eleventy-plugin-webc';
import browserslist from 'browserslist';
import { browserslistToTargets, transform } from 'lightningcss';
import markdownit from 'markdown-it';
import markdownitattrs from 'markdown-it-attrs';
import markdownitcontainer from 'markdown-it-container';
import pluginFilters from './_config/filters.js';

function configureMarkdownIt() {
  return markdownit({ html: true })
    .use(markdownitattrs)
    .use(markdownitcontainer, 'dynamic', {
      validate: function () {
        return true;
      },
      render: function (tokens, idx) {
        const token = tokens[idx];
        if (token.nesting === 1) {
          return '<div class="' + token.info.trim() + '">';
        } else {
          return '</div>';
        }
      },
    });
}

export const config = {
  dir: {
    input: 'src',
    data: '../_data', // default: "_data" (`input` relative)
    layouts: '_includes/layouts',
    output: '_site',
  },
  templateFormats: ['md', 'webc', 'liquid', 'html'],
  htmlTemplateEngine: 'liquid',
  markdownTemplateEngine: 'liquid',
};

/**
 *
 * @param {EleventyConfig} eleventyConfig
 */
export default async function (eleventyConfig) {
  // eleventyConfig.addPassthroughCopy({ 'src/scripts/': '/scripts' });

  // Copy the contents of the `public` folder to the output folder
  // For example, `./public/css/` ends up in `_site/css/`
  eleventyConfig
    .addPassthroughCopy({
      './public/pdf': '/pdf',
    })
    .addPassthroughCopy({
      './src/images': '/images',
    });

  // Watch CSS files
  eleventyConfig.addWatchTarget('css/**/*.css');

  let targets = browserslistToTargets(browserslist('> 0.2% and not dead'));

  eleventyConfig.addPlugin(pluginWebc, {
    componentsX: [
      // …
      // Add as a global WebC component
      'npm:@11ty/eleventy-img/*.webc',
      '_components/**/*.webc',
    ],
    components: ['./src/_includes/components/**/*.webc'],
    bundlePluginOptions: {
      transforms: [
        async function (content) {
          if (this.type === 'css') {
            let { code } = transform({
              code: Buffer.from(content),
              minify: false,
              sourceMap: false,
              targets,
            });
            return code;
          }
          return content;
        },
      ],
    },
  });

  eleventyConfig.setLibrary('md', configureMarkdownIt());

  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

  // Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    // Output formats for each image.
    formats: ['avif', 'webp', 'auto'],

    // widths: ["auto"],

    failOnError: false,
    htmlOptions: {
      imgAttributes: {
        // e.g. <img loading decoding> assigned on the HTML tag will override these values.
        loading: 'lazy',
        decoding: 'async',
      },
    },

    sharpOptions: {
      animated: true,
    },
  });

  // Filters
  eleventyConfig.addPlugin(pluginFilters);
}
