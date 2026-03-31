<?php
/**
 * Artist Card Generator API
 * Простая версия: ресайз + кроп под размеры VK Music
 */

header('Content-Type: application/json');

// Размеры VK Music
$FORMATS = [
    'web' => ['width' => 1820, 'height' => 458],
    'mobile' => ['width' => 1500, 'height' => 1120]
];

// Валидация
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Файл не загружен']);
    exit;
}

$file = $_FILES['image'];
$bgColor = $_POST['bg_color'] ?? '#808080';

// Проверка типа файла
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Неподдерживаемый формат. Используйте JPG, PNG или WebP']);
    exit;
}

// Загружаем исходное изображение
switch ($mimeType) {
    case 'image/jpeg':
        $srcImage = imagecreatefromjpeg($file['tmp_name']);
        break;
    case 'image/png':
        $srcImage = imagecreatefrompng($file['tmp_name']);
        break;
    case 'image/webp':
        $srcImage = imagecreatefromwebp($file['tmp_name']);
        break;
    default:
        echo json_encode(['success' => false, 'error' => 'Ошибка загрузки изображения']);
        exit;
}

if (!$srcImage) {
    echo json_encode(['success' => false, 'error' => 'Ошибка обработки изображения']);
    exit;
}

$srcWidth = imagesx($srcImage);
$srcHeight = imagesy($srcImage);

// Генерируем уникальный ID
$uid = uniqid();
$outputDir = __DIR__ . '/../output/';
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

$results = [];

foreach ($FORMATS as $type => $size) {
    $dstWidth = $size['width'];
    $dstHeight = $size['height'];
    
    // Создаём холст
    $dstImage = imagecreatetruecolor($dstWidth, $dstHeight);
    
    // Заливаем фоновым цветом
    $rgb = hexToRgb($bgColor);
    $bgColorRes = imagecolorallocate($dstImage, $rgb['r'], $rgb['g'], $rgb['b']);
    imagefill($dstImage, 0, 0, $bgColorRes);
    
    // Рассчитываем масштаб для cover (заполнить всё пространство)
    $srcRatio = $srcWidth / $srcHeight;
    $dstRatio = $dstWidth / $dstHeight;
    
    if ($srcRatio > $dstRatio) {
        // Исходное шире — обрезаем по бокам
        $cropHeight = $srcHeight;
        $cropWidth = (int)($srcHeight * $dstRatio);
        $cropX = (int)(($srcWidth - $cropWidth) / 2);
        $cropY = 0;
    } else {
        // Исходное выше — обрезаем сверху/снизу
        $cropWidth = $srcWidth;
        $cropHeight = (int)($srcWidth / $dstRatio);
        $cropX = 0;
        $cropY = (int)(($srcHeight - $cropHeight) / 2);
    }
    
    // Копируем с кропом и масштабированием
    imagecopyresampled(
        $dstImage, $srcImage,
        0, 0,                           // dst x, y
        $cropX, $cropY,                 // src x, y
        $dstWidth, $dstHeight,          // dst size
        $cropWidth, $cropHeight         // src crop size
    );
    
    // Сохраняем
    $filename = "vk-{$type}-{$uid}.png";
    $filepath = $outputDir . $filename;
    imagepng($dstImage, $filepath, 9);
    imagedestroy($dstImage);
    
    $results[$type . '_url'] = 'output/' . $filename;
}

imagedestroy($srcImage);

// Очистка старых файлов (старше 1 часа)
cleanOldFiles($outputDir, 3600);

echo json_encode([
    'success' => true,
    'web_url' => $results['web_url'],
    'mobile_url' => $results['mobile_url']
]);

// === Helper functions ===

function hexToRgb($hex) {
    $hex = ltrim($hex, '#');
    if (strlen($hex) === 3) {
        $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
    }
    return [
        'r' => hexdec(substr($hex, 0, 2)),
        'g' => hexdec(substr($hex, 2, 2)),
        'b' => hexdec(substr($hex, 4, 2))
    ];
}

function cleanOldFiles($dir, $maxAge) {
    $now = time();
    foreach (glob($dir . '*.png') as $file) {
        if ($now - filemtime($file) > $maxAge) {
            @unlink($file);
        }
    }
}
