$csv = Import-Csv -Path 'data\infiltration_powers.csv' -Delimiter ','
$lines = @()

# Add header with 'Center' instead of 'CenterModifier'
$header = 'Index,Initiative,Power Name,Description,Type,Item,Where,Min,Max,FixedAction,FixedInitiative,Infected,Suicidal,Murderer,Predicter,Silencer,2xVote,LookPostAction,DoPower,Self-Destruct,AllowRandom,VaultModifier,Center,Complexity'
$lines += $header

foreach ($row in $csv) {
    $index = [int]$row.Index

    # Determine Center value: TRUE for consolidated powers (21, 22, 23, 25, 26, 27)
    $center = if ($index -in 21, 22, 23, 25, 26, 27) { 'TRUE' } else { 'FALSE' }

    # Build row
    $line = $row.Index + ',' + $row.Initiative + ',' + $row.'Power Name' + ',' + $row.Description + ',' + $row.Type + ',' + $row.Item + ',' + $row.Where + ',' + $row.Min + ',' + $row.Max + ',' + $row.FixedAction + ',' + $row.FixedInitiative + ',' + $row.Infected + ',' + $row.Suicidal + ',' + $row.Murderer + ',' + $row.Predicter + ',' + $row.Silencer + ',' + $row.'2xVote' + ',' + $row.LookPostAction + ',' + $row.DoPower + ',' + $row.'Self-Destruct' + ',' + $row.AllowRandom + ',' + $row.VaultModifier + ',' + $center + ',' + $row.Complexity
    $lines += $line
}

Set-Content -Path 'data\infiltration_powers.csv' -Value ($lines -join "`n") -Encoding utf8
Write-Host 'Updated CSV with Center column'
