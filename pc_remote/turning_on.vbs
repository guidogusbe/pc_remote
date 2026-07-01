Set WshShell = CreateObject("WScript.Shell")
' Imposta la cartella di lavoro su quella dove si trova questo script
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' Lancia il server Python in modalità nascosta (lo "0" serve a nascondere la finestra)
WshShell.Run "python app.py", 0, False