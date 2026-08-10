export default function (eleventyConfig) {
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

  eleventyConfig.addCollection('sortedBento', function (collectionApi) {
    return collectionApi.getFilteredByTag('woodlandLife').sort((a, b) => {
      // 1. Establish the size weight mapping hierarchy
      const sizeWeights = {
        feature: 1, // Big cards float to the absolute front
        medium: 2, // Medium cards come next
        '': 3, // Standard cards fall to the back
      };

      // 2. Fetch the sizes (safely falling back to a standard card if blank/omitted)
      const sizeA = sizeWeights[a.data.bentoSize] ?? 3;
      const sizeB = sizeWeights[b.data.bentoSize] ?? 3;

      // 3. Primary Sort: Compare the macro size weights
      if (sizeA !== sizeB) {
        return sizeA - sizeB;
      }

      // 4. Secondary Sort (Tie-Breaker): If sizes match, check optional order numbers
      // We default to 99 so unnumbered cards of the same size naturally sit at the end of their group
      const orderA = a.data.bentoOrder ?? 99;
      const orderB = b.data.bentoOrder ?? 99;

      return orderA - orderB;
    });
  });
}
