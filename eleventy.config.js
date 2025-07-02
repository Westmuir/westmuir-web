/**
 * @typedef {import("@11ty/eleventy/src/UserConfig")} EleventyConfig
 * @typedef {ReturnType<import("@11ty/eleventy/src/defaultConfig")>} EleventyReturnValue
 *
 * @type {(eleventyConfig: EleventyConfig) => EleventyReturnValue}
 */

import { HtmlBasePlugin, InputPathToUrlTransformPlugin } from '@11ty/eleventy';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';
import pluginNavigation from '@11ty/eleventy-navigation';
import markdownit from 'markdown-it';
import markdownitattrs from 'markdown-it-attrs';
import markdownitcontainer from 'markdown-it-container';

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

export default function (eleventyConfig) {
  // eleventyConfig.addPassthroughCopy({ 'src/scripts/': '/scripts' });

  // Copy the contents of the `public` folder to the output folder
  // For example, `./public/css/` ends up in `_site/css/`
  eleventyConfig.addPassthroughCopy({
    './public/pdf': '/pdf',
  });

  // Watch CSS files
  eleventyConfig.addWatchTarget('css/**/*.css');

  // Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
  // Bundle <style> content and adds a {% css %} paired shortcode
  eleventyConfig.addBundle('css', {
    toFileDirectory: 'css',
    // Add all <style> content to `css` bundle (use <style eleventy:ignore> to opt-out)
    // Supported selectors: https://www.npmjs.com/package/posthtml-match-helper
    bundleHtmlContentFromSelector: 'style',
  });

  // Bundle <script> content and adds a {% js %} paired shortcode
  eleventyConfig.addBundle('js', {
    toFileDirectory: 'js',
    // Add all <script> content to the `js` bundle (use <script eleventy:ignore> to opt-out)
    // Supported selectors: https://www.npmjs.com/package/posthtml-match-helper
    bundleHtmlContentFromSelector: 'script',
  });

  eleventyConfig.setLibrary('md', configureMarkdownIt());

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

  return {
    dir: {
      input: 'src',
      data: '../_data', // default: "_data" (`input` relative)
      layouts: '_includes/layouts',
      output: '_site',
    },
    templateFormats: ['md', 'njk', 'liquid', 'html'],
    htmlTemplateEngine: 'liquid',
    markdownTemplateEngine: 'liquid',
  };
}
