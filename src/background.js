browser.omnibox.setDefaultSuggestion({ description: "Query will be search across multiple search engines." });

browser.omnibox.onInputEntered.addListener(text =>
{
    browser.search.get().then(engines =>
    {
        engines.forEach(eng =>
        {
            console.table(eng);
            browser.search.search({
                query: text,
                engine: eng.name
            });
        });
    });
});
