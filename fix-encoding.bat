@echo off
cd /d C:\GatewayPagamentos\frontend
powershell -Command "$files = @('app\dashboard\page.tsx','app\dashboard\produtos\page.tsx','app\dashboard\vendas\page.tsx','app\dashboard\afiliados\page.tsx','app\dashboard\mercado\page.tsx','app\dashboard\relatorios\page.tsx','app\dashboard\testes-ab\page.tsx','app\dashboard\admin\page.tsx'); foreach($f in $files){ if(Test-Path $f){ $c=[System.IO.File]::ReadAllText($f,[System.Text.UTF8Encoding]::new($false)); $c=$c -replace [char]0xC3+[char]0x82+[char]0xC2+[char]0xA9,[char]0xC2+[char]0xA9; [System.IO.File]::WriteAllText($f,$c,[System.Text.UTF8Encoding]::new($false)); Write-Host \"OK: $f\" }}"
echo.
echo Concluido!
pause
