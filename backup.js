const elBtn1 = document.querySelector(".btn1")
const elBtn2 = document.querySelector(".btn2")

// elBtn.addEventListener("click", () => {
//   alert("Clicked")
// })

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

var profileID = 0

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
});

window.addEventListener('load', (event) => {
    console.log('loaded');

    // debugger
    fetch("http://localhost:21311")
      .then(res => {
        console.log("=====================================================================")
        console.clear
        console.log("res is:")
        console.log(res)
        res.json()
      })
      .then(function(json) {
        console.log(typeof json)
        jsondata = json
        console.log("before jsondata")
        console.log(typeof jsondata)
        console.log(jsondata)

        dataLoad(profileID)
      })
  // .then(txt => console.log(jsondata))
    .catch((err) => {
      alert(err)
      alert("An error occurred. Try again")
})
});

const elName = document.querySelector('#backupname');
const elBackupTo = document.querySelector('#backupto');
const elDate = document.querySelector('#includedate');
const elMsgBefore = document.querySelector('#msgbefore');
const elMsgAfter = document.querySelector('#msgafter');
const elSendEmail = document.querySelector('#sendemail');
const elEmail = document.querySelector('#email');
const elLastEdited = document.querySelector('.field p');

elName.addEventListener("change", function() {
  dataSet(profileID, "Backup Name", this.value)
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
  dataSet(profileID, "Backup Root Directory", this.value)
})

elDate.addEventListener("change", function() {
  // debugger
  dataSet(profileID, "Include Date", Boolean(this.checked))
})

elMsgBefore.addEventListener("change", function() {
  dataSet(profileID, "Message Before", this.value)
})

elMsgBefore.addEventListener("keypress  ", function(e) {
  if (elMsgBefore.value.length > 150) {
    e.preventDefault();
  }
})

elMsgAfter.addEventListener("change", function() {
  dataSet(profileID, "Message After", this.value)
})

elMsgAfter.addEventListener("keydown", function(e) {
  // alert(e.key)
  if (elMsgAfter.value.length > 150) {
        e.preventDefault();
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
  dataSet(profileID, "Send Email After", Boolean(this.checked))
})

elEmail.addEventListener("change", function() {
  dataSet(profileID, "Email Address", this.value)
})


function dataSet(profileID, property, value) {
  // debugger
  jsondata["Backup List"][profileID][property] = value


  let today = new Date()
  debugger
  jsondata["Backup List"][profileID]["Last edited"] = dateToDDMMYYYY(today)

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

console.log(options)
console.log(JSON.stringify(options.body))
fetch(url, options)
  .then(response => {
    console.log(response.status);
});
}

function dataLoad(profileID) {
  // debugger
  elName.value = jsondata["Backup List"][profileID]["Backup Name"]
  elBackupTo.value = jsondata["Backup List"][profileID]["Backup Root Directory"]
  elDate.checked = jsondata["Backup List"][profileID]["Include Date"]
  elMsgBefore.value = jsondata["Backup List"][profileID]["Message Before"]
  elMsgAfter.value = jsondata["Backup List"][profileID]["Message After"]
  elSendEmail.checked = jsondata["Backup List"][profileID]["Send Email After"]
  elEmail.value = jsondata["Backup List"][profileID]["Email Address"]
  elLastEdited.innerText = dateDisplay(dateDDMMYYYYToDate(jsondata["Backup List"][profileID]["Last edited"]))
  var d1 = new Date(dateDDMMYYYYToDate(jsondata["Backup List"][profileID]["Last edited"]))
  var today = new Date()
  elLastEdited.classList.remove("txt-today")
  elLastEdited.classList.remove("txt-soon")
  let datecolor = dateColor(d1, today)
  if (datecolor) {
    elLastEdited.classList.add(datecolor)
  }

}


function dateDDMMYYYYToDate(string) {
  // debugger
  if (string.length !== 10) {
    return null
  } else {
    let result = new Date()
    result.setDate(string.substring(0, 2))
    result.setMonth(Number(string.substring(3,5)) - 1)
    result.setYear(string.substring(6))
    return result
  }
}

function dateToDDMMYYYY(dt) {
  let d = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate()
  let m = dt.getMonth() < 9 ? "0" + Number(dt.getMonth() + 1) : Number(dt.getMonth() + 1)
  let y = dt.getFullYear()
  return d + '/' + m +'/' + y
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


function numberOfNightsBetweenDates(startDate, endDate) {
  let start = new Date(startDate)
  let end = new Date(endDate)
  start.setHours("1")
  end.setHours("1")
  start.setMinutes("0")
  end.setMinutes("0")
  start.setSeconds("0")
  end.setSeconds("0")
  start.setMilliseconds("0")
  end.setMilliseconds("0")

  let oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  let diffDays = Math.floor(Math.abs((end - start) / (oneDay)))

  return diffDays
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


