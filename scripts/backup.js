var jsondata = ''
const elID = document.querySelector('.backupid');
const elName = document.querySelector('#backupname');
const elBackupTo = document.querySelector('#backupto');
const elDate = document.querySelector('#includedate');
const elMsgBefore = document.querySelector('#msgbefore');
const elMsgAfter = document.querySelector('#msgafter');
const elSendEmail = document.querySelector('#sendemail');
const elEmail = document.querySelector('#email');
const elLastEdited = document.querySelector('.lastedited');
const elActive = document.querySelector('#active');
const elCreateScript = document.querySelector('.createscript')

const elFileList = document.querySelector('.filelist')

const elFileAdd = document.querySelector('.filelist__add button')

const elModal = document.querySelector('.modal-overlay')
const elModalSave = document.querySelector('.modal__save')
const elModalCancel = document.querySelector('.modal__cancel')

const backupListIDToIndex = id => jsondata["Backup List"].findIndex(i => i.ID === id)
const backupListFindFirstID = () => jsondata["Backup List"].filter(i => i.Active === true)[0] ? jsondata["Backup List"].filter(i => i.Active === true)[0]["ID"] : jsondata["Backup List"][0]["ID"]

//* date in root dir, it needs to be checked in various places
var scriptRootDirDate

const warningvisible = (fieldname, visible) => { (visible) ? document.querySelector('p.' + fieldname).classList.add("isvisible") : document.querySelector('p.' + fieldname).classList.remove("isvisible") };
const fields = [elName, elBackupTo, elDate, elMsgBefore, elMsgAfter, elSendEmail, elEmail, elLastEdited, elActive];

const elBackupNameListTB = document.querySelector('.backupnamelist tbody')

const elAdd = document.querySelector('.backupnamelist__buttons .add')
const elRemove = document.querySelector('.backupnamelist__buttons .remove')


var bIndex = 0    // array index number
// elID and bIndex tell us the ID and array index of the backup List
// ID is known first because user clicks on it and it's an attribute in the DOM, bIndex is found from dataLoad()


function IsJsonString(str) {
  try {
      return JSON.parse(str);
  } catch (e) {
      return { "File": "File isn't in JSON format" };
  }
  return false;
}


window.addEventListener('load', () => {
      var b = fetch("http://localhost:21311")
      .then(r => r.json())
      .then(function(str) {
          debugger
          console.log(str)
          jsondata = str;

          if (jsondata.hasOwnProperty("Important Error Message")) {
              alert(jsondata['Important Error Message'])
              warnings(jsondata)
            } else {
              warnings(jsondata)
            }

            bIndex = backupListFindFirstID()
            dataLoad(bIndex)

            debugToolInitialAfter()
      })
      .catch(err => console.log(err))
})


elName.addEventListener("change", function() {
  dataSet(bIndex, "Backup Name", this.value.trim())
})

elName.addEventListener("focus", () => elName.classList.add('focused'), true)
elName.addEventListener("blur", () => elName.classList.remove('focused'), true);

elName.addEventListener("keypress", function(e) {
  if (!windowsFilenameIllegalCharacters(e.key)) {
    e.preventDefault();
  } else {
  if (elName.value.length > 50) {
    e.preventDefault();
  }
}
})


elBackupTo.addEventListener("change", function() {
  dataSet(bIndex, "Backup Root Directory", this.value.trim())
})

elDate.addEventListener("change", function() {
  scriptRootDirDate = this.checked
  dataSet(bIndex, "Include Date", Boolean(this.checked))
  // debugger
  for (let i = 0; i < document.querySelectorAll(".filelist__date input").length; i++) {
    if (elDate.checked) {
      document.querySelectorAll(".filelist__date input")[i].setAttribute("disabled", '')
    } else {
      //* enable if the line is active
      if (document.querySelectorAll(".filelist__active input")[i].checked) {
        document.querySelectorAll(".filelist__date input")[i].removeAttribute("disabled")
      }
    }
  }
})

elMsgBefore.addEventListener("change", function() {
  dataSet(bIndex, "Message Before", this.value)
})

