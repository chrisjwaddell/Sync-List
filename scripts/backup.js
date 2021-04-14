const elID = document.querySelector(".backupid"), elName = document.querySelector("#backupname"), elBackupTo = document.querySelector("#backupto"), elDate = document.querySelector("#includedate"), elMsgBefore = document.querySelector("#msgbefore"), elMsgAfter = document.querySelector("#msgafter"), elSendEmail = document.querySelector("#sendemail"), elEmail = document.querySelector("#email"), elLastEdited = document.querySelector(".lastedited"), elActive = document.querySelector("#active"), elCreateScript = document.querySelector(".createscript"), elFileList = document.querySelector(".filelist"), elFileAdd = document.querySelector(".filelist__add button");

//* date in root dir, it needs to be checked in various places
var scriptRootDirDate;

const warningvisible = (fieldname, visible) => {
    visible ? document.querySelector("p." + fieldname).classList.add("isvisible") : document.querySelector("p." + fieldname).classList.remove("isvisible");
}, fields = [ elName, elBackupTo, elDate, elMsgBefore, elMsgAfter, elSendEmail, elEmail, elLastEdited, elActive ], elBackupNameListTB = document.querySelector(".backupnamelist tbody"), elAdd = document.querySelector(".backupnamelist__buttons .add"), elRemove = document.querySelector(".backupnamelist__buttons .remove");

var jsondata = "", bIndex = 0;

function IsJsonString(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return {
            File: "File isn't in JSON format"
        };
    }
    return !1;
}

function windowsFilenameIllegalCharacters(char) {
    switch (char) {
      case "/":
      case "\\":
      case ":":
      case "*":
      case "?":
      case '"':
      case "<":
      case ">":
      case "|":
        return !1;

      default:
        return !0;
    }
}

function dataSet(backupIndex, property, value, fileIndex, fileField) {
    //* fileIndex - if this is filled in, it means we are talking about file fields
    void 0 === fileIndex ? jsondata["Backup List"][backupIndex][property] = value : jsondata["Backup List"][backupIndex].Files[fileIndex][fileField] = value, 
    dataSave();
}

async function dataSave() {
    let today = new Date;
    today = Date.now(), jsondata["Backup List"][bIndex] && (jsondata["Backup List"][bIndex]["Last edited"] = today), 
    elLastEdited.innerText = "Today", elLastEdited.classList.add("txt-today");
    const options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsondata)
    };
    let r = await fetch("http://localhost:21311/", options).catch((err => {
        console.log(err), alert("Check if Node is running. To start it, type 'node app.js' in the command prompt.");
    })), txt = await r.text();
    try {
        json = JSON.parse(txt), json.hasOwnProperty("Important Error Message") ? (alert(json["Important Error Message"]), 
        warnings(json)) : warnings(json);
    } catch (err) {
        console.log(err);
    }
}

function active(active) {
    fields.forEach((fld => {
        fld !== elActive ? (active ? elDate.checked ? "includedate" === !fld.getAttribute("name") && fld.removeAttribute("disabled") : fld.removeAttribute("disabled") : (warningsRemove(), 
        fld.setAttribute("disabled", !0)), fld.disabled = !active) : (active || warningsRemove(), 
        warningvisible("active", !active));
    }));
}

function warningsRemove() {
    warningvisible("backupname", !1), warningvisible("backupto", !1), warningvisible("createscript", !1);
}

function warnings(json) {
    warningsRemove();
    var bName = !1, bEdited = !1;
    if (warningvisible("createscript", !1), Boolean(json["Error List"][bIndex]) && elActive.checked) for (let i = 0; i < Object.keys(json["Error List"][bIndex]).length; i++) switch (Object.keys(json["Error List"][bIndex])[i]) {
      case "Backup Name":
        warningvisible("backupname", !0), bName = !0;
        break;

      case "Backup Root Directory":
        warningvisible("backupto", !0);
        break;

      case "Last edited":
        warningvisible("createscript", !0), bEdited = !0;
    }
    bName || bEdited ? bName ? (elCreateScript.classList.add("isvisible"), elCreateScript.innerText = "Create Backup Script") : bEdited && (elCreateScript.classList.add("isvisible"), 
    elCreateScript.innerText = "Regenerate Backup Script") : elCreateScript.classList.remove("isvisible");
}

function fileLineIndexNew() {
    let elTemp = document.querySelectorAll(".filelist__line"), arrIndexes = [];
    return elTemp.forEach((item => arrIndexes.push(Number(item.getAttribute("data-id"))))), 
    arrIndexes.reduce(((acc, cv) => cv > acc ? cv : acc), 0) + 1;
}

