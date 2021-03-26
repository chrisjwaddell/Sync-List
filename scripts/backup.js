const elID = document.querySelector(".backupid");

const elName = document.querySelector("#backupname");

const elBackupTo = document.querySelector("#backupto");

const elDate = document.querySelector("#includedate");

const elMsgBefore = document.querySelector("#msgbefore");

const elMsgAfter = document.querySelector("#msgafter");

const elSendEmail = document.querySelector("#sendemail");

const elEmail = document.querySelector("#email");

const elLastEdited = document.querySelector(".lastedited");

const elActive = document.querySelector("#active");

const elCreateScript = document.querySelector(".createscript");

const elFileList = document.querySelector(".filelist");

const elFileAdd = document.querySelector(".filelist__add button");

var scriptRootDirDate;

const warningvisible = (e, t) => {
    t ? document.querySelector("p." + e).classList.add("isvisible") : document.querySelector("p." + e).classList.remove("isvisible");
};

const fields = [ elName, elBackupTo, elDate, elMsgBefore, elMsgAfter, elSendEmail, elEmail, elLastEdited, elActive ];

const elBackupNameListTB = document.querySelector(".backupnamelist tbody");

const elAdd = document.querySelector(".backupnamelist__buttons .add");

const elRemove = document.querySelector(".backupnamelist__buttons .remove");

var jsondata = "";

var bIndex = 0;

function IsJsonString(e) {
    try {
        return JSON.parse(e);
    } catch (e) {
        return {
            File: "File isn't in JSON format"
        };
    }
    return false;
}

window.addEventListener("load", async () => {
    var e = await fetch("http://localhost:21311").then(e => e.text()).catch(e => {
        console.log(e);
        alert("Check if Node is running. To start it, type 'node app.js' in the command prompt.");
    });
    try {
        jsondata = await JSON.parse(e);
    } catch (e) {
        console.log(e);
    }
    bIndex = 0;
    if (jsondata.hasOwnProperty("Important Error Message")) {
        alert(jsondata["Important Error Message"]);
        warnings(jsondata);
    } else warnings(jsondata);
    dataLoad(bIndex);
});

elName.addEventListener("change", function() {
    dataSet(bIndex, "Backup Name", this.value.trim());
});

elName.addEventListener("keypress", function(e) {
    if (!windowsFilenameIllegalCharacters(e.key)) e.preventDefault(); else if (50 < elName.value.length) e.preventDefault();
});

elBackupTo.addEventListener("change", function() {
    dataSet(bIndex, "Backup Root Directory", this.value.trim());
});

elDate.addEventListener("change", function() {
    scriptRootDirDate = this.checked;
    dataSet(bIndex, "Include Date", Boolean(this.checked));
    for (let e = 0; e < document.querySelectorAll(".filelist__date input").length; e++) if (elDate.checked) document.querySelectorAll(".filelist__date input")[e].setAttribute("disabled", ""); else if (document.querySelectorAll(".filelist__active input")[e].checked) document.querySelectorAll(".filelist__date input")[e].removeAttribute("disabled");
});

elMsgBefore.addEventListener("change", function() {
    dataSet(bIndex, "Message Before", this.value);
});

elMsgBefore.addEventListener("keypress  ", function(e) {
    if (150 < elMsgBefore.value.length) e.preventDefault();
});

elMsgAfter.addEventListener("change", function() {
    dataSet(bIndex, "Message After", this.value);
});

elMsgAfter.addEventListener("keydown", function(e) {
    if (150 < elMsgAfter.value.length) e.preventDefault();
});

elActive.addEventListener("click", function(e) {
    var t;
    if (!elActive.checked) {
        var i;
        if (true == confirm("Are you sure you want to make it inactive?")) {
            active(false);
            dataSet(bIndex, "Active", this.checked);
        } else {
            active(true);
            elActive.checked = true;
        }
    } else {
        active(true);
        dataSet(bIndex, "Active", this.checked);
    }
});

function windowsFilenameIllegalCharacters(e) {
    switch (e) {
      case "/":
      case "\\":
      case ":":
      case "*":
      case "?":
      case '"':
      case "<":
      case ">":
      case "|":
        return false;

      default:
        return true;
    }
}

elMsgAfter.addEventListener("keypress", function(e) {
    if (20 < elMsgAfter.value.length) e.preventDefault();
});

elSendEmail.addEventListener("change", function() {
    dataSet(bIndex, "Send Email After", Boolean(this.checked));
});

