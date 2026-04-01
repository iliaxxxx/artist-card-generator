const { createApp, ref, watch, computed, onMounted, nextTick } = Vue;

// Translations
const translations = {
    ru: {
        title: 'БЫСТРОЕ СОЗДАНИЕ ФОТО В НУЖНЫХ РАЗМЕРАХ ДЛЯ ОФОРМЛЕНИЯ КАРТОЧЕК АРТИСТА НА ВСЕХ ПЛОЩАДКАХ',
        subtitle: 'загрузи своё фото – настрой – скачай готовые размеры для оформления',
        warning: 'ВНИМАНИЕ: Арты и коллажи не допускаются – только настоящие фотографии группы или артиста. На фото не должно быть курения, алкоголя, каких-либо надписей и изображений брендов (в том числе на одежде).',
        info: 'Для оформления карточки в Apple Music, Spotify и Звук необходимо зарегистрироваться в их приложениях: <a href="https://artists.apple.com" target="_blank">artists.apple.com</a>, <a href="https://artists.spotify.com" target="_blank">artists.spotify.com</a> и <a href="https://studio.zvuk.com" target="_blank">studio.zvuk.com</a> соответственно.',
        modeCards: '🎴 Карточки',
        modeCover: '💿 Обложка',
        uploadLabel: 'Загрузи своё фото',
        uploadText: 'Нажми или перетащи фото',
        uploadHint: 'JPG, PNG до 10MB',
        editorHint: 'Перетаскивай фото и используй слайдер для масштаба',
        reset: 'Сбросить',
        changePhoto: 'Другое фото',
        generating: 'Создаём...',
        downloadCover: 'Скачать обложку 1500×1500',
        lightTheme: 'Светлая тема',
        darkTheme: 'Тёмная тема',
        fileTooLarge: 'Файл слишком большой (макс. 10MB)',
        loadError: 'Не удалось загрузить изображение'
    },
    en: {
        title: 'QUICK PHOTO CREATION IN THE RIGHT SIZES FOR ARTIST CARDS ON ALL PLATFORMS',
        subtitle: 'upload your photo – adjust – download ready sizes for design',
        warning: 'WARNING: Art and collages are not allowed – only real photos of the band or artist. Photos must not contain smoking, alcohol, any text or brand images (including on clothing).',
        info: 'To set up your artist card on Apple Music, Spotify and Zvuk, you need to register in their apps: <a href="https://artists.apple.com" target="_blank">artists.apple.com</a>, <a href="https://artists.spotify.com" target="_blank">artists.spotify.com</a> and <a href="https://studio.zvuk.com" target="_blank">studio.zvuk.com</a> respectively.',
        modeCards: '🎴 Cards',
        modeCover: '💿 Cover',
        uploadLabel: 'Upload your photo',
        uploadText: 'Click or drag photo here',
        uploadHint: 'JPG, PNG up to 10MB',
        editorHint: 'Drag photo and use slider to scale',
        reset: 'Reset',
        changePhoto: 'Change photo',
        generating: 'Creating...',
        downloadCover: 'Download cover 1500×1500',
        lightTheme: 'Light theme',
        darkTheme: 'Dark theme',
        fileTooLarge: 'File too large (max 10MB)',
        loadError: 'Failed to load image'
    }
};