elMsgBefore.addEventListener("keypress", function(e) {
  if (elMsgBefore.value.length > 150) {
    e.preventDefault();
  }
})

elMsgAfter.addEventListener("change", function() {
  dataSet(bIndex, "Message After", this.value)
})

elMsgAfter.addEventListener("keypress", function(e) {
  // alert(e.key)
  // alert(elMsgAfter.value.length)
  if (elMsgAfter.value.length > 150) {
        e.preventDefault();
  }
})


elActive.addEventListener("click", function(e) {
  let txt
  // alert(elActive.checked)
  if (!elActive.checked) {
    var r = confirm("Are you sure you want to make it inactive?")
    if (r == true) {
      // txt = "You pressed OK!";
      active(false)
      dataSet(bIndex, "Active", this.checked)

    } else {
      active(true)
      elActive.checked = true
    }
  } else {
    debugger
    active(true)
    dataSet(bIndex, "Active", this.checked)
  }
})


function windowsFilenameIllegalCharacters(char) {
  switch (char) {
    case "/":
      return false;
    case "\\":
      return false;
    case ":":
      return false
    case "*":
      return false
    case "?":
      return false
    case '"':
      return false
    case "<":
      return false
    case ">":
      return false
    case "|":
      return false
    default:
    return true
  }
}

elSendEmail.addEventListener("change", function() {
  dataSet(bIndex, "Send Email After", Boolean(this.checked))
})

elEmail.addEventListener("change", function() {
  dataSet(bIndex, "Email Address", this.value.trim())
})


function dataSet(backupIndex, property, value, fileIndex, fileField) {
  let json
  // fileIndex - if this is filled in, it means we are talking about file fields
  // debugger

  if (fileIndex === undefined) {
    jsondata["Backup List"][backupIndex][property] = value
  } else {
    jsondata["Backup List"][backupIndex]["Files"][fileIndex][fileField] = value
  }

  dataSave(false, elID.value)
}


async function dataSave(build, id) {
// build === true tells express to build a new script
  let today = new Date()
  today = Date.now()

  delete jsondata["BackupListID"]
  jsondata["BackupListID"] = Number(id)

  // debugger
  // jsondata["Backup List"][bIndex]["Last edited"] = dateToDDMMYYYY(today, '/')

  if (jsondata["Backup List"][bIndex])   jsondata["Backup List"][bIndex]["Last edited"] = today

  elLastEdited.innerText = "Today"
  elLastEdited.classList.add("txt-today")

  // fetch()
  // console.log(JSON.stringify(jsondata))

  const url = build ? 'http://localhost:21311/build' : 'http://localhost:21311/';
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsondata)
  };


  // let rr3 = fetch(url, options)
  // .then(t => t.json())

  let g2 = fetch(url, options)
  .then(j => j.json())
  // .then(j => j["a"]= 4)
  .catch(err => console.log(err))

  try {
    json = JSON.parse(g2)
    // json = r3
    // json = IsJsonString(txt)
    if (json.hasOwnProperty("Script message")) {
      alert(json['Script message'])
      warrnings(json)
    } else {
      warnings(json)
    }
  } catch(err) {
    console.log(err)
  }

}


function active(active) {
  // debugger
  fields.forEach(fld => {
    if  (fld !== elActive) {
      // active ? fld.renoveAttribute("disabled") : fld.setAttribute("disabled", !active)
      if (!active) {
        warningsRemove()
        fld.setAttribute("disabled", true)
      } else {

        if (elDate.checked) {
          // console.log(fld)
          if (!fld.getAttribute('name') === "includedate") {
            fld.removeAttribute("disabled")
          }
        } else {
          fld.removeAttribute("disabled")
        }

      }
      fld.disabled = !active
    } else {
        if (!active) {
          warningsRemove()
        }
        warningvisible("active", !active)
    }
  })
}

function backupSettingsClear() {
  elName.value = ""
  elBackupTo.value = ""
  elDate.checked = false
  elMsgBefore.value = ""
  elMsgAfter.value = ""
  elActive.checked = true
}