elEmail.addEventListener("change", function() {
    dataSet(bIndex, "Email Address", this.value.trim());
});

function dataSet(e, t, i, a, n) {
    var l;
    if (void 0 === a) jsondata["Backup List"][e][t] = i; else jsondata["Backup List"][e].Files[a][n] = i;
    dataSave();
}

async function dataSave() {
    var e = new Date();
    e = Date.now();
    if (jsondata["Backup List"][bIndex]) jsondata["Backup List"][bIndex]["Last edited"] = e;
    elLastEdited.innerText = "Today";
    elLastEdited.classList.add("txt-today");
    var t = "http://localhost:21311/";
    var e = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsondata)
    };
    let i = await fetch(t, e).catch(e => {
        console.log(e);
        alert("Check if Node is running. To start it, type 'node app.js' in the command prompt.");
    });
    var e = await i.text();
    try {
        json = JSON.parse(e);
        if (json.hasOwnProperty("Important Error Message")) {
            alert(json["Important Error Message"]);
            warnings(json);
        } else warnings(json);
    } catch (e) {
        console.log(e);
    }
}

function active(t) {
    fields.forEach(e => {
        if (e !== elActive) {
            if (!t) {
                warningsRemove();
                e.setAttribute("disabled", true);
            } else if (elDate.checked) {
                if ("includedate" === !e.getAttribute("name")) e.removeAttribute("disabled");
            } else e.removeAttribute("disabled");
            e.disabled = !t;
        } else {
            if (!t) warningsRemove();
            warningvisible("active", !t);
        }
    });
}

function warningsRemove() {
    warningvisible("backupname", false);
    warningvisible("backupto", false);
    warningvisible("createscript", false);
}

function warnings(t) {
    warningsRemove();
    var i = false;
    var a = false;
    warningvisible("createscript", false);
    if (Boolean(t["Error List"][bIndex])) if (elActive.checked) for (let e = 0; e < Object.keys(t["Error List"][bIndex]).length; e++) switch (Object.keys(t["Error List"][bIndex])[e]) {
      case "Backup Name":
        warningvisible("backupname", true);
        i = true;
        break;

      case "Backup Root Directory":
        warningvisible("backupto", true);
        break;

      case "Last edited":
        warningvisible("createscript", true);
        a = true;
    }
    if (!i && !a) elCreateScript.classList.remove("isvisible"); else if (i) {
        elCreateScript.classList.add("isvisible");
        elCreateScript.innerText = "Create Backup Script";
    } else if (a) {
        elCreateScript.classList.add("isvisible");
        elCreateScript.innerText = "Regenerate Backup Script";
    }
}

function fileLineIndexNew() {
    let e = document.querySelectorAll(".filelist__line");
    let t = [];
    e.forEach(e => t.push(Number(e.getAttribute("data-id"))));
    var i;
    return t.reduce((e, t) => e < t ? t : e, 0) + 1;
}

function fileLineIndexToLineNumber(e) {
    elTemp = document.querySelectorAll(".filelist__line");
    let t = 0;
    for (;t += 1, Number(elTemp[t].getAttribute("data-index")) !== e || 200 == t; ) ;
    return t;
}

function backupLineIndexNew() {
    let e = document.querySelectorAll(".backupnamelist tbody tr");
    let t = [];
    e.forEach(e => t.push(Number(e.getAttribute("data-id"))));
    var i;
    return t.reduce((e, t) => e < t ? t : e, 0) + 1;
}

