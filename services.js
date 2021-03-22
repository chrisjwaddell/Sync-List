const fsp = require('fs/promises');
// const fs = require('fs');
// const fsp = fs.promises;

const templateSettings = '{"Backup List":[{ "Backup Name": "Main", "Backup Root Directory": "", "Include Date": true, "Message Before": "", "Message After": "", "Send Email After": false, "Email Address": "", "Last edited": 123, "Script created": 123, "Active": true, "Files": [] } ] }'
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
//buildErrorChecker is run to get the updated information of the filesystem
// But it is not saved to the file, it's not necesary to save the error array

  // See if scripts Directory exists
  let scriptsDir = __dirname + '\\' + 'Backup-scripts'
  try {
    await fsp.access(scriptsDir)
    // console.log("Batch scripts dir exists")
  } catch (error){
    // console.log("Batch scripts dir DOESNT exist")
    await fsp.mkdir(scriptsDir)
      .then(m => {
          console.warn("Making Backup-scripts directory")
          // settingsFile()
      })
      .catch(err => console.error("Error: In making Backup-scripts directory"))
 }


   // Settings file
  //  console.log("start of Settings")
   try {
      // console.log("Before try - settings.json read")

        var strFileContent = await fsp.readFile(settingsFile,'utf8')
        // console.log(strFileContent)
        let objJSON = IsJsonString(strFileContent)
        // console.log(objJSON)
        let fileContentPlusErrors = await buildErrorChecker(objJSON)
        return fileContentPlusErrors


    } catch (err){
        console.error(err)
        console.error("Settings file DOESN'T exists...... Making settings.json")

        // save the file before overwritting settings.json
        let today = new Date()
        // today = Date.now()
        // console.log("today - " + today)
        // console.log(dateToYYYYMMDD(today, ''))
        let settingsFileError = __dirname + '\\' + 'settings-' + dateToYYYYMMDD(today, '') + '-' + dateToHHMM(today, '') + '.json'
        await fsp.writeFile(settingsFileError, strFileContent).catch(err => console.error("Error: Couldn't create settings Error json file"))


        let jsontemplate = IsJsonString(templateSettings)
        jsontemplate["Important Error Message"] = "The settings.json isn't in the correct format. A new, blank settings.json file has been created and the previous settings file was save to " + settingsFileError


        let strjson = JSON.stringify(jsontemplate, null, 4)
        // console.log(jsontemplate)


        await fsp.writeFile(settingsFile, strjson).catch(err => console.error("Error: Couldn't create settings.json"))

        return jsontemplate
    }

}


async function putSettings(jsonobj) {
  // console.log("in putSettings")
  // console.log(jsonobj)

  debugger

  let json = await buildErrorChecker(jsonobj)

  // console.log("in putSettings:")
  // console.log(json)

  let strjson = JSON.stringify(json, null, 4)
  // console.log(strjson)
  // fsp.writeFile(__dirname + '\\' + 'settings.json', strjson, (err) => {
  //   if (err) {
  //     console.log("xxx")
  //     console.error(err)
  //     return
  //   }
  //   console.log("file written to")
  // })

  try {
    await fsp.writeFile(settingsFile, strjson)
    return json
  } catch (err) {
      // console.log("xxx")
      console.error(err)
  }
  //file written successfully
  // console.log("file written to")
}


async function buildErrorChecker(jsonobj) {
  var errorlist = ""
  var json = ""

  // console.log("in buildErrorChecker")

  json = jsonobj

  try {
    // console.log("buildErrorChecker - try")
    // console.log(jsonobj)
    // console.log(json)
    // let objJSON = JSON.parse(json)
  } catch (err) {
    console.error(err)
  }


  delete json["Important Error Message"]

  delete json['Script message']

  delete json["Error List"]
  json["Error List"] = []

  delete json["BackupListID"]

  for(let i = 0; i < json["Backup List"].length; i++){

    json["Error List"].push({})

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
    let d1 = json["Backup List"][i]["Script created"]
    let d2 = json["Backup List"][i]["Last edited"]

    if (d2 > d1) {
      json["Error List"][i]["Last edited"] = "Changes have been made since the Backup Script was generated last."
    }

}  // for

return json

}  // buildErrorChecker



