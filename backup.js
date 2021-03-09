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

const warningvisible = (fieldname, visible) => { (visible) ? document.querySelector('p.' + fieldname).classList.add("isvisible") : document.querySelector('p.' + fieldname).classList.remove("isvisible") };
const fields = [elName, elBackupTo, elDate, elMsgBefore, elMsgAfter, elSendEmail, elEmail, elLastEdited, elActive];


function IsJsonString(str) {
  try {
      return JSON.parse(str);
  } catch (e) {
      return { "File": "File isn't in JSON format" };
  }
  return false;
}

var jsondata = ''

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


var backupListID = 0

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
});


var t
function tt() {
  const templateSettings = '{"Backup List":[{ "Backup Name": "Main", "Backup Root Directory": "", "Include Date": true, "Message Before": "", "Message After": "", "Send Email After": false, "Email Address": "", "Last edited": "03/03/2021", "Script created": "27/02/2021", "Active": true, "Files": [] } ] }'
  t = JSON.parse(templateSettings)
  console.log(t)
  console.log(typeof t)
  console.log(t[0])

}


window.addEventListener('load', async () => {
    console.log('loaded');

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
      console.log(jsondata)
      console.log(typeof jsondata)
    } catch(err) {
      console.log(err)
      console.log("Error in fetch")
    }

    dataLoad(backupListID)

});


elName.addEventListener("change", function() {
  dataSet(backupListID, "Backup Name", this.value)
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
  dataSet(backupListID, "Backup Root Directory", this.value)
})

elDate.addEventListener("change", function() {
  // debugger
  dataSet(backupListID, "Include Date", Boolean(this.checked))
  debugger
  for (let i = 0; i < document.querySelectorAll(".filelist__date input").length; i++) {
    if (elDate.checked) {
      document.querySelectorAll(".filelist__date input")[i].setAttribute("disabled", '')
    } else {
      document.querySelectorAll(".filelist__date input")[i].removeAttribute("disabled")
    }
  }
})

elMsgBefore.addEventListener("change", function() {
  dataSet(backupListID, "Message Before", this.value)
})

elMsgBefore.addEventListener("keypress  ", function(e) {
  if (elMsgBefore.value.length > 150) {
    e.preventDefault();
  }
})

elMsgAfter.addEventListener("change", function() {
  dataSet(backupListID, "Message After", this.value)
})

elMsgAfter.addEventListener("keydown", function(e) {
  // alert(e.key)
  if (elMsgAfter.value.length > 150) {
        e.preventDefault();
  }
})


