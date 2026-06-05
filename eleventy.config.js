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
import postcssGlobalData from '@csstools/postcss-global-data';
import browserslist from 'browserslist';
import { browserslistToTargets, Features, transform } from 'lightningcss';
import markdownit from 'markdown-it';
import markdownitattrs from 'markdown-it-attrs';
import markdownitcontainer from 'markdown-it-container';
import fs from 'node:fs';
import OpenProps from 'open-props';
import postcss from 'postcss';
import postcssCustomMedia from 'postcss-custom-media';
import postcssImport from 'postcss-import';
import postcssJit from 'postcss-jit-props';
import * as sass from 'sass';
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
    includes: './../_includes',
    layouts: './../_includes/layouts',
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
    './src/css/custom.woff2': '/custom.woff2',
  });

  // Watch CSS files
  eleventyConfig.addWatchTarget('./src/css/**/*.{css,scss}');

  let targets = browserslistToTargets(browserslist('> 0.2% and not dead'));

  // Use the native HTML transform plugin
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    // Crucial for Cloudflare Build Cache
    outputDir: '.cache/images/',
    urlPath: '/img/',
    // Set your global image configurations here
    formats: ['webp', 'avif', 'jpeg'],
    widths: [1200, 'auto'],
    htmlOptions: {
      imgAttributes: {
        loading: 'lazy',
        decoding: 'async',
      },
    },
  });

  eleventyConfig.addPlugin(pluginWebc, {
    components: ['./_includes/components/**/*.webc', 'npm:@11ty/eleventy-img/*.webc'],
    // ADD THIS BLOCK: Tells WebC to read .scss link imports natively
    preprocessors: {
      scss: src =>
        sass.compileString(src, {
          loadPaths: ['./src/css', './node_modules'],
        }).css,
    },
    bundlePluginOptions: {
      toFileDirectory: false,
      hoistDuplicateBundles: true,
      transforms: [
        async function (content) {
          if (this.type === 'css') {
            const result = sass.compileString(content, {
              alertColor: true,
              // Crucial: Tells Sass where to find files if you use @use or @import
              loadPaths: ['./src/css', './node_modules'],
              logger: sass.Logger.silent,
            });
            return result.css;
          }
          return content;
        },
        async function (content) {
          if (this.type === 'css') {
            const result = await postcss([
              // Inlines all remaining @import statements physically into the file

              postcssImport({
                path: ['./node_modules'],
              }),
              // A. Load OpenProps media definitions globally for PostCSS
              postcssGlobalData({
                files: ['./node_modules/open-props/media.min.css'],
              }),
              // B. Polyfill the @media (--md-n-below) strings into raw pixels
              postcssCustomMedia(),
              // C. Pull in standard OpenProps variables Just-In-Time
              postcssJit(OpenProps),
            ]).process(content, {
              from: this.page.inputPath,
              to: null,
            });

            return result.css;
          }
          return content;
        },
        async function (content) {
          if (this.type === 'css') {
            try {
              let { code } = transform({
                filename: 'bundle.css',
                code: Buffer.from(content), //r.toString()),
                minify: false,
                sourceMap: false,
                targets,
                exclude: Features.LogicalProperties,
                drafts: {
                  customMedia: true,
                },
              });

              return code;
            } catch (e) {
              console.log(e.toString());
              console.log(content.toString());
              throw e;
            }
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

  // Filters
  eleventyConfig.addPlugin(pluginFilters);

  // 3. Move files from Cloudflare's cache to the final build output directory
  eleventyConfig.on('eleventy.after', async ({ dir }) => {
    const sourceDir = '.cache/images/';
    const destDir = `${dir.output}/img/`;

    if (fs.existsSync(sourceDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.cpSync(sourceDir, destDir, { recursive: true });
    }
  });
}
