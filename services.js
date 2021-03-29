const fsp = require("fs/promises");

const templateSettings = e => '{"Backup List":[{ "ID": ID, "Backup Name": "Main", "Backup Root Directory": "", "Include Date": true, "Message Before": "", "Message After": "", "Send Email After": false, "Email Address": "", "Last edited": 123, "Script created": 123, "Active": true, "Files": [] } ] }';

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
    for (let e = 0; e < t.length; e++) i += "\n" + t[e]["File Or Folder"];
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

async function powershellFileWrite(e, t) {
    try {
        fsp.writeFile(e, t);
        return t;
    } catch (e) {
        console.error(e);
    }
}

async function putBuild(l) {
    console.log("in putBuild");
    var n;
    if (l.BackupListID) n = l.BackupListID; else n = 0;
    var e = __dirname + "\\Backup-scripts\\" + l["Backup List"][n]["Backup Name"] + ".ps1";
    var s = "";
    s = powershellStart(l["Backup List"][n].Files, l["Backup List"][n]["Last edited"]);
    s += powershellVars(l["Backup List"][n]["Backup Root Directory"]);
    s += "Add-Type -As System.IO.Compression.FileSystem\n\n";
    s += powershellFunctions() + "\n\n";
    if (l["Backup List"][n]["Message Before"]) s += powershellMsgBefore(l["Backup List"][n]["Message Before"]);
    if (l["Backup List"][n]["Message After"]) s += powershellMsgAfter(l["Backup List"][n]["Message After"]);
    s += powershellDestination();
    let t = l["Backup List"][n]["Backup Root Directory"];
    var i = new Date();
    if (l["Backup List"][n]["Include Date"]) {
        s += powershellDirData(l["Backup List"][n]["Backup Root Directory"]);
        if (t.endsWith("'")) {
            t = t.substring(0, t.length - 1);
            if (t.endsWith("'")) t = t.substring(0, t.length - 1);
        }
        t += "\\" + dateToYYYYMMDD(i, "");
    } else {
        s += "$BackupToFinal = $BackupTo\n\n";
        if (t.endsWith("'")) {
            t = t.substring(0, t.length - 1);
            if (t.endsWith("'")) t = t.substring(0, t.length - 1);
        }
    }
    let r = l;
    for (let r = 0; r < l["Backup List"][n].Files.length; r++) {
        if (!l["Backup List"][n].Files[r].Active) {
            r++;
            if (r >= l["Backup List"][n].Files.length) break;
        }
        let i = l["Backup List"][n].Files[r]["File Or Folder"].split("\\");
        var o = "";
        var a;
        try {
            a = await fileFolderType(l["Backup List"][n].Files[r]["File Or Folder"]);
        } catch (e) {
            a = -1;
        }
        s += `$FileName = "${l["Backup List"][n].Files[r]["File Or Folder"]}"` + "\n";
        if (0 === a) s += `$FileDir = Split-Path "${l["Backup List"][n].Files[r]["File Or Folder"]}"` + "\n\n"; else if (1 === a) s += `$FileDir = "${l["Backup List"][n].Files[r]["File Or Folder"]}"` + "\n\n"; else s += `$FileDir = Split-Path "${l["Backup List"][n].Files[r]["File Or Folder"]}"` + "\n\n";
        var c = l["Backup List"][n].Files[r]["Sub-Directories"];
        var p = l["Backup List"][n].Files[r]["Date In File"];
        var u = l["Backup List"][n].Files[r]["Zip It"];
        var F;
        var $ = dateToYYYYMMDD(new Date(), "");
        if (-1 !== a) if (0 === a) {
            if (!p && !u) {
                console.log("File copy");
                if (1 < i.length) for (j = 1; j < i.length - 1; j++) "" === o ? o = i[j] : o += "\\" + i[j];
                s += `If (!(Test-Path "$BackupToFinal\\${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal\\${o}"` + "\n";
                s += "}\n";
                s += 'Copy-Item -Path "' + l["Backup List"][n].Files[r]["File Or Folder"] + '" -Destination "$BackupToFinal\\' + o + '"\n\n';
            } else if (p && !u) {
                console.log("File copy with date");
                if (0 < i.length) if (1 === i.length) o = ""; else for (j = 1; j < i.length - 1; j++) "" === o ? o = i[j] : o += "\\" + $ + "-" + i[j];
                o ? o = "\\" + o : o = "";
                s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += '\tCreateDir -Path "$BackupToFinal' + o + '"\n';
                s += "}\n";
                s += 'Copy-Item -Path "' + l["Backup List"][n].Files[r]["File Or Folder"] + '" -Destination "$BackupToFinal' + o + "\\" + $ + "-" + i[i.length - 1] + '"\n\n';
            } else if (!p && u) {
                console.log("File zip copy");
                o = "";
                if (2 < i.length) for (j = 1; j < i.length - 1; j++) "" === o ? o += "\\" + i[j] : o += "\\" + i[j];
                var h = "" === o ? "\\" + i[i.length - 1].replace(".", "-") : o + "\\" + i[i.length - 1].replace(".", "-");
                s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
                s += "}\n";
                s += `Compress-Archive -Update "${l["Backup List"][n].Files[r]["File Or Folder"]}" "$BackupToFinal${h}.zip"` + "\n\n";
            } else if (p && u) {
                console.log("File zip copy with date");
                let e = o = "";
                if (2 < i.length) {
                    for (j = 1; j < i.length - 1; j++) if (j === i.length - 1 || j === i.length) ; else o += "\\" + i[j];
                    e = "\\" + $ + "-" + i[i.length - 1].replace(".", "-");
                } else {
                    o = "";
                    e = "\\" + $ + "-" + i[1].replace(".", "-");
                }
                o ? o = "\\" + o : o = "";
                s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
                s += "}\n";
                s += `Compress-Archive -Update "${l["Backup List"][n].Files[r]["File Or Folder"]}" "$BackupToFinal${o}${e}.zip"\n\n`;
            }
        } else if (1 === a) {
            if (!c) {
                if (!p && !u) {
                    console.log("Directory copy");
                    if (0 < i.length) for (j = 1; j < i.length; j++) "" === o ? o = i[j] : o += "\\" + i[j];
                    o ? o = "\\" + o : o = "";
                    s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                    s += '\tWrite-Output "Directory does not exist"\n';
                    s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
                    s += "}\n";
                    s += `Get-ChildItem "${l["Backup List"][n].Files[r]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal${o}" -Force\n\n`;
                } else if (p && !u) {
                    console.log("Directory copy with date");
                    if (0 < i.length) if (1 === i.length) o = $ + "-" + i[1]; else for (j = 1; j < i.length; j++) "" === o ? o = i[j] : o += "\\" + $ + "-" + i[j];
                    s += `If (!(Test-Path "$BackupToFinal\\${o}")) {` + "\n";
                    s += '\tWrite-Output "Directory does not exist"\n';
                    s += `\tCreateDir -Path "$BackupToFinal\\${o}"` + "\n";
                    s += "}\n";
                    s += `Get-ChildItem "${l["Backup List"][n].Files[r]["File Or Folder"]}" -file | Copy-Item -Destination "$BackupToFinal\\${o}" -Force\n\n`;
                } else if (!p && u) {
                    console.log("Directory zip copy");
                    let e = "";
                    if (0 < i.length) {
                        for (j = 1; j < i.length; j++) "" === o ? o = i[j] : o += "\\" + i[j];
                        e = i[i.length - 1] + ".zip";
                    } else e = l["Backup List"][n].Files[r]["File Or Folder"] + ".zip";
                    s += `If (!(Test-Path "$BackupToFinal\\${o}")) {` + "\n";
                    s += '\tWrite-Output "Directory does not exist"\n';
                    s += `\tCreateDir -Path "$BackupToFinal\\${o}"` + "\n";
                    s += "}\n";
                    s += `compressFiles -zipFile "$BackupToFinal\\${e}" -RootDir "${l["Backup List"][n].Files[r]["File Or Folder"]}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}\\*" -Recursive $false` + "\n\n";
                } else if (p && u) {
                    console.log("Directory zip copy with date");
                    let e = "";
                    o = "";
                    if (0 < i.length) {
                        if (1 === i.length) o = "\\" + $ + "-" + i[1]; else for (j = 1; j < i.length; j++) if (j === i.length - 1 || j === i.length) "" === o ? o = "\\" + $ + "-" + i[j] : o += "\\" + $ + "-" + i[j]; else "" === o ? o = "\\" + i[j] : o += "\\" + i[j];
                        e = $ + "-" + i[i.length - 1] + ".zip";
                    } else e = l["Backup List"][n].Files[r]["File Or Folder"] + ".zip";
                    o ? o = "\\" + o : o = "";
                    s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                    s += '\tWrite-Output "Directory does not exist"\n';
                    s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
                    s += "}\n";
                    s += `compressFiles -zipFile "$BackupToFinal${o}\\${e}" -RootDir "${l["Backup List"][n].Files[r]["File Or Folder"]}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}\\*" -Recursive $false` + "\n\n";
                }
            } else if (!p && !u) {
                console.log("Directory copy with sub-directories");
                if (0 < i.length) for (j = 1; j < i.length; j++) "" === o ? o = i[j] : o += "\\" + i[j];
                if (0 === i.length) filename = l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = i[i.length - 1] + ".zip";
                s += `$FileDirRoot = Split-Path "$BackupToFinal\\${o}"` + "\n\n";
                s += "If (!(Test-Path $FileDirRoot)) {\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += "\tCreateDir -Path $FileDirRoot\n";
                s += "}\n";
                s += `Copy-Item -Path "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Destination $FileDirRoot -Recurse` + "\n\n";
            } else if (p && !u) {
                console.log("Directory copy with date with sub-directories");
                if (0 < i.length) if (1 === i.length) o = $ + "-" + i[1]; else for (j = 1; j < i.length; j++) "" === o ? o = i[j] : o += "\\" + $ + "-" + i[j];
                if (0 === i.length) filename = $ + "-" + l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = $ + "-" + i[i.length - 1] + ".zip";
                s += `$FileDirRoot = Split-Path "$BackupToFinal\\${o}"` + "\n\n";
                s += "If (!(Test-Path $FileDirRoot)) {\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += "\tCreateDir -Path $FileDirRoot\n";
                s += "}\n";
                s += `Copy-Item -Path "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Destination "$BackupToFinal\\${o}" -recurse -Force` + "\n\n";
            } else if (!p && u) {
                console.log("Directory zip copy with sub-directories");
                if (0 < i.length) for (j = 1; j < i.length; j++) "" === o ? o = i[j] : o += "\\" + i[j];
                if (0 === i.length) filename = l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = i[i.length - 1] + ".zip";
                o ? o = "\\" + o : o = "";
                s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
                s += "}\n";
                s += `compressFiles -zipFile "$BackupToFinal${o}\\${filename}" -RootDir "${l["Backup List"][n].Files[r]["File Or Folder"]}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}\\*" -Recursive $true` + "\n\n";
            } else if (p && u) {
                console.log("Directory zip copy with date with sub-directories");
                if (0 < i.length) if (1 === i.length) o = $ + "-" + i[1]; else for (j = 1; j < i.length; j++) "" === o ? o = i[j] : o += "\\" + $ + "-" + i[j];
                if (0 === i.length) filename = $ + "-" + l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = $ + "-" + i[i.length - 1] + ".zip";
                o ? o = "\\" + o : o = "";
                s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
                s += "}\n";
                s += `compressFiles -zipFile "$BackupToFinal${o}\\${filename}" -RootDir "${l["Backup List"][n].Files[r]["File Or Folder"]}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}\\*" -Recursive $true` + "\n\n";
            }
        } else if (2 === a) if (!c) {
            if (!p && !u) {
                console.log("Filetype copy");
                if (1 < i.length) for (j = 1; j < i.length - 1; j++) "" === o ? o = i[j] : o += "\\" + i[j];
                s += `If (!(Test-Path "$BackupToFinal\\${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal\\${o}"` + "\n";
                s += "}\n";
                s += `Get-ChildItem -Path "${l["Backup List"][n].Files[r]["File Or Folder"]}" -File | ForEach-Object {` + "\n";
                s += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${t}\\${o}")` + "\n";
                s += "}\n\n";
            } else if (p && !u) {
                console.log("Filetype copy with date");
                if (0 < i.length) if (1 === i.length) o = $ + "-" + i[1]; else for (j = 1; j < i.length - 1; j++) "" === o ? o = i[j] : o += "\\" + $ + "-" + i[j];
                if (0 === i.length) filename = $ + "-" + l["Backup List"][n].Files[r]["File Or Folder"] + ".zip"; else filename = $ + "-" + i[i.length - 1] + ".zip";
                s += `If (!(Test-Path "$BackupToFinal\\${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal\\${o}"` + "\n";
                s += "}\n";
                s += `Get-ChildItem -Path "${l["Backup List"][n].Files[r]["File Or Folder"]}" -File | ForEach-Object {` + "\n";
                s += `\tCopy-Item $_.FullName -Destination $_.DirectoryName.Replace("$FileDir", "${t}\\${o}")` + "\n";
                s += "}\n\n";
            } else if (!p && u) {
                console.log("Filetype zip copy");
                let e = "";
                if (2 < i.length) {
                    for (j = 1; j < i.length - 1; j++) "" === o ? o = i[j] : o += "\\" + i[j];
                    e = i[i.length - 2] + i[i.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else e = l["Backup List"][n].Files[r]["File Or Folder"].replace(":\\*.*", "").replace(":\\*.", "-") + ".zip";
                o ? o = "\\" + o : o = "";
                s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
                s += "}\n";
                s += `compressFiles -zipFile "$BackupToFinal${o}\\${e}" -RootDir "${i[0]}${o}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Recursive $false` + "\n\n";
            } else if (p && u) {
                console.log("Filetype zip copy with date");
                let e = "";
                let t = "";
                o = "";
                if (2 < i.length) {
                    for (j = 1; j < i.length - 1; j++) if (j === i.length - 2 || j === i.length - 1) {
                        "" === o ? o = $ + "-" + i[j] : o += "\\" + $ + "-" + i[j];
                        "" === t ? t = i[j] : t += "\\" + i[j];
                    } else {
                        "" === o ? o = i[j] : o += "\\" + i[j];
                        "" === t ? t = i[j] : t += "\\" + i[j];
                    }
                    e = i[i.length - 2] + i[i.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
                } else e = $ + "-" + l["Backup List"][n].Files[r]["File Or Folder"].replace("*.*", "").replace(":\\*.", "-") + ".zip";
                o ? o = "\\" + o : o = "";
                t ? t = "\\" + t : t = "";
                s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
                s += '\tWrite-Output "Directory does not exist"\n';
                s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
                s += "}\n";
                s += `compressFiles -zipFile "$BackupToFinal${o}\\${e}" -RootDir "${i[0]}${t}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Recursive $false` + "\n\n";
            }
        } else if (!p && !u) {
            console.log("Filetype copy with sub-directories");
            if (1 < i.length) for (j = 1; j < i.length - 1; j++) "" === o ? o = i[j] : o += "\\" + i[j];
            s += `$FileDirRoot = "$BackupToFinal\\${o}"` + "\n\n";
            s += `If (!(Test-Path "$BackupToFinal\\${o}")) {` + "\n";
            s += '\tWrite-Output "Directory does not exist"\n';
            s += `\tCreateDir -Path "$BackupToFinal\\${o}"` + "\n";
            s += "}\n";
            s += `robocopy "${i[0]}\\${o}" "$FileDirRoot" ${i[i.length - 1]} /e` + "\n\n";
        } else if (p && !u) {
            console.log("Filetype copy with date with sub-directories");
            let e = "";
            if (0 < i.length) if (1 === i.length) {
                o = "";
                e = "";
            } else for (j = 1; j < i.length - 1; j++) {
                "" === o ? o = i[j] : o += "\\" + $ + "-" + i[j];
                "" === e ? e = i[j] : e += "\\" + i[j];
            }
            s += `$FileDirRoot = "$BackupToFinal\\${o}"` + "\n\n";
            s += `If (!(Test-Path "$BackupToFinal\\${o}")) {` + "\n";
            s += '\tWrite-Output "Directory does not exist"\n';
            s += `\tCreateDir -Path "$BackupToFinal\\${o}"` + "\n";
            s += "}\n";
            s += `robocopy "${i[0]}\\${e}" "$FileDirRoot" ${i[i.length - 1]} /e` + "\n\n";
        } else if (!p && u) {
            console.log("Filetype zip copy with sub-directories");
            let e = "";
            let t = "";
            if (2 < i.length) {
                for (j = 1; j < i.length - 1; j++) if (j === i.length - 2 || j === i.length - 1) {
                    "" === o ? o = $ + "-" + i[j] : o += "\\" + $ + "-" + i[j];
                    "" === t ? t = i[j] : t += "\\" + i[j];
                } else {
                    "" === o ? o = i[j] : o += "\\" + i[j];
                    "" === t ? t = i[j] : t += "\\" + i[j];
                }
                e = i[i.length - 2] + i[i.length - 1].replace("*.*", "").replace("*.", "-") + ".zip";
            } else e = $ + "-" + l["Backup List"][n].Files[r]["File Or Folder"].replace("*.*", "").replace(":\\*.", "-") + ".zip";
            t ? t = "\\" + t : t = "";
            s += `If (!(Test-Path "$BackupToFinal${t}")) {` + "\n";
            s += '\tWrite-Output "Directory does not exist"\n';
            s += `\tCreateDir -Path "$BackupToFinal${t}"` + "\n";
            s += "}\n";
            s += `compressFiles -zipFile "$BackupToFinal${t}\\${e}" -RootDir "${i[0]}${t}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Recursive $true` + "\n\n";
        } else if (p && u) {
            console.log("Filetype zip copy with date with sub-directories");
            let e = "";
            let t = "";
            o = "";
            if (2 < i.length) {
                for (j = 1; j < i.length - 1; j++) if (j === i.length - 2 || j === i.length - 1) {
                    "" === o ? o = $ + "-" + i[j] : o += "\\" + $ + "-" + i[j];
                    "" === t ? t = i[j] : t += "\\" + i[j];
                } else {
                    "" === o ? o = i[j] : o += "\\" + i[j];
                    "" === t ? t = i[j] : t += "\\" + i[j];
                }
                e = $ + "-" + i[i.length - 2] + i[i.length - 1].replace(":\\*.*", "").replace("*.", "-") + ".zip";
            } else e = $ + "-" + l["Backup List"][n].Files[r]["File Or Folder"].replace(":\\*.*", "").replace(":\\*.", "-") + ".zip";
            o ? o = "\\" + o : o = "";
            t ? t = "\\" + t : t = "";
            s += `If (!(Test-Path "$BackupToFinal${o}")) {` + "\n";
            s += '\tWrite-Output "Directory does not exist"\n';
            s += `\tCreateDir -Path "$BackupToFinal${o}"` + "\n";
            s += "}\n";
            s += `compressFiles -zipFile "$BackupToFinal${o}\\${e}" -RootDir "${i[0]}${t}\\" -FilesToZip "${l["Backup List"][n].Files[r]["File Or Folder"]}" -Recursive $true` + "\n\n";
        }
    }
    powershellFileWrite(e, s);
    var i = new Date();
    i = Date.now();
    r["Backup List"][n]["Script created"] = i;
    r["Script message"] = `Backup script file created in ${e}. Put this file in a cron job or scheduler to automatically do your backups regularly.`;
    let f = "";
    try {
        f = await buildErrorChecker(r);
    } catch (e) {
        throw new Error("Error building ErrorChecker");
    }
    return f;
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