function dataLoad(i) {
    elID.textContent = jsondata["Backup List"][i].ID;
    elName.value = jsondata["Backup List"][i]["Backup Name"];
    elBackupTo.value = jsondata["Backup List"][i]["Backup Root Directory"];
    elDate.checked = jsondata["Backup List"][i]["Include Date"];
    elMsgBefore.value = jsondata["Backup List"][i]["Message Before"];
    elMsgAfter.value = jsondata["Backup List"][i]["Message After"];
    elSendEmail.checked = jsondata["Backup List"][i]["Send Email After"];
    elEmail.value = jsondata["Backup List"][i]["Email Address"];
    elLastEdited.innerText = dateDisplay(dateToYYYYMMDD(jsondata["Backup List"][i]["Last edited"], "-"));
    elActive.checked = jsondata["Backup List"][i].Active;
    var e = new Date(dateDDMMYYYYToDate(jsondata["Backup List"][i]["Last edited"]));
    var t = new Date();
    elLastEdited.classList.remove("txt-today");
    elLastEdited.classList.remove("txt-soon");
    var t = dateColor(e, t);
    if (t) elLastEdited.classList.add(t);
    if (jsondata.hasOwnProperty("Error List")) warnings(jsondata);
    active(elActive.checked);
    scriptRootDirDate = elActive.checked;
    var a = fileLineIndexNew();
    for (let e = 0; e < jsondata["Backup List"][i].Files.length; e++) {
        fileLineAdd(a - 1);
        a++;
        document.querySelectorAll(".filelist__file input")[e].value = jsondata["Backup List"][i].Files[e]["File Or Folder"];
        if (jsondata["Backup List"][i].Files[e]["Zip It"]) document.querySelectorAll(".filelist__zip input")[e].setAttribute("checked", "checked"); else document.querySelectorAll(".filelist__zip input")[e].removeAttribute("checked");
        document.querySelectorAll(".filelist__subdir input")[e].checked = jsondata["Backup List"][i].Files[e]["Sub-Directories"];
        document.querySelectorAll(".filelist__date input")[e].checked = jsondata["Backup List"][i].Files[e]["Date In File"];
        document.querySelectorAll(".filelist__active input")[e].checked = jsondata["Backup List"][i].Files[e].Active;
        var n = document.querySelectorAll(".filelist__active input")[e].checked;
        fileLineActive(e, n);
    }
    backupListClear();
    for (let t = 0; t < jsondata["Backup List"].length; t++) {
        let e;
        if (Number(jsondata["Backup List"][t].ID) === Number(jsondata["Backup List"][i].ID)) e = createElementAtt(document.querySelector(".backupnamelist tbody"), "tr", [ "selected" ], [ [ "data-id", jsondata["Backup List"][t].ID ] ], " "); else e = createElementAtt(document.querySelector(".backupnamelist tbody"), "tr", [], [ [ "data-id", jsondata["Backup List"][t].ID ] ], " ");
        if (jsondata["Backup List"][t].Active) if (Number(jsondata["Backup List"][t].ID) === Number(jsondata["Backup List"][i].ID)) {
            createElementAtt(e, "td", [ "backupname", "selected" ], [], jsondata["Backup List"][t]["Backup Name"]);
            createElementAtt(e, "td", [ "active", "selected" ], [], jsondata["Backup List"][t].Active);
            createElementAtt(e, "td", [ "lastrun", "selected" ], [], "");
        } else {
            createElementAtt(e, "td", [ "backupname" ], [], jsondata["Backup List"][t]["Backup Name"]);
            createElementAtt(e, "td", [ "active" ], [], jsondata["Backup List"][t].Active);
            createElementAtt(e, "td", [ "lastrun" ], [], "");
        } else {
            createElementAtt(e, "td", [ "backupname", "u-text-line-through" ], [], jsondata["Backup List"][t]["Backup Name"]);
            createElementAtt(e, "td", [ "active", "u-text-line-through" ], [], String(jsondata["Backup List"][t].Active));
            createElementAtt(e, "td", [ "lastrun", "u-text-line-through" ], [], "");
        }
        e.addEventListener("click", function() {
            var e = Number(this.getAttribute("data-id"));
            if (200 != e) {
                bIndex = backupIDToIndex(e);
                fileListClear();
                dataLoad(bIndex);
            }
        });
    }
}

function dateDisplay(e) {
    if ("undefined" == typeof cd) {
        var t = new Date();
        cd = t.getDate();
        cm = t.getMonth();
        cy = t.getFullYear();
    }
    if (0 === e.length) return "";
    var e = new Date(e);
    let i = e.getDate();
    let a = l(Number(e.getMonth()));
    let n;
    if (cy === e.getFullYear()) {
        n = "";
        if (e < t) {
            if (numberOfNightsBetweenDates(e, t) < 7) if (0 === numberOfNightsBetweenDates(e, t)) {
                i = "Today";
                a = "";
            } else if (1 === numberOfNightsBetweenDates(e, t)) {
                i = "Yesterday";
                a = "";
            }
        } else if (numberOfNightsBetweenDates(t, e) < 7) if (0 === numberOfNightsBetweenDates(t, e)) {
            i = "Today";
            a = "";
        } else if (1 == numberOfNightsBetweenDates(t, e)) {
            i = "Tomorrow";
            a = "";
        } else {
            i = r(e.getDay());
            a = "";
        }
    } else n = e.getFullYear();
    return String(i + ("" == a ? "" : " " + a) + ("" == n ? "" : " " + n));
    function l(e) {
        var t;
        return [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ][e];
    }
    function r(e) {
        var t;
        return [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ][e];
    }
}

