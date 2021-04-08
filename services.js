const fsp = require("fs/promises");

const templateSettings = e => '{"Backup List":[{ "ID": ID, "Backup Name": "Main", "Backup Root Directory": "", "Include Date": true, "Message Before": "", "Message After": "Backup complete", "Send Email After": false, "Email Address": "", "Last edited": 123, "Script created": 123, "Active": true, "Files": [] } ] }';

var settingsFile = __dirname + "\\settings.json";

function IsJsonString(e) {
    try {
        return JSON.parse(e);
    } catch (e) {
        return {
            File: "File isn't in JSON format"
        };
    }
    return false;
}

async function getSettings() {
    var i = __dirname + "\\Backup-scripts";
    try {
        await fsp.access(i);
    } catch (e) {
        await fsp.mkdir(i).then(e => {
            console.warn("Making Backup-scripts directory");
        }).catch(e => console.error("Error: In making Backup-scripts directory"));
    }
    try {
        var r = await fsp.readFile(settingsFile, "utf8");
        var e;
        var t;
        return await buildErrorChecker(IsJsonString(r));
    } catch (e) {
        console.error(e);
        console.error("Settings file DOESN'T exists...... Making settings.json");
        var i = new Date();
        var i = __dirname + "\\settings-" + dateToYYYYMMDD(i, "") + "-" + dateToHHMM(i, "") + ".json";
        await fsp.writeFile(i, r).catch(e => console.error("Error: Couldn't create settings Error json file"));
        let t = IsJsonString(templateSettings);
        t["Important Error Message"] = "The settings.json isn't in the correct format. A new, blank settings.json file has been created and the previous settings file was save to " + i;
        var i = JSON.stringify(t, null, 4);
        await fsp.writeFile(settingsFile, i).catch(e => console.error("Error: Couldn't create settings.json"));
        return t;
    }
}

async function putSettings(e) {
    var t = await buildErrorChecker(e);
    var e = JSON.stringify(t, null, 4);
    try {
        await fsp.writeFile(settingsFile, e);
        return t;
    } catch (e) {
        console.error(e);
    }
}

async function buildErrorChecker(e) {
    var t = "";
    var i = "";
    delete (i = e)["Important Error Message"];
    delete i["Script message"];
    delete i["Error List"];
    i["Error List"] = [];
    delete i.BackupListID;
    for (let t = 0; t < i["Backup List"].length; t++) {
        i["Error List"].push({});
        try {
            await fsp.access(__dirname + "\\Backup-scripts\\" + i["Backup List"][t]["Backup Name"] + ".ps1");
        } catch (e) {
            console.error(e);
            i["Error List"][t]["Backup Name"] = "Script file doesn't exist.";
        }
        try {
            await fsp.access(i["Backup List"][t]["Backup Root Directory"]);
        } catch (e) {
            i["Error List"][t]["Backup Root Directory"] = "Backup Root Directory not found.";
        }
        var r;
        var l;
        if (i["Backup List"][t]["Script created"] < i["Backup List"][t]["Last edited"]) i["Error List"][t]["Last edited"] = "Changes have been made since the Backup Script was generated last.";
    }
    return i;
}

function powershellStart(t, e) {
    var i = "<#";
    for (let e = 0; e < t.length; e++) if (t[e].Active) i += "\n" + t[e]["File Or Folder"];
    i += "\n\n";
    return i += "Last Edited - " + e + "\n#>\n\n";
}

const powershellVars = e => `$BackupTo = '${e}'\n$Now = Get-Date -Format "yyyyMMdd"\n\n`;

const powershellMsgBefore = e => `$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${e}")\n\n`;

const powershellMsgAfter = e => `$wsh = New-Object -ComObject Wscript.Shell\n$wsh.Popup("${e}")\n\n`;

const powershellDestination = () => 'Test-Path "$BackupTo"\nIf (!(Test-Path "$BackupTo")) {\n\tWrite-Output "does not exist"\n\tExit\n}\n\n\n';

function powershellDirData(e) {
    var t = "";
    let i = e;
    if (i.endsWith("'")) {
        i = i.substring(0, i.length - 1);
        if (i.endsWith("'")) i = i.substring(0, i.length - 1);
    }
    t = `$BackupToFinal = "${i}\\$Now"` + "\n";
    t += 'If (!(Test-Path "$BackupToFinal")) {\n';
    t += '\tWrite-Output "Directory does not exist"\n';
    t += '\tNew-Item -Path "$BackupTo" -Name $Now -ItemType "directory"\n';
    return t += "}\n\n\n";
}

