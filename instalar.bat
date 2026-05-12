@echo off
echo ========================================================
echo Instalador - MW Sport Wear POS
echo ========================================================

echo Instalando dependencias...
python -m pip install -r requirements.txt

echo Generando ejecutable. Por favor espere, esto puede tardar unos minutos...
python -m PyInstaller --noconfirm --onedir --windowed --add-data "templates;templates/" --add-data "static;static/"  "app.py"

echo ========================================================
echo Creando acceso directo en el escritorio...
echo ========================================================

powershell -Command "$wshell = New-Object -ComObject WScript.Shell; $shortcut = $wshell.CreateShortcut('%USERPROFILE%\Desktop\MW Sport Wear.lnk'); $shortcut.TargetPath = '%CD%\dist\app\app.exe'; $shortcut.WorkingDirectory = '%CD%\dist\app'; $shortcut.Description = 'Sistema de Ventas MW Sport Wear'; $shortcut.Save()"

echo Instalacion completada con exito.
echo Puede encontrar el acceso directo 'MW Sport Wear' en su escritorio.
pause
