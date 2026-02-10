$ts = Get-Content 'apps\web\src\constants\infiltrationPowers.ts' -Raw
$centerTrue = ([regex]::Matches($ts, 'center: true') | Measure-Object).Count
$centerFalse = ([regex]::Matches($ts, 'center: false') | Measure-Object).Count
Write-Host "Center TRUE: $centerTrue (should be 6)"
Write-Host "Center FALSE: $centerFalse (should be 40)"

# Check CSV
$csv = Import-Csv -Path 'data\infiltration_powers.csv' -Delimiter ','
$csvCenterTrue = ($csv | Where-Object { $_.Center -eq 'TRUE' } | Measure-Object).Count
$csvCenterFalse = ($csv | Where-Object { $_.Center -eq 'FALSE' } | Measure-Object).Count
Write-Host "CSV Center TRUE: $csvCenterTrue"
Write-Host "CSV Center FALSE: $csvCenterFalse"
