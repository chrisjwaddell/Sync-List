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

var listnumber = 0

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
});

window.addEventListener('load', (event) => {
    console.log('loaded');

    debugger
    fetch("http://localhost:21311")
      .then(res => res.json())
      .then(function(json) {
        jsondata = json
        dataLoad(listnumber)
      })
  // .then(txt => console.log(jsondata))
    .catch((err) => {
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
  dataSet(listnumber, "Backup Name", this.value)
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
  dataSet(listnumber, "Backup Root Directory", this.value)
})

elDate.addEventListener("change", function() {
  debugger
  dataSet(listnumber, "Include Date", Boolean(this.checked))
})

elMsgBefore.addEventListener("change", function() {
  dataSet(listnumber, "Message Before", this.value)
})

elMsgBefore.addEventListener("keypress  ", function(e) {
  if (elMsgBefore.value.length > 150) {
    e.preventDefault();
  }
})

elMsgAfter.addEventListener("change", function() {
  dataSet(listnumber, "Message After", this.value)
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
  dataSet(listnumber, "Send Email After", Boolean(this.checked))
})

elEmail.addEventListener("change", function() {
  dataSet(listnumber, "Email Address", this.value)
})


function dataSet(listnumber, property, value) {
  debugger
  jsondata["Backup List"][listnumber][property] = value

  // fetch()
  console.log(JSON.stringify(jsondata))

const url = 'http://localhost:21311';
const options = {
  method: 'PUT',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json;charset=UTF-8'
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

function dataLoad(listnumber) {
  elName.value = jsondata["Backup List"][listnumber]["Backup Name"]
  elBackupTo.value = jsondata["Backup List"][listnumber]["Backup Root Directory"]
  elDate.checked = jsondata["Backup List"][listnumber]["Include Date"]
  elMsgBefore.value = jsondata["Backup List"][listnumber]["Message Before"]
  elMsgAfter.value = jsondata["Backup List"][listnumber]["Message After"]
  elSendEmail.checked = jsondata["Backup List"][listnumber]["Send Email After"]
  elEmail.value = jsondata["Backup List"][listnumber]["Email Address"]
  elLastEdited.innerText = jsondata["Backup List"][listnumber]["Last edited"]

}