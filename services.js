const fsp = require('fs/promises');
// const fs = require('fs');
// const fsp = fs.promises;

const templateSettings = '{"Backup List":[{ "Backup Name": "Main", "Backup Root Directory": "", "Include Date": true, "Message Before": "", "Message After": "", "Send Email After": false, "Email Address": "", "Last edited": "03/03/2021", "Script created": "27/02/2021", "Active": true, "Files": [] } ] }'

async function getSettings() {
  // See if scripts Directory exists
  let scriptsDir = __dirname + '\\' + 'Backup-scripts'
  try {
    await fsp.access(scriptsDir)
    console.log("Batch scripts dir exists")
  } catch (error){
    console.log("Batch scripts dir DOESNT exist")
    await fsp.mkdir(scriptsDir)
      .then(m => {
          console.warn("Making Backup-scripts directory")
          // settingsFile()
      })
      .catch(err => console.error("Error: In making Backup-scripts directory"))
    }


    // Settings file
    console.log("start of Settings")
    let settingsFile = __dirname + '\\' + 'settings.json'
    try {
        console.log("Before try - settings.json read")
        // return "abc"
        // fsp.readFile(settingsFile,'utf8').then(result => {
        //   console.log(result)
        //   console.log("Settings file exists")
        //   result
        // })

        // Return Promise to awaiting get request
        // return fsp.readFile(settingsFile,'utf8'). then(result => 'rrrrrr')
        return fsp.readFile(settingsFile,'utf8'). then(result => buildErrorChecker(result))
        .catch(err => {
          console.log("error in reading file in get")
          fsp.writeFile(settingsFile,templateSettings)
          return templateSettings
        })
        .then(re => re)

          // console.log(typeof result)
          // console.log(result.length)
          // console.log("result of buildErrorChecker")
          // let b = buildErrorChecker(result)
          // console.log(b)
        // })

          // This works
          // let rr = await fsp.readFile(settingsFile,'utf8')
          // // console.log(rr)
          // return rr

          console.log("command after read file")

    } catch (err){
        console.error(err)
        console.log("Settings file DOESN'T exists")
        await fsp.writeFile(settingsFile,templateSettings)
           .then(m => {
             console.warn("Making settings.json")
            //  buildErrorChecker(templateSettings)
           })
          .catch(err => console.error("Error: Couldn't create settings.json"))
    }

}


async function putSettings(jsonstring) {
  console.log("in putSettings")
  console.log(jsonstring)

  let json = await buildErrorChecker(jsonstring)
  let strjson = await JSON.stringify(json, null, 4)
  console.log(strjson)
  // fsp.writeFile(__dirname + '\\' + 'settings.json', strjson, (err) => {
  //   if (err) {
  //     console.log("xxx")
  //     console.error(err)
  //     return
  //   }
  //   console.log("file written to")
  // })

  try {
    await fsp.writeFile(__dirname + '\\' + 'settings.json', strjson)
  } catch (err) {
      console.log("xxx")
      console.error(err)
    }
    //file written successfully
    console.log("file written to")
}


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


async function scriptsDirAndSettingsFile() {
  // See if scripts Directory exists
  let scriptsDir = __dirname + '\\' + 'Backup-scripts'
  try {
    await fsp.access(scriptsDir)
    console.log("Batch scripts dir exists")
  } catch (error){
    console.log("Batch scripts dir DOESNT exist")
    await fsp.mkdir(scriptsDir)
      .then(m => {
          console.warn("Making Backup-scripts directory")
          // settingsFile()
      })
      .catch(err => console.error("Error: In making Backup-scripts directory"))
    }


    // Settings file
    console.log("start of Settings")
    let blanksettings = ''
    let settingsFile = __dirname + '\\' + 'settings.json'
    try {
        await fsp.access(settingsFile)
        console.log("Settings file exists")
    } catch (error){
        console.log("Settings file DOESN'T exists")
        await fsp.writeFile(settingsFile,blanksettings)
           .then(m => {
             console.warn("Making settings.json")
            //  buildErrorChecker(blanksettings)
           })
          .catch(err => console.error("Error: Couldn't create settings.json"))
    }

}


async function buildErrorChecker(jsonstring) {
  var errorlist = ""
  var json = ""

  // console.log("in buildErrorChecker")
  // console.log(jsonstring)
  // console.log(typeof jsonstring)
  // console.log(jsonstring.substring(0,50))

//   let js2 = '{"Backup List": "gg"}'
  // let js = '{"Backup List": [ { "Backup Name": "Main" } ]}'

// debugger

  try {
    // let jsonstringify = await JSON.stringify(jsonstring)
    let jsonnospaces = jsonstring.replace(' ','')
    // console.log("no spaces - " + jsonnospaces)
    console.log(jsonstring.substring(0,1).toString(256))
    json = await JSON.parse(jsonstring)
  } catch(err) {
    console.log(err)

  }

  delete json["Error List"]
  json["Error List"] = []

  // console.log(json["Backup List"])
  // console.log(json["Backup List"].length)

  // console.log("before for loop")
  for(let i = 0; i < json["Backup List"].length; i++){

    json["Error List"].push({})
    // console.log(json)

    // Backup Name
  try {
    await fsp.access(__dirname + '\\' + 'Backup-scripts' + '\\' + json["Backup List"][i]["Backup Name"] + '.ps1')
    // console.log("Check script file - after await")
  } catch (error){
    console.error(error)
    json["Error List"][i]["Backup Name"] = "Script file doesn't exist."
    // console.log(json)
  }

  // Backup Root Directory
  try {
    await fsp.access(json["Backup List"][i]["Backup Root Directory"])
  } catch (error){
    json["Error List"][i]["Backup Root Directory"] = "Backup Root Directory not found."
  }

  // Backup script created less than Last edited
  let diff = numberOfNightsBetweenDates(dateDDMMYYYYToDate(json["Backup List"][i]["Script created"]), dateDDMMYYYYToDate(json["Backup List"][i]["Last edited"]))
  if (diff > 1) {
    json["Error List"][i]["Last edited"] = "Changes have been made since the Backup Script was generated last."
    // console.log(json)
  }

  // console.log("end of for - " + i)
}  // for


// console.log(json)
return json

}  // buildErrorChecker


  function dateDDMMYYYYToDate(string) {
    // debugger
    console.log("dateDDMMYYYYToDate")
    console.log( { string })
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
  getSettings,
  putSettings,
  scriptsDirAndSettingsFile,
  scriptsFolder3
}
