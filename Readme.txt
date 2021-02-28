


Backup your frequently changed computer files to your cloud backup folder

Backup up the frequently changed files on your computer to the cloud
Incremental backup



____ automatically backing up a list of files and directories you've selected to a folder that is synced to the cloud
Using Your Own Cloud Storage

You can have seperate lists of backup files such as files on your computer, website files, working files. 
A backup script gets created for each backup list. You can run these scripts as a cron job or schedule for each script to run periodically. 

with or without sub-directories

that you change often 

individual files
directories
file types eg *.txt
zip them up (to keep the cloud storage space lower) or save without zipping
with or without sub-directories

You can use the ____ GUI which stores the backup script settings and generates Powershell scripts which you can put into a scheduler of your choice. 


* Take snapshot backups
* Copy Incremental backup files
* Compress with gzip or bzip2 to save space


Really handy for doing frequent backups of files that don't take up much storage that change often
Save all txt files into a zip file
E:\My-projects\*.css zip
E:\My-projects\*.js zip
E:\My-projects\*.ht* zip
E:\My-work\*.txt zip 


Screenshot of GUI with root folder
screenshot of all directories
- 20210214
- 20210221
- 20210228
Another screenshot one of the directories


Incremental backups, it includes a date in the file
C:\Users\Owner\OneDrive\20210501\........

GUI to make it easy
Zip your files
Logs


Works with any backup system that syncs files automatically to it's cloud storage. Services like Dropbox, Google Drive, OneDrive etc
Just give it a local directory to save to eg
C:\Users\Owner\OneDrive
C:\Users\Owner\Dropbox


It keeps the same directory structure

If you save file C:\My Documents\A\B\xyz.doc
and your backup directory is:
C:\Users\Owner\Dropbox
It would save it in 
C:\Users\Owner\Dropbox\My Documents\A\B\xyz.doc
even if this is the only file you are saving in My Documents


If you add files to a backup list, ______ will rebuild the associated Powershell script


It keeps a log of all filenames it backs up



How it works
Uses Powershell to build scripts
When you want to backup you run the Powershell script.

You can have as many Powershell scripts as you want eg to back up your website, weekly backup, monthly backup




System Requirements
Windows machine?
* You need NPM installed
* Powershell
* Cloud backup service of your choice such as Google Drive, OneDrive, Dropbox
* chocolatey???



