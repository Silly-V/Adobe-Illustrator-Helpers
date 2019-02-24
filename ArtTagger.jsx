#target illustrator
#targetengine "main"

function ArtItemTagger() {

  var Tagger = {
  BridgeTalkActions: {
   asSourceStringObj: function(obj) {
    return obj.toSource();
   },
   bridgeTalkEncode: function(txt) {
    txt = encodeURIComponent(txt);
    txt = txt.replace(/\r/, "%0d");
    txt = txt.replace(/\n/, "%0a");
    txt = txt.replace(/\\/, "%5c");
    txt = txt.replace(/'/g, "%27");
    return txt.replace(/"/g, "%22");
   },
   sendBTmsg: function(objStr, targetApp, resultFunc) {
    var bt = new BridgeTalk;
    bt.target = targetApp;
    var btMsg = Tagger.BridgeTalkActions.bridgeTalkEncode(objStr);


    btMsg = "var scp ='" + btMsg + "'";
    btMsg += ";\nvar scpDecoded = decodeURI( scp );\n";
    btMsg += "eval( scpDecoded );";


    bt.body = btMsg;
    /*alert(bt.body);/*###*/
    if (typeof resultFunc == "function") {
     bt.onResult = resultFunc;
     /* resultFunc takes the (result) default argument that's implied.*/
    }
    bt.send();
   }
  },
  UI: {
   tabPalette: function() {
    var w = new Window("palette");
    w.margins = [0, 0, 0, 0];
    var btn = w.add("button", undefined, "Tagger");
    btn.size = [100, 35];

    function writeDebugFile(contents) {
     var f = File("~/Desktop/debug.txt");
     f.open('w');
     f.write(contents);
     f.close();
    };
    btn.onClick = function() {
     var str = "var Tagger = " + Tagger.BridgeTalkActions.asSourceStringObj(Tagger).toString().replace(/(^\(|\)$)/g, '') + "\rTagger.init();";
     /*writeDebugFile(str);*/
     /*return;*/
     Tagger.BridgeTalkActions.sendBTmsg(
      str,
      ("illustrator-" + app.version.substr(0, 2))
     );
    };
    w.show();
   },
   makeEditableReadonlyEdittext: function(parent, chars, defaultText) {
    /* an edittext group which holds 2 inputs so that it can be toggled for editability*/
    defaultText = defaultText || "";
    chars = chars || 20;
    var stackGroup = parent.add("group");
    stackGroup.orientation = "stack";
    var readonlyEdittext = stackGroup.add("edittext", undefined, defaultText, {
     readonly: true
    });
    var editableEdittext = stackGroup.add("edittext", undefined, defaultText);
    readonlyEdittext.characters = editableEdittext.characters = chars;
    return {
     editable: editableEdittext,
     readonly: readonlyEdittext,
     getValue: function() {
      if (this.editable.visible) {
       return this.editable.text;
      } else {
       return this.readonly.text;
      }
     },
     setValue: function(value) {
      this.editable.text = this.readonly.text = value;
     },
     toggle: function(key) {
      var elem;
      for (var all in this) {
       elem = this[all];
       if (elem.hasOwnProperty("type") && elem.type == "edittext") {
        if (all == key) {
         elem.visible = true;
        } else {
         elem.visible = false;
        }
       }
      }
     }
    };
   },
   makeInputControl: function(parent, elem, argsObj) {
    /* { name : string(name) , value : string(value), helpTip : string(help-string), (processFunction : function) }*/
    var g = parent.add("group");
    var lbl = g.add("statictext", undefined, argsObj.name + ":");
    var e = this.makeEditableReadonlyEdittext(g, 20, elem[argsObj.name]);
    e.toggle("readonly");
    e.readonly.helpTip = argsObj.helpTip;
    var btn = g.add("button", undefined, "Edit");
    btn.onClick = function() {
     if (this.text == "Edit") {
      e.toggle("editable");
      e.editable.active = false;
      e.editable.active = true;
      this.text = "Set";
     } else {
      var textString = e.getValue();
      elem[argsObj.name] = textString;
      if (argsObj.hasOwnProperty("processFunction")) {
       argsObj.processFunction(elem);
      }
      e.setValue(textString);
      e.toggle("readonly");
      this.text = "Edit";
     }
    }
   },
   displayTagsList: function(list, elem) {
    list.removeAll();
    var itemTags = Tagger.documentActions.getTags(elem),
     thisTag, listItem;
    for (var i = 0; i < itemTags.length; i++) {
     thisTag = itemTags[i];
     listItem = list.add("item");
     listItem.text = thisTag.name;
     listItem.subItems[0].text = thisTag.value;
    }
   },
   tagDialog: function(tagObj, elem, purpose) {
    /* { name : string(name) , value : string(value) }*/
    var w = new Window("dialog", "Tag Options");


    var g = w.add("group");
    var g1 = g.add("panel", undefined, "Tag Name");
    var e1 = g1.add("edittext", undefined, tagObj.name);
    e1.characters = 20;


    e1.onChanging = function() {
     this.text = this.text.replace(/[^\w\d_]/g, "_");
    };


    var g2 = g.add("panel", undefined, "Tag Value");
    var e2 = g2.add("edittext", undefined, tagObj.value);
    e2.characters = 20;


    var g_btn = w.add("group");
    var btn_ok = g_btn.add("button", undefined, "Ok");
    var btn_ccl = g_btn.add("button", undefined, "Cancel");


    if (w.show() == 2) {
     return false;
    } else {
     var thisTag;
     if (purpose == "edit") {
      thisTag = elem.tags.getByName(tagObj.name);
     } else if (purpose == "add") {
      thisTag = elem.tags.add();
     }
     thisTag.name = e1.text;
     thisTag.value = e2.text;
     return true;
    }
   },
   mainDialog: function() {
    var w = new Window("dialog", "Tagger");
    w.spacing = 4;


    var g_props = w.add("panel", undefined, Tagger.selectedItem.typename + " Properties:");
    g_props.alignChildren = "right";
    for (var all in Tagger.propObj) {
     this.makeInputControl(g_props, Tagger.selectedItem, Tagger.propObj[all]);
    }


    var g_tagList = w.add("group");
    g_tagList.orientation = "column";


    var list = g_tagList.add("listbox", undefined, [], {
     numberOfColumns: 2,
     showHeaders: true,
     columnTitles: ["Tag Name", "Value"],
     columnWidths: [100, 200]
    });
    list.size = [340, 200];
    g_tagList.helpTip = "This list shows the Adobe illustrator tags assigned to art items." +
     "The 'tag' is a way to store custom data to an art object, and some tags get assigned automatically when a certain user action " +
     "is performed on specific art items, such as rotating a text box or a raster image. Other than auto-assignment, tags are only known " +
     "to be set by scripts, such as this one.";
    this.displayTagsList(list, Tagger.selectedItem);


    list.onDoubleClick = function() {
     if (this.selection == null) {
      return;
     }
     var result = Tagger.UI.tagDialog(
      Tagger.selectedItem.tags.getByName(this.selection.text),
      Tagger.selectedItem,
      "edit"
     );
     if (result) {
      Tagger.UI.displayTagsList(this, Tagger.selectedItem);
     }
    };


    var g_listBtn = g_tagList.add("group");
    g_listBtn.margins = [4, 4, 4, 4];
    var btn_add = g_listBtn.add("button", undefined, "Add");
    btn_add.size = [160, 30];
    var btn_rem = g_listBtn.add("button", undefined, "Remove");
    btn_rem.size = [160, 30];


    btn_add.onClick = function() {
     var result = Tagger.UI.tagDialog({
      name: "NewTag",
      value: ""
     }, Tagger.selectedItem, "add");
     if (result) {
      Tagger.UI.displayTagsList(list, Tagger.selectedItem);
     }
    };


    btn_rem.onClick = function() {
     if (list.selection != null) {
      Tagger.selectedItem.tags.getByName(list.selection.text).remove();
      Tagger.UI.displayTagsList(list, Tagger.selectedItem);
     }
    };


    var g_btn = w.add("group");
    var btn_ok = g_btn.add("button", undefined, "Ok");


    w.show();
   }
  },
  documentActions: {
   getTags: function(elem) {
    var arr = [],
     thisTag;
    for (var i = 0; i < elem.tags.length; i++) {
     thisTag = elem.tags[i];
     arr.push({
      name: thisTag.name,
      value: thisTag.value
     });
    }
    return arr;
   }
  },
  propObj: {
   name: {
    name: "name",
    value: "",
    helpTip: "The name of the art item inside the Layers panel."
   },
   note: {
    name: "note",
    value: "",
    helpTip: "The note for this art item, accessible inside the Attributes panel."
   },
   uRL: {
    name: "uRL",
    value: "",
    helpTip: "The URL for this art item, accessible inside the Attributes panel.",
    processFunction: function(elem) {
     elem.selected = false;
     elem.selected = true;
    }
   }
  },
  selectedItem: undefined,
  init: function() {
   if (app.documents.length == 0) {
    alert("Please open a document first.");
    return;
   }
   var doc = app.activeDocument,
    sel = doc.selection;


   if (sel == null) {
    alert("Please select an item.");
   }
   if (sel.length != 1) {
    alert("Please select only one item. Currently selected: " + sel.length + " items.");
    return;
   }
   this.selectedItem = sel[0];
   for (var all in this.propObj) {
    this.propObj[all].value = this.selectedItem[all];
   }
   this.UI.mainDialog();
  }
  };


  Tagger.UI.tabPalette();




};
ArtItemTagger();