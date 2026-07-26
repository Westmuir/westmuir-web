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
    const xx = collectionApi.getFilteredByTag('writtenPoems').sort((a, b) => {
      // Natural alphabetical/string sorting matches chronological progression perfectly!
      return (a.data.id ?? '2222').localeCompare(b.data.id ?? '9999');
    });

    console.log(xx.map(i => i.data.id));
    return xx;
  });
}
