const fsp = require("fs/promises"), templateSettings = ID => '{"Backup List":[{ "ID": ID, "Backup Name": "Main", "Backup Root Directory": "", "Include Date": true, "Message Before": "", "Message After": "Backup complete", "Send Email After": false, "Email Address": "", "Last edited": 123, "Script created": 123, "Active": true, "Files": [] } ] }';

var settingsFile = __dirname + "\\settings.json";

function IsJsonString(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return {
            File: "File isn't in JSON format"
        };
    }
    return !1;
}

async function getSettings() {
    //* buildErrorChecker is run to get the updated information of the filesystem
    //*  But it is not saved to the file, it's not necesary to save the error array
    //* See if scripts Directory exists
    let scriptsDir = __dirname + "\\Backup-scripts";
    try {
        await fsp.access(scriptsDir);
    } catch (error) {
        await fsp.mkdir(scriptsDir).then(m => {
            console.warn("Making Backup-scripts directory");
        }).catch(err => console.error("Error: In making Backup-scripts directory"));
    }
    //* Settings file
    try {
        var strFileContent = await fsp.readFile(settingsFile, "utf8");
        let objJSON = IsJsonString(strFileContent), fileContentPlusErrors = await buildErrorChecker(objJSON);
        return fileContentPlusErrors;
    } catch (err) {
        console.error(err), console.error("Settings file DOESN'T exists...... Making settings.json");
        //* save the file before overwritting settings.json
        let today = new Date(), settingsFileError = __dirname + "\\settings-" + dateToYYYYMMDD(today, "") + "-" + dateToHHMM(today, "") + ".json";
        await fsp.writeFile(settingsFileError, strFileContent).catch(err => console.error("Error: Couldn't create settings Error json file"));
        let jsontemplate = IsJsonString(templateSettings);
        jsontemplate["Important Error Message"] = "The settings.json isn't in the correct format. A new, blank settings.json file has been created and the previous settings file was save to " + settingsFileError;
        let strjson = JSON.stringify(jsontemplate, null, 4);
        return await fsp.writeFile(settingsFile, strjson).catch(err => console.error("Error: Couldn't create settings.json")), 
        jsontemplate;
    }
}

async function putSettings(jsonobj) {
    let json = await buildErrorChecker(jsonobj), strjson = JSON.stringify(json, null, 4);
    try {
        return await fsp.writeFile(settingsFile, strjson), json;
    } catch (err) {
        console.error(err);
    }
    //* file written successfully
}

async function buildErrorChecker(jsonobj) {
    var json = "";
    delete (json = jsonobj)["Important Error Message"], delete json["Script message"], 
    delete json["Error List"], json["Error List"] = [], delete json.BackupListID;
    for (let i = 0; i < json["Backup List"].length; i++) {
        json["Error List"].push({});
        //* Backup Name
        try {
            await fsp.access(__dirname + "\\Backup-scripts\\" + json["Backup List"][i]["Backup Name"] + ".ps1");
        } catch (error) {
            console.error(error), json["Error List"][i]["Backup Name"] = "Script file doesn't exist.";
        }
        //* Backup Root Directory
        try {
            await fsp.access(json["Backup List"][i]["Backup Root Directory"]);
        } catch (error) {
            json["Error List"][i]["Backup Root Directory"] = "Backup Root Directory not found.";
        }
        //* Backup script created less than Last edited
        let d1 = json["Backup List"][i]["Script created"], d2 = json["Backup List"][i]["Last edited"];
        d1 < d2 && (json["Error List"][i]["Last edited"] = "Changes have been made since the Backup Script was generated last.");
    }
    return json;
}

function powershellStart(filesArray, edited) {
    var strFileList = "<#";
    for (let i = 0; i < filesArray.length; i++) filesArray[i].Active && (strFileList += "\n" + filesArray[i]["File Or Folder"]);
    return strFileList += "\n\n", strFileList += "Last Edited - " + edited + "\n#>\n\n";
}

const powershellVars = bt => `$BackupTo = '${bt}'\n$Now = Get-Date -Format "yyyyMMdd"\n\n`, powershellMsgBefore = msgBefore => `$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${msgBefore}")\n\n`, powershellMsgAfter = msgAfter => `$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${msgAfter}")\n\n`, powershellDestination = () => 'Test-Path "$BackupTo"\nIf (!(Test-Path "$BackupTo")) {\n\tWrite-Output "does not exist"\n\tExit\n}\n\n\n';