function warningsRemove() {
  warningvisible("backupname", false)
  warningvisible("backupto", false)
  // warningvisible("lastedited", false)
  warningvisible("createscript", false)
}


function warnings(json) {
  warningsRemove()
  var bName = false
  var bEdited = false

  warningvisible("createscript", false)
  // debugger


  if (Boolean(json["Error List"][bIndex])) {
      if (elActive.checked) {
      // console.log(json["Error List"][bIndex])
          for (let i = 0; i < Object.keys(json["Error List"][bIndex]).length; i++) {
            switch (Object.keys(json["Error List"][bIndex])[i]) {
              case "Backup Name":
                warningvisible("backupname", true)
                bName = true
                break
              case "Backup Root Directory":
                warningvisible("backupto", true)
                break
              case "Last edited":
                // warningvisible("lastedited", true)
                // debugger
                warningvisible("createscript", true)
                bEdited = true
                break
              default:
                break
            }
          }
      }
  }

  // debugger
  if (!bName && !bEdited) {
    elCreateScript.classList.remove('isvisible')
  } else if (bName) {
    elCreateScript.classList.add('isvisible')
    elCreateScript.innerText = "Create Backup Script"
  } else if (bEdited) {
    elCreateScript.classList.add('isvisible')
    elCreateScript.innerText = "Regenerate Backup Script"
  }
}


function fileLineIndexNew() {
  let elTemp = document.querySelectorAll('.filelist__line')
  let arrIndexes = []
  elTemp.forEach(item => arrIndexes.push(Number(item.getAttribute('data-id'))))
  let a = arrIndexes.reduce((acc, cv) => cv > acc ? cv : acc, 0)
  return a + 1
}

function fileLineIndexToLineNumber(index) {
  elTemp = document.querySelectorAll(".filelist__line")

  //* Get the line number in the DOM and array
  let i = 0
  do {
    i = i + 1
    // console.log(elTemp[i]) //value
    // console.log(elTemp[i].getAttribute('data-index'))
  } while ((Number(elTemp[i].getAttribute('data-index')) !== index) && (i !== 200))

  return i
}


function backupLineIndexNew() {
  let elTemp = document.querySelectorAll('.backupnamelist tbody tr')
  let arrIndexes = []
  elTemp.forEach(item => arrIndexes.push(Number(item.getAttribute('data-id'))))
  let a = arrIndexes.reduce((acc, cv) => cv > acc ? cv : acc, 0)
  return a + 1
}


