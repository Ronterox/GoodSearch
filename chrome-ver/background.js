const MODIFIERS = { inUrl: "inurl:", fileType: "filetype:", site: "site:", show: '"', notShow: "-", showMore: "+" };
const MODS = Object.values(MODIFIERS);

chrome.omnibox.setDefaultSuggestion({ description: 'Write, then move with "TAB/SHIFT+TAB", select with "SPACEBAR"' });
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
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

chrome.omnibox.onInputEntered.addListener((text) => {
	chrome.search.query({ text }).catch((err) => console.log("Search error: " + err));
});
