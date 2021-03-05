const fsp = require('fs/promises');
// const fs = require('fs');
// const fsp = fs.promises;

const templateSettings = '{"Backup List":[{ "Backup Name": "Main", "Backup Root Directory": "", "Include Date": true, "Message Before": "", "Message After": "", "Send Email After": false, "Email Address": "", "Last edited": "03/03/2021", "Script created": "27/02/2021", "Active": true, "Files": [] } ] }'
//take the date out

var settingsFile = __dirname + '\\' + 'settings.json'

function IsJsonString(str) {
  try {
      return JSON.parse(str);
  } catch (e) {
      return { "File": "File isn't in JSON format" };
  }
  return false;
}

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
    try {
        console.log("Before try - settings.json read")

        let strFileContent = await fsp.readFile(settingsFile,'utf8')
        console.log(strFileContent)
        let objJSON = IsJsonString(strFileContent)
        let fileContentPlusErrors = await buildErrorChecker(objJSON)
        return fileContentPlusErrors


    } catch (err){
        console.error(err)
        console.error("Settings file DOESN'T exists...... Making settings.json")

        let jsontemplate = IsJsonString(templateSettings)
        jsontemplate["Important Error Message"] = "The settings.json doesn't exist."

        let strjson = JSON.stringify(jsontemplate, null, 4)

        await fsp.writeFile(settingsFile, strjson).catch(err => console.error("Error: Couldn't create settings.json"))

          return jsontemplate
    }

}


async function putSettings(jsonobj) {
  console.log("in putSettings")
  console.log(jsonobj)

  debugger

  let json = await buildErrorChecker(jsonobj)

  // console.log("in putSettings:")
  // console.log(json)
  let strjson = JSON.stringify(json, null, 4)
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
    fsp.writeFile(settingsFile, strjson)
    return json
  } catch (err) {
      console.log("xxx")
      console.error(err)
    }
    //file written successfully
    console.log("file written to")
}


async function buildErrorChecker(jsonobj) {
  var errorlist = ""
  var json = ""

  console.log("in buildErrorChecker")
  // console.log(jsonobj)
  // console.log(typeof jsonobj)
  // console.log(typeof jsonstring)
  // console.log(jsonstring.substring(0,50))

//   let js2 = '{"Backup List": "gg"}'
  // let js = '{"Backup List": [ { "Backup Name": "Main" } ]}'

  // try {
  //   json = JSON.parse(jsonstring)
  // } catch(err) {
  //   console.log("error in parsing settings file")
  //   console.log(err)

  //   let today = new Date()
  //   let strToday =   dateToYYYYMMDD(today, '')
  //   let fileRenamed = __dirname + '\\' + 'settings-' + strToday + '.json'
  //   // console.dir({fileRenamed})

  //   await fsp.rename(settingsFile, fileRenamed)

  //   let jsontemplate = JSON.parse(templateSettings)
  //   jsontemplate["Important Error Message"] = `The settings.json file isn't in JSON format and has been moved to ${fileRenamed}`
  //   // let strjson = JSON.stringify(templateSettings, null, 4)
  //   await fsp.writeFile(settingsFile,templateSettings)
  //   return jsontemplate
  // }

  json = jsonobj

  delete json["Important Error Message"]

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

function dateToYYYYMMDD(dt, seperator) {
  let d = dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate()
  let m = dt.getMonth() < 9 ? "0" + Number(dt.getMonth() + 1) : Number(dt.getMonth() + 1)
  let y = dt.getFullYear()
  return y + seperator + m + seperator + d
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
  putSettings
}