function dataLoad(backupID) {
  // console.log("from dataLoad")
  // console.log(arguments)
  // console.log(arguments[0])

  // debugger
  // console.log(typeof jsondata)

  bIndex = backupListIDToIndex(backupID)
  elID.textContent = jsondata["Backup List"][bIndex]["ID"]
  elName.value = jsondata["Backup List"][bIndex]["Backup Name"]
  elBackupTo.value = jsondata["Backup List"][bIndex]["Backup Root Directory"]
  elDate.checked = jsondata["Backup List"][bIndex]["Include Date"]
  elMsgBefore.value = jsondata["Backup List"][bIndex]["Message Before"]
  elMsgAfter.value = jsondata["Backup List"][bIndex]["Message After"]
  elSendEmail.checked = jsondata["Backup List"][bIndex]["Send Email After"]
  elEmail.value = jsondata["Backup List"][bIndex]["Email Address"]
  // elLastEdited.innerText = dateDisplay(dateDDMMYYYYToDate(jsondata["Backup List"][bIndex]["Last edited"]))
  elLastEdited.innerText = dateDisplay(dateToYYYYMMDD(jsondata["Backup List"][bIndex]["Last edited"], '-'))
  elActive.checked = jsondata["Backup List"][bIndex]["Active"]
  // elCreateScript.innerText = dateDisplay(dateDDMMYYYYToDate(jsondata["Backup List"][bIndex]["Last edited"]))
  //* This may change from Create to Regenerate - on name change or edit or create


  var d1 = new Date(dateDDMMYYYYToDate(jsondata["Backup List"][bIndex]["Last edited"]))
  var today = new Date()
  elLastEdited.classList.remove("txt-today")
  elLastEdited.classList.remove("txt-soon")
  let datecolor = dateColor(d1, today)
  if (datecolor) {
    elLastEdited.classList.add(datecolor)
  }

  if (jsondata.hasOwnProperty("Error List")) {
    warnings(jsondata)
  }

  active(elActive.checked)
  scriptRootDirDate = elActive.checked

  var dataindex = fileLineIndexNew()

  for (let i = 0; i < jsondata["Backup List"][bIndex]["Files"].length; i++) {
    // console.log("i - " + i + "; length - " + jsondata["Backup List"][bIndex]["Files"].length)

    fileLineAdd(dataindex - 1)
    dataindex++
    document.querySelectorAll(".filelist__file input")[i].value = jsondata["Backup List"][bIndex]["Files"][i]["File Or Folder"]

    // document.querySelectorAll(".filelist__file input")[i].value = jsondata["Backup List"][bIndex]["Files"][i]["File Type"]
    // debugger
    if (jsondata["Backup List"][bIndex]["Files"][i]["Zip It"]) {
      document.querySelectorAll(".filelist__zip input")[i].setAttribute("checked", "checked")
    } else {
      document.querySelectorAll(".filelist__zip input")[i].removeAttribute("checked")
    }
    // document.querySelectorAll(".filelist__zip")[i].checked = Boolean(jsondata["Backup List"][bIndex]["Files"][i]["Zip It"])
    document.querySelectorAll(".filelist__subdir input")[i].checked = jsondata["Backup List"][bIndex]["Files"][i]["Sub-Directories"]

    if (jsondata["Backup List"][bIndex]["Files"][i]["Sub-Directories"]) {
      document.querySelectorAll(".filelist__exludedirs input")[i].removeAttribute("disabled")
    } else {
      document.querySelectorAll(".filelist__exludedirs input")[i].setAttribute("disabled", "true")
    }

    document.querySelectorAll(".filelist__date input")[i].checked = jsondata["Backup List"][bIndex]["Files"][i]["Date In File"]

    document.querySelectorAll(".filelist__active input")[i].checked = jsondata["Backup List"][bIndex]["Files"][i]["Active"]
    let active = document.querySelectorAll(".filelist__active input")[i].checked
    fileLineActive(i, active)
  }


  backupListClear()

  for (let i = 0; i < jsondata["Backup List"].length; i++) {
    // debugLog(debugGetFuncName(), "5",  { bIndex })

    let elTR
    if (Number(jsondata["Backup List"][i]["ID"])  === Number(jsondata["Backup List"][bIndex]["ID"]) ) {
      elTR = createElementAtt(document.querySelector('.backupnamelist tbody'), 'tr', ['selected'], [['data-id', jsondata["Backup List"][i]["ID"]]], ' ')
    } else {
      elTR = createElementAtt(document.querySelector('.backupnamelist tbody'), 'tr', [], [['data-id', jsondata["Backup List"][i]["ID"]]], ' ')
    }


    // debugger
    if (jsondata["Backup List"][i]["Active"]) {
      if (Number(jsondata["Backup List"][i]["ID"])  === Number(jsondata["Backup List"][bIndex]["ID"]) ) {
          createElementAtt(elTR, 'td', ['backupname', 'selected'], [], jsondata["Backup List"][i]["Backup Name"])
          createElementAtt(elTR, 'td', ['active', 'selected'], [], jsondata["Backup List"][i]["Active"])
          createElementAtt(elTR, 'td', ['lastrun', 'selected'], [], '')
      } else {
          createElementAtt(elTR, 'td', ['backupname'], [], jsondata["Backup List"][i]["Backup Name"])
          createElementAtt(elTR, 'td', ['active'], [], jsondata["Backup List"][i]["Active"])
          createElementAtt(elTR, 'td', ['lastrun'], [], '')
      }
    } else {
      createElementAtt(elTR, 'td', ['backupname', 'u-text-line-through'], [], jsondata["Backup List"][i]["Backup Name"])
      createElementAtt(elTR, 'td', ['active', 'u-text-line-through'], [], String(jsondata["Backup List"][i]["Active"]))
      createElementAtt(elTR, 'td', ['lastrun', 'u-text-line-through'], [], '')
    }
    // debugger

  elTR.addEventListener("click", function () {
    // debugger
      // console.log(this.getAttribute('data-id'))
      let id = Number(this.getAttribute('data-id'))

      if (id != 200) {
        if (bIndex !== -1) {
          // alert(bIndex)

          fileListClear()

          // sleep(5000)
          // debugger
          dataLoad(id)
        }
    }
  })
}
}


