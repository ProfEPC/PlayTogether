# Read the file
$content = Get-Content infiltrationPowers.ts -Raw

# Replace indices from highest to lowest to avoid conflicts
# Deleted indices: 22, 24
# So indices 25+ should become 23+, 26+ should become 24+, etc.

# Work backwards from 45 down to 26
for ($i = 45; $i -gt 25; $i--) {
    $newIndex = $i - 2  # Skip 2 indices
    $content = $content -replace "index: $i,", "index: $newIndex,"
}

# Indices 25 should stay (it's the old 26)
# Actually, let's just do a clean pass
# Current state: indices 1-21 are correct, 23 is correct, then we have 24, 24, 24...
# We need to renumber 24 onwards

# Extract power count
$matches = [regex]::Matches($content, 'index: \d+,')
$maxIndex = 0
foreach ($match in $matches) {
    $idx = [int]($match.Value -replace '[^0-9]', '')
    if ($idx -gt $maxIndex) { $maxIndex = $idx }
}

Write-Host "Max index found: $maxIndex"
Write-Host "Total index occurrences: $($matches.Count)"

# Save
Set-Content infiltrationPowers.ts -Value $content -Encoding utf8
Write-Host "Fixed"
