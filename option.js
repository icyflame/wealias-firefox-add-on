var valor_inicial;
var canvis_fets = false;
const textarea = document.getElementById("alias-list");
const saveButton = document.getElementById("save-button");
const showHelp1 = document.getElementById("switch1");
const showHelp2 = document.getElementById("switch2");
const addyes = document.getElementById("addyes");


function storeSettings(){
	let aliases = [];
	let urls = []
	const t_area = textarea.value;
	var linies = t_area.split('\n');
	linies.sort();
	let j = 0;
	for (let i = 0; i < linies.length; i++)
	{
		let line = linies[i].split(/\s+/);
		let alias = line.shift();
		if (alias != "" && alias != " ")
		{
			aliases[j] = alias;
			urls[j] = line.join(" ");
			j++;
		}
	}
	
	browser.storage.local.set({aliases,urls}).then(() => {
		browser.runtime.sendMessage({
			command: "updated-alias"
		}).then(() => {
			browser.tabs.getCurrent().then((tab) => {
				browser.tabs.remove(tab.id).then();
			});
		});
	});
	
}

function updateUI(restoredSettings){
	let aliases = restoredSettings.aliases;
	let urls = restoredSettings.urls;
	let linies = "";
	for (let i = 0; i < aliases.length; i++)
	{
		if (aliases[i] != "_add" && aliases[i] != "_addt")
		{
			let linia = aliases[i] + " " + urls[i] + "\n";
			linies += linia;
		}
	}
	linies = linies.slice(0, linies.length - 1);
	valor_inicial = linies;
	textarea.value = linies;
	textarea.addEventListener("input", aliasesChanged);
}

function aliasesChanged(){
	let valor_actual = textarea.value;
	canvis_fets = (valor_actual != valor_inicial);
	if (canvis_fets)
	{
		textarea.style.backgroundColor = "#ffffcc";
		saveButton.disabled = false;
	}
	else
	{
		textarea.style.backgroundColor = "white";
		saveButton.disabled = true;
	}
}

function onClick(event){
	let id = event.currentTarget.id.slice(-1);
	let th = document.getElementById("text_help" + id);
	
	if (event.currentTarget.innerHTML == "Show help")
	{
		event.currentTarget.innerHTML = "Hide help";
		th.style.visibility = "visible";
	}
	else
	{
		event.currentTarget.innerHTML = "Show help";
		th.style.visibility = "hidden";
	}
}

function onChange(event){
	function requestPermission(){
		function onResponse(response){
			if (response) 	//permission granted
				addyes.checked = true;
			else			//permission not granted
				addyes.checked = false;
		}
	
		browser.permissions.request({permissions: ["tabs"]}).then(onResponse);
	}
	
	if (addyes.checked) //no estava marcat i el marco, demanar permisos
		requestPermission();
	else				//estava marcat i el desmarco, revocar permisos
		browser.permissions.remove({permissions: ["tabs"]}).then(() => {
			addyes.checked = false;
		})
}


browser.storage.local.get().then(updateUI);
browser.permissions.getAll().then((result) => {
	function checkPermission(p){
		return p == "tabs";
	}
	
	addyes.checked = (result.permissions.find(checkPermission) == "tabs")
});

saveButton.addEventListener("click", storeSettings);
showHelp1.addEventListener("click", onClick);
showHelp2.addEventListener("click", onClick);
addyes.addEventListener("change", onChange);