function dateDisplay(fieldDate) {
  //* This takes a YYYYMMDD string
  //* If the date is within a week, just say the day name
  //* If date is this year but not within the next week, show the month 3 letter abbreviation but not the year
  // debugger

  // debugger
  if (typeof cd === "undefined") {
    var today = new Date()
    cd = today.getDate()
    cm = today.getMonth()
    cy = today.getFullYear()
  }

  // debugger
  if (fieldDate.length === 0) {
    return ""
  }

  var d = new Date(fieldDate)
  let day = d.getDate()
  let mnth = monthabbrev(Number(d.getMonth()))
  let yr

  // debugger
  if (cy === d.getFullYear()) {
    yr = ""

    if (today > d) {
      if (numberOfNightsBetweenDates(d, today) < 7) {
        // debugger
        if (numberOfNightsBetweenDates(d, today) === 0) {
          day = "Today"
          mnth = ""
        } else if (numberOfNightsBetweenDates(d, today) === 1) {
          day = "Yesterday"
          mnth = ""
        }
      }

    } else {
      if (numberOfNightsBetweenDates(today, d) < 7) {
        if (numberOfNightsBetweenDates(today, d) === 0) {
          day = "Today"
          mnth = ""
        } else if (numberOfNightsBetweenDates(today, d) == 1) {
          day = "Tomorrow"
          mnth = ""
        } else {
          day = dayabbrev(d.getDay())
          mnth = ""
        }
      }
    }

  } else {
    yr = d.getFullYear()
  }


  return String(day + ((mnth == "") ? "" : " " + mnth) + ((yr == "") ? "" : " " + yr))

  // return String(day + " " + mnth + " " + yr)
  // return String(day + " " + (mnth == "" ? "" : " "))


  function monthabbrev(i) {
    const mnths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return mnths[i]
  }

  function dayabbrev(i) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[i]
  }

}


function dateColor(startDate, endDate) {
  //* given 2 dates, it tells it what class to add
  //* if today - purple, if last 7 days, purple, else normal color
  //* return a class to add to the item
  //* the rules of date coloring are made in this class
  // debugger
  //* I used it this way:
  //* elLastEdited.classList.remove("txt-today")
  //* elLastEdited.classList.remove("txt-soon")
  //* let datecolor = dateColor(d1, today)
  //* if (datecolor) {
  //*   elLastEdited.classList.add(datecolor)
  //* }
  let diff = numberOfNightsBetweenDates(startDate, endDate)
  if (diff === 0) {
    return "txt-today"
  } else if (Math.abs(diff) < 7) {
    return "txt-soon"
  }
}


