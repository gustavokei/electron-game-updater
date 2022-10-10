!macro RunApp
	${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" ""
!macroend

!macro customInstall
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