$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$arquivos = Get-ChildItem -Path "app" -Recurse -Include "*.tsx","*.ts"
$count = 0
foreach ($arquivo in $arquivos) {
    $count++
    Write-Host "$count - $($arquivo.Name)"
    $conteudo = [System.IO.File]::ReadAllText($arquivo.FullName, [System.Text.Encoding]::UTF8)
    $conteudo = $conteudo.Replace('??','?').Replace('??','?').Replace('??','?').Replace('??','?').Replace('??','?').Replace('??','?').Replace('??','?').Replace('??','?').Replace('??','?').Replace('??','?').Replace('?','?')
    [System.IO.File]::WriteAllText($arquivo.FullName, $conteudo, $utf8NoBom)
}
Write-Host "Concluido!" -ForegroundColor Green
