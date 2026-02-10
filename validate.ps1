$tsContent = Get-Content 'apps\web\src\constants\infiltrationPowers.ts' -Raw
$powerCount = ([regex]::Matches($tsContent, 'index: \d+,') | Measure-Object).Count
Write-Host "TypeScript powers: $powerCount"

$csv = @(Import-Csv -Path 'data\infiltration_powers.csv' -Delimiter ',')
$csvCount = if ($csv -is [array]) { $csv.Length } else { 1 }
Write-Host "CSV powers: $csvCount"

$vault = ([regex]::Matches($tsContent, 'vaultModifier: true') | Measure-Object).Count
$center = ([regex]::Matches($tsContent, 'centerModifier: true') | Measure-Object).Count
Write-Host "Vault modifiers (should be 2): $vault"
Write-Host "Center modifiers (should be 0): $center"