function powershellStart(filesArray, edited) {
  var strFileList = "<#"
  debugger
  for (let i = 0; i < filesArray.length; i++) {
     strFileList += "\n" + filesArray[i]["File Or Folder"]
  }
  strFileList += "\n" + "\n"

  strFileList += "Last Edited - " + edited + "\n" + "#>" + "\n" + "\n"

  // console.log("powershellStart")
  // console.log(strFileList)
  return strFileList
  }


  const powershellVars = (bt) => `$BackupTo = '${bt}'\n$Now = Get-Date -Format "yyyyMMdd"\n\n`


  const powershellMsgBefore = (msgBefore) => `$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${msgBefore}")\n\n`
  const powershellMsgAfter = (msgAfter) => `$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${msgAfter}")\n\n`

  const powershellDestination = ()  => 'Test-Path "$BackupTo"\nIf (!(Test-Path "$BackupTo")) {\n\tWrite-Output "does not exist"\n\tExit\n}\n\n\n'

  function powershellDirData(rootdir) {
    let str = ''

    let rd = rootdir
    if (rd.endsWith('\'')) {
      rd = rd.substring(0, rd.length - 1)
      if (rd.endsWith('\'')) {
        rd = rd.substring(0, rd.length - 1)
      }
    }


    str = `$BackupToFinal = "${rd}\\$Now"` + '\n'
    str += 'If (!(Test-Path "$BackupToFinal")) {' + '\n'
    str += '\tWrite-Output "Directory does not exist"' + '\n'
    str += '\tNew-Item -Path "$BackupTo" -Name $Now -ItemType "directory"' + '\n'
    str += '}' + '\n\n\n'

    return str
  }


  async function fileFolderType(fileLine) {
    console.log("fileFolderType - fileLine - " + fileLine)
    // console.log(fileLine.indexOf('*'))
    if (fileLine.indexOf('*') === -1) {
      var stats = await fsp.stat(fileLine)
      // console.log("no *")
      stats.isFile() ? filetype = 0 : filetype = 1
      // console.log('is directory ? ' + stats.isDirectory());
    } else {
      console.log("* in file")
      filetype = 2
    }
    return filetype
  }


  function powershellFunctions() {
    str = `function CreateDir {
      param (
          $Path
      )

      $len = $Path.length

      $Drive = $Path.substring(0,2)
      $Drive
      $Folders = $Path[[int](-1 * ($len - 3))..-1] -join ''
      $Folders

      $arrFolders = $Folders.split("\\")
      $arrFolders

      $FolderBuild = "$Drive\\"
      $FolderRoot = "$Drive\\"
      Foreach ($i in $arrFolders)
      {
          $i

          $FolderBuild = $FolderBuild + "\\" + $i
          $FolderBuild
          Test-Path $FolderBuild
          If (!(Test-Path "$FolderBuild")) {
              Write-Output "doesn't exist"
              New-Item -Path "$FolderRoot" -Name $i -ItemType "directory"
          }

          $FolderRoot = $FolderRoot + "\\" + $i
          $FolderRoot
      }
  }


  function compressFiles {

    param (
        $zipFile,
        $RootDir,
        $FilesToZip,
        $Recursive
    )

    $compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal

    If ((Test-Path "$zipFile")) {
        Write-Output "Zip file zipFile exists"
        $zip = [System.IO.Compression.ZipFile]::Open($zipFile, 'Update')
    }
    Else {
        $zip = [System.IO.Compression.ZipFile]::Open($zipFile, 'Create')
    }


    If ($Recursive) {
      Get-ChildItem $FilesToZip -Recurse | ForEach-Object {
          [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $_.FullName.Replace($RootDir,""), $compressionLevel)
      }
    } Else {
      Get-ChildItem $FilesToZip -File | ForEach-Object {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $_.FullName.Replace($RootDir,""), $compressionLevel)
      }
    }

    $zip.Dispose()

}`

  return str
  }


  async function powershellFileWrite(fileName, fileText) {
    try {
      fsp.writeFile(fileName, fileText)
      return fileText
    } catch (err) {
        // console.log("xxx")
        console.error(err)
    }
    //file written successfully
  }


