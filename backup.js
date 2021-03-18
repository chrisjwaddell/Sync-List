const elBtn1 = document.querySelector(".btn1")
const elBtn2 = document.querySelector(".btn2")
const elBtn3 = document.querySelector(".btn3")
const elBtn4 = document.querySelector(".btn4")
const elBtn5 = document.querySelector(".btn5")
const elBtn6 = document.querySelector(".btn6")
const elBtn7 = document.querySelector(".btn7")

// elBtn.addEventListener("click", () => {
//   alert("Clicked")
// })

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

// date in root dir, it needs to be checked in various places
var scriptRootDirDate

const warningvisible = (fieldname, visible) => { (visible) ? document.querySelector('p.' + fieldname).classList.add("isvisible") : document.querySelector('p.' + fieldname).classList.remove("isvisible") };
const fields = [elName, elBackupTo, elDate, elMsgBefore, elMsgAfter, elSendEmail, elEmail, elLastEdited, elActive];

const elBackupNameListTB = document.querySelector('.backupnamelist tbody')

const elAdd = document.querySelector('.backupnamelist__buttons .add')
const elRemove = document.querySelector('.backupnamelist__buttons .remove')


var jsondata = ''

var bListID = 0


function IsJsonString(str) {
  try {
      return JSON.parse(str);
  } catch (e) {
      return { "File": "File isn't in JSON format" };
  }
  return false;
}


elBtn1.addEventListener("click", () => {
  fetch("http://localhost:21311")
  .then(res => res.json())
  .then(json => jsondata = json)
  // .then(txt => console.log(jsondata))
.catch((err) => {
  alert("An error occurred. Try again")
})

})


elBtn2.addEventListener("click", () => {
  console.log(jsondata)
})

elBtn3.addEventListener("click", () => {
  console.time('st')
  fetch("http://localhost:21311/test")
  .then(j => j.json())
  console.timeEnd('st')
})

elBtn4.addEventListener("click", () => {
  var k
  console.time('st')
  fetch("http://localhost:21311/test2")
  .then(t => t.text())
  // .then(s => console.log(s.substring(0,10)))
  // .then(r => js = r)
  .then(c => {
    console.time('convert')
    k = JSON.parse(c)
    console.log(k["500px"])
    console.timeEnd('convert')
  })
  .then(j => console.log(k))
  console.timeEnd('st')
  // console.log(js)
})

var k
elBtn5.addEventListener("click", async () => {
  console.time('st')
  var f = await fetch("http://localhost:21311/test2")
  let t = await f.text()
  console.log(t)

  console.time('convert')

  k = JSON.parse(t)
  console.log(k["500px"])      // always gives undefined

  console.timeEnd('convert')
  console.timeEnd('st')

})

elBtn6.addEventListener("click", async () => {
  console.time('st')
  var f = await fetch("http://localhost:21311/test2")
  let t = await f.text()
  // console.log(t)

  console.time('convert')

  try {
    k = JSON.parse(t)
    console.log(k["500px"])
  } catch(err) {
    console.log(err)
  }

  console.timeEnd('convert')
  console.timeEnd('st')
})


elBtn7.addEventListener("click", async () => {
  console.time('st')
  var f = await fetch("http://localhost:21311/testjson")
  let t = await f.text()
  console.log(t.substring(0,100))

  // return
  console.time('convert')

  try {
    k = JSON.parse(t)
    console.log(k["500px"])
  } catch(err) {
    console.log(err)
  }

  console.timeEnd('convert')
  console.timeEnd('st')

})


// window.addEventListener('DOMContentLoaded', (event) => {
//     console.log('DOM fully loaded and parsed');
// });


window.addEventListener('load', async () => {
    // debugger
    try {
      let a = await fetch("http://localhost:21311")
      let txt = await a.text()
      // console.log(txt)
      // console.log(typeof txt)
      // debugger
      jsondata = await JSON.parse(txt)

      if (typeof jsondata === "string") {
        // console.log("jsondata still string")
        jsondata = JSON.parse(jsondata)
      }
      // console.log(jsondata)
      // console.log(typeof jsondata)
    } catch(err) {
      console.log(err)
      console.log("Error in fetch")
    }

    dataLoad(bListID)

});


elName.addEventListener("change", function() {
  dataSet(bListID, "Backup Name", this.value.trim())
})

// elName.addEventListener("keydown", function(e) {
//   if (e.key !== "Shift") {
//     alert(windowsFilenameIllegalCharacters(e.key))
//   }
// })

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
  dataSet(bListID, "Backup Root Directory", this.value.trim())
})