function fileLineAdd(index) {
  // debugStart(debugGetFuncName(), arguments)
  createElementAtt(elFileList, 'hr', [], [], '')

  // console.log( { bIndex })

  let elFL = createElementAtt(elFileList, 'div', ['filelist__line'], [["data-index", index]], '')

  let elFileDiv = createElementAtt(elFL, 'div', ['filelist__file', 'col'], [], '')

  let elFileTxt = createElementAtt(elFileDiv, 'input', ['e-input--primary'], [['type', 'text'], ['placeholder', 'File, Directory or Filetype eg C:\\My Documents or C:\\My Documents\\*.txt']], '')
  //* this fixes the problem of no new line created when using createElement, appendChild - <span> </span>
  // createElementAtt(elFL, 'span', [], [], ' ')
  elFL.appendChild(document.createTextNode(' '))

  let elSubDirDiv = createElementAtt(elFL, 'div', ['filelist__subdir', 'col'], [], '')

  let elSDChk = createElementAtt(elSubDirDiv, 'input', [], [['type', 'checkbox']], [], '')
  elFL.appendChild(document.createTextNode(' '))

  let elExclDirsDiv = createElementAtt(elFL, 'div', ['filelist__exludedirs', 'col'], [], '')
  let elExclDirs = createElementAtt(elExclDirsDiv, 'input', ['e-input--primary'], [['type', 'text'], ['placeholder', 'Format - "dir1", "dir2"'], ['disabled', 'true']], '')
  //* this fixes the problem of no new line created when using createElement, appendChild - <span> </span>
  // createElementAtt(elFL, 'span', [], [], ' ')
  elFL.appendChild(document.createTextNode(' '))


  let elModifiedDiv = createElementAtt(elFL, 'div', ['filelist__modified', 'col'], [], '')
  elFL.appendChild(document.createTextNode(' '))


  let elDateDiv = createElementAtt(elFL, 'div', ['filelist__date', 'col'], [], '')
  let elDateChk = createElementAtt(elDateDiv, 'input', ['field'], [['type', 'checkbox'], ["data-description", "This feature is really handy for Weekly and Monthly backups. It stops files being overwritten. It puts the date at the end of the filename in YYYYMMDD format. If it is a zip file, it will be the date on the zip file filename otherwise it will put the date on each file in this line if it is *.txt, it will put the date on each text file matching this filetype."]], '')
  elFL.appendChild(document.createTextNode(' '))

  let elZipDiv = createElementAtt(elFL, 'div', ['filelist__zip', 'col'], [], '')
  let elZipChk = createElementAtt(elZipDiv, 'input', ['field'], [['type', 'checkbox'], ['data-description', 'Zip up these files. The zip file can be a maximum size of 8Gb. It is best to have a date in either the Root Directory or in the file name.']], '')
  elFL.appendChild(document.createTextNode(' '))


  let elActiveDiv = createElementAtt(elFL, 'div', ['filelist__active', 'col'], [], '')
  let elActiveChk = createElementAtt(elActiveDiv, 'input', [], [['type', 'checkbox'], ["data-index", index]], '')
  elFL.appendChild(document.createTextNode(' '))
  elActiveChk.checked = true


  let elBinDiv = createElementAtt(elFL, 'div', ['filelist__bin', 'col'], [], '')
  let elDeleteBtn = createElementAtt(elBinDiv, 'button', ['c-btn', 'c-btn--secondary', 'createscript', 'u-text-center'], [["data-index", index]], '')


  elFileTxt.addEventListener("change", function() {
    dataSet(bIndex, "Files", this.value.trim(), index, "File Or Folder")
  })

  elSDChk.addEventListener("change", function() {
    dataSet(bIndex, "Files", this.checked, index, "Sub-Directories")
  })

  elDateChk.addEventListener("change", function() {
    dataSet(bIndex, "Files", this.checked, index, "Date In File")
  })

  elZipChk.addEventListener("change", function() {
    dataSet(bIndex, "Files", this.checked, index, "Zip It")
  })

  elActiveChk.addEventListener("change", function() {
    // let index = Number(this.getAttribute('data-index'))
    // let lineNumber = fileLineIndexToLineNumber(index)

    fileLineActive(index, this.checked)


    dataSet(bIndex, "Files", this.checked, index, "Active")
  })


  elDeleteBtn.addEventListener("click", function() {
    // dataSet(bIndex, "Files", this.value, index, "File Or Folder")
    // debugger
    var r = confirm("Are you sure you want to remove this line?")
    if (r == true) {
      debugger
      let lineNumber = Number(this.getAttribute('data-index'))
      let line = fileLineIndexToLineNumber(lineNumber)
      document.querySelectorAll("hr")[line -1].remove()
      let strLine = `.filelist__line[data-index="${lineNumber}"]`
      // debugger
      let index
      for (let i = 0; i < document.querySelectorAll('.filelist__bin button').length; i++) {
        if (lineNumber === Number(document.querySelectorAll('.filelist__bin button')[i].getAttribute('data-index'))) {
          jsondata["Backup List"][bIndex]["Files"].splice(i, 1)
          document.querySelector(strLine).remove()
        }
      }

      dataSave(false, elID.value)
    }
  })

}


