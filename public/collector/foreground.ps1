param([int]$DurationSeconds = 60, [int]$IntervalMs = 1000)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
if ($DurationSeconds -lt 1 -or $DurationSeconds -gt 300 -or $IntervalMs -lt 250) { throw 'Invalid bounds' }
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class ForegroundProbe {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint processId);
}
'@
$watch = [Diagnostics.Stopwatch]::StartNew()
while ($watch.Elapsed.TotalSeconds -lt $DurationSeconds) {
  $handle = [ForegroundProbe]::GetForegroundWindow()
  $processNumber = [uint32]0
  $title = New-Object Text.StringBuilder 4096
  $status = 'ok'
  $appName = 'Unknown application'
  if ($handle -eq [IntPtr]::Zero) { $status = 'no_foreground' }
  else {
    [void][ForegroundProbe]::GetWindowThreadProcessId($handle, [ref]$processNumber)
    [void][ForegroundProbe]::GetWindowText($handle, $title, $title.Capacity)
    try { $appName = (Get-Process -Id $processNumber -ErrorAction Stop).ProcessName }
    catch { $status = 'process_unavailable' }
    if ($status -eq 'ok' -and $title.Length -eq 0) { $status = 'empty_title' }
  }
  [ordered]@{timestamp=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); appName=$appName; processId=$processNumber; windowTitle=$title.ToString(); status=$status} | ConvertTo-Json -Compress
  Start-Sleep -Milliseconds $IntervalMs
}
$self = Get-Process -Id $PID
[Console]::Error.WriteLine((@{cpuSeconds=$self.CPU; peakWorkingSetBytes=$self.PeakWorkingSet64; workingSetBytes=$self.WorkingSet64} | ConvertTo-Json -Compress))
