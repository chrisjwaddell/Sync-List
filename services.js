const fsp = require('fs/promises');
// const fs = require('fs');
// const fsp = fs.promises;

function scriptsFolder() {
  scriptsdir = __dirname + '\\' + 'Backup-scripts'
  fsp.access(scriptsdir, (err) => {
    if(err && err.code === 'ENOENT'){
      fs.mkdir(scriptsdir, { recursive: false }, e => {
        if (e) {
            console.error(e);
        } else {
            console.log('Success');
        }
     })

    } else {
      console.log("gg")
    }

  })

}


async function scriptsFolder2() {
  scriptsdir = __dirname + '\\' + 'Backup-scripts'
  try {
    await access(scriptsdir, constants.R_OK | constants.W_OK);
    console.log('can access');
  } catch {
    console.error('cannot access');
  }
}

function scriptsFolder3() {
  scriptsdir = __dirname + '\\' + 'Backup-scripts'
  fsp.access(scriptsdir)
      .then(i => {
          console.log(scriptsdir + " Folder exists")
          settingsFile()
      })
      .catch(err => {
          fsp.mkdir(scriptsdir)
            .then(m => {
              console.warn("Making Backup-scripts directory")
              settingsFile()
            })
            .catch(err => console.error("Error: In making Backup-scripts directory"))
      })
}


function settingsFile() {
  var settings = __dirname + '\\' + 'settings.json'
  console.log("in setttingsFile")

const blanksettings = ""

  fsp.access(settings)
      .then(i => {
          console.log("Settings file exists")
          fsp.readFile('./settings.json', 'utf8')
            .then(data => {
              // console.log("data is " + data)
              let json = JSON.stringify(data)
              // let json = data
              // console.log("json is " + json)
              buildErrorChecker(data)
            })
            .catch((err) => {
              console.log(err)
              console.log("error reading file")
            })
      })
      .catch(err => {
          // console.error(err)
          console.log("Settings file DOESN'T exists")
          fsp.writeFile(settings,blanksettings)
               .then(m => {
                 console.warn("Making settings.json")
                 buildErrorChecker(blanksettings)
               })
              .catch(err => console.error("Error: Couldn't create settings.json"))
      })
}

async function buildErrorChecker(jsonstring) {
  var errorlist = ""

  let json = await JSON.parse(jsonstring)
  console.log("In buildErrorChecker")
  // console.dir(json)
  // console.dir(typeof json)

  // console.log(json["Backup List"][0])
  // let count = json["Backup List"].length
  // console.log({count})

  delete json["Error List"]
  // console.dir(json)
  json["Error List"] = []
  console.dir(json)
  // console.log(json["Error List"][0])

  // console.log(json["Backup List"][0]["Backup Name"])
  // errorCheckerScriptFile(0)

  for(let i = 0; i < json["Backup List"].length; i++){
    console.log("i - " + i)
    json["Error List"].push({})
  // Backup Name
  try {
    // await fsp.access(__dirname + '\\' + 'Backup-scripts' + '\\' + json["Backup List"][i]["Backup Name"] + '.ps1', "console.log('Hello world with Node.js v10 fs/promises!'")
    await fsp.access(__dirname + '\\' + 'Backup-scripts' + '\\' + json["Backup List"][i]["Backup Name"] + '.ps1')
    console.info("Backup Name")
    console.log(__dirname + '\\' + 'Backup-scripts' + '\\' + json["Backup List"][i]["Backup Name"] + '.ps1')
  } catch (error){
    console.log("error - Backup Name")
    // console.error(error);
    json["Error List"][i]["Backup Name"] = "Script file doesn't exist."
  }
  console.dir(json)

  // Backup Root Directory
  try {
    // await fsp.access(__dirname + '\\' + 'Backup-scripts' + '\\' + json["Backup List"][i]["Backup Name"] + '.ps1', "console.log('Hello world with Node.js v10 fs/promises!'")
    await fsp.access(json["Backup List"][i]["Backup Root Directory"])
    console.info("Checked Backup Root Directory");
    console.log(json["Backup List"][i]["Backup Root Directory"])
    // json["Error List"][i] = {  }
  } catch (error){
    console.log("error - Backup Root Directory")
    // console.error(error);
    json["Error List"][i]["Backup Root Directory"] = "Backup Root Directory not found."
  }
  console.dir(json)

  // Backup script created less than Last edited
  let diff = numberOfNightsBetweenDates(dateDDMMYYYYToDate(json["Backup List"][i]["Backup script created"]), dateDDMMYYYYToDate(json["Backup List"][i]["Last edited"]))
  console.log("diff - " + diff)
  if (diff > 1) {
    json["Error List"][i]["Last edited"] = "Changes have been made since the Backup Script was generated last."
  }

}  // for

    console.dir(json)
console.log("Before end")
return

  console.log("up to errorCheckerScriptFile3")
  errorCheckerScriptFile3(json["Backup List"][0]["Backup Name"])
    // .then(result => {
    //   console.log("errorCheckerScriptFile2 Promise result - " + result)
    //   if (!result) {
    //     json["Error List"][0] = { "Backup Name": "Script file doesn't exist." }
    //     console.dir(json)
    //   }
    // })
    // .catch(err => {
    //   console.log("errorCheckerScriptFile2 Promise in catch")
    //   json["Error List"][0] = { "Backup Name": "Script file doesn't exist." }
    //   console.dir(json)
    //   // console.log(err)
    // })
  // console.log(b)
  console.log("In buildErrorChecker, finished errorCheckerScriptFile2 section")
  console.dir(json)

console.log("up to errorCheckerBackupTo")
  let h = errorCheckerBackupTo(json["Backup List"][0]["Backup Root Directory"])
  .then(result => {
    console.log(result)
    if (!result) {
      json["Error List"][0] = { "Backup Root Directory": "Backup Root Directory not found." }
      console.dir(json)
    }
  })
  .catch(err => {
    json["Error List"][0] = { "Backup Root Directory": "Backup Root Directory not found." }
    console.dir(json)
    // console.log(err)
  })
  // console.log(b)
  console.log("In buildErrorChecker, finished errorCheckerBackupTo section")
  console.dir(json)


}


