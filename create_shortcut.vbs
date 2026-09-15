Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set oWS = CreateObject("WScript.Shell")

electronExe = scriptDir & "\node_modules\electron\dist\electron.exe"
iconPath = scriptDir & "\assets\app-icon.ico"

' Danh sach cac duong dan Desktop
desktopPaths = Array(oWS.SpecialFolders("Desktop"), "D:\Desktop", "C:\Users\Admin\Desktop")

For Each dPath in desktopPaths
    If fso.FolderExists(dPath) Then
        sLinkFile = dPath & "\Remotion 5 - AI Video Studio.lnk"
        oldLinkFile = dPath & "\Remotion AI Video Editor.lnk"
        
        ' Xoa shortcut cu bi trung
        If fso.FileExists(oldLinkFile) And dPath <> "C:\Users\Public\Desktop" Then
            On Error Resume Next
            fso.DeleteFile(oldLinkFile)
            On Error Goto 0
        End If

        If fso.FileExists(sLinkFile) Then
            On Error Resume Next
            fso.DeleteFile(sLinkFile)
            On Error Goto 0
        End If

        ' Tao shortcut moi voi icon dac trung Remotion 5
        Set oLink = oWS.CreateShortcut(sLinkFile)
        oLink.TargetPath = electronExe
        oLink.Arguments = "."
        oLink.WorkingDirectory = scriptDir
        oLink.Description = "Remotion 5 AI Video Studio Desktop App"
        
        If fso.FileExists(iconPath) Then
            oLink.IconLocation = iconPath & ",0"
        Else
            oLink.IconLocation = electronExe & ",0"
        End If
        
        oLink.Save
        Set oLink = Nothing
    End If
Next

Set oWS = Nothing
Set fso = Nothing