function powershellDirData(rootdir) {
    let str, rd = rootdir;
    return rd.endsWith("'") && (rd = rd.substring(0, rd.length - 1), rd.endsWith("'") && (rd = rd.substring(0, rd.length - 1))), 
    str = `$BackupToFinal = "${rd}\\$Now"` + "\n", str += 'If (!(Test-Path "$BackupToFinal")) {\n', 
    str += '\tWrite-Output "Directory does not exist"\n', str += '\tNew-Item -Path "$BackupTo" -Name $Now -ItemType "directory"\n', 
    str += "}\n\n\n";
}

async function fileFolderType(fileLine) {
    return filetype = -1 === fileLine.indexOf("*") ? (await fsp.stat(fileLine)).isFile() ? 0 : 1 : 2, 
    filetype;
}

function powershellFunctions() {
    return str = `function CreateDir {
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

}`, str;
}

function backupIDToIndex(jsondata, ID) {
    let i = 0;
    for (;jsondata["Backup List"][i]; ) {
        if (jsondata["Backup List"][i].ID === ID) return i;
        i++;
    }
    return 200;
}

async function powershellFileWrite(fileName, fileText) {
    try {
        return fsp.writeFile(fileName, fileText), fileText;
    } catch (err) {
        console.error(err);
    }
    //* File written successfully
}