createApp({
    setup() {
        // State
        const showContent = ref(false);
        const isDark = ref(false);
        const isDragover = ref(false);
        const error = ref(null);
        const isGenerating = ref(false);
        const lang = ref('ru');
        const mode = ref('cards');
        
        // Translations
        const t = computed(() => translations[lang.value]);
        
        // Image state
        const imageLoaded = ref(false);
        const image = ref(null);
        
        // Editor state
        const canvas = ref(null);
        const activeFormat = ref('vkWeb');
        const zoom = ref(1);
        
        // Card format sizes
        const cardFormats = {
            vkWeb: { width: 1820, height: 458, label: 'VK Web' },
            vkMobile: { width: 1500, height: 1120, label: 'VK Mobile' },
            yandex: { width: 2000, height: 2000, label: 'Yandex' }
        };
        
        // Cover format
        const coverFormat = { width: 1500, height: 1500, label: 'Cover 1500×1500' };
        
        // Current format based on mode
        const currentFormat = computed(() => {
            if (mode.value === 'cover') {
                return coverFormat;
            }
            return cardFormats[activeFormat.value];
        });
        
        // Position for each format
        const positions = ref({
            vkWeb: { x: 0, y: 0, zoom: 1 },
            vkMobile: { x: 0, y: 0, zoom: 1 },
            yandex: { x: 0, y: 0, zoom: 1 },
            cover: { x: 0, y: 0, zoom: 1 }
        });
        
        // Current position key
        const currentPosKey = computed(() => mode.value === 'cover' ? 'cover' : activeFormat.value);
        
        // Drag state
        const isDragging = ref(false);
        const dragStart = ref({ x: 0, y: 0 });
        
        // Minimum zoom to cover the area
        const minZoom = computed(() => {
            if (!image.value) return 1;
            const format = currentFormat.value;
            const scaleX = format.width / image.value.width;
            const scaleY = format.height / image.value.height;
            return Math.max(scaleX, scaleY);
        });
        
        // Methods
        const toggleTheme = () => {
            isDark.value = !isDark.value;
            document.body.classList.toggle('dark', isDark.value);
            localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
        };
        
        const toggleLang = () => {
            lang.value = lang.value === 'ru' ? 'en' : 'ru';
            localStorage.setItem('lang', lang.value);
        };
        
        const setMode = (newMode) => {
            mode.value = newMode;
            if (image.value) {
                nextTick(() => {
                    zoom.value = positions.value[currentPosKey.value].zoom;
                    render();
                });
            }
        };
        
        const setActiveFormat = (format) => {
            activeFormat.value = format;
            if (image.value) {
                nextTick(() => {
                    zoom.value = positions.value[currentPosKey.value].zoom;
                    render();
                });
            }
        };
        
        const handleFileSelect = (e) => {
            const file = e.target.files[0];
            if (file) loadImage(file);
        };
        
        const handleDrop = (e) => {
            isDragover.value = false;
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                loadImage(file);
            }
        };
        
        const loadImage = (file) => {
            if (file.size > 10 * 1024 * 1024) {
                error.value = t.value.fileTooLarge;
                return;
            }
            
            const img = new Image();
            img.onload = () => {
                image.value = img;
                imageLoaded.value = true;
                error.value = null;
                
                nextTick(() => {
                    initPositions();
                    render();
                });
            };
            img.onerror = () => {
                error.value = t.value.loadError;
            };
            img.src = URL.createObjectURL(file);
        };
        
        const initPositions = () => {
            if (!image.value) return;
            
            // Init card formats
            for (const [key, format] of Object.entries(cardFormats)) {
                const scaleX = format.width / image.value.width;
                const scaleY = format.height / image.value.height;
                const coverZoom = Math.max(scaleX, scaleY);
                positions.value[key] = { x: 0, y: 0, zoom: coverZoom };
            }
            
            // Init cover format
            const scaleX = coverFormat.width / image.value.width;
            const scaleY = coverFormat.height / image.value.height;
            positions.value.cover = { x: 0, y: 0, zoom: Math.max(scaleX, scaleY) };
            
            zoom.value = positions.value[currentPosKey.value].zoom;
        };
        
        const render = () => {
            if (!canvas.value || !image.value) return;
            
            const ctx = canvas.value.getContext('2d');
            const format = currentFormat.value;
            const pos = positions.value[currentPosKey.value];
            
            canvas.value.width = format.width;
            canvas.value.height = format.height;
            
            const imgWidth = image.value.width * pos.zoom;
            const imgHeight = image.value.height * pos.zoom;
            
            const x = (format.width - imgWidth) / 2 + pos.x;
            const y = (format.height - imgHeight) / 2 + pos.y;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, format.width, format.height);
            ctx.drawImage(image.value, x, y, imgWidth, imgHeight);
        };
        
        const startDrag = (e) => {
            isDragging.value = true;
            const point = e.touches ? e.touches[0] : e;
            dragStart.value = {
                x: point.clientX - positions.value[currentPosKey.value].x,
                y: point.clientY - positions.value[currentPosKey.value].y
            };
        };
        
        const onDrag = (e) => {
            if (!isDragging.value) return;
            
            const point = e.touches ? e.touches[0] : e;
            const pos = positions.value[currentPosKey.value];
            const format = currentFormat.value;
            
            let newX = point.clientX - dragStart.value.x;
            let newY = point.clientY - dragStart.value.y;
            
            const imgWidth = image.value.width * pos.zoom;
            const imgHeight = image.value.height * pos.zoom;
            const maxX = Math.max(0, (imgWidth - format.width) / 2);
            const maxY = Math.max(0, (imgHeight - format.height) / 2);
            
            newX = Math.max(-maxX, Math.min(maxX, newX));
            newY = Math.max(-maxY, Math.min(maxY, newY));
            
            pos.x = newX;
            pos.y = newY;
            render();
        };
        
        const endDrag = () => {
            isDragging.value = false;
        };
        
        const onWheel = (e) => {
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            const pos = positions.value[currentPosKey.value];
            const newZoom = Math.max(minZoom.value, Math.min(3, pos.zoom + delta));
            pos.zoom = newZoom;
            zoom.value = newZoom;
            constrainPosition();
            render();
        };
        
        const onZoomChange = () => {
            const pos = positions.value[currentPosKey.value];
            pos.zoom = Math.max(minZoom.value, parseFloat(zoom.value));
            constrainPosition();
            render();
        };
        
        const constrainPosition = () => {
            const pos = positions.value[currentPosKey.value];
            const format = currentFormat.value;
            
            const imgWidth = image.value.width * pos.zoom;
            const imgHeight = image.value.height * pos.zoom;
            const maxX = Math.max(0, (imgWidth - format.width) / 2);
            const maxY = Math.max(0, (imgHeight - format.height) / 2);
            
            pos.x = Math.max(-maxX, Math.min(maxX, pos.x));
            pos.y = Math.max(-maxY, Math.min(maxY, pos.y));
        };
        
        const resetPosition = () => {
            const format = currentFormat.value;
            const scaleX = format.width / image.value.width;
            const scaleY = format.height / image.value.height;
            
            positions.value[currentPosKey.value] = {
                x: 0,
                y: 0,
                zoom: Math.max(scaleX, scaleY)
            };
            zoom.value = positions.value[currentPosKey.value].zoom;
            render();
        };
        
        const clearImage = () => {
            imageLoaded.value = false;
            image.value = null;
            error.value = null;
        };
        
        const generateCanvas = (formatKey) => {
            let format;
            if (formatKey === 'cover') {
                format = coverFormat;
            } else {
                format = cardFormats[formatKey];
            }
            const pos = positions.value[formatKey];
            
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = format.width;
            exportCanvas.height = format.height;
            const ctx = exportCanvas.getContext('2d');
            
            const imgWidth = image.value.width * pos.zoom;
            const imgHeight = image.value.height * pos.zoom;
            
            const x = (format.width - imgWidth) / 2 + pos.x;
            const y = (format.height - imgHeight) / 2 + pos.y;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, format.width, format.height);
            ctx.drawImage(image.value, x, y, imgWidth, imgHeight);
            
            return exportCanvas;
        };
        
        const downloadFormat = (formatKey) => {
            if (!image.value) return;
            
            isGenerating.value = true;
            
            try {
                const exportCanvas = generateCanvas(formatKey);
                let format;
                if (formatKey === 'cover') {
                    format = coverFormat;
                } else {
                    format = cardFormats[formatKey];
                }
                
                exportCanvas.toBlob((blob) => {
                    const link = document.createElement('a');
                    link.download = `${format.label.replace(/\s+/g, '-')}-${format.width}x${format.height}.png`;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    URL.revokeObjectURL(link.href);
                    isGenerating.value = false;
                }, 'image/png');
            } catch (err) {
                console.error('Download error:', err);
                error.value = lang.value === 'ru' ? 'Ошибка скачивания' : 'Download error';
                isGenerating.value = false;
            }
        };
        
        // Init
        onMounted(() => {
            setTimeout(() => showContent.value = true, 200);
            
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                isDark.value = true;
                document.body.classList.add('dark');
            }
            
            const savedLang = localStorage.getItem('lang');
            if (savedLang) {
                lang.value = savedLang;
            }
        });
        
        return {
            showContent,
            isDark,
            isDragover,
            error,
            isGenerating,
            imageLoaded,
            canvas,
            activeFormat,
            zoom,
            minZoom,
            cardFormats,
            currentFormat,
            mode,
            lang,
            t,
            toggleTheme,
            toggleLang,
            setMode,
            setActiveFormat,
            handleFileSelect,
            handleDrop,
            startDrag,
            onDrag,
            endDrag,
            onWheel,
            onZoomChange,
            resetPosition,
            clearImage,
            downloadFormat
        };
    }
}).mount('#app');
