

const { json } = require('body-parser');
const fsp = require('fs/promises');

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
  // console.log("In buildErrorArray")
  console.dir(json)
  // console.dir(typeof json)

  // console.log(json["Backup List"][0])

  let count = json["Backup List"].length

  console.log({count})

  delete json["Error List"]
  console.dir(json)
  json["Error List"] = [{}]
  console.dir(json)
  console.log(json["Error List"][0])

  // console.log(json["Backup List"][0]["Backup Name"])
  // errorCheckerScriptFile(0)
  let g = errorCheckerScriptFile2(json["Backup List"][0]["Backup Name"])
  .then(result => {
    console.log(result)
    if (!result) {
      json["Error List"][0] = { "Backup Name": "Script file doesn't exist." }
      console.dir(json)
    }
  })
  .catch(err => {
    json["Error List"][0] = { "Backup Name": "Script file doesn't exist." }
    console.dir(json)
    // console.log(err)
  })
  // console.log(b)
  console.dir(json)

}


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
    return true
  } catch(err) {
    // console.error(err)
    return false
  }
}

async function errorCheckerBackupTo(profileNumber) {
  var backupDir = json["Backup List"][profileNumber]["Backup To"]
  console.log("in errorCheckerBackupTo - " + backupDir)

const blanksettings = ""

try {
  await fsp.access(backupDir)
} catch(err) {
  console.error(err)
}

}


module.exports = {
  scriptsFolder3
}
