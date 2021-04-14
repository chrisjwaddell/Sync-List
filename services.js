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
        await fsp.mkdir(scriptsDir).then((m => {
            console.warn("Making Backup-scripts directory");
        })).catch((err => console.error("Error: In making Backup-scripts directory")));
    }
    //* Settings file
        try {
        var strFileContent = await fsp.readFile(settingsFile, "utf8");
        let objJSON = IsJsonString(strFileContent);
        return await buildErrorChecker(objJSON);
    } catch (err) {
        console.error(err), console.error("Settings file DOESN'T exists...... Making settings.json");
        //* save the file before overwritting settings.json
        let today = new Date, settingsFileError = __dirname + "\\settings-" + dateToYYYYMMDD(today, "") + "-" + dateToHHMM(today, "") + ".json";
        await fsp.writeFile(settingsFileError, strFileContent).catch((err => console.error("Error: Couldn't create settings Error json file")));
        let jsontemplate = IsJsonString(templateSettings);
        jsontemplate["Important Error Message"] = "The settings.json isn't in the correct format. A new, blank settings.json file has been created and the previous settings file was save to " + settingsFileError;
        let strjson = JSON.stringify(jsontemplate, null, 4);
        return await fsp.writeFile(settingsFile, strjson).catch((err => console.error("Error: Couldn't create settings.json"))), 
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
                let d1 = json["Backup List"][i]["Script created"];
        json["Backup List"][i]["Last edited"] > d1 && (json["Error List"][i]["Last edited"] = "Changes have been made since the Backup Script was generated last.");
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
    let str = "", rd = rootdir;
    return rd.endsWith("'") && (rd = rd.substring(0, rd.length - 1), rd.endsWith("'") && (rd = rd.substring(0, rd.length - 1))), 
    str = `$BackupToFinal = "${rd}\\$Now"\n`, str += 'If (!(Test-Path "$BackupToFinal")) {\n', 
    str += '\tWrite-Output "Directory does not exist"\n', str += '\tNew-Item -Path "$BackupTo" -Name $Now -ItemType "directory"\n', 
    str += "}\n\n\n", str;
}

async function fileFolderType(fileLine) {
    // console.log(fileLine.indexOf('*'))
    -1 === fileLine.indexOf("*") ? 
    // console.log("no *")
    (await fsp.stat(fileLine)).isFile() ? filetype = 0 : filetype = 1 : 
    // console.log("* in file")
    filetype = 2;
    return filetype;
}

