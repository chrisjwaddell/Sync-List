const fsp = require("fs/promises")
const fs = require("fs")
const {settings} = require("cluster")
const {resolve} = require("path")
// const fsp = fs.promises;


const templateSettings = (id, date, dateInt) =>
	`{"Backup List":[{ "ID": ${id}, "Backup Name": "Main", "Backup Root Directory": "", "Include Date": true, "Message Before": "", "Message After": "Backup Complete", "Send Email After": false, "Email Address": "", "Last Edited": ${dateInt}, "Last Saved": ${dateInt}, "Script Created": "${date}", "Active": true, "Files": [] } ] }`
const backupListFindFirstID = (backuplistarray) =>
	backuplistarray["Backup List"].filter((i) => i.Active === true)[0]
		? backuplistarray["Backup List"].filter((i) => i.Active === true)[0]["ID"]
		: backuplistarray["Backup List"][0]["ID"]
const backupListIDToIndex = (backuplistarray, id) =>
	jsondata["Backup List"].findIndex((i) => i.ID === id)

const parseJsonAsync = (jsonString) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			try {
				let r = JSON.parse(jsonString)
				resolve(r)
			} catch (err) {
				console.error("ERROR: Settings.json not in valid JSON format")
				reject("Settings.json not in valid JSON format")
			}
		})
	})
}

var settingsFile = __dirname + "\\" + "settings.json"

// get rid of this, it's not used anymore
function IsJsonString(str) {
	try {
		return JSON.parse(str)
	} catch (e) {
		return {File: "File isn't in JSON format"}
	}
}

function getSettings() {
	//* buildErrorChecker is run to get the updated information of the filesystem
	//*  But it is not saved to the file, it's not necesary to save the error array

	return new Promise((resolve, reject) => {
		//* See if scripts Directory exists
		let scriptsDir = __dirname + "\\" + "Backup-scripts"
		let dirExists = false
		let fileExists = false

		try {
			if (fs.existsSync(scriptsDir)) dirExists = true
		} catch (err) {
			console.error(err)
			dirExists = false
		}

		if (!dirExists) {
			try {
				fs.mkdirSync(scriptsDir)
				console.log("Creating scripts directory")
			} catch (err) {
				dirExists = false
				// return "No directory"
				reject("Scripts directory doesn't exist and couldn't be created.")
			}
		}

		try {
			if (fs.existsSync(settingsFile)) fileExists = true
		} catch (err) {
			fileExists = false
		}

		if (!fileExists) {
			reject("Settings file not found")
		} else {
			fs.readFile(settingsFile, "utf8", (err, data) => {
				let newFile = ""

				if (err) {
					console.error(
						"Settings file DOESN'T exists...... Making settings.json"
					)
					reject("Couldn't read settings file.")
				} else {
					// settings.json file read successfully
					var strFileContent = data
					parseJsonAsync(strFileContent)
						.then((objJSON) => {
							if (objJSON["Backup List"].length !== 0) {
								let backupListID = backupListFindFirstID(objJSON)
								delete objJSON["BackupListID"]
								objJSON["BackupListID"] = Number(backupListID)
								let fileContentPlusErrors = buildErrorChecker(objJSON).then(
									(f) => {
										resolve(f)
									}
								)
							} else {
								backupListID = -1
								objJSON["BackupListID"] = Number(backupListID)
								resolve(objJSON)
							}
						})
						.catch((err) => {
							reject(err)
						})
				} //else
			})
		}
	})
}

function newSettings() {
	return new Promise((resolve, reject) => {
		let today = new Date()
		let strNew = templateSettings(
			1,
			dateToDDMMYYYY(today, "/"),
			today.valueOf()
		)
		parseJsonAsync(strNew)
			.then((jsontemplate) => {
				jsontemplate["BackupListID"] = 0
				jsontemplate["Important Error Message"] =
					"The settings.json wasn't able to be read so a new blank settings.json file was created."

				let strjson = JSON.stringify(jsontemplate, null, 4)

				fs.writeFile(settingsFile, strjson, function (err) {
					if (err) {
						console.log(err)
						reject("Error writing to settings file")
					} else {
						resolve(strjson)
					}
				})
			})
			.catch((err) => reject(err))
	})
}