async function fileFolderType(e) {
    if (-1 === e.indexOf("*")) {
        var t;
        (await fsp.stat(e)).isFile() ? filetype = 0 : filetype = 1;
    } else filetype = 2;
    return filetype;
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

}`;
    return str;
}

function backupIDToIndex(e, t) {
    let i = 0;
    for (;e["Backup List"][i]; ) {
        if (e["Backup List"][i].ID === t) return i;
        i++;
    }
    return 200;
}

async function powershellFileWrite(e, t) {
    try {
        fsp.writeFile(e, t);
        return t;
    } catch (e) {
        console.error(e);
    }
}

async function putBuild(l) {
    var e;
    if (l.BackupListID) e = l.BackupListID; else e = 0;
    var n = backupIDToIndex(l, e);
    var t = __dirname + "\\Backup-scripts\\" + l["Backup List"][n]["Backup Name"] + ".ps1";
    var o = "";
    o = powershellStart(l["Backup List"][n].Files, l["Backup List"][n]["Last edited"]);
    o += powershellVars(l["Backup List"][n]["Backup Root Directory"]);
    o += "Add-Type -As System.IO.Compression.FileSystem\n\n";
    o += powershellFunctions() + "\n\n";
    if (l["Backup List"][n]["Message Before"]) o += powershellMsgBefore(l["Backup List"][n]["Message Before"]);
    o += powershellDestination();
    let s = l["Backup List"][n]["Backup Root Directory"];
    var e = new Date();
    if (l["Backup List"][n]["Include Date"]) {
        o += powershellDirData(l["Backup List"][n]["Backup Root Directory"]);
        if (s.endsWith("'")) {
            s = s.substring(0, s.length - 1);
            if (s.endsWith("'")) s = s.substring(0, s.length - 1);
        }
        s += "\\" + dateToYYYYMMDD(e, "");
    } else {
        o += "$BackupToFinal = $BackupTo\n\n";
        if (s.endsWith("'")) {
            s = s.substring(0, s.length - 1);
            if (s.endsWith("'")) s = s.substring(0, s.length - 1);
        }
    }
    let i = l;
    for (let r = 0; r < l["Backup List"][n].Files.length; r++) {
        if (!l["Backup List"][n].Files[r].Active) {
            r++;
            if (r >= l["Backup List"][n].Files.length) break;
        }
        let i = l["Backup List"][n].Files[r]["File Or Folder"].split("\\");
        var a = "";
        var c;
        try {
            c = await fileFolderType(l["Backup List"][n].Files[r]["File Or Folder"]);
        } catch (e) {
            c = -1;
        }
        o += `$FileName = "${l["Backup List"][n].Files[r]["File Or Folder"]}"` + "\n";
        if (0 === c) o += `$FileDir = Split-Path "${l["Backup List"][n].Files[r]["File Or Folder"]}"` + "\n\n"; else if (1 === c) o += `$FileDir = "${l["Backup List"][n].Files[r]["File Or Folder"]}"` + "\n\n"; else o += `$FileDir = Split-Path "${l["Backup List"][n].Files[r]["File Or Folder"]}"` + "\n\n";
        var p = l["Backup List"][n].Files[r]["Sub-Directories"];
        var u = l["Backup List"][n].Files[r]["Date In File"];
        var F = l["Backup List"][n].Files[r]["Zip It"];
        var $;
        var h = dateToYYYYMMDD(new Date(), "");
        if (-1 !== c) if (0 === c) {
            if (!u && !F) {
                console.log("File copy");
                if (1 < i.length) for (j = 1; j < i.length - 1; j++) "" === a ? a = i[j] : a += "\\" + i[j];
                o += `If (!(Test-Path "$BackupToFinal\\${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal\\${a}"` + "\n";
                o += "}\n";
                o += 'Copy-Item -Path "' + l["Backup List"][n].Files[r]["File Or Folder"] + '" -Destination "$BackupToFinal\\' + a + '"\n\n';
            } else if (u && !F) {
                console.log("File copy with date");
                if (0 < i.length) if (1 === i.length) a = ""; else for (j = 1; j < i.length - 1; j++) "" === a ? a = i[j] : a += "\\" + h + "-" + i[j];
                a ? a = "\\" + a : a = "";
                o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += '\tCreateDir -Path "$BackupToFinal' + a + '"\n';
                o += "}\n";
                o += 'Copy-Item -Path "' + l["Backup List"][n].Files[r]["File Or Folder"] + '" -Destination "$BackupToFinal' + a + "\\" + h + "-" + i[i.length - 1] + '"\n\n';
            } else if (!u && F) {
                console.log("File zip copy");
                a = "";
                if (2 < i.length) for (j = 1; j < i.length - 1; j++) "" === a ? a += "\\" + i[j] : a += "\\" + i[j];
                var f = "" === a ? "\\" + i[i.length - 1].replace(".", "-") : a + "\\" + i[i.length - 1].replace(".", "-");
                o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
                o += "}\n";
                o += `Compress-Archive -Update "${l["Backup List"][n].Files[r]["File Or Folder"]}" "$BackupToFinal${f}.zip"` + "\n\n";
            } else if (u && F) {
                console.log("File zip copy with date");
                let e = a = "";
                if (2 < i.length) {
                    for (j = 1; j < i.length - 1; j++) if (j === i.length - 1 || j === i.length) ; else a += "\\" + i[j];
                    e = "\\" + h + "-" + i[i.length - 1].replace(".", "-");
                } else {
                    a = "";
                    e = "\\" + h + "-" + i[1].replace(".", "-");
                }
                a ? a = "\\" + a : a = "";
                o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
                o += "}\n";
                o += `Compress-Archive -Update "${l["Backup List"][n].Files[r]["File Or Folder"]}" "$BackupToFinal${a}${e}.zip"\n\n`;
            }
        } else if (1 === c) {
            if (!p) {
                if (!u && !F) {
                    console.log("Directory copy");
                    if (0 < i.length) for (j = 1; j < i.length; j++) "" === a ? a = i[j] : a += "\\" + i[j];
                    a ? a = "\\" + a : a = "";
                    o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                    o += '\tWrite-Output "Directory does not exist"\n';
                    o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
                    o += "}\n";
                    o += `Get-ChildItem "${l["Backup List"][n].Files[r]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal${a}" -Force\n\n`;
                } else if (u && !F) {
                    console.log("Directory copy with date");
                    if (0 < i.length) if (1 === i.length) a = h + "-" + i[1]; else for (j = 1; j < i.length; j++) "" === a ? a = i[j] : a += "\\" + h + "-" + i[j];
                    o += `If (!(Test-Path "$BackupToFinal\\${a}")) {` + "\n";
                    o += '\tWrite-Output "Directory does not exist"\n';
                    o += `\tCreateDir -Path "$BackupToFinal\\${a}"` + "\n";
                    o += "}\n";
                    o += `Get-ChildItem "${l["Backup List"][n].Files[r]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${a}" -Force\n\n`;
                } else if (!u && F) {
                    console.log("Directory zip copy");
                    let e = "";
                    if (0 < i.length) {
                        for (j = 1; j < i.length; j++) "" === a ? a = i[j] : a += "\\" + i[j];
                        e = i[i.length - 1] + ".zip";
                    } else e = l["Backup List"][n].Files[r]["File Or Folder"] + ".zip";
                    o += `If (!(Test-Path "$BackupToFinal\\${a}")) {` + "\n";
                    o += '\tWrite-Output "Directory does not exist"\n';
                    o += `\tCreateDir -Path "$BackupToFinal\\${a}"` + "\n";
                    o += "}\n";
                    o += `compressFiles -zipFile "$BackupToFinal\\${e}" -RootDir "${l["Backup List"][n].Files[r]["File Or Folder"]}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}\\*" -Recursive $false` + "\n\n";
                } else if (u && F) {
                    console.log("Directory zip copy with date");
                    let e = "";
                    a = "";
                    if (0 < i.length) {
                        if (1 === i.length) a = "\\" + h + "-" + i[1]; else for (j = 1; j < i.length; j++) if (j === i.length - 1 || j === i.length) "" === a ? a = "\\" + h + "-" + i[j] : a += "\\" + h + "-" + i[j]; else "" === a ? a = "\\" + i[j] : a += "\\" + i[j];
                        e = h + "-" + i[i.length - 1] + ".zip";
                    } else e = l["Backup List"][n].Files[r]["File Or Folder"] + ".zip";
                    a ? a = "\\" + a : a = "";
                    o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                    o += '\tWrite-Output "Directory does not exist"\n';
                    o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
                    o += "}\n";
                    o += `compressFiles -zipFile "$BackupToFinal${a}\\${e}" -RootDir "${l["Backup List"][n].Files[r]["File Or Folder"]}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}\\*" -Recursive $false` + "\n\n";
                }
            } else if (!u && !F) {
                console.log("Directory copy with sub-directories");
                if (0 < i.length) for (j = 1; j < i.length; j++) "" === a ? a = i[j] : a += "\\" + i[j];
                if (0 === i.length) filename = l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = i[i.length - 1] + ".zip";
                o += `$FileDirRoot = Split-Path "$BackupToFinal\\${a}"` + "\n\n";
                o += "If (!(Test-Path $FileDirRoot)) {\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += "\tCreateDir -Path $FileDirRoot\n";
                o += "}\n";
                o += `Copy-Item -Path "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` + "\n\n";
            } else if (u && !F) {
                console.log("Directory copy with date with sub-directories");
                if (0 < i.length) if (1 === i.length) a = h + "-" + i[1]; else for (j = 1; j < i.length; j++) "" === a ? a = i[j] : a += "\\" + h + "-" + i[j];
                if (0 === i.length) filename = h + "-" + l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = h + "-" + i[i.length - 1] + ".zip";
                o += `$FileDirRoot = Split-Path "$BackupToFinal\\${a}"` + "\n\n";
                o += "If (!(Test-Path $FileDirRoot)) {\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += "\tCreateDir -Path $FileDirRoot\n";
                o += "}\n";
                o += `Copy-Item -Path "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Destination "$BackupToFinal\\${a}" -recurse -Force` + "\n\n";
            } else if (!u && F) {
                console.log("Directory zip copy with sub-directories");
                if (0 < i.length) for (j = 1; j < i.length; j++) "" === a ? a = i[j] : a += "\\" + i[j];
                if (0 === i.length) filename = l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = i[i.length - 1] + ".zip";
                a ? a = "\\" + a : a = "";
                o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
                o += "}\n";
                o += `compressFiles -zipFile "$BackupToFinal${a}\\${filename}" -RootDir "${l["Backup List"][n].Files[r]["File Or Folder"]}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}\\*" -Recursive $true` + "\n\n";
            } else if (u && F) {
                console.log("Directory zip copy with date with sub-directories");
                if (0 < i.length) if (1 === i.length) a = h + "-" + i[1]; else for (j = 1; j < i.length; j++) "" === a ? a = i[j] : a += "\\" + h + "-" + i[j];
                if (0 === i.length) filename = h + "-" + l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = h + "-" + i[i.length - 1] + ".zip";
                a ? a = "\\" + a : a = "";
                o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
                o += "}\n";
                o += `compressFiles -zipFile "$BackupToFinal${a}\\${filename}" -RootDir "${l["Backup List"][n].Files[r]["File Or Folder"]}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}\\*" -Recursive $true` + "\n\n";
            }
        } else if (2 === c) if (!p) {
            if (!u && !F) {
                console.log("Filetype copy");
                if (1 < i.length) for (j = 1; j < i.length - 1; j++) "" === a ? a = i[j] : a += "\\" + i[j];
                o += `If (!(Test-Path "$BackupToFinal\\${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal\\${a}"` + "\n";
                o += "}\n";
                o += `Get-ChildItem -Path "${l["Backup List"][n].Files[r]["File Or Folder"]}" -File | ForEach-Object {` + "\n";
                o += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${s}\\${a}")` + "\n";
                o += "}\n\n";
            } else if (u && !F) {
                console.log("Filetype copy with date");
                if (0 < i.length) if (1 === i.length) a = h + "-" + i[1]; else for (j = 1; j < i.length - 1; j++) "" === a ? a = i[j] : a += "\\" + h + "-" + i[j];
                if (0 === i.length) filename = h + "-" + l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = h + "-" + i[i.length - 1] + ".zip";
                o += `If (!(Test-Path "$BackupToFinal\\${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal\\${a}"` + "\n";
                o += "}\n";
                o += `Get-ChildItem -Path "${l["Backup List"][n].Files[r]["File Or Folder"]}" -File | ForEach-Object {` + "\n";
                o += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${s}\\${a}")` + "\n";
                o += "}\n\n";
            } else if (!u && F) {
                console.log("Filetype zip copy");
                let e = "";
                if (2 < i.length) {
                    for (j = 1; j < i.length - 1; j++) "" === a ? a = i[j] : a += "\\" + i[j];
                    e = i[i.length - 2] + i[i.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else e = l["Backup List"][n].Files[r]["File Or Folder"].replace(":\\*.*", "").replace(":\\*.", "-") + ".zip";
                a ? a = "\\" + a : a = "";
                o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
                o += "}\n";
                o += `compressFiles -zipFile "$BackupToFinal${a}\\${e}" -RootDir "${i[0]}${a}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Recursive $false` + "\n\n";
            } else if (u && F) {
                console.log("Filetype zip copy with date");
                let e = "";
                let t = "";
                a = "";
                if (2 < i.length) {
                    for (j = 1; j < i.length - 1; j++) if (j === i.length - 2 || j === i.length - 1) {
                        "" === a ? a = h + "-" + i[j] : a += "\\" + h + "-" + i[j];
                        "" === t ? t = i[j] : t += "\\" + i[j];
                    } else {
                        "" === a ? a = i[j] : a += "\\" + i[j];
                        "" === t ? t = i[j] : t += "\\" + i[j];
                    }
                    e = i[i.length - 2] + i[i.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else e = h + "-" + l["Backup List"][n].Files[r]["File Or Folder"].replace("*.*", "").replace(":\\*.", "-") + ".zip";
                a ? a = "\\" + a : a = "";
                t ? t = "\\" + t : t = "";
                o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
                o += '\tWrite-Output "Directory does not exist"\n';
                o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
                o += "}\n";
                o += `compressFiles -zipFile "$BackupToFinal${a}\\${e}" -RootDir "${i[0]}${t}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Recursive $false` + "\n\n";
            }
        } else if (!u && !F) {
            console.log("Filetype copy with sub-directories");
            if (1 < i.length) for (j = 1; j < i.length - 1; j++) "" === a ? a = i[j] : a += "\\" + i[j];
            o += `$FileDirRoot = "$BackupToFinal\\${a}"` + "\n\n";
            o += `If (!(Test-Path "$BackupToFinal\\${a}")) {` + "\n";
            o += '\tWrite-Output "Directory does not exist"\n';
            o += `\tCreateDir -Path "$BackupToFinal\\${a}"` + "\n";
            o += "}\n";
            o += `robocopy "${i[0]}\\${a}" "$FileDirRoot" ${i[i.length - 1]} /e` + "\n\n";
        } else if (u && !F) {
            console.log("Filetype copy with date with sub-directories");
            let e = "";
            if (0 < i.length) if (1 === i.length) {
                a = "";
                e = "";
            } else for (j = 1; j < i.length - 1; j++) {
                "" === a ? a = i[j] : a += "\\" + h + "-" + i[j];
                "" === e ? e = i[j] : e += "\\" + i[j];
            }
            o += `$FileDirRoot = "$BackupToFinal\\${a}"` + "\n\n";
            o += `If (!(Test-Path "$BackupToFinal\\${a}")) {` + "\n";
            o += '\tWrite-Output "Directory does not exist"\n';
            o += `\tCreateDir -Path "$BackupToFinal\\${a}"` + "\n";
            o += "}\n";
            o += `robocopy "${i[0]}\\${e}" "$FileDirRoot" ${i[i.length - 1]} /e` + "\n\n";
        } else if (!u && F) {
            console.log("Filetype zip copy with sub-directories");
            let e = "";
            let t = "";
            if (2 < i.length) {
                for (j = 1; j < i.length - 1; j++) if (j === i.length - 2 || j === i.length - 1) {
                    "" === a ? a = h + "-" + i[j] : a += "\\" + h + "-" + i[j];
                    "" === t ? t = i[j] : t += "\\" + i[j];
                } else {
                    "" === a ? a = i[j] : a += "\\" + i[j];
                    "" === t ? t = i[j] : t += "\\" + i[j];
                }
                e = i[i.length - 2] + i[i.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
            } else e = h + "-" + l["Backup List"][n].Files[r]["File Or Folder"].replace("*.*", "").replace(":\\*.", "-") + ".zip";
            t ? t = "\\" + t : t = "";
            o += `If (!(Test-Path "$BackupToFinal${t}")) {` + "\n";
            o += '\tWrite-Output "Directory does not exist"\n';
            o += `\tCreateDir -Path "$BackupToFinal${t}"` + "\n";
            o += "}\n";
            o += `compressFiles -zipFile "$BackupToFinal${t}\\${e}" -RootDir "${i[0]}${t}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Recursive $true` + "\n\n";
        } else if (u && F) {
            console.log("Filetype zip copy with date with sub-directories");
            let e = "";
            let t = "";
            a = "";
            if (2 < i.length) {
                for (j = 1; j < i.length - 1; j++) if (j === i.length - 2 || j === i.length - 1) {
                    "" === a ? a = h + "-" + i[j] : a += "\\" + h + "-" + i[j];
                    "" === t ? t = i[j] : t += "\\" + i[j];
                } else {
                    "" === a ? a = i[j] : a += "\\" + i[j];
                    "" === t ? t = i[j] : t += "\\" + i[j];
                }
                e = h + "-" + i[i.length - 2] + i[i.length - 1].replace(":\\*.*", "").replace("*.", "-") + ".zip";
            } else e = h + "-" + l["Backup List"][n].Files[r]["File Or Folder"].replace(":\\*.*", "").replace(":\\*.", "-") + ".zip";
            a ? a = "\\" + a : a = "";
            t ? t = "\\" + t : t = "";
            o += `If (!(Test-Path "$BackupToFinal${a}")) {` + "\n";
            o += '\tWrite-Output "Directory does not exist"\n';
            o += `\tCreateDir -Path "$BackupToFinal${a}"` + "\n";
            o += "}\n";
            o += `compressFiles -zipFile "$BackupToFinal${a}\\${e}" -RootDir "${i[0]}${t}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Recursive $true` + "\n\n";
        }
    }
    if (l["Backup List"][n]["Message After"]) o += powershellMsgAfter(l["Backup List"][n]["Message After"]);
    powershellFileWrite(t, o);
    var e = new Date();
    e = Date.now();
    i["Backup List"][n]["Script created"] = e;
    i["Script message"] = `Backup script file created in ${t}. Put this file in a cron job or scheduler to automatically do your backups regularly.`;
    let r = "";
    try {
        r = await buildErrorChecker(i);
    } catch (e) {
        throw new Error("Error building ErrorChecker");
    }
    return r;
}

function dateDDMMYYYYToDate(e) {
    if (10 !== e.length) return null;
    var t = Number(e.substring(0, 2));
    var i = Number(e.substring(3, 5));
    var e = e.substring(6);
    if (t < 0) return null;
    if (31 < t) return null;
    if (4 === i || 6 === i || 9 === i || 11 === i) if (30 < t) return null;
    if (2 === i) if (28 < t) return null;
    let r = new Date();
    r.setDate(t);
    r.setMonth(i - 1);
    r.setYear(e);
    return r;
}

function dateToYYYYMMDD(e, t) {
    let i = new Date(e);
    var r = i.getDate() < 10 ? "0" + i.getDate() : i.getDate();
    var e = i.getMonth() < 9 ? "0" + Number(i.getMonth() + 1) : Number(i.getMonth() + 1);
    var l;
    return i.getFullYear() + t + e + t + r;
}

function dateToDDMMYYYY(e, t) {
    let i = new Date(e);
    var r;
    var l;
    var n;
    return (i.getDate() < 10 ? "0" + i.getDate() : i.getDate()) + "/" + (i.getMonth() < 9 ? "0" + Number(i.getMonth() + 1) : Number(i.getMonth() + 1)) + t + i.getFullYear();
}

function numberOfNightsBetweenDates(e, t) {
    let i = new Date(e);
    let r = new Date(t);
    i.setHours("1");
    r.setHours("1");
    i.setMinutes("0");
    r.setMinutes("0");
    i.setSeconds("0");
    r.setSeconds("0");
    i.setMilliseconds("0");
    r.setMilliseconds("0");
    var l;
    var n;
    return Math.floor((r - i) / 864e5);
}

function dateToHHMM(e, t) {
    let i = new Date(e);
    var r;
    var l;
    return (i.getHours() < 10 ? "0" + i.getHours() : i.getHours()) + t + (i.getMinutes() < 9 ? "0" + Number(i.getMinutes() + 1) : Number(i.getMinutes() + 1));
}

module.exports = {
    getSettings: getSettings,
    putSettings: putSettings,
    putBuild: putBuild
};