// Put these within buildErrorChecker

async function errorCheckerScriptFile(profileNumber) {
  var scriptFile = __dirname + '\\' + 'Backup-scripts' + '\\' + json["Backup List"][profileNumber]["Backup Name"] + '.ps11'
  console.log("in errorCheckerSettings - " + scriptFile)

  const blanksettings = ""

  try {
    await fsp.access(scriptFile)
    json["Error List"][profileNumber]["Backup Name"] ={}
  } catch(err) {
    console.error(err)
    // json["Error List"][profileNumber]["Backup Name"] ={}
    json["Error List"][profileNumber] = { "Backup Name": "Script file doesn't exist." }
  }
  console.log(json)
}

async function errorCheckerScriptFile2(backupScriptFile) {
  // var scriptFile = __dirname + '\\' + 'Backup-scripts' + '\\' + json["Backup List"][0]["Backup Name"] + '.ps11'
  var scriptFile = __dirname + '\\' + 'Backup-scripts' + '\\' + backupScriptFile + '.ps11'
  console.log("in errorCheckerSettings - " + scriptFile)

  const blanksettings = ""

  try {
    await fsp.access(scriptFile)
    console.log("errorCheckerScriptFile2 - true")
    return true
  } catch(err) {
    // console.error(err)
    console.log("errorCheckerScriptFile2 - false")
    return false
  }
}

function errorCheckerScriptFile3(backupScriptFile) {
  // var scriptFile = __dirname + '\\' + 'Backup-scripts' + '\\' + json["Backup List"][0]["Backup Name"] + '.ps11'
  var scriptFile = __dirname + '\\' + 'Backup-scripts' + '\\' + backupScriptFile + '.ps11'
  console.log("in errorCheckerSettings - " + scriptFile)

  const blanksettings = ""

  // , fs.constants.R_OK | fs.constants.W_OK)
  fsp.access(scriptFile)
  .then(() => console.log("errorCheckerScriptFile3 .then()"))
  .catch(() => console.log("errorCheckerScriptFile3 .catch()"))

  // fsp.access(scriptFile)
  //   .then(result => {
  //     console.log("errorCheckerScriptFile3 .then()")
  //     console.log(result)
  //   })
  //   .catch(err => {
  //   // console.error(err)
  //   console.log("errorCheckerScriptFile3 - false")
  // })
}


async function errorCheckerBackupTo(backuptTo) {
  // var backupDir = json["Backup List"][profileNumber]["Backup To"]
  console.log("in errorCheckerBackupTo - " + backuptTo)

const blanksettings = ""

try {
  await fsp.access(backuptTo)
  console.log("errorCheckerBackupTo - true")
  return true
} catch(err) {
  // console.error(err)
  console.log("errorCheckerBackupTo - false")
  return false
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
  let diffDays = Math.floor((end - start) / (oneDay))

  return diffDays
}


module.exports = {
  scriptsFolder3
}