elFileAdd.addEventListener("click", function() {
  let dataindex = fileLineIndexNew()
  fileLineAdd(dataindex - 1)
  // debugger
  jsondata["Backup List"][bIndex]["Files"].push( { "File Or Folder": "", "File Type": "", "Zip It": false, "Sub-Directories": false,  "Exclude-Directories": "", "Date In File": false, "Active": true })

  dataSave(false, elID.value)
})


function fileListClear() {
// debugStart(debugGetFuncName(), arguments)
// debugLog(debugGetFuncName(), "1", { bIndex } )

// console.count("fileListClear")

  if (document.querySelectorAll(".filelist__line")[1] !== undefined) {
    if (document.querySelectorAll("hr")[0] !== undefined) {
      document.querySelectorAll("hr")[0].remove()
   }
    document.querySelectorAll(".filelist__line")[1].remove()
    fileListClear()
    return true
  } else {
    return false
  }

}


function backupListClear() {
// debugStart(debugGetFuncName(), arguments)
// debugLog(debugGetFuncName(), "2", { bIndex } )
  if (document.querySelectorAll(".backupnamelist tbody tr")[0] !== undefined) {
    document.querySelectorAll(".backupnamelist tbody tr")[0].remove()
    backupListClear()
    // sleep(5000)
    return true
  } else {
    // sleep(5000)
    return false
  }

}


elAdd.addEventListener("click", function() {
  // debugger
  elModal.classList.add('isvisible')
  // document.querySelector('#backupname--modal').focus()
  // elName.focus()
  document.querySelector('#backupname--modal').focus()
})


elModalSave.addEventListener("click", function() {
  const elName = document.querySelector('#backupname--modal')

  if (elName.value) {
    backupSettingsClear()

    fileListClear()

    let bID = backupLineIndexNew()
    // debugger
    jsondata["Backup List"].push( { "ID": bID, "Backup Name": elName.value, "Backup Root Directory": "", "Include Date": false, "Message Before": "", "Message After": "", "Send Email After": false, "Email Address": "", "Last edited": "", "Script created": "", "Active": true, "Files": []} )

    // PUT HTTP request ie new backup list needs "BackupListID" to tell Node which backup list ID to create a new file for
    jsondata["BackupListID"] = bID

    let elTR = createElementAtt(document.querySelector('.backupnamelist tbody'), 'tr', ['selected'], [['data-id', bID]], ' ')
    createElementAtt(elTR, 'td', ['backupname', 'u-text-line-through'], [], elName.value)
    createElementAtt(elTR, 'td', ['active', 'u-text-line-through'], [], 'true')
    createElementAtt(elTR, 'td', ['lastrun', 'u-text-line-through'], [], '')

    dataSave(true, bID)

    // buildBackupScript(bID)
    dataLoad(bID)

    elName.value = ''

    elModal.classList.remove('isvisible')

  } else {
    alert("Nothing in")

  }
})


elModalCancel.addEventListener("click", function() {
  elModal.classList.remove('isvisible')
  document.querySelector('#backupname--modal').value = ''
})


elRemove.addEventListener("click", function() {
  let removebID = Number(document.querySelector('.backupnamelist tr.selected').getAttribute('data-id'))
  let removebIndex = backupListIDToIndex(removebID)
  let bID

  if (removebIndex !== -1) {
     var r = confirm(`Are you sure you want to remove this Backup List - ${elName.value}`)
     if (r == true) {
       // debugger
       jsondata["Backup List"].splice(removebIndex, 1)
       // After removing, find the first active backup List, if not, just the first backup list, there needs to be at least one
       try {
         bID = jsondata["Backup List"].filter(i => i.Active === true)[0]["ID"]
       }
       catch (err) {
         bID = jsondata["Backup List"][0]["ID"]
       }
       dataSave(false, elID.value)
       dataLoad(bID)
    } else {
      alert("Something went wrong, it can't remove this Backup List. It can't find it in the JSON data.")
    }
  }
})


