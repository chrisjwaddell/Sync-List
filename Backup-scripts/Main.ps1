<#

Last Edited - 1616399055845
#>

$BackupTo = 'C:\Users\Chris\Google-Drive'
$Now = Get-Date -Format "yyyyMMdd"

Add-Type -As System.IO.Compression.FileSystem

function CreateDir {
      param (
          $Path
      )

      $len = $Path.length

      $Drive = $Path.substring(0,2)
      $Drive
      $Folders = $Path[[int](-1 * ($len - 3))..-1] -join ''
      $Folders

      $arrFolders = $Folders.split("\")
      $arrFolders

      $FolderBuild = "$Drive\"
      $FolderRoot = "$Drive\"
      Foreach ($i in $arrFolders)
      {
          $i

          $FolderBuild = $FolderBuild + "\" + $i
          $FolderBuild
          Test-Path $FolderBuild
          If (!(Test-Path "$FolderBuild")) {
              Write-Output "doesn't exist"
              New-Item -Path "$FolderRoot" -Name $i -ItemType "directory"
          }

          $FolderRoot = $FolderRoot + "\" + $i
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

}

Test-Path "$BackupTo"
If (!(Test-Path "$BackupTo")) {
	Write-Output "does not exist"
	Exit
}


$BackupToFinal = "C:\Users\Chris\Google-Drive\$Now"
If (!(Test-Path "$BackupToFinal")) {
	Write-Output "Directory does not exist"
	New-Item -Path "$BackupTo" -Name $Now -ItemType "directory"
}


