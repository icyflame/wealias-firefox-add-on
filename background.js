var alias_url = [];
var last_typed;
var currentTab;
var currentURL;

function divideArray(au){
	let a = Object.keys(au);
	let u = a.map(function(k){
		return au[k];
	});
	let returned_value = {aliases: a, urls: u};
	return returned_value;
}

function useSettings(settings){
	alias_url = [];
	for(let i = 0; i < settings.aliases.length; i++)
		alias_url[settings.aliases[i]] = settings.urls[i];
	alias_url["_add"] = "";
	alias_url["_addt"] = "";
}

function transformaAlias(text){
	let returned_value = {};
	if (!text)
		return;
	let arr = text.split(/\s+/);
	let alias = arr[0];
	let url = alias_url[alias];
	if (!(alias in alias_url))
	{
		url = alias_url["*"];
		if (!("*" in alias_url))
			return {alias: alias, url: alias}; //alias doesn't exist
	}
	else	
		arr.shift();
	if (url != "")
	{
		for (let i = (arr.length - 1); i >= 0; i--)
		{
			let elem = i + 1;
			if (url.search('`' + elem) != -1)
			{
				repla = new RegExp('`' + elem, "g");
				url = url.replace(repla, arr[i]);
				arr.splice(i, 1);				
			}
		}
		if (url.search('`s') == -1)
			url += arr.join(" ");		
		else
			url = url.replace('`s', arr.join(" "));
		returned_value = {alias: alias, url: url};
	}
	else //si l'url no existeix retornem la primera paraula de les que ha ficat (si ha ficat)
	{
		if (arr.length > 0)
			returned_value = {alias: alias, url: arr[0]};
		else
			returned_value = {alias: alias, url: ""}; // alias exists but there's no url
	}
	return returned_value;
}

function checkStoredSettings(storedSettings){
	const defaultSettings = {
		aliases: ["*"],
		urls: ["https://www.google.com/search?q="]
	};
	
	let settings;
	if (!storedSettings.aliases || !storedSettings.urls)
	{
		browser.storage.local.set(defaultSettings).then();
		settings = defaultSettings;
	}
	else
		settings = storedSettings;
	
	useSettings(settings);
}

browser.storage.local.get().then(checkStoredSettings);

browser.omnibox.setDefaultSuggestion({
  description: "WEAlias: Binding alias to URLs"
});

browser.runtime.onMessage.addListener((message) => {
	switch(message.command)
	{
		case "go":
			let resultat = transformaAlias(message.alias_url);
			let firstchar = resultat.alias.substr(0, 1);
			
			if (firstchar == "_")
			{
				if (currentURL == null)
					browser.runtime.sendMessage({command: "no_add"}).then();
				else
				{
					if (resultat.url == "")
						browser.runtime.sendMessage({command: "no_add_alias"}).then();
					else
					{
						if (resultat.url in alias_url)
							browser.runtime.sendMessage({command: "dup_add_alias", alias: resultat.url}).then();
						else
						{
							if (resultat.alias == "_addt")
								currentURL = "_" + currentURL
							alias_url[resultat.url] = currentURL;
							browser.storage.local.set(divideArray(alias_url)).then(() => {
								browser.runtime.sendMessage({command: "add_alias", alias: resultat.url}).then();
							});
						}
					}
				}
			}
			else
			{
				if (resultat.url == "")
					browser.runtime.sendMessage({command: "bad_declare", alias: resultat.alias}).then();
				else
				{
					if (resultat.url == resultat.alias)
						browser.runtime.sendMessage({command: "bad_alias", alias: resultat.alias}).then();
					else
					{
						if (resultat.url.substr(0,1) == "_")
							browser.tabs.create({url: resultat.url.slice(1)}).then(() => {
								browser.runtime.sendMessage({command: "close_popup"}).then();
							},() => {
								browser.runtime.sendMessage({command: "bad_url", alias: resultat.url}).then();
							});
						else
							browser.tabs.update({url: resultat.url}).then(() => {
								browser.runtime.sendMessage({command: "close_popup"}).then();
							},() => {
								browser.runtime.sendMessage({command: "bad_url", alias: resultat.url}).then();
							});
					}
				}
			}
			break;
		case "updated-alias":
			browser.storage.local.get().then((val) => {
				useSettings(val);
			});
	}
});

browser.commands.onCommand.addListener((command) => {
	if (command == "show_popup_in_tab")
		browser.tabs.create({url:"popup.html"});
});

browser.omnibox.onInputChanged.addListener((input, suggest) => {
	last_typed = transformaAlias(input);
	let msg = "";
	let firstchar = last_typed.alias.substr(0, 1);
	
	if (firstchar == "_")
	{
		if (currentURL == null)
			msg = "Go to the settings page to allow FastAdd"
		else
		{
			if (last_typed.url == "")
				msg = "Adding alias...";
			else
			{
				if (last_typed.url in alias_url)
					msg = "Alias '" + last_typed.url + "' already exists";
				else
					msg = "Add alias '" + last_typed.url + " " + currentURL + "'";
			}
		}
	}
	else
	{
		if (last_typed.url == "")
			msg = "Alias '" + last_typed.alias + "' doesn't have an URL";
		else
		{
			if (last_typed.url == last_typed.alias)
				msg = "Alias '" + last_typed.alias + "' doesn't exist";
			else
				msg = last_typed.url;
		}
	}
	
	suggest([{content: msg, description: "WEAlias"}]);
});

browser.omnibox.onInputEntered.addListener((text) => {
	let firstchar = last_typed.alias.substr(0, 1);
	
	if (firstchar == "_")
	{
		if (last_typed.url != "" && !(last_typed.url in alias_url) && currentURL != null)
		{
			if (last_typed.alias == "_addt")
				currentURL = "_" + currentURL
			alias_url[last_typed.url] = currentURL;
			browser.storage.local.set(divideArray(alias_url)).then();
		}
	}
	else
	{
		if (last_typed.url != "")
		{
			if (last_typed.url.substr(0,1) == "_")
				browser.tabs.create({url: last_typed.url.slice(1)}).then((last_typed = {}),(last_typed = {}));
			else
				browser.tabs.update({url: last_typed.url}).then((last_typed = {}),(last_typed = {}));
		}
	}
});

browser.tabs.onActivated.addListener((activeInfo) => {
	currentTab = activeInfo.tabId;
	browser.tabs.get(activeInfo.tabId).then((tabInfo) => {
		currentURL = tabInfo.url;
	});
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tabId == currentTab)
		currentURL = tab.url;
});