async function putSettings(jsonobj) {
	// putSettings writes updates to the the settings.json file

	return new Promise((resolve, reject) => {
		let fileExists = false
		let json = ""

		try {
			if (fs.existsSync(settingsFile)) fileExists = true
		} catch (err) {
			fileExists = false
		}

		if (!fileExists) {
			reject("Settings file not found")
		} else {
			buildErrorChecker(jsonobj).then((json) => {
				let strjson = JSON.stringify(json, null, 4)

				fs.writeFile(settingsFile, strjson, function (err) {
					if (err) {
						console.log(err)
						// throw new Error(err)
						reject("Error writing to settings file")
					} else {
						// return json
						resolve(json)
					}
				})
			})
		} // else
	}) // return new Promise
}

function settingsBackup() {
	let d = new Date()
	let strDate = dateToYYYYMMDD(d, "")

	return new Promise((resolve, reject) => {
		fs.rename(
			__dirname + "\\" + "settings.json",
			__dirname + "\\" + "settings-" + strDate + ".json",
			(err) => {
				if (err) reject(err)
				resolve("Rename complete!")
			}
		)
	})
}

async function buildErrorChecker(jsonobj) {
	var errorlist = ""
	var json = ""

	json = jsonobj

	delete json["Important Error Message"]

	delete json["Script message"]

	delete json["Error List"]
	json["Error List"] = []

	for (let i = 0; i < json["Backup List"].length; i++) {
		json["Error List"].push({})

		//* Backup Name
		try {
			await fsp.access(
				__dirname +
					"\\" +
					"Backup-scripts" +
					"\\" +
					json["Backup List"][i]["Backup Name"] +
					".ps1"
			)
			// console.log("Check script file - after await")
		} catch (error) {
			console.error(error)
			json["Error List"][i]["Backup Name"] = "Script file doesn't exist."
		}

		//* Backup Root Directory
		try {
			await fsp.access(json["Backup List"][i]["Backup Root Directory"])
		} catch (error) {
			json["Error List"][i]["Backup Root Directory"] =
				"Backup Root Directory not found."
		}

		//* Backup script created less than Last edited
		let d1 = json["Backup List"][i]["Last Saved"]
		let d2 = json["Backup List"][i]["Last Edited"]

		if (d2 > d1) {
			json["Error List"][i]["Last Edited"] =
				"Changes have been made since the Backup Script was generated last."
		}
	} // for

	return new Promise((resolve, reject) => {
		resolve(json)
	})
} // buildErrorChecker

function powershellStart(filesArray, edited) {
	var strFileList = "<#"
	for (let i = 0; i < filesArray.length; i++) {
		if (filesArray[i]["Active"]) {
			strFileList += "\n" + filesArray[i]["File Or Folder"]
		}
	}
	strFileList += "\n" + "\n"

	strFileList += "Last Edited - " + edited + "\n" + "#>" + "\n" + "\n"

	return strFileList
}

const powershellVars = (bt) =>
	`$BackupTo = '${bt}'\n$Now = Get-Date -Format "yyyyMMdd"\n\n`

const powershellMsgBefore = (msgBefore) =>
	`$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${msgBefore}")\n\n`
const powershellMsgAfter = (msgAfter) =>
	`$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${msgAfter}")\n\n`

const powershellEnd = () => `Read-Host -Prompt "Press any key to continue"\n\n`

const powershellDestination = () =>
	'Test-Path "$BackupTo"\nIf (!(Test-Path "$BackupTo")) {\n\tWrite-Output "does not exist"\n\tExit\n}\n\n\n'

function powershellDirData(rootdir) {
	let str = ""

	let rd = rootdir
	if (rd.endsWith("'")) {
		rd = rd.substring(0, rd.length - 1)
		if (rd.endsWith("'")) {
			rd = rd.substring(0, rd.length - 1)
		}
	}

	str = `$BackupToFinal = "${rd}\\$Now"` + "\n"
	str += 'If (!(Test-Path "$BackupToFinal")) {' + "\n"
	str += '\tWrite-Output "Directory does not exist"' + "\n"
	str += '\tNew-Item -Path "$BackupTo" -Name $Now -ItemType "directory"' + "\n"
	str += "}" + "\n\n\n"

	return str
}

