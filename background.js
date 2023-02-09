browser.omnibox.setDefaultSuggestion({ description: "Query will be search across multiple search engines." });

let lastSearch = "";
async function search(text, engineName, tabId = undefined) {
	if (lastSearch != "") {
		tabId = await browser.tabs
			.query({})
			.then((tabs) => {
				for (let tab of tabs) {
					if (tab.url.includes(engineName.split()[0].toLowerCase()) && tab.title.includes(lastSearch)) {
						return tab.id;
					}
				}
				return undefined;
			})
			.catch((e) => console.log("Error:" + e));
	}
	return browser.search.search({ query: text, engine: engineName, tabId: tabId });
}

browser.omnibox.onInputEntered.addListener((text) => {
	browser.search.get().then(async (engines) => {
		let tabId = await browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0].id);
		let promises = [];
		for (let engine of engines) promises.push(search(text, engine.name));
		Promise.all(promises).then(() => {
			lastSearch = text;
			browser.tabs.remove(tabId);
		});
	});
});