function fileLineActive(index, value) {
  // debugger
  if (value) {
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__file input`).removeAttribute('disabled')
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__subdir input`).removeAttribute('disabled')
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__zip input`).removeAttribute('disabled')
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__bin button`).removeAttribute('disabled')
  } else {
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__file input`).setAttribute('disabled', true)
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__subdir input`).setAttribute('disabled', true)
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__zip input`).setAttribute('disabled', true)
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__bin button`).setAttribute('disabled', true)
  }

  if (scriptRootDirDate) {
    document.querySelector(`.filelist__line[data-index="${index}"] .filelist__date input`).setAttribute('disabled', true)
  } else {
    if (value) {
      document.querySelector(`.filelist__line[data-index="${index}"] .filelist__date input`).removeAttribute('disabled')
    } else {
      document.querySelector(`.filelist__line[data-index="${index}"] .filelist__date input`).setAttribute('disabled', true)
    }
  }
}


elCreateScript.addEventListener("click", function() {
  buildBackupScript(elID.textContent)
})


async function buildBackupScript(id) {
    // console.log(jsondata)
    // debugger

    delete jsondata["BackupListID"]
    jsondata["BackupListID"] = Number(id)

    const url = 'http://localhost:21311/build'
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsondata)
    }


    // let r3 = await fetch(url, options)
    let r3 = fetch(url, options)
        // .then(res => res.text())
        .then(res => res.text())
        .catch(err => console.log(err))

    let r4 = await r3
    console.log("r4")
    console.log(r4)

    try {
      json = JSON.parse(r3)
      // json = r3
      // json = IsJsonString(txt)
      if (json.hasOwnProperty("Script message")) {
        alert(json['Script message'])
        warrnings(json)
      } else {
        warnings(json)
      }
    } catch(err) {
      console.log(err)
    }

  }


  function dirFromPath(path) {
    let p = path
    // console.log("path - " + path)
    if (p.indexOf("\\") !==-1) {
      // console.log("1")
      // return p.substring(0, p.indexOf('\\')) + dirFromPath(p.substring(p.indexOf('\\'), p.length))
      return dirFromPath(p.substring(p.indexOf("\\"), p.length))
    } else {
      // console.log("2")
      return p
    }

}


function sleep(miliseconds) {
    var currentTime = new Date().getTime();

    while (currentTime + miliseconds >= new Date().getTime()) {
    }
}


async function testFetch() {
  const url = 'http://localhost:21311/build'

  const jj = { "Backup List": [ { "ID": 1, "Backup Name": "one", "Backup Root Directory": "C:\\Users\\Chris\\Google-Drive" }], "Error List": [] }

  const str = JSON.stringify(jsondata)
  console.log(str)

  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'text/plain'
    },
    body: JSON.stringify(jsondata)
  }
  // body: jj

  debugger
  // let r3 = await fetch(url, options)
  let r3 = fetch(url, options)
      // .then(res => res.text())
      // .then(txt => txt.json())
      // .catch(err => console.log(err))

      debugger
  console.log(r3)
  let a = await fetch(url, options)
  let t = await a.text()
  console.log(t)

}


async function testFetch1(endurl) {
  // const jj = { "Backup List": [ { "ID": 1, "Backup Name": "one", "Backup Root Directory": "C:\\Users\\Chris\\Google-Drive" }], "Error List": [] }
  const jj = { A: 1 }

  const str = JSON.stringify(jj)
  // console.log(str)

  // console.log(JSON.stringify(jsondata))
  // return

  delete jsondata["BackupListID"]
  jsondata["BackupListID"] = 1

  // const url = 'http://localhost:21311/testjsonjson'
  const url = 'http://localhost:21311/' + endurl;
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsondata)
  };

  // let rr = fetch(url, options)


  debugger
  // let r3 = await fetch(url, options)
  let r3 = await fetch(url, options)
      .then(txt => txt.json())
      // .catch(err => console.log(err))

  console.log(r3)
}