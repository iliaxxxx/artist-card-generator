<?php
/**
 * Artist Card Generator API
 * Обрабатывает фото через Gemini 3.1 Flash Image (EvoLink)
 */

header('Content-Type: application/json');

// Конфиг
$GEMINI_IMAGE_API_KEY = 'sk-w062ma7msO25lBxaFPd0eq2R7kcbw3P309mbqEVMYiHVzlJx';
$EVOLINK_API_URL = 'https://api.evolink.ai/v1/images/generations';
$EVOLINK_TASKS_URL = 'https://api.evolink.ai/v1/tasks';
$MODEL = 'gemini-3.1-flash-image-preview';

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
    echo json_encode(['success' => false, 'error' => 'Неподдерживаемый формат']);
    exit;
}

// Читаем и конвертируем в base64
$imageData = file_get_contents($file['tmp_name']);
$base64Image = base64_encode($imageData);

// Формируем промпт для Gemini
$colorName = getColorName($bgColor);
$prompt = "Edit this photo: Remove the background completely and replace it with a solid $colorName color ($bgColor). Keep the person perfectly cut out with clean smooth edges. Make it look like a professional artist profile photo. Return only the edited image.";

// Запрос к EvoLink API (async)
$payload = [
    'model' => $MODEL,
    'prompt' => $prompt,
    'image' => "data:$mimeType;base64,$base64Image",
    'n' => 1
];

$ch = curl_init($EVOLINK_API_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $GEMINI_IMAGE_API_KEY
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    echo json_encode(['success' => false, 'error' => "Ошибка сети: $curlError"]);
    exit;
}

if ($httpCode !== 200) {
    $errorData = json_decode($response, true);
    $errorMsg = $errorData['error']['message'] ?? "API error: $httpCode";
    echo json_encode(['success' => false, 'error' => $errorMsg]);
    exit;
}

$data = json_decode($response, true);
$taskId = $data['id'] ?? null;

if (!$taskId) {
    echo json_encode(['success' => false, 'error' => 'Не получен task_id']);
    exit;
}

// Поллинг статуса задачи
$maxAttempts = 60; // 60 * 2 сек = 2 минуты макс
$attempt = 0;
$resultUrl = null;

while ($attempt < $maxAttempts) {
    sleep(2);
    $attempt++;
    
    $ch = curl_init("$EVOLINK_TASKS_URL/$taskId");
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $GEMINI_IMAGE_API_KEY
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10
    ]);
    
    $statusResponse = curl_exec($ch);
    curl_close($ch);
    
    $statusData = json_decode($statusResponse, true);
    $status = $statusData['status'] ?? 'unknown';
    
    if ($status === 'completed') {
        $resultUrl = $statusData['results'][0] ?? null;
        break;
    } elseif ($status === 'failed') {
        echo json_encode(['success' => false, 'error' => 'Генерация не удалась']);
        exit;
    }
    // продолжаем поллинг если pending/processing
}

if (!$resultUrl) {
    echo json_encode(['success' => false, 'error' => 'Таймаут генерации']);
    exit;
}

// Скачиваем результат
$resultImage = file_get_contents($resultUrl);
if (!$resultImage) {
    echo json_encode(['success' => false, 'error' => 'Не удалось скачать результат']);
    exit;
}

// Создаём ресайзы для VK Music
$srcImage = imagecreatefromstring($resultImage);
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
    $dstImage = imagecreatetruecolor($size['width'], $size['height']);
    
    // Включаем альфа-канал
    imagealphablending($dstImage, false);
    imagesavealpha($dstImage, true);
    
    // Заливаем фоновым цветом
    $rgb = hexToRgb($bgColor);
    $bgColorRes = imagecolorallocate($dstImage, $rgb['r'], $rgb['g'], $rgb['b']);
    imagefill($dstImage, 0, 0, $bgColorRes);
    
    // Рассчитываем позицию для центрирования
    $scale = min($size['width'] / $srcWidth, $size['height'] / $srcHeight);
    $newWidth = (int)($srcWidth * $scale);
    $newHeight = (int)($srcHeight * $scale);
    $dstX = (int)(($size['width'] - $newWidth) / 2);
    $dstY = (int)(($size['height'] - $newHeight) / 2);
    
    // Копируем с масштабированием
    imagecopyresampled(
        $dstImage, $srcImage,
        $dstX, $dstY, 0, 0,
        $newWidth, $newHeight, $srcWidth, $srcHeight
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
    return [
        'r' => hexdec(substr($hex, 0, 2)),
        'g' => hexdec(substr($hex, 2, 2)),
        'b' => hexdec(substr($hex, 4, 2))
    ];
}

function getColorName($hex) {
    $colors = [
        '#ffffff' => 'white',
        '#000000' => 'black',
        '#808080' => 'gray',
        '#e4dfd8' => 'beige',
        '#1a1a2e' => 'dark blue',
        '#ab1115' => 'burgundy red'
    ];
    return $colors[strtolower($hex)] ?? $hex;
}

function cleanOldFiles($dir, $maxAge) {
    $now = time();
    foreach (glob($dir . '*.png') as $file) {
        if ($now - filemtime($file) > $maxAge) {
            @unlink($file);
        }
    }
}
