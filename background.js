const MODIFIERS = { inUrl: "inurl:", fileType: "filetype:", site: "site:", show: '"', notShow: "-", showMore: "+" };
const MODS = Object.values(MODIFIERS);

browser.omnibox.setDefaultSuggestion({ description: 'Move with "TAB/SHIFT+TAB", select with "SPACEBAR"' });
browser.omnibox.onInputChanged.addListener((text, suggest) => {
	const dotPriority = (str) => (str.includes(".") ? str.length * 3 : str.length);
	const lengthPriority = (a, b) => dotPriority(b) - dotPriority(a);

	let suggestions = [];
	for (let word of text.split(" ").sort(lengthPriority)) {
		const createSuggestion = (actText, prefix, suffix = "") => {
			let cleanWord = prefix == MODIFIERS.fileType ? word.substring(word.indexOf(".") + 1) : word;
			let modText = text.split(" ");
			modText[modText.indexOf(word)] = prefix + cleanWord + suffix;
			suggestions.push({
				content: modText.join(" "),
				description: `Must ${actText} "${word}"`,
			});
		};
		if (word.length < 2 || MODS.some((mod) => word.includes(mod))) continue;
		if (word.includes(".")) {
			createSuggestion("be in URL ", MODIFIERS.inUrl);
			createSuggestion("be FILETYPE ", MODIFIERS.fileType);
			createSuggestion("be SITE ", MODIFIERS.site);
		}
		createSuggestion("SHOW ", MODIFIERS.show, MODIFIERS.show);
		createSuggestion("NOT show ", MODIFIERS.notShow);
		createSuggestion("show MORE ", MODIFIERS.showMore);
	}
	suggest(suggestions);
});

let lastSearch = "";
async function search(text, engineName, tabId = undefined) {
	const isStillLastSearch = (tab) => tab.url.includes(engineName.split(" ")[0].toLowerCase()) && tab.title.includes(lastSearch);
	if (lastSearch != "") tabId = await browser.tabs.query({}).then((tabs) => tabs.find(isStillLastSearch));
	return browser.search.search({ query: text, engine: engineName, tabId: tabId });
}

browser.omnibox.onInputEntered.addListener((text) => {
	browser.search.get().then(async (engines) => {
		let tabId = await browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0].id);
		Promise.all(engines.map((engine) => search(text, engine.name, tabId))).then(() => {
			lastSearch = text;
			browser.tabs.remove(tabId);
		});
	});
});
