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
  // Generates a clean array of parent links for breadcrumbs
  eleventyConfig.addFilter('getBreadcrumbs', function (pageUrl, collectionsAll) {
    if (!pageUrl || pageUrl === '/') return [];

    let parts = pageUrl.split('/').filter(Boolean);
    let breadcrumbs = [{ label: 'Home', url: '/' }];
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath += `/${part}/`;
      // Find the corresponding page in Eleventy's master list to grab its true title
      let matchedPage = collectionsAll.find(p => p.url === currentPath);

      breadcrumbs.push({
        label: matchedPage?.data?.title || matchedPage?.data?.eleventyNavigation?.key || part,
        url: currentPath,
        // Mark the very last item as the active page
        isCurrent: index === parts.length - 1,
      });
    });

    return breadcrumbs;
  });

  // ONE UNIFIED HIGH-PERFORMANCE NAVIGATION FILTER:
  eleventyConfig.addFilter('getPostNav', function (collections) {
    if (!this.page?.inputPath || !collections?.posts) {
      return { prev: null, next: null };
    }

    // Run the array index search exactly ONCE for this page compile pass
    const idx = collections.posts.findIndex(post => post.inputPath === this.page.inputPath);

    if (idx === -1) {
      return { prev: null, next: null };
    }

    // Grab both elements instantly using direct, ultra-fast index offsets
    return {
      prev: idx > 0 ? collections.posts[idx - 1] : null,
      next: idx < collections.posts.length - 1 ? collections.posts[idx + 1] : null,
    };
  });

  eleventyConfig.addFilter('getPrev', function (collections) {
    if (!this.page?.inputPath || !collections?.posts) return null;

    // 1. Find the index number of the current page file inside your posts array
    const currentIndex = collections.posts.findIndex(post => post.inputPath === this.page.inputPath);

    // 2. If it's the first post, or not found, there is no previous item!
    if (currentIndex <= 0) return null;

    // 3. Return the exact previous item object array element natively
    return collections.posts[currentIndex - 1];
  });

  eleventyConfig.addFilter('getNext', function (collections) {
    if (!this.page?.inputPath || !collections?.posts) return null;

    // 1. Find the index number of the current page file inside your posts array
    const currentIndex = collections.posts.findIndex(post => post.inputPath === this.page.inputPath);

    // 2. If it's not found or it's the absolute last post, there is no next item!
    if (currentIndex === -1 || currentIndex === collections.posts.length - 1) return null;

    // 3. Return the exact next item object array element natively
    return collections.posts[currentIndex + 1];
  });
  eleventyConfig.addFilter('readableDate', (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || 'utc' }).toFormat(format || 'dd LLLL yyyy');
  });

  eleventyConfig.addFilter('htmlDateString', dateObj => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  // Update your reverse filter to safely handle early build ticks
  eleventyConfig.addFilter('reverse', function (array) {
    // FALLBACK GUARD: If Eleventy passes an undefined list early, return an empty array
    if (!array || !Array.isArray(array)) {
      return [];
    }

    // Reverse a shallow copy so you don't accidentally mutate the original data stream
    return [...array].reverse();
  });

  eleventyConfig.addFilter('reverseX', (/** @type {[]}*/ array) => {
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