async function fileFolderType(fileLine) {
	if (fileLine.indexOf("*") === -1) {
		var stats = await fsp.stat(fileLine)
		stats.isFile() ? (filetype = 0) : (filetype = 1)
	} else {
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
      Get-ChildItem $FilesToZip -Recurse | Exclude-Directories | ForEach-Object {
          [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $_.FullName.Replace($RootDir,""), $compressionLevel)
      }
    } Else {
      Get-ChildItem $FilesToZip -File | ForEach-Object {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $_.FullName.Replace($RootDir,""), $compressionLevel)
   }
}

$zip.Dispose()


function Exclude-Directories
{
    process
    {
        $allowThrough = $true
        foreach ($directoryToExclude in $excludeDirectories)
        {
            $directoryText = "*\" + $directoryToExclude
            $childText = "*\" + $directoryToExclude + "\*"
            if (($_.FullName -Like $directoryText -And $_.PsIsContainer) -Or $_.FullName -Like $childText)
            {
                $allowThrough = $false
                break
            }
        }
        if ($allowThrough)
        {
            return $_
        }
    }
}


}`

	return str
}

async function powershellFileWrite(fileName, fileText) {

	fs.writeFile(fileName, fileText, function (err) {
		if (err) {
			console.log(err)
			// throw new Error(err)
			reject("Error writing to Powershell backup script file")
		} else {
			console.log("Backup Powershell script " + fileName + " written to")
			resolve(fileText)
		}
	})
	//* File written successfully
}

async function putBuild(jsondata) {
	// Updates the powershell batch script
	// Put needs a "BackupListID"

	//* Backup Name
	var backupID
	if (jsondata["BackupListID"]) {
		backupID = jsondata["BackupListID"]
	} else {
		backupID = 0
	}

	const backupListIDToIndex = (id) =>
		jsondata["Backup List"].findIndex((i) => i.ID === id)

	let index = backupListIDToIndex(backupID)

	let json = jsondata

	if (index !== -1) {
		let strFile = await putBuildText(json, index)

		var batchFileName =
			__dirname +
			"\\" +
			"Backup-scripts" +
			"\\" +
			jsondata["Backup List"][index]["Backup Name"] +
			".ps1"
		let result

		var successfulWrite
		await powershellFileWrite(batchFileName, strFile)
			.then((w) => (successfulWrite = true))
			.catch((c) => (successfulWrite = false))

		if (successfulWrite) {
			let today = new Date()
			today = Date.now()
			json["Backup List"][index]["Last Saved"] = today

			let fileContentPlusErrors = ""
			fileContentPlusErrors = await buildErrorChecker(json)
			// let b = buildErrorChecker(json).then(fileContentPlusErrors => {
			//buildErrorChecker removes ["Script message"], add it after
			fileContentPlusErrors[
				"Script message"
			] = `Backup script file created in ${batchFileName}. Put this file in a cron job or scheduler to automatically do your backups regularly.`

			result = fileContentPlusErrors

			return new Promise((resolve, reject) => {
				resolve(fileContentPlusErrors)
			})
		} else {
			return new Promise((resolve, reject) => {
				reject("Error writing to Powershell backup script file")
			})
		}
	} else {
		// Backup List Index not found
		result = json
		console.log("result")
		console.log(result)
		return new Promise((resolve, reject) => {
			resolve(result)
		})
	}
}

async function putBuildText(jsondata, index) {
	let json = jsondata

	var strFile = ""
	strFile = powershellStart(
		jsondata["Backup List"][index]["Files"],
		jsondata["Backup List"][index]["Last Edited"]
	)
	strFile += powershellVars(
		jsondata["Backup List"][index]["Backup Root Directory"]
	)

	strFile += "Add-Type -As System.IO.Compression.FileSystem" + "\n\n"

	strFile += powershellFunctions() + "\n\n"

	if (jsondata["Backup List"][index]["Message Before"])
		strFile += powershellMsgBefore(
			jsondata["Backup List"][index]["Message Before"]
		)
	strFile += powershellDestination()

	let rd = jsondata["Backup List"][index]["Backup Root Directory"]
	let todayDir = new Date()

	if (jsondata["Backup List"][index]["Include Date"]) {
		strFile += powershellDirData(
			jsondata["Backup List"][index]["Backup Root Directory"]
		)
		if (rd.endsWith("'")) {
			rd = rd.substring(0, rd.length - 1)
			if (rd.endsWith("'")) {
				rd = rd.substring(0, rd.length - 1)
			}
		}
		rd += "\\" + dateToYYYYMMDD(todayDir, "")
	} else {
		strFile += "$BackupToFinal = $BackupTo\n\n"
		if (rd.endsWith("'")) {
			rd = rd.substring(0, rd.length - 1)
			if (rd.endsWith("'")) {
				rd = rd.substring(0, rd.length - 1)
			}
		}
	}

	for (let i = 0; i < jsondata["Backup List"][index]["Files"].length; i++) {
		//* if file line is disabled don't look at it
		if (!jsondata["Backup List"][index]["Files"][i]["Active"]) {
			i++
			if (i >= jsondata["Backup List"][index]["Files"].length) break
		}

		let s =
			jsondata["Backup List"][index]["Files"][i]["File Or Folder"].split("\\")
		var dir = ""

		var ft
		try {
			ft = await fileFolderType(
				jsondata["Backup List"][index]["Files"][i]["File Or Folder"]
			)
		} catch (err) {
			ft = -1
		}

		strFile +=
			`$FileName = "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}"` +
			"\n"
		if (ft === 0) {
			// File
			strFile +=
				`$FileDir = Split-Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}"` +
				"\n\n"
		} else if (ft === 1) {
			// Folder
			strFile +=
				`$FileDir = "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}"` +
				"\n\n"
			strFile += `$ExcludeDirectories = (${jsondata["Backup List"][index]["Files"][i]["Exclude-Directories"]})\n\n`
		} else {
			strFile +=
				`$FileDir = Split-Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}"` +
				"\n\n"
			strFile += `$ExcludeDirectories = (${jsondata["Backup List"][index]["Files"][i]["Exclude-Directories"]})\n\n`
		}

		let sd = jsondata["Backup List"][index]["Files"][i]["Sub-Directories"]
		let dateinfile = jsondata["Backup List"][index]["Files"][i]["Date In File"]
		let zip = jsondata["Backup List"][index]["Files"][i]["Zip It"]

		let toda = new Date()
		var td = dateToYYYYMMDD(toda, "")

		if (ft !== -1) {
			if (ft === 0) {
				// sub-dir doesn't matter for file
				if (!dateinfile && !zip) {
					console.log("File copy")
					if (s.length > 1) {
						for (j = 1; j < s.length - 1; j++) {
							dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
						}
					}

					strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n"
					strFile += '\tWrite-Output "Directory does not exist"' + "\n"
					strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n"
					strFile += "}" + "\n"

					strFile +=
						'Copy-Item -Path "' +
						jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
						'" -Destination "$BackupToFinal' +
						"\\" +
						dir +
						'"\n\n'
				} else if (dateinfile && !zip) {
					console.log("File copy with date")

					if (s.length > 0) {
						if (s.length === 1) {
							dir = ""
						} else {
							for (j = 1; j < s.length - 1; j++) {
								dir === "" ? (dir = s[j]) : (dir += "\\" + td + "-" + s[j])
							}
						}
					}

					dir ? (dir = "\\" + dir) : (dir = "")

					strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
					strFile += '\tWrite-Output "Directory does not exist"' + "\n"
					strFile += '\tCreateDir -Path "$BackupToFinal' + dir + '"\n'
					strFile += "}" + "\n"

					strFile +=
						'Copy-Item -Path "' +
						jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
						'" -Destination "$BackupToFinal' +
						dir +
						"\\" +
						td +
						"-" +
						s[s.length - 1] +
						'"\n\n'
				} else if (!dateinfile && zip) {
					console.log("File zip copy")

					dir = ""
					if (s.length > 2) {
						for (j = 1; j < s.length - 1; j++) {
							dir === "" ? (dir += "\\" + s[j]) : (dir += "\\" + s[j])
						}
					}

					let folder =
						dir === ""
							? "\\" + s[s.length - 1].replace(".", "-")
							: dir + "\\" + s[s.length - 1].replace(".", "-")

					strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
					strFile += '\tWrite-Output "Directory does not exist"' + "\n"
					strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
					strFile += "}" + "\n"

					strFile +=
						`Compress-Archive -Update "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" "$BackupToFinal${folder}.zip"` +
						"\n\n"
				} else if (dateinfile && zip) {
					console.log("File zip copy with date")

					dir = ""
					let filename = ""
					if (s.length > 2) {
						for (j = 1; j < s.length - 1; j++) {
							if (j === s.length - 1 || j === s.length) {
								// dir === '' ? dir = '\\' + s[j] : dir += '\\' + s[j]
							} else {
								// dir === '' ? dir += '\\' + s[j] : dir += ''
								// filename = '\\' + s[j].replace('.', '-')
								dir += "\\" + s[j]
							}
						}
						filename = "\\" + td + "-" + s[s.length - 1].replace(".", "-")
					} else {
						dir = ""
						filename = "\\" + td + "-" + s[1].replace(".", "-")
					}

					dir ? (dir = "\\" + dir) : (dir = "")

					strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
					strFile += '\tWrite-Output "Directory does not exist"' + "\n"
					strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
					strFile += "}" + "\n"

					// console.log(`Compress-Archive -Update "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" "$BackupToFinal${dir}${filename}.zip"\n\n`)

					strFile += `Compress-Archive -Update "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" "$BackupToFinal${dir}${filename}.zip"\n\n`
				}
			} else if (ft === 1) {
				if (!sd) {
					if (!dateinfile && !zip) {
						console.log("Directory copy")

						if (s.length > 0) {
							for (j = 1; j < s.length; j++) {
								dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
							}
						}

						dir ? (dir = "\\" + dir) : (dir = "")

						strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'
						strFile += `Get-ChildItem "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal${dir}" -Force\n\n`
					} else if (dateinfile && !zip) {
						console.log("Directory copy with date")

						if (s.length > 0) {
							if (s.length === 1) {
								dir = td + "-" + s[1]
							} else {
								for (j = 1; j < s.length; j++) {
									dir === "" ? (dir = s[j]) : (dir += "\\" + td + "-" + s[j])
								}
							}
						}

						strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'
						// strFile += 'Get-ChildItem "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '\\*"' + ' -file | Copy-Item -Destination "$BackupToFinal' + '\\' + td + '-' + dir + ' -Force' + '\n\n'

						strFile += `Get-ChildItem "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force\n\n`
					} else if (!dateinfile && zip) {
						console.log("Directory zip copy")

						let filename = ""
						if (s.length > 0) {
							for (j = 1; j < s.length; j++) {
								dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
							}
							filename = s[s.length - 1] + ".zip"
						} else {
							filename =
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
								".zip"
						}

						strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n"
						strFile += "}" + "\n"

						strFile +=
							`compressFiles -zipFile "$BackupToFinal\\${filename}" -RootDir "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Recursive $false` +
							"\n\n"
					} else if (dateinfile && zip) {
						console.log("Directory zip copy with date")
						let filename = ""

						dir = ""
						if (s.length > 0) {
							if (s.length === 1) {
								dir = "\\" + td + "-" + s[1]
							} else {
								for (j = 1; j < s.length; j++) {
									// console.log(dir)
									if (j === s.length - 1 || j === s.length) {
										dir === ""
											? (dir = "\\" + td + "-" + s[j])
											: (dir += "\\" + td + "-" + s[j])
									} else {
										dir === "" ? (dir = "\\" + s[j]) : (dir += "\\" + s[j])
									}
								}
							}

							filename = td + "-" + s[s.length - 1] + ".zip"
						} else {
							filename =
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
								".zip"
						}

						dir ? (dir = "\\" + dir) : (dir = "")

						strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
						strFile +=
							`compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Recursive $false` +
							"\n\n"
					}
				} else {
					if (!dateinfile && !zip) {
						console.log("Directory copy with sub-directories")

						if (s.length > 0) {
							for (j = 1; j < s.length; j++) {
								dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
							}
						}

						if (s.length === 0) {
							filename =
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
								".zip"
						} else {
							filename = s[s.length - 1] + ".zip"
						}

						strFile +=
							`$FileDirRoot = Split-Path "$BackupToFinal\\${dir}"` + "\n\n"

						strFile += `If (!(Test-Path $FileDirRoot)) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path $FileDirRoot` + "\n"
						strFile += "}" + "\n"

						strFile +=
							`Copy-Item -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` +
							"\n\n"
					} else if (dateinfile && !zip) {
						console.log("Directory copy with date with sub-directories")

						if (s.length > 0) {
							if (s.length === 1) {
								dir = td + "-" + s[1]
							} else {
								for (j = 1; j < s.length; j++) {
									dir === "" ? (dir = s[j]) : (dir += "\\" + td + "-" + s[j])
								}
							}
						}

						if (s.length === 0) {
							filename =
								td +
								"-" +
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
								".zip"
						} else {
							filename = td + "-" + s[s.length - 1] + ".zip"
						}

						strFile +=
							`$FileDirRoot = Split-Path "$BackupToFinal\\${dir}"` + "\n\n"

						strFile += `If (!(Test-Path $FileDirRoot)) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path $FileDirRoot` + "\n"
						strFile += "}" + "\n"

						// strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + td + '-' + dir + '"\n\n'
						// strFile += `Get-ChildItem "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force -Recurse\n\n`
						// strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Recursive $true` + '\n\n'
						// strFile += `Copy-Item -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` + '\n\n'
						strFile +=
							`Copy-Item -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Destination "$BackupToFinal\\${dir}" -recurse -Force` +
							"\n\n"
					} else if (!dateinfile && zip) {
						console.log("Directory zip copy with sub-directories")

						if (s.length > 0) {
							for (j = 1; j < s.length; j++) {
								dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
							}
						}

						if (s.length === 0) {
							filename =
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
								".zip"
						} else {
							filename = s[s.length - 1] + ".zip"
						}

						dir ? (dir = "\\" + dir) : (dir = "")

						strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*.*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
						strFile +=
							`compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Recursive $true` +
							"\n\n"
						// console.log(strFile)
					} else if (dateinfile && zip) {
						console.log("Directory zip copy with date with sub-directories")

						if (s.length > 0) {
							if (s.length === 1) {
								dir = td + "-" + s[1]
							} else {
								for (j = 1; j < s.length; j++) {
									dir === "" ? (dir = s[j]) : (dir += "\\" + td + "-" + s[j])
								}
							}
						}

						if (s.length === 0) {
							filename =
								td +
								"-" +
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
								".zip"
						} else {
							filename = td + "-" + s[s.length - 1] + ".zip"
						}

						dir ? (dir = "\\" + dir) : (dir = "")

						strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*.*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
						strFile +=
							`compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Recursive $true` +
							"\n\n"
					}
				}
			} else if (ft === 2) {
				if (!sd) {
					if (!dateinfile && !zip) {
						console.log("Filetype copy")

						if (s.length > 1) {
							for (j = 1; j < s.length - 1; j++) {
								dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
							}
						}

						strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

						strFile +=
							`Get-ChildItem -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -File | ForEach-Object {` +
							"\n"
						strFile +=
							`\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` +
							"\n"
						strFile += "}" + "\n\n"
					} else if (dateinfile && !zip) {
						console.log("Filetype copy with date")

						if (s.length > 0) {
							if (s.length === 1) {
								dir = td + "-" + s[1]
							} else {
								for (j = 1; j < s.length - 1; j++) {
									dir === "" ? (dir = s[j]) : (dir += "\\" + td + "-" + s[j])
								}
							}
						}

						if (s.length === 0) {
							filename =
								td +
								"-" +
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"] +
								".zip"
						} else {
							filename = td + "-" + s[s.length - 1] + ".zip"
						}


						strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

						strFile +=
							`Get-ChildItem -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -File | ForEach-Object {` +
							"\n"
						strFile +=
							`\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` +
							"\n"
						strFile += "}" + "\n\n"
					} else if (!dateinfile && zip) {
						console.log("Filetype zip copy")

						let filename = ""
						if (s.length > 2) {
							for (j = 1; j < s.length - 1; j++) {
								dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
							}
							filename =
								s[s.length - 2] +
								s[s.length - 1].replace("*.*", "").replace("*.", "-") +
								".zip"
						} else {
							filename =
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"]
									.replace(":\\*.*", "")
									.replace(":\\*.", "-") + ".zip"
						}

						dir ? (dir = "\\" + dir) : (dir = "")

						strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
						strFile += "}" + "\n"

						strFile +=
							`compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${dir}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Recursive $false` +
							"\n\n"
					} else if (dateinfile && zip) {
						console.log("Filetype zip copy with date")

						let filename = ""
						let origdir = ""
						dir = ""
						if (s.length > 2) {
							for (j = 1; j < s.length - 1; j++) {
								if (j === s.length - 2 || j === s.length - 1) {
									dir === ""
										? (dir = td + "-" + s[j])
										: (dir += "\\" + td + "-" + s[j])
									origdir === "" ? (origdir = s[j]) : (origdir += "\\" + s[j])
								} else {
									dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
									origdir === "" ? (origdir = s[j]) : (origdir += "\\" + s[j])
								}
								// console.log("j - " + j + "; dir - " + dir)
								// console.log("j - " + j + "; origdir - " + origdir)
							}
							filename =
								s[s.length - 2] +
								s[s.length - 1].replace("*.*", "").replace("*.", "-") +
								".zip"
						} else {
							filename =
								td +
								"-" +
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"]
									.replace("*.*", "")
									.replace(":\\*.", "-") +
								".zip"
						}

						dir ? (dir = "\\" + dir) : (dir = "")
						origdir ? (origdir = "\\" + origdir) : (origdir = "")

						strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
						// strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Recursive $false` + '\n\n'
						strFile +=
							`compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Recursive $false` +
							"\n\n"
						// compressFiles -zipFile "$BackupToFinal\PROJECTS\01-WEALTH\20210317-01-WEALTH.zip" -RootDir "E:\PROJECTS\01-WEALTH\" -FilesToZip "E:\PROJECTS\01-WEALTH\*.txt" -Recursive $false
					}
				} else {
					if (!dateinfile && !zip) {
						console.log("Filetype copy with sub-directories")

						if (s.length > 1) {
							for (j = 1; j < s.length - 1; j++) {
								dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
							}
						}

						// console.log("dir - " + dir)
						// console.log(rd + '\\' + dir)

						strFile += `$FileDirRoot = "$BackupToFinal\\${dir}"` + "\n\n"

						strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

						// strFile += `Get-ChildItem -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" | ForEach-Object {` + '\n'
						// strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` + '\n'
						// strFile += '}' + '\n\n'

						// strFile += `Copy-Item -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` + '\n\n'
						strFile +=
							`robocopy "${s[0]}\\${dir}" "$FileDirRoot" ${
								s[s.length - 1]
							} /e` + "\n\n"
					} else if (dateinfile && !zip) {
						console.log("Filetype copy with date with sub-directories")

						let origdir = ""
						if (s.length > 0) {
							if (s.length === 1) {
								dir = ""
								origdir = ""
							} else {
								for (j = 1; j < s.length - 1; j++) {
									dir === "" ? (dir = s[j]) : (dir += "\\" + td + "-" + s[j])
									origdir === "" ? (origdir = s[j]) : (origdir += "\\" + s[j])
								}
							}
						}

						strFile += `$FileDirRoot = "$BackupToFinal\\${dir}"` + "\n\n"

						strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'

						// strFile += `Get-ChildItem -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" | ForEach-Object {` + '\n'
						// strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` + '\n'
						// strFile += '}' + '\n\n'

						// strFile += `Copy-Item -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Destination "$BackupToFinal\\${dir}" -recurse -Force`
						// strFile += `Get-ChildItem "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force\n\n`
						strFile +=
							`robocopy "${s[0]}\\${origdir}" "$FileDirRoot" ${
								s[s.length - 1]
							} /e` + "\n\n"
					} else if (!dateinfile && zip) {
						console.log("Filetype zip copy with sub-directories")

						let filename = ""
						let origdir = ""
						if (s.length > 2) {
							for (j = 1; j < s.length - 1; j++) {
								if (j === s.length - 2 || j === s.length - 1) {
									dir === ""
										? (dir = td + "-" + s[j])
										: (dir += "\\" + td + "-" + s[j])
									origdir === "" ? (origdir = s[j]) : (origdir += "\\" + s[j])
								} else {
									dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
									origdir === "" ? (origdir = s[j]) : (origdir += "\\" + s[j])
								}

							}
							filename =
								s[s.length - 2] +
								s[s.length - 1].replace("*.*", "").replace("*.", "-") +
								".zip"
						} else {
							filename =
								td +
								"-" +
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"]
									.replace("*.*", "")
									.replace(":\\*.", "-") +
								".zip"
						}

						origdir ? (origdir = "\\" + origdir) : (origdir = "")
						strFile += `If (!(Test-Path "$BackupToFinal${origdir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal${origdir}"` + "\n"
						strFile += "}" + "\n"

						strFile +=
							`compressFiles -zipFile "$BackupToFinal${origdir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Recursive $true` +
							"\n\n"
					} else if (dateinfile && zip) {
						console.log("Filetype zip copy with date with sub-directories")

						let filename = ""
						let origdir = ""
						dir = ""
						if (s.length > 2) {
							for (j = 1; j < s.length - 1; j++) {
								if (j === s.length - 2 || j === s.length - 1) {
									dir === ""
										? (dir = td + "-" + s[j])
										: (dir += "\\" + td + "-" + s[j])
									origdir === "" ? (origdir = s[j]) : (origdir += "\\" + s[j])
								} else {
									dir === "" ? (dir = s[j]) : (dir += "\\" + s[j])
									origdir === "" ? (origdir = s[j]) : (origdir += "\\" + s[j])
								}

							}
							filename =
								td +
								"-" +
								s[s.length - 2] +
								s[s.length - 1].replace(":\\*.*", "").replace("*.", "-") +
								".zip"
						} else {
							filename =
								td +
								"-" +
								jsondata["Backup List"][index]["Files"][i]["File Or Folder"]
									.replace(":\\*.*", "")
									.replace(":\\*.", "-") +
								".zip"
						}

						dir ? (dir = "\\" + dir) : (dir = "")
						origdir ? (origdir = "\\" + origdir) : (origdir = "")

                        strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n"
						strFile += '\tWrite-Output "Directory does not exist"' + "\n"
						strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n"
						strFile += "}" + "\n"

						// strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
						strFile +=
							`compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}" -Recursive $true` +
							"\n\n"
					}
				}
			}
		}
	} // for

	if (jsondata["Backup List"][index]["Message After"])
		strFile += powershellMsgAfter(
			jsondata["Backup List"][index]["Message After"]
		)

	strFile += powershellEnd()

	return strFile
}

