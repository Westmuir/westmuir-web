import { DateTime } from 'luxon';

/**
 * @typedef {import("@11ty/eleventy/src/UserConfig")} EleventyConfig
 */

/**
 *
 * @param {EleventyConfig} eleventyConfig
 * @returns
 */
export default function (eleventyConfig) {
  eleventyConfig.addFilter('readableDate', (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || 'utc' }).toFormat(format || 'dd LLLL yyyy');
  });

  eleventyConfig.addFilter('htmlDateString', dateObj => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter('reverse', (/** @type {[]}*/ array) => {
    return [...array].reverse();
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('slice', (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }

    return array.slice(0, n);
  });

  // Return the smallest number argument
  eleventyConfig.addFilter('min', (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  // Return the keys used in an object
  eleventyConfig.addFilter('getKeys', target => {
    return Object.keys(target);
  });

  eleventyConfig.addFilter('filterTagList', function filterTagList(tags) {
    return (tags || []).filter(tag => ['all', 'posts'].indexOf(tag) === -1);
  });

  eleventyConfig.addFilter('categoryFilter', (collection, category) => {
    return collection.filter(item => {
      const expired = item.data.expires && item.data.expires < DateTime.now();
      return !expired && item.data?.categories?.includes(category);
      //&&
      //DateTime.fromFormat(item.data?.expires ?? '2099-12-31', 'yyyy-LL-dd') > DateTime.now()
    });
  });

  eleventyConfig.addFilter('sortAlphabetically', strings => (strings || []).sort((b, a) => b.localeCompare(a)));
}
