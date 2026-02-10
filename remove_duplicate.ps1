$content = Get-Content 'data\infiltration_powers.csv' -Raw
$lines = $content -split "`n"
$header = $lines[0]
$header = $header -replace 'VaultModifier,', ''
$lines[0] = $header

# Remove VaultModifier value from each data row
for ($i = 1; $i -lt $lines.Count; $i++) {
  if ($lines[$i].Trim()) {
    $parts = $lines[$i] -split ','
    if ($parts.Count -gt 22) {
      # Remove index 21 (0-based, which is column 22, the VaultModifier)
      $lines[$i] = ($parts[0..20] + $parts[22..($parts.Count-1)]) -join ','
    }
  }
}

Set-Content 'data\infiltration_powers.csv' -Value ($lines -join "`n") -Encoding utf8
Write-Host 'Removed VaultModifier column from CSV'
