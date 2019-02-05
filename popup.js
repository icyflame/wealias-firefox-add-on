const inputBox = document.getElementById("inputbox");
const settings = document.getElementById("settings");
const alertdiv = document.getElementById("alert");

function showMessage(text, color, timeout){
	alertdiv.innerHTML = text;
	if (color != "")
		alertdiv.style.color = color;
	alertdiv.style.display = "block";
	inputbox.blur();
	inputbox.disabled = true;
	setTimeout(() => {
		alertdiv.style.display = "none";
		inputBox.value = "";
		inputBox.disabled = false;
		inputBox.focus();
	}, timeout);
}	


inputbox.addEventListener("keydown", (event) => {
	if (event.keyCode != 13) return;
	browser.runtime.sendMessage({command: "go", alias_url: inputbox.value}).then();
});

settings.addEventListener("click", (event) => {
	browser.runtime.openOptionsPage().then(window.close());
});

browser.runtime.onMessage.addListener((message) => {
	switch(message.command)
	{
		case "close_popup":
			window.close();
			break;
		case "bad_alias":
			showMessage("Alias <em>" + message.alias + "</em> doesn't exist!", "", 1000);
			break;
		case "bad_url":
			showMessage("Can't open <em>" + message.alias + "</em>. Illegal URL?", "", 2000);
			break;
		case "add_alias":
			showMessage("Alias <em>" + message.alias + "</em> added for URL in current tab.", "#006600", 3000);
			break;
		case "no_add":
			showMessage("Go to the settings page to allow FastAdd.","", 3000);
			break;
		case "no_add_alias":
			showMessage("New alias missing.", "", 2000);
			break;
		case "dup_add_alias":
			showMessage("Alias <em>" + message.alias + "</em> already exists.", "", 2000);
			break;
		case "bad_declare":
			showMessage("Alias <em>" + message.alias + "</em> doesn't have an URL.", "", 2000);
	}
});