function fileLineIndexToLineNumber(index) {
    elTemp = document.querySelectorAll(".filelist__line");
    //* Get the line number in the DOM and array
        let i = 0;
    do {
        i += 1;
    } while (Number(elTemp[i].getAttribute("data-index")) !== index && 200 !== i);
    return i;
}

function backupLineIndexNew() {
    let elTemp = document.querySelectorAll(".backupnamelist tbody tr"), arrIndexes = [];
    return elTemp.forEach((item => arrIndexes.push(Number(item.getAttribute("data-id"))))), 
    arrIndexes.reduce(((acc, cv) => cv > acc ? cv : acc), 0) + 1;
}

function dataLoad(backupIndex) {
    elID.textContent = jsondata["Backup List"][backupIndex].ID, elName.value = jsondata["Backup List"][backupIndex]["Backup Name"], 
    elBackupTo.value = jsondata["Backup List"][backupIndex]["Backup Root Directory"], 
    elDate.checked = jsondata["Backup List"][backupIndex]["Include Date"], elMsgBefore.value = jsondata["Backup List"][backupIndex]["Message Before"], 
    elMsgAfter.value = jsondata["Backup List"][backupIndex]["Message After"], elSendEmail.checked = jsondata["Backup List"][backupIndex]["Send Email After"], 
    elEmail.value = jsondata["Backup List"][backupIndex]["Email Address"], elLastEdited.innerText = dateDisplay(dateToYYYYMMDD(jsondata["Backup List"][backupIndex]["Last edited"], "-")), 
    elActive.checked = jsondata["Backup List"][backupIndex].Active;
    //* This may change from Create to Regenerate - on name change or edit or create
    var d1 = new Date(dateDDMMYYYYToDate(jsondata["Backup List"][backupIndex]["Last edited"])), today = new Date;
    elLastEdited.classList.remove("txt-today"), elLastEdited.classList.remove("txt-soon");
    let datecolor = dateColor(d1, today);
    datecolor && elLastEdited.classList.add(datecolor), jsondata.hasOwnProperty("Error List") && warnings(jsondata), 
    active(elActive.checked), scriptRootDirDate = elActive.checked;
    var dataindex = fileLineIndexNew();
    for (let i = 0; i < jsondata["Backup List"][backupIndex].Files.length; i++) {
        fileLineAdd(dataindex - 1), dataindex++, document.querySelectorAll(".filelist__file input")[i].value = jsondata["Backup List"][backupIndex].Files[i]["File Or Folder"], 
        jsondata["Backup List"][backupIndex].Files[i]["Zip It"] ? document.querySelectorAll(".filelist__zip input")[i].setAttribute("checked", "checked") : document.querySelectorAll(".filelist__zip input")[i].removeAttribute("checked"), 
        document.querySelectorAll(".filelist__subdir input")[i].checked = jsondata["Backup List"][backupIndex].Files[i]["Sub-Directories"], 
        document.querySelectorAll(".filelist__date input")[i].checked = jsondata["Backup List"][backupIndex].Files[i]["Date In File"], 
        document.querySelectorAll(".filelist__active input")[i].checked = jsondata["Backup List"][backupIndex].Files[i].Active, 
        fileLineActive(i, document.querySelectorAll(".filelist__active input")[i].checked);
    }
    backupListClear();
    for (let i = 0; i < jsondata["Backup List"].length; i++) {
        let elTR;
        elTR = Number(jsondata["Backup List"][i].ID) === Number(jsondata["Backup List"][backupIndex].ID) ? createElementAtt(document.querySelector(".backupnamelist tbody"), "tr", [ "selected" ], [ [ "data-id", jsondata["Backup List"][i].ID ] ], " ") : createElementAtt(document.querySelector(".backupnamelist tbody"), "tr", [], [ [ "data-id", jsondata["Backup List"][i].ID ] ], " "), 
        jsondata["Backup List"][i].Active ? Number(jsondata["Backup List"][i].ID) === Number(jsondata["Backup List"][backupIndex].ID) ? (createElementAtt(elTR, "td", [ "backupname", "selected" ], [], jsondata["Backup List"][i]["Backup Name"]), 
        createElementAtt(elTR, "td", [ "active", "selected" ], [], jsondata["Backup List"][i].Active), 
        createElementAtt(elTR, "td", [ "lastrun", "selected" ], [], "")) : (createElementAtt(elTR, "td", [ "backupname" ], [], jsondata["Backup List"][i]["Backup Name"]), 
        createElementAtt(elTR, "td", [ "active" ], [], jsondata["Backup List"][i].Active), 
        createElementAtt(elTR, "td", [ "lastrun" ], [], "")) : (createElementAtt(elTR, "td", [ "backupname", "u-text-line-through" ], [], jsondata["Backup List"][i]["Backup Name"]), 
        createElementAtt(elTR, "td", [ "active", "u-text-line-through" ], [], String(jsondata["Backup List"][i].Active)), 
        createElementAtt(elTR, "td", [ "lastrun", "u-text-line-through" ], [], "")), elTR.addEventListener("click", (function() {
            let id = Number(this.getAttribute("data-id"));
            200 != id && (bIndex = backupIDToIndex(id), fileListClear(), dataLoad(bIndex));
        }));
    }
}

