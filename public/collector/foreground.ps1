param([int]$DurationSeconds = 60, [int]$IntervalMs = 1000, [int]$ParentProcessId = 0)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
if ($DurationSeconds -lt 0 -or $DurationSeconds -gt 300 -or $IntervalMs -lt 250) { throw 'Invalid bounds' }
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class ForegroundProbe {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint processId);
  [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
  [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LASTINPUTINFO info);
  public static uint IdleMilliseconds() { var info = new LASTINPUTINFO(); info.cbSize = (uint)Marshal.SizeOf(info); return GetLastInputInfo(ref info) ? unchecked((uint)Environment.TickCount - info.dwTime) : uint.MaxValue; }
  [DllImport("user32.dll")] public static extern IntPtr OpenInputDesktop(uint flags, bool inherit, uint access);
  [DllImport("user32.dll")] public static extern bool CloseDesktop(IntPtr desktop);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern bool GetUserObjectInformation(IntPtr obj, int index, StringBuilder text, uint size, out uint needed);
  public static bool IsInteractive() { var desktop = OpenInputDesktop(0, false, 1); if (desktop == IntPtr.Zero) return false; try { uint needed; var name = new StringBuilder(256); return GetUserObjectInformation(desktop, 2, name, 512, out needed) && name.ToString() == "Default"; } finally { CloseDesktop(desktop); } }
}
'@
$watch = [Diagnostics.Stopwatch]::StartNew()
while ($DurationSeconds -eq 0 -or $watch.Elapsed.TotalSeconds -lt $DurationSeconds) {
  if ($ParentProcessId -gt 0 -and -not (Get-Process -Id $ParentProcessId -ErrorAction SilentlyContinue)) { break }
  $handle = [ForegroundProbe]::GetForegroundWindow()
  $processNumber = [uint32]0
  $title = New-Object Text.StringBuilder 4096
  $status = 'ok'
  $appName = 'Unknown application'
  $appPath = ''
  if (-not [ForegroundProbe]::IsInteractive()) { $status = 'locked_or_secure_desktop' }
  elseif ($handle -eq [IntPtr]::Zero) { $status = 'no_foreground' }
  else {
    [void][ForegroundProbe]::GetWindowThreadProcessId($handle, [ref]$processNumber)
    [void][ForegroundProbe]::GetWindowText($handle, $title, $title.Capacity)
    try { $processInfo = Get-Process -Id $processNumber -ErrorAction Stop; $appName = $processInfo.ProcessName; try { $appPath = $processInfo.Path } catch {} }
    catch { $status = 'process_unavailable' }
    if ($status -eq 'ok' -and $title.Length -eq 0) { $status = 'empty_title' }
  }
  [ordered]@{timestamp=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); appName=$appName; appPath=$appPath; processId=$processNumber; windowTitle=$title.ToString(); status=$status; idleMs=[ForegroundProbe]::IdleMilliseconds()} | ConvertTo-Json -Compress
  Start-Sleep -Milliseconds $IntervalMs
}
$self = Get-Process -Id $PID
[Console]::Error.WriteLine((@{cpuSeconds=$self.CPU; peakWorkingSetBytes=$self.PeakWorkingSet64; workingSetBytes=$self.WorkingSet64} | ConvertTo-Json -Compress))