async function test(jsondata) {
	let json = jsondata

	try {
		await fsp.access("E:\\wamp64\\www\\Websites-I-Did\\Sync-List\\zicons.json")
	} catch (error) {
		// console.log(error)
		console.log("error")
		// json["Error List"][i]["Backup Name"] = "Script file doesn't exist."
	}
}

function dateDDMMYYYYToDate(string) {
	// debugger
	if (string.length !== 10) {
		return null
	}

	let d = Number(string.substring(0, 2))
	let m = Number(string.substring(3, 5))
	let y = string.substring(6)

	if (d < 0) {
		return null
	}
	if (d > 31) {
		return null
	}

	if (m === 4 || m === 6 || m === 9 || m === 11) {
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
	let m =
		da.getMonth() < 9
			? "0" + Number(da.getMonth() + 1)
			: Number(da.getMonth() + 1)
	let y = da.getFullYear()
	return y + seperator + m + seperator + d
}

function dateToDDMMYYYY(dt, seperator) {
	let da = new Date(dt)

	let d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate()
	let m =
		da.getMonth() < 9
			? "0" + Number(da.getMonth() + 1)
			: Number(da.getMonth() + 1)
	let y = da.getFullYear()
	return d + "/" + m + seperator + y
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

	let oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
	let diffDays = Math.floor((end - start) / oneDay)

	return diffDays
}

function dateToHHMM(dt, seperator) {
	let da = new Date(dt)

	let h = da.getHours() < 10 ? "0" + da.getHours() : da.getHours()
	let m =
		da.getMinutes() < 9
			? "0" + Number(da.getMinutes() + 1)
			: Number(da.getMinutes() + 1)
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
	putBuild,
	newSettings,
	settingsBackup,
}
