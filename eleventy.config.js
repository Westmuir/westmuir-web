/**
 * @typedef {import("@11ty/eleventy/src/UserConfig")} EleventyConfig

 *
 * @type {(eleventyConfig: EleventyConfig) => void}
 */

import { HtmlBasePlugin, InputPathToUrlTransformPlugin } from '@11ty/eleventy';
import { eleventyImagePlugin } from '@11ty/eleventy-img';
import pluginNavigation from '@11ty/eleventy-navigation';
import pluginSyntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import pluginWebc from '@11ty/eleventy-plugin-webc';
import browserslist from 'browserslist';
import { browserslistToTargets, Features, transform } from 'lightningcss';
import markdownit from 'markdown-it';
import markdownitattrs from 'markdown-it-attrs';
import markdownitcontainer from 'markdown-it-container';
import OpenProps from 'open-props';
import pluginFilters from './_config/filters.js';

import postcss from 'postcss';
import postcssJit from 'postcss-jit-props';

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
  markdownTemplateEngine: 'webc',
};

/**
 *
 * @param {EleventyConfig} eleventyConfig
 */
export default async function (eleventyConfig) {
  // eleventyConfig.addPassthroughCopy({ 'src/scripts/': '/scripts' });

  // Copy the contents of the `public` folder to the output folder
  // For example, `./public/css/` ends up in `_site/css/`
  eleventyConfig.addPassthroughCopy({
    './public/pdf': '/pdf',
    './src/css/custom.woff2': '/bundle/custom.woff2',
  });

  // Watch CSS files
  eleventyConfig.addWatchTarget('css/**/*.css');

  let targets = browserslistToTargets(browserslist('> 0.2% and not dead'));

  eleventyConfig.addPlugin(pluginWebc, {
    components: ['./src/_includes/components/**/*.webc', 'npm:@11ty/eleventy-img/*.webc'],
    bundlePluginOptions: {
      transforms: [
        async function (content) {
          if (this.type === 'css') {
            let { code } = transform({
              filename: 'bundle.css',
              code: Buffer.from(content), //r.toString()),
              minify: false,
              sourceMap: false,
              targets,
              exclude: Features.LogicalProperties,
            });

            return code;
          }
          return content;
        },
        async function (content) {
          if (this.type === 'css') {
            const result = await postcss([postcssJit(OpenProps)]).process(content, {
              from: this.page.inputPath,
              to: null,
            });

            return result.css;
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

  // Image plugin
  eleventyConfig.addPlugin(eleventyImagePlugin, {
    // Set global default options
    formats: ['avif', 'webp', 'jpeg'],
    urlPath: '/img/',

    // Notably `outputDir` is resolved automatically
    // to the project output directory

    defaultAttributes: {
      loading: 'lazy',
      decoding: 'async',
    },
  });

  // Filters
  eleventyConfig.addPlugin(pluginFilters);
}
