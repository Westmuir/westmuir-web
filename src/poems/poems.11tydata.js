// src/poems/poems.11tydata.js
export default {
  tags: 'writtenPoems',
  eleventyComputed: {
    permalink: data => {
      // Safely read the parent folder slug using the dynamic data cascade
      return `/other/poems/${data.page.fileSlug}/index.html`;
    },
  },
};