function dateColor(e, t) {
    var t = numberOfNightsBetweenDates(e, t);
    if (0 === t) return "txt-today"; else if (Math.abs(t) < 7) return "txt-soon";
}

function fileLineAdd(e) {
    createElementAtt(elFileList, "hr", [], [], "");
    let t = createElementAtt(elFileList, "div", [ "filelist__line" ], [ [ "data-index", e ] ], "");
    var i = createElementAtt(t, "div", [ "filelist__file", "col" ], [], "");
    let a = createElementAtt(i, "input", [ "e-input--primary" ], [ [ "type", "text" ], [ "placeholder", "File, Directory or Filetype eg C:\\My Documents or C:\\My Documents\\*.txt" ] ], "");
    t.appendChild(document.createTextNode(" "));
    var i = createElementAtt(t, "div", [ "filelist__subdir", "col" ], [], "");
    let n = createElementAtt(i, "input", [], [ [ "type", "checkbox" ] ], [], "");
    t.appendChild(document.createTextNode(" "));
    var l = createElementAtt(t, "div", [ "filelist__modified", "col" ], [], "");
    t.appendChild(document.createTextNode(" "));
    var i = createElementAtt(t, "div", [ "filelist__date", "col" ], [], "");
    let r = createElementAtt(i, "input", [ "field" ], [ [ "type", "checkbox" ], [ "data-description", "This feature is really handy for Weekly and Monthly backups. It stops files being overwritten. It puts the date at the end of the filename in YYYYMMDD format. If it is a zip file, it will be the date on the zip file filename otherwise it will put the date on each file in this line if it is *.txt, it will put the date on each text file matching this filetype." ] ], "");
    t.appendChild(document.createTextNode(" "));
    var i = createElementAtt(t, "div", [ "filelist__zip", "col" ], [], "");
    let s = createElementAtt(i, "input", [ "field" ], [ [ "type", "checkbox" ], [ "data-description", "Zip up these files. The zip file can be a maximum size of 8Gb. It is best to have a date in either the Root Directory or in the file name." ] ], "");
    t.appendChild(document.createTextNode(" "));
    var i = createElementAtt(t, "div", [ "filelist__active", "col" ], [], "");
    let c = createElementAtt(i, "input", [], [ [ "type", "checkbox" ], [ "data-index", e ] ], "");
    t.appendChild(document.createTextNode(" "));
    c.checked = true;
    var i = createElementAtt(t, "div", [ "filelist__bin", "col" ], [], "");
    let d = createElementAtt(i, "button", [ "c-btn", "c-btn--secondary", "createscript", "u-text-center" ], [ [ "data-index", e ] ], "");
    a.addEventListener("change", function() {
        dataSet(bIndex, "Files", this.value.trim(), e, "File Or Folder");
    });
    n.addEventListener("change", function() {
        dataSet(bIndex, "Files", this.checked, e, "Sub-Directories");
    });
    r.addEventListener("change", function() {
        dataSet(bIndex, "Files", this.checked, e, "Date In File");
    });
    s.addEventListener("change", function() {
        dataSet(bIndex, "Files", this.checked, e, "Zip It");
    });
    c.addEventListener("change", function() {
        fileLineActive(e, this.checked);
        dataSet(bIndex, "Files", this.checked, e, "Active");
    });
    d.addEventListener("click", function() {
        var e;
        if (true == confirm("Are you sure you want to remove this line?")) {
            var t = Number(this.getAttribute("data-index"));
            var i = fileLineIndexToLineNumber(t);
            document.querySelectorAll("hr")[i - 1].remove();
            var a = `.filelist__line[data-index="${t}"]`;
            var n;
            for (let e = 0; e < document.querySelectorAll(".filelist__bin button").length; e++) if (t === Number(document.querySelectorAll(".filelist__bin button")[e].getAttribute("data-index"))) {
                jsondata["Backup List"][bIndex].Files.splice(e, 1);
                document.querySelector(a).remove();
            }
            dataSave();
        }
    });
}

