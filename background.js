const MODIFIERS = ['"', "-", "+", "inurl:", "filetype:", "site:"];
browser.omnibox.setDefaultSuggestion({ description: "Move with \"TAB/SHIFT+TAB\", select with \"SPACEBAR\"" });
browser.omnibox.onInputChanged.addListener((text, suggest) => {
	const dotPriority = (str) => (str.includes(".") ? str.length * 3 : str.length);
	const longerPriority = (a, b) => dotPriority(b) - dotPriority(a);

	let suggestions = [];
	for (let word of text.split(" ").sort(longerPriority)) {
		const createSuggestion = (actText, prefix, suffix = "") => {
			let wordQuery = prefix == "filetype:" ? word.substring(word.indexOf(".") + 1) : word;
			let words = text.split(" ");
			words[words.indexOf(word)] = prefix + wordQuery + suffix;
			suggestions.push({
				content: words.join(" "),
				description: `Must ${actText} "${word}"`,
			});
		};

		if (word.length < 2 || MODIFIERS.some((mod) => word.includes(mod))) continue;
		if (word.includes(".")) {
			createSuggestion("be in URL ", "inurl:");
			createSuggestion("be FILETYPE ", "filetype:");
			createSuggestion("be SITE ", "site:");
		}
		createSuggestion("SHOW ", '"', '"');
		createSuggestion("NOT show ", "-");
		createSuggestion("show MORE ", "+");
	}
	suggest(suggestions);
});

let lastSearch = "";
async function search(text, engineName, tabId = undefined) {
	if (lastSearch != "") {
		tabId = await browser.tabs
			.query({})
			.then((tabs) => {
				for (let tab of tabs) {
					if (tab.url.includes(engineName.split(" ")[0].toLowerCase()) && tab.title.includes(lastSearch)) {
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
