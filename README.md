# Sync List

Backup your frequently changed computer files to your cloud backup folder.

Sync List works well with OneDrive, Dropbox or other cloud storage systems.
You can zip up your files, select a specific file or directory or certain file types.

Sync List is for Windows only.

![Sync List File list](https://github.com/chrisjwaddell/Sync-List/blob/main/img/sync-list.jpg)

Sync List automatically backs up a list of files and directories you've selected to your directory synced to the cloud using your preferred cloud storage service.


## How to install

```bash
git clone https://github.com/chrisjwaddell/Sync-List.git
cd "Sync List"
```

To run it:
```bash
node app.js
```

Then open index.htm in your browser and start using Sync List.



### There are three ways to add files:
1. Specific file *eg C:\Projects\project list.txt*
2. Directory *eg C:\Projects*
3. File type *eg C:\Projects\*.txt*


#### Options for each line
- You can include all **sub-directories**
- You can **zip** all the files together
- You can **include date in the filename**


Sync List generates a Powershell script and saves it in your *Backup-scripts\* directory.
Sync List has a very easy to use GUI (index.htm) to backup your selected files and generates a Powershell script which is then run.
You can have several different backup lists such as Weekly, Monthly, Work files, website files etc. A Powershell backup script gets created for each backup list.
You can then run the .ps1 file and schedule it to run periodically. The Powershell backup scripts are saved into your *Backup-scripts\* directory.

**Include date in filename**
This feature puts a date in the filename in *YYYYMMDD* format so you don't overwrite the previous backup. A sort of incremental backup.

**Zip**
This is handy for zipping a folder or certain types of files together. It keeps your backup size lower to maximize cloud storage.
You can zip up a maximum of 8 Gb of files together.


You can have the date in the root backup directory as well. This will give you a backup directory structure such as:

![Sync List Directory structure](https://github.com/chrisjwaddell/Sync-List/blob/main/img/directories.jpg)

Sync List keeps the same directory structure as the backed up files.

If you have a root backup directory - C:\Users\Owner\Dropbox
And a file you want to backup - C:\My Documents\A\B\xyz.doc
It would save it in - C:\Users\Owner\Dropbox\My Documents\A\B\xyz.doc



# System Requirements
* A Windows machine
* Cloud backup service of your choice such as Google Drive, OneDrive, Dropbox
* Node.js
















