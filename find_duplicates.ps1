$csv = Import-Csv -Path 'data\infiltration_powers.csv' -Delimiter ','

# Group by Type, Item, Where and find duplicates
$groups = $csv | Group-Object -Property Type, Item, Where

$duplicates = $groups | Where-Object { $_.Count -gt 1 }

Write-Host "Type+Item+Where combinations with multiple powers:`n"

foreach ($group in $duplicates) {
    $key = $group.Name
    Write-Host "=== $key ==="
    foreach ($power in $group.Group) {
        Write-Host "  Index $($power.Index): $($power.'Power Name')"
        Write-Host "    Initiative: $($power.Initiative)"
        Write-Host "    Description: $($power.Description)"
        Write-Host "    Vault: $($power.VaultModifier), Center: $($power.Center), Complexity: $($power.Complexity)"
    }
    Write-Host ""
}