elFileAdd.addEventListener("click", function() {
    var e;
    fileLineAdd(fileLineIndexNew() - 1);
    jsondata["Backup List"][bIndex].Files.push({
        "File Or Folder": "",
        "File Type": "",
        "Zip It": false,
        "Sub-Directories": false,
        "Date In File": false,
        Active: true
    });
    dataSave();
});

function fileListClear() {
    if (void 0 !== document.querySelectorAll(".filelist__line")[1]) {
        if (void 0 !== document.querySelectorAll("hr")[0]) document.querySelectorAll("hr")[0].remove();
        document.querySelectorAll(".filelist__line")[1].remove();
        fileListClear();
        return true;
    } else return false;
}

function backupListClear() {
    if (void 0 !== document.querySelectorAll(".backupnamelist tbody tr")[0]) {
        document.querySelectorAll(".backupnamelist tbody tr")[0].remove();
        backupListClear();
        return true;
    } else return false;
}

elAdd.addEventListener("click", function() {
    var e = backupLineIndexNew();
    jsondata["Backup List"].push({
        ID: e,
        "Backup Name": "",
        "Backup Root Directory": "",
        "Include Date": false,
        "Message Before": "",
        "Message After": "",
        "Send Email After": false,
        "Email Address": "",
        "Last edited": "",
        "Script created": "",
        Active: true,
        Files: [ {
            "File Or Folder": "",
            "File Type": "",
            "Zip It": false,
            "Sub-Directories": false,
            "Date In File": false
        } ]
    });
    dataSave();
    dataLoad(bIndex = jsondata["Backup List"].length - 1);
    elName.focus();
});

elRemove.addEventListener("click", function() {
    var e;
    var t = backupIDToIndex(Number(document.querySelector(".backupnamelist tr.selected").getAttribute("data-id")));
    var i;
    if (true == confirm(`Are you sure you want to make this Backup Profile - ${elName.value} inactive?`)) {
        jsondata["Backup List"].splice(t, 1);
        dataSave();
        dataLoad(0);
    }
});

function fileLineActive(e, t) {
    if (t) {
        document.querySelector(`.filelist__line[data-index="${e}"] .filelist__file input`).removeAttribute("disabled");
        document.querySelector(`.filelist__line[data-index="${e}"] .filelist__subdir input`).removeAttribute("disabled");
        document.querySelector(`.filelist__line[data-index="${e}"] .filelist__zip input`).removeAttribute("disabled");
        document.querySelector(`.filelist__line[data-index="${e}"] .filelist__bin button`).removeAttribute("disabled");
    } else {
        document.querySelector(`.filelist__line[data-index="${e}"] .filelist__file input`).setAttribute("disabled", true);
        document.querySelector(`.filelist__line[data-index="${e}"] .filelist__subdir input`).setAttribute("disabled", true);
        document.querySelector(`.filelist__line[data-index="${e}"] .filelist__zip input`).setAttribute("disabled", true);
        document.querySelector(`.filelist__line[data-index="${e}"] .filelist__bin button`).setAttribute("disabled", true);
    }
    if (scriptRootDirDate) document.querySelector(`.filelist__line[data-index="${e}"] .filelist__date input`).setAttribute("disabled", true); else if (t) document.querySelector(`.filelist__line[data-index="${e}"] .filelist__date input`).removeAttribute("disabled"); else document.querySelector(`.filelist__line[data-index="${e}"] .filelist__date input`).setAttribute("disabled", true);
}

elCreateScript.addEventListener("click", function() {
    buildBackupScript();
});

async function buildBackupScript() {
    var e = "http://localhost:21311/build";
    var t = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsondata)
    };
    let i = await fetch(e, t).catch(e => {
        console.log(e);
        alert("Check if Node is running. To start it, type 'node app.js' in the command prompt.");
    });
    var t = await i.text();
    try {
        json = JSON.parse(t);
        if (json.hasOwnProperty("Script message")) {
            alert(json["Script message"]);
            warnings(json);
        } else warnings(json);
    } catch (e) {
        console.log(e);
    }
}

function dirFromPath(e) {
    let t = e;
    if (-1 !== t.indexOf("\\")) return dirFromPath(t.substring(t.indexOf("\\"), t.length)); else return t;
}

function backupIDToIndex(e) {
    let t = 0;
    for (;jsondata["Backup List"][t]; ) {
        if (jsondata["Backup List"][t].ID === e) return t;
        t++;
    }
    return 200;
}

function sleep(e) {
    var t = new Date().getTime();
    for (;t + e >= new Date().getTime(); ) ;
}