elDate.addEventListener("change", function() {
  // debugger
  scriptRootDirDate = this.checked
  dataSet(bListID, "Include Date", Boolean(this.checked))
  debugger
  for (let i = 0; i < document.querySelectorAll(".filelist__date input").length; i++) {
    if (elDate.checked) {
      document.querySelectorAll(".filelist__date input")[i].setAttribute("disabled", '')
    } else {
      // enable if the line is active
      if (document.querySelectorAll(".filelist__active input")[i].checked) {
        document.querySelectorAll(".filelist__date input")[i].removeAttribute("disabled")
      }
    }
  }
})

elMsgBefore.addEventListener("change", function() {
  dataSet(bListID, "Message Before", this.value)
})

elMsgBefore.addEventListener("keypress  ", function(e) {
  if (elMsgBefore.value.length > 150) {
    e.preventDefault();
  }
})

elMsgAfter.addEventListener("change", function() {
  dataSet(bListID, "Message After", this.value)
})

elMsgAfter.addEventListener("keydown", function(e) {
  // alert(e.key)
  if (elMsgAfter.value.length > 150) {
        e.preventDefault();
  }
})


elActive.addEventListener("click", function(e) {
  debugStart(debugGetFuncName(), arguments)
  debugLog(debugGetFuncName(), "1", { bListID })

  // alert(e.key)
  let txt
  // alert(elActive.checked)
  if (!elActive.checked) {
    var r = confirm("Are you sure you want to make it inactive?")
    if (r == true) {
      // txt = "You pressed OK!";
      active(false)
      dataSet(bListID, "Active", this.checked)

    } else {
      active(true)
      elActive.checked = true
    }
  } else {
    debugger
    active(true)
    dataSet(bListID, "Active", this.checked)
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

elMsgAfter.addEventListener("keypress", function(e) {
  if (elMsgAfter.value.length > 20) {
    e.preventDefault()
  }
})

elSendEmail.addEventListener("change", function() {
  dataSet(bListID, "Send Email After", Boolean(this.checked))
})

elEmail.addEventListener("change", function() {
  dataSet(bListID, "Email Address", this.value.trim())
})


function dataSet(backupListID, property, value, fileIndex, fileField) {
  // fileIndex - if this is filled in, it means we are talking about file fields
  let json
  // debugger

  if (fileIndex === undefined) {
    jsondata["Backup List"][backupListID][property] = value
  } else {
    jsondata["Backup List"][backupListID]["Files"][fileIndex][fileField] = value
  }

  dataSave()
}

async function dataSave() {
  let today = new Date()
  // debugger
  jsondata["Backup List"][bListID]["Last edited"] = dateToDDMMYYYY(today, '/')

  elLastEdited.innerText = "Today"
  elLastEdited.classList.add("txt-today")

  // fetch()
  // console.log(JSON.stringify(jsondata))

  const url = 'http://localhost:21311/';
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsondata)
  };

  let r = await fetch(url, options)
  // debugger
  let txt = await r.text()

  try {
    json = JSON.parse(txt)
    // json = IsJsonString(txt)
    if (json.hasOwnProperty("Error List")) {
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
          console.log(fld)
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
  // debugger
  if (elActive.checked) {
  // console.log(json["Error List"][bListID])
  for (let i = 0; i < Object.keys(json["Error List"][bListID]).length; i++) {
    switch (Object.keys(json["Error List"][bListID])[i]) {
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
  elTemp.forEach(item => arrIndexes.push(Number(item.getAttribute('data-index'))))
  let a = arrIndexes.reduce((acc, cv) => cv > acc ? cv : acc, 0)
  return a + 1
}

function fileLineIndexToLineNumber(index) {
  elTemp = document.querySelectorAll(".filelist__line")

  // Get the line number in the DOM and array
  let i = 0
  do {
    i = i + 1
    console.log(elTemp[i]) //value
    console.log(elTemp[i].getAttribute('data-index'))
  } while ((Number(elTemp[i].getAttribute('data-index')) !== index) || (i ==200))

  return i
}


function dataLoad(backupListID) {
  // console.log("from dataLoad")
  // console.log(arguments)
  // console.log(arguments[0])
  // debugStart()
  debugStart(debugGetFuncName(), arguments)
  debugLog(debugGetFuncName(), "1", { bListID })
  // debugLog(debugGetFuncName(), "1", bListID )

  // debugger
  elName.value = jsondata["Backup List"][backupListID]["Backup Name"]
  elBackupTo.value = jsondata["Backup List"][backupListID]["Backup Root Directory"]
  elDate.checked = jsondata["Backup List"][backupListID]["Include Date"]
  elMsgBefore.value = jsondata["Backup List"][backupListID]["Message Before"]
  elMsgAfter.value = jsondata["Backup List"][backupListID]["Message After"]
  elSendEmail.checked = jsondata["Backup List"][backupListID]["Send Email After"]
  elEmail.value = jsondata["Backup List"][backupListID]["Email Address"]
  elLastEdited.innerText = dateDisplay(dateDDMMYYYYToDate(jsondata["Backup List"][backupListID]["Last edited"]))
  elActive.checked = jsondata["Backup List"][backupListID]["Active"]
  // elCreateScript.innerText = dateDisplay(dateDDMMYYYYToDate(jsondata["Backup List"][backupListID]["Last edited"]))
  // This may change from Create to Regenerate - on name change or edit or create

  var d1 = new Date(dateDDMMYYYYToDate(jsondata["Backup List"][backupListID]["Last edited"]))
  var today = new Date()
  elLastEdited.classList.remove("txt-today")
  elLastEdited.classList.remove("txt-soon")
  let datecolor = dateColor(d1, today)
  if (datecolor) {
    elLastEdited.classList.add(datecolor)
  }

  debugger
  if (jsondata.hasOwnProperty("Error List")) {
    warnings(jsondata)
  }

  // debugger
  active(elActive.checked)
  scriptRootDirDate = elActive.checked
  // debugger

  // debugLog(debugGetFuncName(), "4", { backupListID })

  var dataindex = fileLineIndexNew()

  for (let i = 0; i < jsondata["Backup List"][backupListID]["Files"].length; i++) {
    console.log("i - " + i + "; length - " + jsondata["Backup List"][backupListID]["Files"].length)

    debugger
    fileLineAdd(dataindex - 1)
    dataindex++
    document.querySelectorAll(".filelist__file input")[i].value = jsondata["Backup List"][backupListID]["Files"][i]["File Or Folder"]

    // document.querySelectorAll(".filelist__file input")[i].value = jsondata["Backup List"][backupListID]["Files"][i]["File Type"]
    // debugger
    if (jsondata["Backup List"][backupListID]["Files"][i]["Zip It"]) {
      document.querySelectorAll(".filelist__zip input")[i].setAttribute("checked", "checked")
    } else {
      document.querySelectorAll(".filelist__zip input")[i].removeAttribute("checked")
    }
    // document.querySelectorAll(".filelist__zip")[i].checked = Boolean(jsondata["Backup List"][backupListID]["Files"][i]["Zip It"])
    document.querySelectorAll(".filelist__subdir input")[i].checked = jsondata["Backup List"][backupListID]["Files"][i]["Sub-Directories"]
    document.querySelectorAll(".filelist__date input")[i].checked = jsondata["Backup List"][backupListID]["Files"][i]["Date In File"]

    document.querySelectorAll(".filelist__active input")[i].checked = jsondata["Backup List"][backupListID]["Files"][i]["Active"]
    let active = document.querySelectorAll(".filelist__active input")[i].checked
    fileLineActive(i, active)
  }


  for (let i = 0; i < jsondata["Backup List"].length; i++) {
    // debugLog(debugGetFuncName(), "5",  { backupListID })

    let elTR
    if (i === bListID) {
      elTR = createElementAtt(document.querySelector('.backupnamelist tbody'), 'tr', ['selected'], [['data-index', i]], ' ')
    } else {
      elTR = createElementAtt(document.querySelector('.backupnamelist tbody'), 'tr', [], [['data-index', i]], ' ')
    }

    // debugger
    if (jsondata["Backup List"][i]["Active"]) {
      if (i === bListID) {
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

    elTR.addEventListener("click", function () {
      // console.log(this.getAttribute('data-index'))
      bListID = Number(this.getAttribute('data-index'))
      fileListClear()
      backupListClear()
      // debugger
      dataLoad(Number(this.getAttribute('data-index')))
    })

  }

}


function dateDisplay(fieldDate) {
  // If the date is within a week, just say the day name
  // If date is this year but not within the next week, show the month 3 letter abbreviation but not the year
  // debugger

  // debugger
  if (typeof cd === "undefined") {
    let today = new Date()
    cd = today.getDate()
    cm = today.getMonth()
    cy = today.getFullYear()
  }

  // debugger
  if (fieldDate.length === 0) {
    return ""
  }

  let d = new Date(fieldDate)
  let today = new Date()
  let currentYear = today.getFullYear()
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

  // const test1 = () => {
  //   console.log("hello")
  // }

}


function dateColor(startDate, endDate) {
  // given 2 dates, it tells it what class to add
  // if today - purple, if last 7 days, purple, else normal color
  // return a class to add to the item
  // the rules of date coloring are made in this class
  // debugger
  // I used it this way:
  // elLastEdited.classList.remove("txt-today")
  // elLastEdited.classList.remove("txt-soon")
  // let datecolor = dateColor(d1, today)
  // if (datecolor) {
  //   elLastEdited.classList.add(datecolor)
  // }
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

  console.log( { bListID })

  let elFL = createElementAtt(elFileList, 'div', ['filelist__line'], [["data-index", index]], '')

  let elFileDiv = createElementAtt(elFL, 'div', ['filelist__file', 'col'], [], '')

  let elFileTxt = createElementAtt(elFileDiv, 'input', ['e-input--primary'], [['type', 'text'], ['placeholder', 'File, Directory or Filetype eg C:\\My Documents or C:\\My Documents\\*.txt']], '')
  // this fixes the problem of no new line created when using createElement, appendChild - <span> </span>
  // createElementAtt(elFL, 'span', [], [], ' ')
  elFL.appendChild(document.createTextNode(' '))

  let elSubDirDiv = createElementAtt(elFL, 'div', ['filelist__subdir', 'col'], [], '')

  let elSDChk = createElementAtt(elSubDirDiv, 'input', [], [['type', 'checkbox']], [], '')
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

  console.log( { bListID })
  debugStart(debugGetFuncName(), arguments)
  debugLog(debugGetFuncName(), "1", { bListID } )


  elFileTxt.addEventListener("change", function() {
    dataSet(bListID, "Files", this.value.trim(), index, "File Or Folder")
  })

  elSDChk.addEventListener("change", function() {
    dataSet(bListID, "Files", this.checked, index, "Sub-Directories")
  })

  elDateChk.addEventListener("change", function() {
    dataSet(bListID, "Files", this.checked, index, "Date In File")
  })

  elZipChk.addEventListener("change", function() {
    dataSet(bListID, "Files", this.checked, index, "Zip It")
  })

  elActiveChk.addEventListener("change", function() {
    let index = Number(this.getAttribute('data-index'))
    let lineNumber = fileLineIndexToLineNumber(index)

    fileLineActive(lineNumber, this.checked)

    dataSet(bListID, "Files", this.checked, lineNumber - 1, "Active")
  })


  elDeleteBtn.addEventListener("click", function() {
    // dataSet(bListID, "Files", this.value, index, "File Or Folder")
    debugger
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
          jsondata["Backup List"][bListID]["Files"].splice(i, 1)
          document.querySelector(strLine).remove()
        }
      }

      dataSave()
    }
  })


}


elFileAdd.addEventListener("click", function() {
  let dataindex = fileLineIndexNew()
  fileLineAdd(dataindex - 1)
  // debugger
  jsondata["Backup List"][bListID]["Files"].push( { "File Or Folder": "", "File Type": "", "Zip It": false, "Sub-Directories": false, "Date In File": false, "Active": true })

  dataSave()
})


function fileListClear() {
// debugStart(debugGetFuncName(), arguments)
debugLog(debugGetFuncName(), "1", { bListID } )

console.count("fileListClear")

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
debugLog(debugGetFuncName(), "2", { bListID } )

  if (document.querySelectorAll(".backupnamelist tbody tr")[0] !== undefined) {
    document.querySelectorAll(".backupnamelist tbody tr")[0].remove()
    backupListClear()
    return true
  } else {
    return false
  }

}


elAdd.addEventListener("click", function() {
  // debugger
  jsondata["Backup List"].push( {"Backup Name": "", "Backup Root Directory": "", "Include Date": false, "Message Before": "", "Message After": "", "Send Email After": false, "Email Address": "", "Last edited": "", "Script created": "", "Active": true, "Files": [ { "File Or Folder": "", "File Type": "", "Zip It": false, "Sub-Directories": false, "Date In File": false }]} )

  dataSave()
  dataLoad()
})


elRemove.addEventListener("click", function() {
  let index = Number(document.querySelector('.backupnamelist tr.selected').getAttribute('data-index'))
  var r = confirm(`Are you sure you want to make this Backup Profile - ${elName.value} inactive?`)
  if (r == true) {
    // debugger
    jsondata["Backup List"].splice(index, 1)
    bListID = 0
    dataSave()
    dataLoad()
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
  // debugStart(debugGetFuncName(), arguments)
  // debugLog(debugGetFuncName(), "2", { bListID } )
  // debugger
  buildBackupScript()
})


  async function buildBackupScript() {

    jsondata["BackupListID"]= bListID
    console.log(jsondata)
    // debugger

    const url = 'http://localhost:21311/build'
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsondata)
    };

    let r = await fetch(url, options)
    // debugger
    let txt = await r.text()

    debugger

    try {
      json = JSON.parse(txt)
      // json = IsJsonString(txt)
      if (json.hasOwnProperty("Script message")) {
        alert(json['Script message'])
        warnings(json)
      }
    } catch(err) {
      console.log(err)
    }

  }


  function dirFromPath(path) {
    let p = path
    console.log("path - " + path)
    if (p.indexOf("\\") !==-1) {
      console.log("1")
      // return p.substring(0, p.indexOf('\\')) + dirFromPath(p.substring(p.indexOf('\\'), p.length))
      return dirFromPath(p.substring(p.indexOf("\\"), p.length))
    } else {
      console.log("2")
      return p
    }

  }