function dateDisplay(fieldDate) {
    //* This takes a YYYYMMDD string
    //* If the date is within a week, just say the day name
    //* If date is this year but not within the next week, show the month 3 letter abbreviation but not the year
    if ("undefined" == typeof cd) {
        var today = new Date;
        cd = today.getDate(), cm = today.getMonth(), cy = today.getFullYear();
    }
    if (0 === fieldDate.length) return "";
    var d = new Date(fieldDate);
    let day = d.getDate(), mnth = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ][Number(d.getMonth())];
    let yr;
    return cy === d.getFullYear() ? (yr = "", today > d ? numberOfNightsBetweenDates(d, today) < 7 && (0 === numberOfNightsBetweenDates(d, today) ? (day = "Today", 
    mnth = "") : 1 === numberOfNightsBetweenDates(d, today) && (day = "Yesterday", mnth = "")) : numberOfNightsBetweenDates(today, d) < 7 && (0 === numberOfNightsBetweenDates(today, d) ? (day = "Today", 
    mnth = "") : 1 == numberOfNightsBetweenDates(today, d) ? (day = "Tomorrow", mnth = "") : (day = function(i) {
        return [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ][i];
    }(d.getDay()), mnth = ""))) : yr = d.getFullYear(), String(day + ("" == mnth ? "" : " " + mnth) + ("" == yr ? "" : " " + yr));
}

function dateColor(startDate, endDate) {
    //* given 2 dates, it tells it what class to add
    //* if today - purple, if last 7 days, purple, else normal color
    //* return a class to add to the item
    //* the rules of date coloring are made in this class
    //* I used it this way:
    //* elLastEdited.classList.remove("txt-today")
    //* elLastEdited.classList.remove("txt-soon")
    //* let datecolor = dateColor(d1, today)
    //* if (datecolor) {
    //*   elLastEdited.classList.add(datecolor)
    //* }
    let diff = numberOfNightsBetweenDates(startDate, endDate);
    return 0 === diff ? "txt-today" : Math.abs(diff) < 7 ? "txt-soon" : void 0;
}