async function putBuild(jsondata) {
    //* Backup Name
    var batchFileName = jsondata.BackupListID || 0;
    let index = backupIDToIndex(jsondata, batchFileName);
    var batchFileName = __dirname + "\\Backup-scripts\\" + jsondata["Backup List"][index]["Backup Name"] + ".ps1", strFile = "", strFile = powershellStart(jsondata["Backup List"][index].Files, jsondata["Backup List"][index]["Last edited"]);
    strFile += powershellVars(jsondata["Backup List"][index]["Backup Root Directory"]), 
    strFile += "Add-Type -As System.IO.Compression.FileSystem\n\n", strFile += powershellFunctions() + "\n\n", 
    jsondata["Backup List"][index]["Message Before"] && (strFile += powershellMsgBefore(jsondata["Backup List"][index]["Message Before"])), 
    strFile += powershellDestination();
    let rd = jsondata["Backup List"][index]["Backup Root Directory"], todayDir = new Date();
    jsondata["Backup List"][index]["Include Date"] ? (strFile += powershellDirData(jsondata["Backup List"][index]["Backup Root Directory"]), 
    rd.endsWith("'") && (rd = rd.substring(0, rd.length - 1), rd.endsWith("'") && (rd = rd.substring(0, rd.length - 1))), 
    rd += "\\" + dateToYYYYMMDD(todayDir, "")) : (strFile += "$BackupToFinal = $BackupTo\n\n", 
    rd.endsWith("'") && (rd = rd.substring(0, rd.length - 1), rd.endsWith("'") && (rd = rd.substring(0, rd.length - 1))));
    let json = jsondata;
    for (let i = 0; i < jsondata["Backup List"][index].Files.length && (jsondata["Backup List"][index].Files[i].Active || (i++, 
    !(i >= jsondata["Backup List"][index].Files.length))); i++) {
        let s = jsondata["Backup List"][index].Files[i]["File Or Folder"].split("\\");
        var ft, dir = "";
        try {
            ft = await fileFolderType(jsondata["Backup List"][index].Files[i]["File Or Folder"]);
        } catch (err) {
            ft = -1;
        }
        strFile += `$FileName = "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}"` + "\n", 
        strFile += 0 !== ft && 1 === ft ? `$FileDir = "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}"` + "\n\n" : `$FileDir = Split-Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}"` + "\n\n";
        let sd = jsondata["Backup List"][index].Files[i]["Sub-Directories"], dateinfile = jsondata["Backup List"][index].Files[i]["Date In File"], zip = jsondata["Backup List"][index].Files[i]["Zip It"], toda = new Date();
        var td = dateToYYYYMMDD(toda, "");
        if (-1 !== ft) if (0 === ft) if (dateinfile || zip) {
            if (dateinfile && !zip) {
                if (console.log("File copy with date"), 0 < s.length) if (1 === s.length) dir = ""; else for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += '\tCreateDir -Path "$BackupToFinal' + dir + '"\n', 
                strFile += "}\n", strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index].Files[i]["File Or Folder"] + '" -Destination "$BackupToFinal' + dir + "\\" + td + "-" + s[s.length - 1] + '"\n\n';
            } else if (!dateinfile && zip) {
                if (console.log("File zip copy"), dir = "", 2 < s.length) for (j = 1; j < s.length - 1; j++) dir += "\\" + s[j];
                let folder = "" === dir ? "\\" + s[s.length - 1].replace(".", "-") : dir + "\\" + s[s.length - 1].replace(".", "-");
                strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n", strFile += '\tWrite-Output "Directory does not exist"\n', 
                strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", strFile += "}\n", 
                strFile += `Compress-Archive -Update "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" "$BackupToFinal${folder}.zip"` + "\n\n";
            } else if (dateinfile && zip) {
                console.log("File zip copy with date");
                let filename = dir = "";
                if (2 < s.length) {
                    for (j = 1; j < s.length - 1; j++) j === s.length - 1 || j === s.length || (dir += "\\" + s[j]);
                    filename = "\\" + td + "-" + s[s.length - 1].replace(".", "-");
                } else dir = "", filename = "\\" + td + "-" + s[1].replace(".", "-");
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", 
                strFile += "}\n", strFile += `Compress-Archive -Update "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" "$BackupToFinal${dir}${filename}.zip"\n\n`;
            }
        } else {
            if (console.log("File copy"), 1 < s.length) for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n", strFile += '\tWrite-Output "Directory does not exist"\n', 
            strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n", strFile += "}\n", 
            strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index].Files[i]["File Or Folder"] + '" -Destination "$BackupToFinal\\' + dir + '"\n\n';
        } else if (1 === ft) if (sd) if (dateinfile || zip) {
            if (dateinfile && !zip) {
                if (console.log("Directory copy with date with sub-directories"), 0 < s.length) if (1 === s.length) dir = td + "-" + s[1]; else for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                filename = 0 === s.length ? td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : td + "-" + s[s.length - 1] + ".zip", 
                strFile += `$FileDirRoot = Split-Path "$BackupToFinal\\${dir}"` + "\n\n", strFile += "If (!(Test-Path $FileDirRoot)) {\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += "\tCreateDir -Path $FileDirRoot\n", 
                strFile += "}\n", strFile += `Copy-Item -Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Destination "$BackupToFinal\\${dir}" -recurse -Force` + "\n\n";
            } else if (!dateinfile && zip) {
                if (console.log("Directory zip copy with sub-directories"), 0 < s.length) for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
                filename = 0 === s.length ? jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : s[s.length - 1] + ".zip", 
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\*" -Recursive $true` + "\n\n";
            } else if (dateinfile && zip) {
                if (console.log("Directory zip copy with date with sub-directories"), 0 < s.length) if (1 === s.length) dir = td + "-" + s[1]; else for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                filename = 0 === s.length ? td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : td + "-" + s[s.length - 1] + ".zip", 
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\*" -Recursive $true` + "\n\n";
            }
        } else {
            if (console.log("Directory copy with sub-directories"), 0 < s.length) for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            filename = 0 === s.length ? jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : s[s.length - 1] + ".zip", 
            strFile += `$FileDirRoot = Split-Path "$BackupToFinal\\${dir}"` + "\n\n", strFile += "If (!(Test-Path $FileDirRoot)) {\n", 
            strFile += '\tWrite-Output "Directory does not exist"\n', strFile += "\tCreateDir -Path $FileDirRoot\n", 
            strFile += "}\n", strFile += `Copy-Item -Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` + "\n\n";
        } else if (dateinfile || zip) {
            if (dateinfile && !zip) {
                if (console.log("Directory copy with date"), 0 < s.length) if (1 === s.length) dir = td + "-" + s[1]; else for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n", strFile += '\tWrite-Output "Directory does not exist"\n', 
                strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n", strFile += "}\n", 
                strFile += `Get-ChildItem "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force\n\n`;
            } else if (!dateinfile && zip) {
                console.log("Directory zip copy");
                let filename = "";
                if (0 < s.length) {
                    for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
                    filename = s[s.length - 1] + ".zip";
                } else filename = jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip";
                strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n", strFile += '\tWrite-Output "Directory does not exist"\n', 
                strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n", strFile += "}\n", 
                strFile += `compressFiles -zipFile "$BackupToFinal\\${filename}" -RootDir "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\*" -Recursive $false` + "\n\n";
            } else if (dateinfile && zip) {
                console.log("Directory zip copy with date");
                let filename = "";
                if (dir = "", 0 < s.length) {
                    if (1 === s.length) dir = "\\" + td + "-" + s[1]; else for (j = 1; j < s.length; j++) j === s.length - 1 || j === s.length ? "" === dir ? dir = "\\" + td + "-" + s[j] : dir += "\\" + td + "-" + s[j] : "" === dir ? dir = "\\" + s[j] : dir += "\\" + s[j];
                    filename = td + "-" + s[s.length - 1] + ".zip";
                } else filename = jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip";
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\*" -Recursive $false` + "\n\n";
            }
        } else {
            if (console.log("Directory copy"), 0 < s.length) for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {` + "\n", 
            strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", 
            strFile += "}\n", strFile += `Get-ChildItem "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal${dir}" -Force\n\n`;
        } else if (2 === ft) if (sd) if (dateinfile || zip) {
            if (dateinfile && !zip) {
                console.log("Filetype copy with date with sub-directories");
                let origdir = "";
                if (0 < s.length) if (1 === s.length) dir = "", origdir = ""; else for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j], 
                "" === origdir ? origdir = s[j] : origdir += "\\" + s[j];
                strFile += `$FileDirRoot = "$BackupToFinal\\${dir}"` + "\n\n", strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n", 
                strFile += "}\n", strFile += `robocopy "${s[0]}\\${origdir}" "$FileDirRoot" ${s[s.length - 1]} /e` + "\n\n";
            } else if (!dateinfile && zip) {
                console.log("Filetype zip copy with sub-directories");
                let filename = "", origdir = "";
                if (2 < s.length) {
                    for (j = 1; j < s.length - 1; j++) j === s.length - 2 || j === s.length - 1 ? "" === dir ? dir = td + "-" + s[j] : dir += "\\" + td + "-" + s[j] : "" === dir ? dir = s[j] : dir += "\\" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j];
                    filename = s[s.length - 2] + s[s.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"].replace("*.*", "").replace(":\\*.", "-") + ".zip";
                origdir = origdir ? "\\" + origdir : "", strFile += `If (!(Test-Path "$BackupToFinal${origdir}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${origdir}"` + "\n", 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${origdir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Recursive $true` + "\n\n";
            } else if (dateinfile && zip) {
                console.log("Filetype zip copy with date with sub-directories");
                let filename = "", origdir = "";
                if (dir = "", 2 < s.length) {
                    for (j = 1; j < s.length - 1; j++) j === s.length - 2 || j === s.length - 1 ? "" === dir ? dir = td + "-" + s[j] : dir += "\\" + td + "-" + s[j] : "" === dir ? dir = s[j] : dir += "\\" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j];
                    filename = td + "-" + s[s.length - 2] + s[s.length - 1].replace(":\\*.*", "").replace("*.", "-") + ".zip";
                } else filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"].replace(":\\*.*", "").replace(":\\*.", "-") + ".zip";
                dir = dir ? "\\" + dir : "", origdir = origdir ? "\\" + origdir : "", strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Recursive $true` + "\n\n";
            }
        } else {
            if (console.log("Filetype copy with sub-directories"), 1 < s.length) for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            strFile += `$FileDirRoot = "$BackupToFinal\\${dir}"` + "\n\n", strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n", 
            strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n", 
            strFile += "}\n", strFile += `robocopy "${s[0]}\\${dir}" "$FileDirRoot" ${s[s.length - 1]} /e` + "\n\n";
        } else if (dateinfile || zip) {
            if (dateinfile && !zip) {
                if (console.log("Filetype copy with date"), 0 < s.length) if (1 === s.length) dir = td + "-" + s[1]; else for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                filename = 0 === s.length ? td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : td + "-" + s[s.length - 1] + ".zip", 
                strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n", strFile += '\tWrite-Output "Directory does not exist"\n', 
                strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n", strFile += "}\n", 
                strFile += `Get-ChildItem -Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -File | ForEach-Object {` + "\n", 
                strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` + "\n", 
                strFile += "}\n\n";
            } else if (!dateinfile && zip) {
                console.log("Filetype zip copy");
                let filename = "";
                if (2 < s.length) {
                    for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
                    filename = s[s.length - 2] + s[s.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else filename = jsondata["Backup List"][index].Files[i]["File Or Folder"].replace(":\\*.*", "").replace(":\\*.", "-") + ".zip";
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${dir}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Recursive $false` + "\n\n";
            } else if (dateinfile && zip) {
                console.log("Filetype zip copy with date");
                let filename = "", origdir = "";
                if (dir = "", 2 < s.length) {
                    for (j = 1; j < s.length - 1; j++) j === s.length - 2 || j === s.length - 1 ? "" === dir ? dir = td + "-" + s[j] : dir += "\\" + td + "-" + s[j] : "" === dir ? dir = s[j] : dir += "\\" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j];
                    filename = s[s.length - 2] + s[s.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"].replace("*.*", "").replace(":\\*.", "-") + ".zip";
                dir = dir ? "\\" + dir : "", origdir = origdir ? "\\" + origdir : "", strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {` + "\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"` + "\n", 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Recursive $false` + "\n\n";
            }
        } else {
            if (console.log("Filetype copy"), 1 < s.length) for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {` + "\n", strFile += '\tWrite-Output "Directory does not exist"\n', 
            strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"` + "\n", strFile += "}\n", 
            strFile += `Get-ChildItem -Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -File | ForEach-Object {` + "\n", 
            strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")` + "\n", 
            strFile += "}\n\n";
        }
    }
    jsondata["Backup List"][index]["Message After"] && (strFile += powershellMsgAfter(jsondata["Backup List"][index]["Message After"])), 
    powershellFileWrite(batchFileName, strFile);
    let today = new Date();
    today = Date.now(), json["Backup List"][index]["Script created"] = today, json["Script message"] = `Backup script file created in ${batchFileName}. Put this file in a cron job or scheduler to automatically do your backups regularly.`;
    let fileContentPlusErrors = "";
    try {
        fileContentPlusErrors = await buildErrorChecker(json);
    } catch (err) {
        throw new Error("Error building ErrorChecker");
    }
    return fileContentPlusErrors;
}

function dateDDMMYYYYToDate(string) {
    if (10 !== string.length) return null;
    let d = Number(string.substring(0, 2)), m = Number(string.substring(3, 5)), y = string.substring(6);
    if (d < 0) return null;
    if (31 < d) return null;
    if ((4 === m || 6 === m || 9 === m || 11 === m) && 30 < d) return null;
    if (2 === m && 28 < d) return null;
    let result = new Date();
    return result.setDate(d), result.setMonth(m - 1), result.setYear(y), result;
}

function dateToYYYYMMDD(dt, seperator) {
    let da = new Date(dt), d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate(), m = da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1), y = da.getFullYear();
    return y + seperator + m + seperator + d;
}

function dateToDDMMYYYY(dt, seperator) {
    let da = new Date(dt), d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate(), m = da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1), y = da.getFullYear();
    return d + "/" + m + seperator + y;
}

function numberOfNightsBetweenDates(startDate, endDate) {
    let start = new Date(startDate), end = new Date(endDate);
    start.setHours("1"), end.setHours("1"), start.setMinutes("0"), end.setMinutes("0"), 
    start.setSeconds("0"), end.setSeconds("0"), start.setMilliseconds("0"), end.setMilliseconds("0");
    let diffDays = Math.floor((end - start) / 864e5);
    return diffDays;
}

function dateToHHMM(dt, seperator) {
    let da = new Date(dt), h = da.getHours() < 10 ? "0" + da.getHours() : da.getHours(), m = da.getMinutes() < 9 ? "0" + Number(da.getMinutes() + 1) : Number(da.getMinutes() + 1);
    return h + seperator + m;
}

module.exports = {
    getSettings: getSettings,
    putSettings: putSettings,
    putBuild: putBuild
};