async function putBuild(jsondata) {
    // console.log("in putBuild")

     // Backup Name
     var backupID = Number(jsondata["BackupListID"])
     var batchFileName = __dirname + '\\' + 'Backup-scripts' + '\\' + jsondata["Backup List"][backupID]["Backup Name"] + '.ps1'
    //  console.log(jsondata["Backup List"][backupID]["Last edited"])
     var strFile = ''
     strFile = powershellStart(jsondata["Backup List"][backupID]["Files"], jsondata["Backup List"][backupID]["Last edited"])
     strFile += powershellVars(jsondata["Backup List"][backupID]["Backup Root Directory"])

     strFile += "Add-Type -As System.IO.Compression.FileSystem" + "\n\n"

     strFile += powershellFunctions() + '\n\n'

     if (jsondata["Backup List"][backupID]["Message Before"]) strFile += powershellMsgBefore(jsondata["Backup List"][backupID]["Message Before"])
    //  console.log(strFile)
     if (jsondata["Backup List"][backupID]["Message After"]) strFile += powershellMsgAfter(jsondata["Backup List"][backupID]["Message After"])
    //  console.log(strFile)
     strFile += powershellDestination()
    //  console.log(strFile)

    let rd = jsondata["Backup List"][backupID]["Backup Root Directory"]
    let todayDir = new Date()

     if (jsondata["Backup List"][backupID]["Include Date"]) {
        strFile += powershellDirData(jsondata["Backup List"][backupID]["Backup Root Directory"])
        if (rd.endsWith('\'')) {
          rd = rd.substring(0, rd.length - 1)
          if (rd.endsWith('\'')) {
            rd = rd.substring(0, rd.length - 1)
          }
        }
        rd += '\\' + dateToYYYYMMDD(todayDir, '')
      } else {
        strFile += '$BackupToFinal = $BackupTo\n\n'
        if (rd.endsWith('\'')) {
          rd = rd.substring(0, rd.length - 1)
          if (rd.endsWith('\'')) {
            rd = rd.substring(0, rd.length - 1)
          }
        }
      }

    //  console.log(strFile)

    let json = jsondata


    for (let i = 0; i < jsondata["Backup List"][backupID]["Files"].length; i++) {
      // console.log(jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"])
      // console.log(jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"].substring(3, jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"].length))

      // if file line is disabled don't look at it
      if (!jsondata["Backup List"][backupID]["Files"][i]["Active"]) {
        i++
        if (i >= jsondata["Backup List"][backupID]["Files"].length) break
      }

      let s = jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"].split('\\')
      // console.log(s)
      var dir = ''
      // console.log(s)
      // console.log(s.length)

      var ft
      try {
        ft = await fileFolderType(jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"])
      } catch (err) {
        ft = -1
        // throw new Error("Error in filetype")
        // process.exit(1)
      }

      strFile += `$FileName = "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}"` + '\n'
      if (ft === 0) {
        // File
        strFile += `$FileDir = Split-Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}"` + '\n\n'
      } else if (ft === 1) {
        // Folder
        strFile += `$FileDir = "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}"` + '\n\n'
      } else {
        strFile += `$FileDir = Split-Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}"` + '\n\n'
      }


      let sd = jsondata["Backup List"][backupID]["Files"][i]["Sub-Directories"]
      let dateinfile = jsondata["Backup List"][backupID]["Files"][i]["Date In File"]
      let zip = jsondata["Backup List"][backupID]["Files"][i]["Zip It"]

      let toda = new Date()
      // toda = Date.now()
      // console.log(toda)
      var td = dateToYYYYMMDD(toda, '')
      // console.log("td - " + td)

      // console.log(ft + ' ' + sd + ' ' + dateinfile + ' ' + zip)

      if (ft !== -1) {
        if (ft === 0) {
            // sub-dir doesn't matter for file
            if ((!dateinfile) && (!zip)) {
              console.log("File copy")
              if (s.length> 1) {
                for (j = 1; j < s.length - 1; j++) {
                  dir === '' ? dir = s[j] : dir += '\\' + s[j]
                }
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

            } else if ((dateinfile) && (!zip))  {
              console.log("File copy with date")

              if (s.length > 0) {
                if (s.length === 1) {
                  dir = ''
                } else {
                  for (j = 1; j < s.length - 1; j++) {
                    dir === '' ? dir = s[j] : dir += '\\' + td + '-' + s[j]
                  }
                }
              }

              // console.log("dir - " + dir)
              // console.log(s.length)
              // console.log(s[s.length - 1])
              // console.log(rd + '\\' + td + '-' + s[s.length - 1])


              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += '\tCreateDir -Path "$BackupToFinal' + '\\' + dir + '"\n'
              strFile += '}' + '\n'

              strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '\\' + td + '-' + s[s.length - 1] + '"\n\n'

            } else if ((!dateinfile) && (zip))  {
              // console.log("File zip copy")

              dir = ''
              if (s.length> 2) {
                for (j = 1; j < s.length - 1; j++) {
                  dir === '' ? dir += '\\' + s[j] : dir += '\\' + s[j]
                }
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)
              // console.log(s.length)
              // console.log(s[s.length - 1])

              let folder = dir === '' ? '\\' + s[s.length - 1].replace('.', '-') : dir + '\\' + s[s.length - 1].replace('.', '-')

              strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + '\n'
              strFile += '}' + '\n'

              strFile += `Compress-Archive -Update "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" "$BackupToFinal${folder}.zip"` + '\n\n'

            } else if ((dateinfile) && (zip))  {
              // console.log("File zip copy with date")

              dir = ''
              let filename = ''
              if (s.length > 2) {
                  for (j = 1; j < s.length - 1; j++) {
                    if ((j === s.length - 1) || (j === s.length)) {
                      // dir === '' ? dir = '\\' + s[j] : dir += '\\' + s[j]
                    } else {
                      // dir === '' ? dir += '\\' + s[j] : dir += ''
                      // filename = '\\' + s[j].replace('.', '-')
                      dir += '\\' + s[j]
                    }
                    // console.log("dir - " + dir)
                  }
                  filename = '\\' + td + '-' + s[s.length - 1].replace('.', '-')
              } else {
                dir = ''
                filename = '\\' + td + '-' + s[1].replace('.', '-')
              }

              // console.log("dir - " + dir)
              // console.log(rd + dir)
              // console.log(s.length)
              // console.log(s[s.length - 1])
              // console.log("filename - " + filename)

              strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + '\n'
              strFile += '}' + '\n'

              // console.log(`Compress-Archive -Update "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" "$BackupToFinal${dir}${filename}.zip"\n\n`)

              strFile += `Compress-Archive -Update "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" "$BackupToFinal${dir}${filename}.zip"\n\n`

            }

        } else if (ft === 1) {
          if (!sd) {
            if ((!dateinfile) && (!zip)) {
              // console.log("Directory copy")

              if (s.length > 0) {
                for (j = 1; j < s.length; j++) {
                  dir === '' ? dir = s[j] : dir += '\\' + s[j]
                }
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'
              strFile += `Get-ChildItem "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force\n\n`


            } else if ((dateinfile) && (!zip))  {
              // console.log("Directory copy with date")

              if (s.length > 0) {
                if (s.length === 1) {
                  dir =td + '-' + s[1]
                } else {
                  for (j = 1; j < s.length; j++) {
                    dir === '' ? dir = s[j] : dir += '\\' + td + '-' + s[j]
                  }
                }
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'
              // strFile += 'Get-ChildItem "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '\\*"' + ' -file | Copy-Item -Destination "$BackupToFinal' + '\\' + td + '-' + dir + ' -Force' + '\n\n'

              strFile += `Get-ChildItem "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force\n\n`


            } else if ((!dateinfile) && (zip))  {
              // console.log("Directory zip copy")

              let filename = ''
              if (s.length > 0) {
                for (j = 1; j < s.length; j++) {
                  dir === '' ? dir = s[j] : dir += '\\' + s[j]
                }
                filename = s[s.length - 1] + '.zip'
              } else {
                filename = jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '.zip'
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" -Recursive $false` + '\n\n'


            } else if ((dateinfile) && (zip))  {
              // console.log("Directory zip copy with date")
              let filename = ''

              // console.log("s.length - " + s.length)
              // console.log(s[0] + "; " + s[1] + "; " + s[2])

              dir = ''
              if (s.length > 0) {
                if (s.length === 1) {
                  dir = '\\' + td + '-' + s[1]
                } else {
                  for (j = 1; j < s.length; j++) {
                    console.log(dir)
                    if ((j === s.length - 1) || (j === s.length)) {
                      dir === '' ? dir = '\\' + td + '-' + s[j] : dir += '\\' + td + '-' + s[j]
                    } else {
                      dir === '' ? dir = '\\' + s[j] : dir += '\\' + s[j]
                    }
                    console.log("dir - " + dir)
                  }
                }

                filename = td + '-' + s[s.length - 1] + '.zip'
            } else {
              filename = jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '.zip'
            }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += `Compress-Archive -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
              strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" -Recursive $false` + '\n\n'
            }

          } else {
            if ((!dateinfile) && (!zip)) {
              console.log("Directory copy with sub-directories")

              if (s.length > 0) {
                for (j = 1; j < s.length; j++) {
                  dir === '' ? dir = s[j] : dir += '\\' + s[j]
                }
              }

              if (s.length === 0) {
                filename = jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '.zip'
              } else {
                filename = s[s.length - 1] + '.zip'
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `$FileDirRoot = Split-Path "$BackupToFinal\\${dir}"` + '\n\n'

              strFile += `If (!(Test-Path $FileDirRoot)) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path $FileDirRoot` + '\n'
              strFile += '}' + '\n'

              strFile += `Copy-Item -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` + '\n\n'


            } else if ((dateinfile) && (!zip))  {
              console.log("Directory copy with date with sub-directories")

              if (s.length > 0) {
                if (s.length === 1) {
                  dir =td + '-' + s[1]
                } else {
                  for (j = 1; j < s.length; j++) {
                    dir === '' ? dir = s[j] : dir += '\\' + td + '-' + s[j]
                  }
                }
              }

              if (s.length === 0) {
                filename = td + '-' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '.zip'
              } else {
                filename = td + '-' + s[s.length - 1] + '.zip'
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `$FileDirRoot = Split-Path "$BackupToFinal\\${dir}"` + '\n\n'

              strFile += `If (!(Test-Path $FileDirRoot)) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path $FileDirRoot` + '\n'
              strFile += '}' + '\n'

              // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + td + '-' + dir + '"\n\n'
              // strFile += `Get-ChildItem "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force -Recurse\n\n`
              // strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" -Recursive $true` + '\n\n'
              // strFile += `Copy-Item -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` + '\n\n'
              strFile += `Copy-Item -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Destination "$BackupToFinal\\${dir}" -recurse -Force` + '\n\n'

            } else if ((!dateinfile) && (zip))  {
              // console.log("Directory zip copy with sub-directories")

              if (s.length > 0) {
                for (j = 1; j < s.length; j++) {
                  dir === '' ? dir = s[j] : dir += '\\' + s[j]
                }
              }

              if (s.length === 0) {
                filename = jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '.zip'
              } else {
                filename = s[s.length - 1] + '.zip'
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'
              // console.log(strFile)

              // strFile += `Compress-Archive -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*.*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
              strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" -Recursive $true` + '\n\n'
              // console.log(strFile)


            } else if ((dateinfile) && (zip))  {
              // console.log("Directory zip copy with date with sub-directories")

              if (s.length > 0) {
                if (s.length === 1) {
                  dir =td + '-' + s[1]
                } else {
                  for (j = 1; j < s.length; j++) {
                    dir === '' ? dir = s[j] : dir += '\\' + td + '-' + s[j]
                  }
                }
              }

              if (s.length === 0) {
                filename = td + '-' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '.zip'
              } else {
                filename = td + '-' + s[s.length - 1] + '.zip'
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += `Compress-Archive -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*.*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
              strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" -Recursive $true` + '\n\n'

            }
          }

        } else if (ft === 2) {
          if (!sd) {
            if ((!dateinfile) && (!zip)) {
              console.log("Filetype copy")

              if (s.length> 1) {
                for (j = 1; j < s.length - 1; j++) {
                  dir === '' ? dir = s[j] : dir += '\\' + s[j]
                }
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

              strFile += `Get-ChildItem -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -File | ForEach-Object {` + '\n'
              strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` + '\n'
              strFile += '}' + '\n\n'

            } else if ((dateinfile) && (!zip))  {
              // console.log("Filetype copy with date")

              if (s.length > 0) {
                if (s.length === 1) {
                  dir =td + '-' + s[1]
                } else {
                  for (j = 1; j < s.length - 1; j++) {
                    dir === '' ? dir = s[j] : dir += '\\' + td + '-' + s[j]
                  }
                }
              }

              if (s.length === 0) {
                filename = td + '-' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '.zip'
              } else {
                filename = td + '-' + s[s.length - 1] + '.zip'
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

              strFile += `Get-ChildItem -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -File | ForEach-Object {` + '\n'
              strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` + '\n'
              strFile += '}' + '\n\n'


            } else if ((!dateinfile) && (zip))  {
                // console.log("Filetype zip copy")

                let filename = ''
                if (s.length > 2) {
                  for (j = 1; j < s.length - 1; j++) {
                    dir === '' ? dir = s[j] : dir += '\\' + s[j]
                  }
                  filename = s[s.length - 2] + s[s.length - 1].replace('*.', '-') + '.zip'
                } else {
                  filename = jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"].replace(':\*.', '-') + '.zip'
                }

                // console.log("dir - " + dir)
                // console.log(rd + '\\' + dir)
                // console.log("filename = " + filename)

                strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
                strFile += '\tWrite-Output "Directory does not exist"' + '\n'
                strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
                strFile += '}' + '\n'

                strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${s[0]}\\${dir}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Recursive $false` + '\n\n'


            } else if ((dateinfile) && (zip))  {
              // console.log("Filetype zip copy with date")

              let filename = ''
              let origdir = ''
              dir = ''
              if (s.length > 2) {
                for (j = 1; j < s.length - 1; j++) {
                  if ((j === s.length - 2) || (j === s.length - 1)) {
                    dir === '' ? dir = td + '-' + s[j] : dir += '\\' + td + '-' + s[j]
                    origdir === '' ? origdir = s[j] : origdir += '\\' + s[j]
                  } else {
                    dir === '' ? dir = s[j] : dir += '\\' + s[j]
                    origdir === '' ? origdir = s[j] : origdir += '\\' + s[j]
                  }
                  console.log("j - " + j + "; dir - " + dir)
                  console.log("j - " + j + "; origdir - " + origdir)
                }
                filename = s[s.length - 2] + s[s.length - 1].replace('*.', '-') + '.zip'
              } else {
                filename = td + '-' +jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"].replace(':\*.', '-') + '.zip'
              }

              // console.log("origdir - " + origdir)
              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)
              // console.log("filename = " + filename)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += `Compress-Archive -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
              // strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Recursive $false` + '\n\n'
              strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${s[0]}\\${origdir}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Recursive $false` + '\n\n'
                                // compressFiles -zipFile "$BackupToFinal\PROJECTS\01-WEALTH\20210317-01-WEALTH.zip" -RootDir "E:\PROJECTS\01-WEALTH\" -FilesToZip "E:\PROJECTS\01-WEALTH\*.txt" -Recursive $false


            }

          } else {

            if ((!dateinfile) && (!zip)) {
              // console.log("Filetype copy with sub-directories")

              if (s.length> 1) {
                for (j = 1; j < s.length - 1; j++) {
                  dir === '' ? dir = s[j] : dir += '\\' + s[j]
                }
              }

              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)

              strFile += `$FileDirRoot = "$BackupToFinal\\${dir}"` + '\n\n'

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

              // strFile += `Get-ChildItem -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" | ForEach-Object {` + '\n'
              // strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` + '\n'
              // strFile += '}' + '\n\n'

              // strFile += `Copy-Item -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` + '\n\n'
              strFile += `robocopy "${s[0]}\\${dir}" "$FileDirRoot" ${s[s.length - 1]} /e` + '\n\n'

            } else if ((dateinfile) && (!zip))  {
              // console.log("Filetype copy with date with sub-directories")

              let origdir = ''
              if (s.length > 0) {
                if (s.length === 1) {
                  dir =''
                  origdir =''
                } else {
                  for (j = 1; j < s.length - 1; j++) {
                    dir === '' ? dir = s[j] : dir += '\\' + td + '-' + s[j]
                    origdir === '' ? origdir = s[j] : origdir += '\\' + s[j]
                  }
                }
              }

              // console.log("dir - " + dir)
              // console.log("origdir - " + origdir)
              // console.log(rd + '\\' + dir)

              strFile += `$FileDirRoot = "$BackupToFinal\\${dir}"` + '\n\n'

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

              // strFile += `Get-ChildItem -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" | ForEach-Object {` + '\n'
              // strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` + '\n'
              // strFile += '}' + '\n\n'

              // strFile += `Copy-Item -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Destination "$BackupToFinal\\${dir}" -recurse -Force`
              // strFile += `Get-ChildItem "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force\n\n`
              strFile += `robocopy "${s[0]}\\${origdir}" "$FileDirRoot" ${s[s.length - 1]} /e` + '\n\n'

            } else if ((!dateinfile) && (zip))  {
              // console.log("Filetype zip copy with sub-directories")

              let filename = ''
              let origdir = ''
              if (s.length > 2) {
                for (j = 1; j < s.length - 1; j++) {
                  if ((j === s.length - 2) || (j === s.length - 1)) {
                    dir === '' ? dir = td + '-' + s[j] : dir += '\\' + td + '-' + s[j]
                    origdir === '' ? origdir = s[j] : origdir += '\\' + s[j]
                  } else {
                    dir === '' ? dir = s[j] : dir += '\\' + s[j]
                    origdir === '' ? origdir = s[j] : origdir += '\\' + s[j]
                  }

                  // console.log("j - " + j + "; dir - " + dir)
                  // console.log("j - " + j + "; origdir - " + origdir)
                }
                filename = s[s.length - 2] + s[s.length - 1].replace('*.', '-') + '.zip'
              } else {
                filename = td + '-' +jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"].replace(':\*.', '-') + '.zip'
              }

              // console.log("origdir - " + origdir)
              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)
              // console.log("filename = " + filename)

              strFile += `If (!(Test-Path "$BackupToFinal\\${origdir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${origdir}"` + '\n'
              strFile += '}' + '\n'

              strFile += `compressFiles -zipFile "$BackupToFinal\\${origdir}\\${filename}" -RootDir "${s[0]}\\${origdir}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Recursive $true` + '\n\n'


            } else if ((dateinfile) && (zip))  {
              // console.log("Filetype zip copy with date with sub-directories")

              let filename = ''
              let origdir = ''
              dir = ''
              // console.log("s.length - " + s.length)
              // console.log(s[0] + "; " + s[1] + "; " + s[2])
              if (s.length > 2) {
                for (j = 1; j < s.length - 1; j++) {
                  if ((j === s.length - 2) || (j === s.length - 1)) {
                    dir === '' ? dir = td + '-' + s[j] : dir += '\\' + td + '-' + s[j]
                    origdir === '' ? origdir = s[j] : origdir += '\\' + s[j]
                  } else {
                    dir === '' ? dir = s[j] : dir += '\\' + s[j]
                    origdir === '' ? origdir = s[j] : origdir += '\\' + s[j]
                  }

                  // console.log("j - " + j + "; dir - " + dir)
                  // console.log("j - " + j + "; origdir - " + origdir)
                }
                filename = td + '-' + s[s.length - 2] + s[s.length - 1].replace('*.', '-') + '.zip'
              } else {
                filename = td + '-' +jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"].replace(':\*.', '-') + '.zip'
              }

              // console.log("origdir - " + origdir)
              // console.log("dir - " + dir)
              // console.log(rd + '\\' + dir)
              // console.log("filename = " + filename)

              strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + '\n'
              strFile += '\tWrite-Output "Directory does not exist"' + '\n'
              strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + '\n'
              strFile += '}' + '\n'

              // strFile += `Compress-Archive -Path "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
              strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${s[0]}\\${origdir}\\" -FilesToZip "${jsondata["Backup List"][backupID]["Files"][i]["File Or Folder"]}" -Recursive $true` + '\n\n'

            }
          }

        }
      }
    }  // for


    powershellFileWrite(batchFileName, strFile)


    let today = new Date()
    today = Date.now()
    json["Backup List"][backupID]["Script created"] = today
    json["Script message"] = `Backup script file created in ${batchFileName}. Put this file in a cron job or scheduler to automatically do your backups regularly.`

    let fileContentPlusErrors = ''
    try {
      fileContentPlusErrors = await buildErrorChecker(json)
    } catch(err) {
      throw new Error("Error building ErrorChecker")
      process.exit(1)
    }
    return fileContentPlusErrors

}


  function dateDDMMYYYYToDate(string) {
    // debugger
    if (string.length !== 10) {
      return null
    }

    let d = Number(string.substring(0, 2))
    let m = Number(string.substring(3,5))
    let y = string.substring(6)

    if (d < 0) {
      return null
    }
    if (d > 31) {
      return null
    }

    if ((m === 4) || (m === 6) || (m === 9) || (m === 11)) {
      if (d > 30) {
        return null
      }
    }
    if (m === 2) {
      if (d > 28) {
        return null
      }
    }


    let result = new Date()
    result.setDate(d)
    result.setMonth(m - 1)
    result.setYear(y)
    return result
  }

function dateToYYYYMMDD(dt, seperator) {
  let da = new Date(dt)

  let d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate()
  let m = da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1)
  let y = da.getFullYear()
  return y + seperator + m + seperator + d
}

function dateToDDMMYYYY(dt, seperator) {
  let da = new Date(dt)

  let d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate()
  let m = da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1)
  let y = da.getFullYear()
  return d + '/' + m + seperator + y
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

  function dateToHHMM(dt, seperator) {
    let da = new Date(dt)

    let h = da.getHours() < 10 ? "0" + da.getHours() : da.getHours()
    let m = da.getMinutes() < 9 ? "0" + Number(da.getMinutes() + 1) : Number(da.getMinutes() + 1)
    return h + seperator + m
  }


  // app.use((error, req, res, next) => {
  //   console.log(error)
  //   res.status(error.status || 500).send({
  //     error: {
  //       status: error.status || 500,
  //       message: error.message || 'Internal Server Error',
  //     },
  //   });
  //   process.exit(1)
  //   });


module.exports = {
  getSettings,
  putSettings,
  putBuild
}
