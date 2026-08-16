// src/poems/poems.11tydata.js
export default {
  tags: 'writtenPoems',
  componentBucket: 'poem-global',
  pageBucket: 'poem-theme',
  eleventyComputed: {
    permalink: data => {
      // Safely read the parent folder slug using the dynamic data cascade
      return `/poems/${data.page.fileSlug}/index.html`;
    },
  },

  webc: {
    components: '~/src/poems/components/*.webc',
  },
};