function fileLineAdd(index) {
    createElementAtt(elFileList, "hr", [], [], "");
    let elFL = createElementAtt(elFileList, "div", [ "filelist__line" ], [ [ "data-index", index ] ], ""), elFileDiv = createElementAtt(elFL, "div", [ "filelist__file", "col" ], [], ""), elFileTxt = createElementAtt(elFileDiv, "input", [ "e-input--primary" ], [ [ "type", "text" ], [ "placeholder", "File, Directory or Filetype eg C:\\My Documents or C:\\My Documents\\*.txt" ] ], "");
    //* this fixes the problem of no new line created when using createElement, appendChild - <span> </span>
    elFL.appendChild(document.createTextNode(" "));
    let elSubDirDiv = createElementAtt(elFL, "div", [ "filelist__subdir", "col" ], [], ""), elSDChk = createElementAtt(elSubDirDiv, "input", [], [ [ "type", "checkbox" ] ], [], "");
    elFL.appendChild(document.createTextNode(" "));
    createElementAtt(elFL, "div", [ "filelist__modified", "col" ], [], "");
    elFL.appendChild(document.createTextNode(" "));
    let elDateDiv = createElementAtt(elFL, "div", [ "filelist__date", "col" ], [], ""), elDateChk = createElementAtt(elDateDiv, "input", [ "field" ], [ [ "type", "checkbox" ], [ "data-description", "This feature is really handy for Weekly and Monthly backups. It stops files being overwritten. It puts the date at the end of the filename in YYYYMMDD format. If it is a zip file, it will be the date on the zip file filename otherwise it will put the date on each file in this line if it is *.txt, it will put the date on each text file matching this filetype." ] ], "");
    elFL.appendChild(document.createTextNode(" "));
    let elZipDiv = createElementAtt(elFL, "div", [ "filelist__zip", "col" ], [], ""), elZipChk = createElementAtt(elZipDiv, "input", [ "field" ], [ [ "type", "checkbox" ], [ "data-description", "Zip up these files. The zip file can be a maximum size of 8Gb. It is best to have a date in either the Root Directory or in the file name." ] ], "");
    elFL.appendChild(document.createTextNode(" "));
    let elActiveDiv = createElementAtt(elFL, "div", [ "filelist__active", "col" ], [], ""), elActiveChk = createElementAtt(elActiveDiv, "input", [], [ [ "type", "checkbox" ], [ "data-index", index ] ], "");
    elFL.appendChild(document.createTextNode(" ")), elActiveChk.checked = !0;
    let elBinDiv = createElementAtt(elFL, "div", [ "filelist__bin", "col" ], [], ""), elDeleteBtn = createElementAtt(elBinDiv, "button", [ "c-btn", "c-btn--secondary", "createscript", "u-text-center" ], [ [ "data-index", index ] ], "");
    elFileTxt.addEventListener("change", (function() {
        dataSet(bIndex, "Files", this.value.trim(), index, "File Or Folder");
    })), elSDChk.addEventListener("change", (function() {
        dataSet(bIndex, "Files", this.checked, index, "Sub-Directories");
    })), elDateChk.addEventListener("change", (function() {
        dataSet(bIndex, "Files", this.checked, index, "Date In File");
    })), elZipChk.addEventListener("change", (function() {
        dataSet(bIndex, "Files", this.checked, index, "Zip It");
    })), elActiveChk.addEventListener("change", (function() {
        fileLineActive(index, this.checked), dataSet(bIndex, "Files", this.checked, index, "Active");
    })), elDeleteBtn.addEventListener("click", (function() {
        if (1 == confirm("Are you sure you want to remove this line?")) {
            let lineNumber = Number(this.getAttribute("data-index")), line = fileLineIndexToLineNumber(lineNumber);
            document.querySelectorAll("hr")[line - 1].remove();
            let strLine = `.filelist__line[data-index="${lineNumber}"]`;
            for (let i = 0; i < document.querySelectorAll(".filelist__bin button").length; i++) lineNumber === Number(document.querySelectorAll(".filelist__bin button")[i].getAttribute("data-index")) && (jsondata["Backup List"][bIndex].Files.splice(i, 1), 
            document.querySelector(strLine).remove());
            dataSave();
        }
    }));
}

function fileListClear() {
    return void 0 !== document.querySelectorAll(".filelist__line")[1] && (void 0 !== document.querySelectorAll("hr")[0] && document.querySelectorAll("hr")[0].remove(), 
    document.querySelectorAll(".filelist__line")[1].remove(), fileListClear(), !0);
}

function backupListClear() {
    return void 0 !== document.querySelectorAll(".backupnamelist tbody tr")[0] && (document.querySelectorAll(".backupnamelist tbody tr")[0].remove(), 
    backupListClear(), !0);
}

function fileLineActive(index, value) {
    value ? (document.querySelector(`.filelist__line[data-index="${index}"] .filelist__file input`).removeAttribute("disabled"), 
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__subdir input`).removeAttribute("disabled"), 
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__zip input`).removeAttribute("disabled"), 
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__bin button`).removeAttribute("disabled")) : (document.querySelector(`.filelist__line[data-index="${index}"] .filelist__file input`).setAttribute("disabled", !0), 
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__subdir input`).setAttribute("disabled", !0), 
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__zip input`).setAttribute("disabled", !0), 
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__bin button`).setAttribute("disabled", !0)), 
    scriptRootDirDate ? document.querySelector(`.filelist__line[data-index="${index}"] .filelist__date input`).setAttribute("disabled", !0) : value ? document.querySelector(`.filelist__line[data-index="${index}"] .filelist__date input`).removeAttribute("disabled") : document.querySelector(`.filelist__line[data-index="${index}"] .filelist__date input`).setAttribute("disabled", !0);
}

async function buildBackupScript() {
    delete jsondata.BackupListID, jsondata.BackupListID = Number(elID.textContent);
    const options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsondata)
    };
    let r = await fetch("http://localhost:21311/build", options).catch((err => {
        console.log(err), alert("Check if Node is running. To start it, type 'node app.js' in the command prompt.");
    })), txt = await r.text();
    try {
        json = JSON.parse(txt), json.hasOwnProperty("Script message") ? (alert(json["Script message"]), 
        warrnings(json)) : warnings(json);
    } catch (err) {
        console.log(err);
    }
}

