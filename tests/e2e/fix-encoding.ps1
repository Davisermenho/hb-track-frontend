$content = Get-Content 'run-e2e-teams-fixed.ps1' -Raw
[System.IO.File]::WriteAllText('run-e2e-teams.ps1', $content, [System.Text.Encoding]::UTF8)
Write-Host "File encoding fixed!" -ForegroundColor Green
