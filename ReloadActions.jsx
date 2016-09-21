#target illustrator
function ReloadActions(){
	function removeActionSet(setName){
		var errorFlag = false;
		while(!errorFlag){
			try {
				app.unloadAction(setName, "");
			} catch (e) {
				errorFlag = true;
			}
		}
	};
	function loadActionSet(aiaFile){
		app.loadAction(aiaFile);
	};
	function reloadActionSet(aiaFile, setName){
		removeActionSet(setName);
		loadActionSet(aiaFile);
	};
	if((app.version.substr(0, 2) * 1) < 16){
		alert("Sorry, the Action Reloader script only works in versions CS6 and above.");
		return;
	}
	var actionFolder = Folder(Folder.myDocuments + "/" + "Illustrator Actions");
	if(!actionFolder.exists){
		alert("The folder for script-reloadable Actions is not found at '" + decodeURI(actionFolder) + "'");
		return;
	}
	var fileMask = ($.os.match("Windows"))? "*.aia" : function(f){return f.name.match(/\.aia$/);}
	var actionFiles = actionFolder.getFiles(fileMask);
	var thisFile, thisSetName;
	for (var i = 0; i < actionFiles.length; i++) {
		thisFile = actionFiles[i];
		thisSetName = decodeURI(thisFile.name).replace(".aia", "");
		reloadActionSet(thisFile, thisSetName);
	}
};
ReloadActions();
