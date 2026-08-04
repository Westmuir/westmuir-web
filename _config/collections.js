export default function (eleventyConfig) {
  eleventyConfig.addCollection('sectionCards', function (collectionApi) {
    let allPages = collectionApi.getAll();
    let sectionsMap = {};

    allPages.forEach(item => {
      let pathParts = item.filePathStem.split('/').filter(Boolean);

      if (pathParts.length >= 2) {
        let sectionKey = pathParts[0];
        let isIndexPage = pathParts[pathParts.length - 1] === 'index';

        // OPT-IN FILTER: Only include the page if 'inSectionNav: true' is explicitly set
        if (!isIndexPage && item.data.inSectionNav === true) {
          if (!sectionsMap[sectionKey]) {
            sectionsMap[sectionKey] = [];
          }

          sectionsMap[sectionKey].push({
            label: item.data.title || item.data.eleventyNavigation?.key,
            url: item.url,
            description: item.data.description,
            icon: item.data.icon || 'link',
            order: item.data.order || 0,
          });
        }
      }
    });

    for (let section in sectionsMap) {
      sectionsMap[section].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    }

    return sectionsMap;
  });

  // Register a beautifully sorted collection of your poems
  eleventyConfig.addCollection('writtenPoems', function (collectionApi) {
    return collectionApi.getFilteredByTag('writtenPoems').sort((a, b) => {
      // Natural alphabetical/string sorting matches chronological progression perfectly!
      return (b.data.id ?? '2222').localeCompare(a.data.id ?? '9999');
    });
  });

  // ADD THIS DEDICATED NAVIGATION MIX:
  eleventyConfig.addCollection('autoContext', function (collectionApi) {
    let allPages = collectionApi.getAll();
    let contextMap = {};

    allPages.forEach(item => {
      // Split the URL to find the parent folder slug
      let urlParts = item.url ? item.url.split('/').filter(Boolean) : [];

      if (urlParts.length >= 1) {
        let folderKey = urlParts[0]; // e.g., "Westmuir Hall" or "resilience-hub"
        let isIndexPage = item.url.endsWith('/') && urlParts.length === 1;

        // Only map the page if you explicitly flag it in front matter
        if (!isIndexPage && item.data.inContextNav === true) {
          if (!contextMap[folderKey]) {
            contextMap[folderKey] = [];
          }

          contextMap[folderKey].push({
            label: item.data.title || item.fileSlug,
            url: item.url,
            exact: true,
            order: item.data.order || 0,
          });
        }
      }
    });

    // Sort every mapped folder alphabetically or by numerical order key
    for (let folder in contextMap) {
      contextMap[folder].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    }
    return contextMap;
  });
}