elActive.addEventListener("click", function(e) {
  // alert(e.key)
  let txt
  // alert(elActive.checked)
  if (!elActive.checked) {
    var r = confirm("Are you sure you want to make it inactive?")
    if (r == true) {
      // txt = "You pressed OK!";
      active(false)
      dataSet(backupListID, "Active", this.checked)

    } else {
      active(true)
      elActive.checked = true
    }
  } else {
    active(true)
    dataSet(backupListID, "Active", this.checked)
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
  dataSet(backupListID, "Send Email After", Boolean(this.checked))
})

elEmail.addEventListener("change", function() {
  dataSet(backupListID, "Email Address", this.value)
})


async function dataSet(backupListID, property, value, fileIndex, fileField) {
  // fileIndex - optional, if this is filled in, it means we are talking about file fields
  let json
  debugger

  if (fileIndex === undefined) {
    jsondata["Backup List"][backupListID][property] = value
  } else {
    jsondata["Backup List"][backupListID]["Files"][fileIndex][fileField] = value
  }

  let today = new Date()
  // debugger
  jsondata["Backup List"][backupListID]["Last edited"] = dateToDDMMYYYY(today, '/')

  elLastEdited.innerText = "Today"
  elLastEdited.classList.add("txt-today")


  // fetch()
  console.log(JSON.stringify(jsondata))

const url = 'http://localhost:21311/';
const options = {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(jsondata)
};

// console.log(options)
// console.log(JSON.stringify(options.body))
// fetch(url, options)
//   .then(response => {
//     console.log(response.status);
// })
// .then(r => console.log(r))
// .then(resp => resp.text())

let r = await fetch(url, options)
// debugger
let txt = await r.text()

try {
  json = JSON.parse(txt)
  // json = IsJsonString(txt)
  warnings(json)
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
        fld.removeAttribute("disabled")
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

  // debugger
  if (elActive.checked) {
  // console.log(json["Error List"][backupListID])
  for (let i = 0; i < Object.keys(json["Error List"][backupListID]).length; i++) {
    switch (Object.keys(json["Error List"][backupListID])[i]) {
      case "Backup Name":
        warningvisible("backupname", true)
        break
      case "Backup Root Directory":
        warningvisible("backupto", true)
        break
      case "Last edited":
        // warningvisible("lastedited", true)
        // debugger
        warningvisible("createscript", true)
        break
      default:
        break
    }
  }
  }
}

function dataLoad(backupListID) {
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

  warnings(jsondata)

  // debugger
  active(elActive.checked)

  console.log("File list")
  console.log(jsondata["Backup List"][backupListID]["Files"].length)
  for (let i = 0; i < jsondata["Backup List"][backupListID]["Files"].length; i++) {
    fileLineAdd(i)
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
  createElementAtt(elFileList, 'hr', [], [], '')

  let elFL = createElementAtt(elFileList, 'div', ['filelist__line'], [["data-index", index]], '')

  let elFileDiv = createElementAtt(elFL, 'div', ['filelist__file'], [], '')

  let elFileTxt = createElementAtt(elFileDiv, 'input', ['e-input--primary'], [['type', 'text'], ['placeholder', 'File, Directory or Filetype eg C:\\My Documents or C:\\My Documents\\*.txt']], '')
  // this fixes the problem of no new line created when using createElement, appendChild - <span> </span>
  createElementAtt(elFL, 'span', [], [], ' ')

  let elSubDirDiv = createElementAtt(elFL, 'div', ['filelist__subdir'], [], '')

  let elSDChk = createElementAtt(elSubDirDiv, 'input', [], [['type', 'checkbox']], [], '')
  createElementAtt(elFL, 'span', [], [], ' ')

  let elModifiedDiv = createElementAtt(elFL, 'div', ['filelist__modified'], [], '')
  createElementAtt(elFL, 'span', [], [], ' ')

  let elDateDiv = createElementAtt(elFL, 'div', ['filelist__date'], [], '')
  let elDateChk = createElementAtt(elDateDiv, 'input', ['field'], [['type', 'checkbox'], ["data-description", "This feature is really handy for Weekly and Monthly backups. It stops files being overwritten. It puts the date at the end of the filename in YYYYMMDD format. If it is a zip file, it will be the date on the zip file filename otherwise it will put the date on each file in this line if it is *.txt, it will put the date on each text file matching this filetype."]], '')
  createElementAtt(elFL, 'span', [], [], ' ')

  let elZipDiv = createElementAtt(elFL, 'div', ['filelist__zip'], [], '')
  let elZipChk = createElementAtt(elZipDiv, 'input', [], [['type', 'checkbox']], [], '')
  createElementAtt(elFL, 'span', [], [], ' ')

  let elBinDiv = createElementAtt(elFL, 'div', ['filelist__bin'], [], '')
  let elDeleteBtn = createElementAtt(elBinDiv, 'button', ['c-btn', 'c-btn--secondary', 'createscript', 'u-text-center'], [["data-index", index]], '')

  elFileTxt.addEventListener("change", function() {
    dataSet(backupListID, "Files", this.value, index, "File Or Folder")
  })

  elSDChk.addEventListener("change", function() {
    dataSet(backupListID, "Files", this.checked, index, "Sub-Directories")
  })

  elDateChk.addEventListener("change", function() {
    dataSet(backupListID, "Files", this.checked, index, "Date In File")
  })

  elZipChk.addEventListener("change", function() {
    dataSet(backupListID, "Files", this.checked, index, "Zip It")
  })

  elDeleteBtn.addEventListener("click", function() {
    // dataSet(backupListID, "Files", this.value, index, "File Or Folder")
    console.log(this)
    alert("this")
    console.log(this.getAttribute("data-index"))
    var r = confirm("Are you sure you want to remove this line?")
    debugger
    if (r == true) {
      document.querySelectorAll("hr")[index].remove()
      document.querySelectorAll(`.filelist__line[data-index="${index + 1}"]`).remove()
      jsondata["Backup List"][index]["Files"]
    }
  })


}


elFileAdd.addEventListener("click", function() {
  let len = jsondata["Backup List"][backupListID]["Files"].length
  debugger
  fileLineAdd(len)
  jsondata["Backup List"][backupListID]["Files"].push( { "File Or Folder": "", "File Type": "", "Zip It": "", "Sub-Directories": "", "Date In File": "" })
})




