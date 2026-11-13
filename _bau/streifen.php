<?php
// Erzeugt einmalig den Copyright-Streifen (1200 px breit) für Plakate – gleiche Optik wie stempeln() im Docker-Pflegebereich.
$hinweis = '© TG Gold-Weiß Gelsenkirchen 1932 e.V. – Alle Rechte vorbehalten.';
$schrift = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
$w = 1200;
$gr = max(9.0, round($w * 0.018 * 0.75, 1));
while (true) { $box = imagettfbbox($gr, 0, $schrift, $hinweis); $tw = $box[2] - $box[0]; if ($tw <= $w * 0.92 || $gr <= 8) break; $gr -= 0.5; }
$sh = (int)round($gr * 2.8);
$b = imagecreatetruecolor($w, $sh);
imagesavealpha($b, true); imagealphablending($b, false);
imagefilledrectangle($b, 0, 0, $w, $sh, imagecolorallocatealpha($b, 10, 22, 34, 32));
imagealphablending($b, true);
imagettftext($b, $gr, 0, (int)(($w - $tw) / 2), (int)($sh / 2 + $gr / 2), imagecolorallocate($b, 255, 255, 255), $schrift, $hinweis);
imagepng($b, __DIR__ . '/copyright-streifen.png');
echo "ok {$w}x{$sh}\n";