function powershellFunctions() {
    return str = 'function CreateDir {\n      param (\n          $Path\n      )\n\n      $len = $Path.length\n\n      $Drive = $Path.substring(0,2)\n      $Drive\n      $Folders = $Path[[int](-1 * ($len - 3))..-1] -join \'\'\n      $Folders\n\n      $arrFolders = $Folders.split("\\")\n      $arrFolders\n\n      $FolderBuild = "$Drive\\"\n      $FolderRoot = "$Drive\\"\n      Foreach ($i in $arrFolders)\n      {\n          $i\n\n          $FolderBuild = $FolderBuild + "\\" + $i\n          $FolderBuild\n          Test-Path $FolderBuild\n          If (!(Test-Path "$FolderBuild")) {\n              Write-Output "doesn\'t exist"\n              New-Item -Path "$FolderRoot" -Name $i -ItemType "directory"\n          }\n\n          $FolderRoot = $FolderRoot + "\\" + $i\n          $FolderRoot\n      }\n  }\n\n\n  function compressFiles {\n\n    param (\n        $zipFile,\n        $RootDir,\n        $FilesToZip,\n        $Recursive\n    )\n\n    $compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal\n\n    If ((Test-Path "$zipFile")) {\n        Write-Output "Zip file zipFile exists"\n        $zip = [System.IO.Compression.ZipFile]::Open($zipFile, \'Update\')\n    }\n    Else {\n        $zip = [System.IO.Compression.ZipFile]::Open($zipFile, \'Create\')\n    }\n\n\n    If ($Recursive) {\n      Get-ChildItem $FilesToZip -Recurse | ForEach-Object {\n          [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $_.FullName.Replace($RootDir,""), $compressionLevel)\n      }\n    } Else {\n      Get-ChildItem $FilesToZip -File | ForEach-Object {\n        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $_.FullName.Replace($RootDir,""), $compressionLevel)\n      }\n    }\n\n    $zip.Dispose()\n\n}', 
    str;
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
    let index = backupIDToIndex(jsondata, jsondata.BackupListID ? jsondata.BackupListID : 0);
    var batchFileName = __dirname + "\\Backup-scripts\\" + jsondata["Backup List"][index]["Backup Name"] + ".ps1", strFile = "";
    strFile = powershellStart(jsondata["Backup List"][index].Files, jsondata["Backup List"][index]["Last edited"]), 
    strFile += `$BackupTo = '${jsondata["Backup List"][index]["Backup Root Directory"]}'\n$Now = Get-Date -Format "yyyyMMdd"\n\n`, 
    strFile += "Add-Type -As System.IO.Compression.FileSystem\n\n", strFile += powershellFunctions() + "\n\n", 
    jsondata["Backup List"][index]["Message Before"] && (strFile += `$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${jsondata["Backup List"][index]["Message Before"]}")\n\n`), 
    strFile += 'Test-Path "$BackupTo"\nIf (!(Test-Path "$BackupTo")) {\n\tWrite-Output "does not exist"\n\tExit\n}\n\n\n';
    let rd = jsondata["Backup List"][index]["Backup Root Directory"], todayDir = new Date;
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
        strFile += `$FileName = "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}"\n`, 
        strFile += 0 === ft ? `$FileDir = Split-Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}"\n\n` : 1 === ft ? `$FileDir = "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}"\n\n` : `$FileDir = Split-Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}"\n\n`;
        let sd = jsondata["Backup List"][index].Files[i]["Sub-Directories"], dateinfile = jsondata["Backup List"][index].Files[i]["Date In File"], zip = jsondata["Backup List"][index].Files[i]["Zip It"];
        var td = dateToYYYYMMDD(new Date, "");
        if (-1 !== ft) if (0 === ft) if (dateinfile || zip) {
            if (dateinfile && !zip) {
                if (console.log("File copy with date"), s.length > 0) if (1 === s.length) dir = ""; else for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += '\tCreateDir -Path "$BackupToFinal' + dir + '"\n', 
                strFile += "}\n", strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index].Files[i]["File Or Folder"] + '" -Destination "$BackupToFinal' + dir + "\\" + td + "-" + s[s.length - 1] + '"\n\n';
            } else if (!dateinfile && zip) {
                if (console.log("File zip copy"), dir = "", s.length > 2) for (j = 1; j < s.length - 1; j++) dir += "\\" + s[j];
                let folder = "" === dir ? "\\" + s[s.length - 1].replace(".", "-") : dir + "\\" + s[s.length - 1].replace(".", "-");
                strFile += `If (!(Test-Path "$BackupToFinal${dir}")) {\n`, strFile += '\tWrite-Output "Directory does not exist"\n', 
                strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, strFile += "}\n", strFile += `Compress-Archive -Update "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" "$BackupToFinal${folder}.zip"\n\n`;
            } else if (dateinfile && zip) {
                console.log("File zip copy with date"), dir = "";
                let filename = "";
                if (s.length > 2) {
                    for (j = 1; j < s.length - 1; j++) j === s.length - 1 || j === s.length || (dir += "\\" + s[j]);
                    filename = "\\" + td + "-" + s[s.length - 1].replace(".", "-");
                } else dir = "", filename = "\\" + td + "-" + s[1].replace(".", "-");
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, 
                strFile += "}\n", strFile += `Compress-Archive -Update "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" "$BackupToFinal${dir}${filename}.zip"\n\n`;
            }
        } else {
            if (console.log("File copy"), s.length > 1) for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {\n`, strFile += '\tWrite-Output "Directory does not exist"\n', 
            strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"\n`, strFile += "}\n", strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index].Files[i]["File Or Folder"] + '" -Destination "$BackupToFinal\\' + dir + '"\n\n';
        } else if (1 === ft) if (sd) if (dateinfile || zip) {
            if (dateinfile && !zip) {
                if (console.log("Directory copy with date with sub-directories"), s.length > 0) if (1 === s.length) dir = td + "-" + s[1]; else for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                0 === s.length ? filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : filename = td + "-" + s[s.length - 1] + ".zip", 
                strFile += `$FileDirRoot = Split-Path "$BackupToFinal\\${dir}"\n\n`, strFile += "If (!(Test-Path $FileDirRoot)) {\n", 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += "\tCreateDir -Path $FileDirRoot\n", 
                strFile += "}\n", 
                // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + td + '-' + dir + '"\n\n'
                // strFile += `Get-ChildItem "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force -Recurse\n\n`
                // strFile += `compressFiles -zipFile "$BackupToFinal\\${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Recursive $true` + '\n\n'
                strFile += `Copy-Item -Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Destination "$BackupToFinal\\${dir}" -recurse -Force\n\n`;
            } else if (!dateinfile && zip) {
                if (console.log("Directory zip copy with sub-directories"), s.length > 0) for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
                0 === s.length ? filename = jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : filename = s[s.length - 1] + ".zip", 
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, 
                strFile += "}\n", 
                // strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*.*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
                strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\*" -Recursive $true\n\n`;
            } else if (dateinfile && zip) {
                if (console.log("Directory zip copy with date with sub-directories"), s.length > 0) if (1 === s.length) dir = td + "-" + s[1]; else for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                0 === s.length ? filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : filename = td + "-" + s[s.length - 1] + ".zip", 
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, 
                strFile += "}\n", 
                // strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*.*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
                strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\*" -Recursive $true\n\n`;
            }
        } else {
            if (console.log("Directory copy with sub-directories"), s.length > 0) for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            0 === s.length ? filename = jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : filename = s[s.length - 1] + ".zip", 
            strFile += `$FileDirRoot = Split-Path "$BackupToFinal\\${dir}"\n\n`, strFile += "If (!(Test-Path $FileDirRoot)) {\n", 
            strFile += '\tWrite-Output "Directory does not exist"\n', strFile += "\tCreateDir -Path $FileDirRoot\n", 
            strFile += "}\n", strFile += `Copy-Item -Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Destination $FileDirRoot -Recurse\n\n`;
        } else if (dateinfile || zip) {
            if (dateinfile && !zip) {
                if (console.log("Directory copy with date"), s.length > 0) if (1 === s.length) dir = td + "-" + s[1]; else for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {\n`, strFile += '\tWrite-Output "Directory does not exist"\n', 
                strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"\n`, strFile += "}\n", 
                // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'
                // strFile += 'Get-ChildItem "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '\\*"' + ' -file | Copy-Item -Destination "$BackupToFinal' + '\\' + td + '-' + dir + ' -Force' + '\n\n'
                strFile += `Get-ChildItem "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${dir}" -Force\n\n`;
            } else if (!dateinfile && zip) {
                console.log("Directory zip copy");
                let filename = "";
                if (s.length > 0) {
                    for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
                    filename = s[s.length - 1] + ".zip";
                } else filename = jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip";
                strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {\n`, strFile += '\tWrite-Output "Directory does not exist"\n', 
                strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"\n`, strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal\\${filename}" -RootDir "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\*" -Recursive $false\n\n`;
            } else if (dateinfile && zip) {
                console.log("Directory zip copy with date");
                let filename = "";
                if (dir = "", s.length > 0) {
                    if (1 === s.length) dir = "\\" + td + "-" + s[1]; else for (j = 1; j < s.length; j++) j === s.length - 1 || j === s.length ? "" === dir ? dir = "\\" + td + "-" + s[j] : dir += "\\" + td + "-" + s[j] : "" === dir ? dir = "\\" + s[j] : dir += "\\" + s[j];
                    filename = td + "-" + s[s.length - 1] + ".zip";
                } else filename = jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip";
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, 
                strFile += "}\n", 
                // strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
                strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}\\*" -Recursive $false\n\n`;
            }
        } else {
            if (console.log("Directory copy"), s.length > 0) for (j = 1; j < s.length; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
            strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, 
            strFile += "}\n", 
            // strFile += 'Copy-Item -Path "' + jsondata["Backup List"][index]["Files"][i]["File Or Folder"] + '\\*" -Destination "$BackupToFinal' + '\\' + dir + '"\n\n'
            strFile += `Get-ChildItem "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal${dir}" -Force\n\n`;
        } else if (2 === ft) if (sd) if (dateinfile || zip) {
            if (dateinfile && !zip) {
                console.log("Filetype copy with date with sub-directories");
                let origdir = "";
                if (s.length > 0) if (1 === s.length) dir = "", origdir = ""; else for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j], 
                "" === origdir ? origdir = s[j] : origdir += "\\" + s[j];
                strFile += `$FileDirRoot = "$BackupToFinal\\${dir}"\n\n`, strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"\n`, 
                strFile += "}\n", strFile += `robocopy "${s[0]}\\${origdir}" "$FileDirRoot" ${s[s.length - 1]} /e\n\n`;
            } else if (!dateinfile && zip) {
                console.log("Filetype zip copy with sub-directories");
                let filename = "", origdir = "";
                if (s.length > 2) {
                    for (j = 1; j < s.length - 1; j++) j === s.length - 2 || j === s.length - 1 ? ("" === dir ? dir = td + "-" + s[j] : dir += "\\" + td + "-" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j]) : ("" === dir ? dir = s[j] : dir += "\\" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j]);
                    filename = s[s.length - 2] + s[s.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"].replace("*.*", "").replace(":\\*.", "-") + ".zip";
                origdir = origdir ? "\\" + origdir : "", strFile += `If (!(Test-Path "$BackupToFinal${origdir}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${origdir}"\n`, 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${origdir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Recursive $true\n\n`;
            } else if (dateinfile && zip) {
                console.log("Filetype zip copy with date with sub-directories");
                let filename = "", origdir = "";
                if (dir = "", s.length > 2) {
                    for (j = 1; j < s.length - 1; j++) j === s.length - 2 || j === s.length - 1 ? ("" === dir ? dir = td + "-" + s[j] : dir += "\\" + td + "-" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j]) : ("" === dir ? dir = s[j] : dir += "\\" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j]);
                    filename = td + "-" + s[s.length - 2] + s[s.length - 1].replace(":\\*.*", "").replace("*.", "-") + ".zip";
                } else filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"].replace(":\\*.*", "").replace(":\\*.", "-") + ".zip";
                origdir = origdir ? "\\" + origdir : "", strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, 
                strFile += "}\n", 
                // strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
                strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Recursive $true\n\n`;
            }
        } else {
            if (console.log("Filetype copy with sub-directories"), s.length > 1) for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            strFile += `$FileDirRoot = "$BackupToFinal\\${dir}"\n\n`, strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {\n`, 
            strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"\n`, 
            strFile += "}\n", strFile += `robocopy "${s[0]}\\${dir}" "$FileDirRoot" ${s[s.length - 1]} /e\n\n`;
        } else if (dateinfile || zip) {
            if (dateinfile && !zip) {
                if (console.log("Filetype copy with date"), s.length > 0) if (1 === s.length) dir = td + "-" + s[1]; else for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + td + "-" + s[j];
                0 === s.length ? filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"] + ".zip" : filename = td + "-" + s[s.length - 1] + ".zip", 
                strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {\n`, strFile += '\tWrite-Output "Directory does not exist"\n', 
                strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"\n`, strFile += "}\n", strFile += `Get-ChildItem -Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -File | ForEach-Object {\n`, 
                strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")\n`, 
                strFile += "}\n\n";
            } else if (!dateinfile && zip) {
                console.log("Filetype zip copy");
                let filename = "";
                if (s.length > 2) {
                    for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
                    filename = s[s.length - 2] + s[s.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else filename = jsondata["Backup List"][index].Files[i]["File Or Folder"].replace(":\\*.*", "").replace(":\\*.", "-") + ".zip";
                strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, 
                strFile += "}\n", strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${dir}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Recursive $false\n\n`;
            } else if (dateinfile && zip) {
                console.log("Filetype zip copy with date");
                let filename = "", origdir = "";
                if (dir = "", s.length > 2) {
                    for (j = 1; j < s.length - 1; j++) j === s.length - 2 || j === s.length - 1 ? ("" === dir ? dir = td + "-" + s[j] : dir += "\\" + td + "-" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j]) : ("" === dir ? dir = s[j] : dir += "\\" + s[j], 
                    "" === origdir ? origdir = s[j] : origdir += "\\" + s[j]);
                    filename = s[s.length - 2] + s[s.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else filename = td + "-" + jsondata["Backup List"][index].Files[i]["File Or Folder"].replace("*.*", "").replace(":\\*.", "-") + ".zip";
                origdir = origdir ? "\\" + origdir : "", strFile += `If (!(Test-Path "$BackupToFinal${dir = dir ? "\\" + dir : ""}")) {\n`, 
                strFile += '\tWrite-Output "Directory does not exist"\n', strFile += `\tCreateDir -Path "$BackupToFinal${dir}"\n`, 
                strFile += "}\n", 
                // strFile += `Compress-Archive -Path "${jsondata["Backup List"][index]["Files"][i]["File Or Folder"]}\\*" -Update -DestinationPath "$BackupToFinal\\${dir}"` + '\n\n'
                strFile += `compressFiles -zipFile "$BackupToFinal${dir}\\${filename}" -RootDir "${s[0]}${origdir}\\" -FilesToZip "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -Recursive $false\n\n`;
            }
        } else {
            if (console.log("Filetype copy"), s.length > 1) for (j = 1; j < s.length - 1; j++) "" === dir ? dir = s[j] : dir += "\\" + s[j];
            strFile += `If (!(Test-Path "$BackupToFinal\\${dir}")) {\n`, strFile += '\tWrite-Output "Directory does not exist"\n', 
            strFile += `\tCreateDir -Path "$BackupToFinal\\${dir}"\n`, strFile += "}\n", strFile += `Get-ChildItem -Path "${jsondata["Backup List"][index].Files[i]["File Or Folder"]}" -File | ForEach-Object {\n`, 
            strFile += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${rd}\\${dir}")\n`, 
            strFile += "}\n\n";
        }
    }
    jsondata["Backup List"][index]["Message After"] && (strFile += `$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${jsondata["Backup List"][index]["Message After"]}")\n\n`), 
    powershellFileWrite(batchFileName, strFile);
    let today = new Date;
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
    if (d > 31) return null;
    if ((4 === m || 6 === m || 9 === m || 11 === m) && d > 30) return null;
    if (2 === m && d > 28) return null;
    let result = new Date;
    return result.setDate(d), result.setMonth(m - 1), result.setYear(y), result;
}

function dateToYYYYMMDD(dt, seperator) {
    let da = new Date(dt), d = da.getDate() < 10 ? "0" + da.getDate() : da.getDate(), m = da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1);
    return da.getFullYear() + seperator + m + seperator + d;
}

function dateToDDMMYYYY(dt, seperator) {
    let da = new Date(dt);
    return (da.getDate() < 10 ? "0" + da.getDate() : da.getDate()) + "/" + (da.getMonth() < 9 ? "0" + Number(da.getMonth() + 1) : Number(da.getMonth() + 1)) + seperator + da.getFullYear();
}

function numberOfNightsBetweenDates(startDate, endDate) {
    let start = new Date(startDate), end = new Date(endDate);
    start.setHours("1"), end.setHours("1"), start.setMinutes("0"), end.setMinutes("0"), 
    start.setSeconds("0"), end.setSeconds("0"), start.setMilliseconds("0"), end.setMilliseconds("0");
    return Math.floor((end - start) / 864e5);
}

function dateToHHMM(dt, seperator) {
    let da = new Date(dt);
    return (da.getHours() < 10 ? "0" + da.getHours() : da.getHours()) + seperator + (da.getMinutes() < 9 ? "0" + Number(da.getMinutes() + 1) : Number(da.getMinutes() + 1));
}

module.exports = {
    getSettings: getSettings,
    putSettings: putSettings,
    putBuild: putBuild
};