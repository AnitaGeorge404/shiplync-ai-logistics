Add-Type -AssemblyName System.Drawing
$inputPath = "d:\IIIT Kottayam\Sem 5\Computer Architecture\Lab\shiplync-ai-logistics\public\istockphoto-1158181975-612x612.jpg"
$outputPath = "d:\IIIT Kottayam\Sem 5\Computer Architecture\Lab\shiplync-ai-logistics\public\scooter-driver.png"

$bmp = [System.Drawing.Bitmap]::FromFile($inputPath)

# Let's sample the corner pixels
$p0 = $bmp.GetPixel(0, 0)
Write-Host "Top-left background sample: R=$($p0.R), G=$($p0.G), B=$($p0.B)"

$newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Flood-fill or distance-based background removal from outside
# Any pixel close to the background color or with high brightness and low saturation is made transparent
for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        # Background is near white or light grey/off-white (R>220, G>220, B>220 and difference between R,G,B is small)
        $diff = [Math]::Max([Math]::Abs($pixel.R - $pixel.G), [Math]::Max([Math]::Abs($pixel.G - $pixel.B), [Math]::Abs($pixel.R - $pixel.B)))
        if (($pixel.R -gt 225 -and $pixel.G -gt 225 -and $pixel.B -gt 225) -or ($pixel.R -gt 215 -and $diff -lt 12)) {
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $newBmp.SetPixel($x, $y, $pixel)
        }
    }
}

$newBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$newBmp.Dispose()
Write-Host "Saved transparent PNG to $outputPath"
