/**
 * @typedef {import("@11ty/eleventy/src/UserConfig")} EleventyConfig
 * @typedef {ReturnType<import("@11ty/eleventy/src/defaultConfig")>} EleventyReturnValue
 *
 * @type {(eleventyConfig: EleventyConfig) => EleventyReturnValue}
 */

import markdownit from "markdown-it";
import markdownitcontainer from "markdown-it-container";
import markdownitattrs from "markdown-it-attrs";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

function configureMarkdownIt() {
  return markdownit({ html: true })
    .use(markdownitattrs)
    .use(markdownitcontainer, "dynamic", {
      validate: function () {
        return true;
      },
      render: function (tokens, idx) {
        const token = tokens[idx];
        if (token.nesting === 1) {
          return '<div class="' + token.info.trim() + '">';
        } else {
          return "</div>";
        }
      },
    });
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/scripts/": "/scripts" });

  // Copy the contents of the `public` folder to the output folder
  // For example, `./public/css/` ends up in `_site/css/`
  eleventyConfig.addPassthroughCopy({
    "./public/": "/",
  });

  // Watch CSS files
  eleventyConfig.addWatchTarget("css/**/*.css");

  eleventyConfig.setLibrary("md", configureMarkdownIt());

  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    // Output formats for each image.
    formats: ["avif", "webp", "auto"],

    // widths: ["auto"],

    failOnError: false,
    htmlOptions: {
      imgAttributes: {
        // e.g. <img loading decoding> assigned on the HTML tag will override these values.
        loading: "lazy",
        decoding: "async",
      },
    },

    sharpOptions: {
      animated: true,
    },
  });

  return {
    dir: {
      input: "src",
      includes: "../_includes",
      data: "../_data", // default: "_data" (`input` relative)
      layouts: "../_includes/layouts",
      output: "_site",
    },
    templateFormats: ["md", "njk", "liquid", "html"],
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
  };
}
