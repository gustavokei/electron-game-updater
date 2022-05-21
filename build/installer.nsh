!macro RunApp
	${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" ""
!macroend

!macro customInstall
	CopyFiles "$EXEDIR\gc-client\**" "$INSTDIR\gc-client"
  RMDir /r "$EXEDIR\gc-client"
	!insertmacro RunApp
	!insertmacro quitSuccess
!macroend

!macro customRemoveFiles
	${if} ${isUpdated}
		!insertmacro quitSuccess
	${else}
		RMDir /r $INSTDIR
	${endIf}
!macroend