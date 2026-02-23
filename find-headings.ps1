$base = "c:\Users\pprsn\OneDrive\Desktop\Uremo World\uremo-frontend\app"
$done = @(
    "dashboard\page.tsx", "wallet\page.tsx", "profile\page.tsx", "blogs\page.tsx",
    "login\page.tsx", "signup\page.tsx", "workspace\page.tsx", "explore-services\page.tsx",
    "admin\page.tsx", "notifications\page.tsx", "orders\page.tsx", "support\page.tsx",
    "rentals\page.tsx", "deals\page.tsx", "affiliate\page.tsx", "workspace\my-proofs\page.tsx",
    "support\tickets\page.tsx", "admin\workspace\page.tsx", "admin\tickets\page.tsx",
    "admin\services\page.tsx", "admin\rentals\page.tsx", "admin\proofs\page.tsx",
    "admin\orders\page.tsx", "admin\campaigns\page.tsx", "admin\blogs\page.tsx",
    "admin\analytics\page.tsx"
)
$out = @()
$allPages = Get-ChildItem -Path $base -Recurse -Filter "page.tsx" | ForEach-Object { $_.FullName }
foreach ($p in $allPages) {
    $rel = $p.Replace("$base\", "")
    if ($done -contains $rel) { continue }
    $lines = Select-String -Path $p -Pattern '<h[12345]\b|<h[12345]>' -AllMatches
    if ($lines) {
        $out += "=== $rel ==="
        foreach ($l in $lines) { $out += "  L$($l.LineNumber): $($l.Line.Trim())" }
    }
}
$out | Out-File "c:\Users\pprsn\OneDrive\Desktop\Uremo World\uremo-frontend\heading-search.txt" -Encoding utf8
Write-Output "Done. Found $($out.Count) result lines."