function dirFromPath(path) {
    let p = path;
    return -1 !== p.indexOf("\\") ? dirFromPath(p.substring(p.indexOf("\\"), p.length)) : p;
}

function backupIDToIndex(ID) {
    let i = 0;
    for (;jsondata["Backup List"][i]; ) {
        if (jsondata["Backup List"][i].ID === ID) return i;
        i++;
    }
    return 200;
}

function sleep(miliseconds) {
    for (var currentTime = (new Date).getTime(); currentTime + miliseconds >= (new Date).getTime(); ) ;
}

window.addEventListener("load", (async () => {
    let a = await fetch("http://localhost:21311").then((r => r.text())).catch((err => {
        console.log(err), alert("Check if Node is running. To start it, type 'node app.js' in the command prompt.");
    }));
    try {
        jsondata = await JSON.parse(a);
    } catch (err) {
        console.log(err);
    }
    bIndex = 0, jsondata.hasOwnProperty("Important Error Message") ? (alert(jsondata["Important Error Message"]), 
    warnings(jsondata)) : warnings(jsondata), dataLoad(bIndex);
})), elName.addEventListener("change", (function() {
    dataSet(bIndex, "Backup Name", this.value.trim());
})), elName.addEventListener("keypress", (function(e) {
    windowsFilenameIllegalCharacters(e.key) ? elName.value.length > 50 && e.preventDefault() : e.preventDefault();
})), elBackupTo.addEventListener("change", (function() {
    dataSet(bIndex, "Backup Root Directory", this.value.trim());
})), elDate.addEventListener("change", (function() {
    scriptRootDirDate = this.checked, dataSet(bIndex, "Include Date", Boolean(this.checked));
    for (let i = 0; i < document.querySelectorAll(".filelist__date input").length; i++) elDate.checked ? document.querySelectorAll(".filelist__date input")[i].setAttribute("disabled", "") : 
    //* enable if the line is active
    document.querySelectorAll(".filelist__active input")[i].checked && document.querySelectorAll(".filelist__date input")[i].removeAttribute("disabled");
})), elMsgBefore.addEventListener("change", (function() {
    dataSet(bIndex, "Message Before", this.value);
})), elMsgBefore.addEventListener("keypress", (function(e) {
    elMsgBefore.value.length > 150 && e.preventDefault();
})), elMsgAfter.addEventListener("change", (function() {
    dataSet(bIndex, "Message After", this.value);
})), elMsgAfter.addEventListener("keypress", (function(e) {
    elMsgAfter.value.length > 150 && e.preventDefault();
})), elActive.addEventListener("click", (function(e) {
    elActive.checked ? (active(!0), dataSet(bIndex, "Active", this.checked)) : 1 == confirm("Are you sure you want to make it inactive?") ? (active(!1), 
    dataSet(bIndex, "Active", this.checked)) : (active(!0), elActive.checked = !0);
})), elSendEmail.addEventListener("change", (function() {
    dataSet(bIndex, "Send Email After", Boolean(this.checked));
})), elEmail.addEventListener("change", (function() {
    dataSet(bIndex, "Email Address", this.value.trim());
})), elFileAdd.addEventListener("click", (function() {
    fileLineAdd(fileLineIndexNew() - 1), jsondata["Backup List"][bIndex].Files.push({
        "File Or Folder": "",
        "File Type": "",
        "Zip It": !1,
        "Sub-Directories": !1,
        "Date In File": !1,
        Active: !0
    }), dataSave();
})), elAdd.addEventListener("click", (function() {
    fileListClear();
    let bID = backupLineIndexNew();
    jsondata["Backup List"].push({
        ID: bID,
        "Backup Name": "",
        "Backup Root Directory": "",
        "Include Date": !1,
        "Message Before": "",
        "Message After": "",
        "Send Email After": !1,
        "Email Address": "",
        "Last edited": "",
        "Script created": "",
        Active: !0,
        Files: [ {
            "File Or Folder": "",
            "File Type": "",
            "Zip It": !1,
            "Sub-Directories": !1,
            "Date In File": !1
        } ]
    }), dataSave(), dataLoad(bIndex = jsondata["Backup List"].length - 1), elName.focus();
})), elRemove.addEventListener("click", (function() {
    let bIndex = backupIDToIndex(Number(document.querySelector(".backupnamelist tr.selected").getAttribute("data-id")));
    1 == confirm(`Are you sure you want to make this Backup Profile - ${elName.value} inactive?`) && (jsondata["Backup List"].splice(bIndex, 1), 
    bIndex = 0, dataSave(), dataLoad(0));
})), elCreateScript.addEventListener("click", (function() {
    buildBackupScript();
}));