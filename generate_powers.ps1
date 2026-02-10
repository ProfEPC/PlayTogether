# Read CSV
$csv = Import-Csv -Path 'data\infiltration_powers.csv' -Delimiter ','
$lines = @()
$lines += '/**'
$lines += ' * Infiltration Powers Data'
$lines += ' * Parsed from /data/infiltration_powers.csv'
$lines += ' */'
$lines += ''
$lines += 'export type InfiltrationPower = {'
$lines += '  index: number;'
$lines += '  initiative: string;'
$lines += '  powerName: string;'
$lines += '  description: string;'
$lines += '  type: string;'
$lines += '  item: string;'
$lines += '  where: string;'
$lines += '  min: number;'
$lines += '  max: number;'
$lines += '  fixedAction: boolean;'
$lines += '  fixedInitiative: boolean;'
$lines += '  infected: boolean;'
$lines += '  suicidal: boolean;'
$lines += '  murderer: boolean;'
$lines += '  predicter: boolean;'
$lines += '  silencer: boolean;'
$lines += '  twoXVote: boolean;'
$lines += '  lookPostAction: boolean;'
$lines += '  doPower: boolean;'
$lines += '  selfDestruct: boolean;'
$lines += '  allowRandom: boolean;'
$lines += '  vault: boolean;'
$lines += '  complexity: number;'
$lines += '};'
$lines += ''
$lines += 'export const INFILTRATION_POWERS: InfiltrationPower[] = ['

foreach ($row in $csv) {
    $index = [int]$row.Index
    $min = [int]$row.Min
    $max = [int]$row.Max
    $complexity = [int]$row.Complexity

    $lines += '  {'
    $lines += "    index: $index,"
    $lines += "    initiative: `"$($row.Initiative)`","
    $lines += "    powerName: `"$($row.'Power Name')`","
    $description = $row.Description -replace '"', '\"'
    $lines += "    description: `"$description`","
    $lines += "    type: `"$($row.Type)`","
    $lines += "    item: `"$($row.Item)`","
    $lines += "    where: `"$($row.Where)`","
    $lines += "    min: $min,"
    $lines += "    max: $max,"

    $fixedAction = if ($row.FixedAction -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    fixedAction: $fixedAction,"
    $fixedInitiative = if ($row.FixedInitiative -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    fixedInitiative: $fixedInitiative,"
    $infected = if ($row.Infected -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    infected: $infected,"
    $suicidal = if ($row.Suicidal -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    suicidal: $suicidal,"
    $murderer = if ($row.Murderer -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    murderer: $murderer,"
    $predicter = if ($row.Predicter -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    predicter: $predicter,"
    $silencer = if ($row.Silencer -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    silencer: $silencer,"
    $twoXVote = if ($row.'2xVote' -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    twoXVote: $twoXVote,"
    $lookPostAction = if ($row.LookPostAction -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    lookPostAction: $lookPostAction,"
    $doPower = if ($row.DoPower -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    doPower: $doPower,"
    $selfDestruct = if ($row.'Self-Destruct' -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    selfDestruct: $selfDestruct,"
    $allowRandom = if ($row.AllowRandom -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    allowRandom: $allowRandom,"
    $vault = if ($row.Vault -eq 'TRUE') { 'true' } else { 'false' }
    $lines += "    vault: $vault,"
    $lines += "    complexity: $complexity,"
    $lines += '  },'
}

$lines += '];'

Set-Content -Path 'apps\web\src\constants\infiltrationPowers.ts' -Value ($lines -join "`n") -Encoding utf8
Write-Host "Generated infiltrationPowers.ts with $($csv.Count) powers"
