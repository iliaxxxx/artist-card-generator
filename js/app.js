const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        // State
        const showContent = ref(false);
        const isDark = ref(false);
        const isDragover = ref(false);
        const lang = ref('ru');
        const activeTab = ref('cards');

        const fileInput = ref(null);
        const selectedFile = ref(null);
        const previewUrl = ref(null);
        const selectedColor = ref('#808080');
        const customColor = ref('#808080');

        const isProcessing = ref(false);
        const processingText = ref('');
        const results = ref([]);
        const error = ref(null);

        // Translations
        const translations = {
            ru: {
                title: 'БЫСТРОЕ СОЗДАНИЕ ФОТО В НУЖНЫХ РАЗМЕРАХ ДЛЯ ОФОРМЛЕНИЯ КАРТОЧЕК АРТИСТА НА ВСЕХ ПЛОЩАДКАХ',
                subtitle: 'загрузи своё фото – настрой – скачай готовые размеры для оформления',
                warning: 'ВНИМАНИЕ: Арты и коллажи не допускаются – только настоящие фотографии группы или артиста. На фото не должно быть курения, алкоголя, каких-либо надписей и изображений брендов (в том числе на одежде).',
                notice: 'Для оформления карточки в Apple Music, Spotify и Звук необходимо зарегистрироваться в их приложениях artists.apple.com, artists.spotify.com и studio.zvuk.com соответственно.',
                tabCards: 'Карточки',
                tabCovers: 'Обложки',
                uploadLabel: 'Загрузи своё фото',
                uploadText: 'Нажми или перетащи фото',
                uploadHint: 'JPG, PNG до 10MB',
                originalPhoto: 'Исходное фото',
                bgColor: 'Цвет фона',
                generate: 'Сгенерировать',
                downloadPng: 'Скачать PNG',
                processing: 'Обрабатываем...',
                uploading: 'Загружаем фото...',
                done: 'Готово!',
                fileTooLarge: 'Файл слишком большой (макс. 10MB)',
                processingError: 'Ошибка обработки',
                genericError: 'Произошла ошибка',
                lightTheme: 'Светлая тема',
                darkTheme: 'Тёмная тема',
                colorWhite: 'Белый',
                colorBlack: 'Чёрный',
                colorGray: 'Серый',
                colorBeige: 'Бежевый',
                colorBlue: 'Синий',
                colorMaroon: 'Бордовый',
                webName: 'VK Музыка — Веб',
                mobileName: 'VK Музыка — Мобильная',
                coverName: 'Обложка 1500×1500',
                coversDescription: 'Увеличение фото до 1500×1500 для обложек на площадках',
            },
            en: {
                title: 'QUICK PHOTO CREATION IN REQUIRED SIZES FOR ARTIST CARD DESIGN ON ALL PLATFORMS',
                subtitle: 'upload your photo – adjust – download ready sizes for design',
                warning: 'WARNING: Art and collages are not allowed – only real photos of the band or artist. Photos must not contain smoking, alcohol, any text or brand images (including on clothing).',
                notice: 'To set up artist cards on Apple Music, Spotify and Zvuk, you need to register at artists.apple.com, artists.spotify.com and studio.zvuk.com respectively.',
                tabCards: 'Cards',
                tabCovers: 'Covers',
                uploadLabel: 'Upload your photo',
                uploadText: 'Click or drag a photo',
                uploadHint: 'JPG, PNG up to 10MB',
                originalPhoto: 'Original photo',
                bgColor: 'Background color',
                generate: 'Generate',
                downloadPng: 'Download PNG',
                processing: 'Processing...',
                uploading: 'Uploading photo...',
                done: 'Done!',
                fileTooLarge: 'File is too large (max 10MB)',
                processingError: 'Processing error',
                genericError: 'An error occurred',
                lightTheme: 'Light theme',
                darkTheme: 'Dark theme',
                colorWhite: 'White',
                colorBlack: 'Black',
                colorGray: 'Gray',
                colorBeige: 'Beige',
                colorBlue: 'Blue',
                colorMaroon: 'Maroon',
                webName: 'VK Music — Web',
                mobileName: 'VK Music — Mobile',
                coverName: 'Cover 1500×1500',
                coversDescription: 'Upscale photo to 1500×1500 for platform covers',
            }
        };

        const t = computed(() => translations[lang.value]);

        // Preset colors (reactive for language)
        const colors = computed(() => [
            { name: t.value.colorWhite, value: '#ffffff', bg: '#ffffff' },
            { name: t.value.colorBlack, value: '#000000', bg: '#000000' },
            { name: t.value.colorGray, value: '#808080', bg: '#808080' },
            { name: t.value.colorBeige, value: '#e4dfd8', bg: '#e4dfd8' },
            { name: t.value.colorBlue, value: '#1a1a2e', bg: '#1a1a2e' },
            { name: t.value.colorMaroon, value: '#ab1115', bg: '#ab1115' },
        ]);

        // Methods
        const toggleTheme = () => {
            isDark.value = !isDark.value;
            document.body.classList.toggle('dark', isDark.value);
            localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
        };

        const toggleLang = () => {
            lang.value = lang.value === 'ru' ? 'en' : 'ru';
            localStorage.setItem('lang', lang.value);
            document.documentElement.lang = lang.value;
        };

        const handleFileSelect = (e) => {
            const file = e.target.files[0];
            if (file) processFile(file);
        };

        const handleDrop = (e) => {
            isDragover.value = false;
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                processFile(file);
            }
        };

        const processFile = (file) => {
            if (file.size > 10 * 1024 * 1024) {
                error.value = t.value.fileTooLarge;
                return;
            }

            selectedFile.value = file;
            previewUrl.value = URL.createObjectURL(file);
            results.value = [];
            error.value = null;
        };

        const clearImage = () => {
            selectedFile.value = null;
            previewUrl.value = null;
            results.value = [];
            error.value = null;
        };

        const generate = async () => {
            if (!selectedFile.value) return;

            isProcessing.value = true;
            processingText.value = t.value.uploading;
            error.value = null;
            results.value = [];

            try {
                const formData = new FormData();
                formData.append('image', selectedFile.value);
                formData.append('bg_color', selectedColor.value);
                formData.append('mode', activeTab.value);

                processingText.value = t.value.processing;

                const response = await fetch('api/process.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || t.value.processingError);
                }

                processingText.value = t.value.done;

                if (activeTab.value === 'cards') {
                    results.value = [
                        {
                            name: t.value.webName,
                            type: 'web',
                            width: 1820,
                            height: 458,
                            url: data.web_url,
                            filename: 'vk-music-web-1820x458.png'
                        },
                        {
                            name: t.value.mobileName,
                            type: 'mobile',
                            width: 1500,
                            height: 1120,
                            url: data.mobile_url,
                            filename: 'vk-music-mobile-1500x1120.png'
                        }
                    ];
                } else {
                    results.value = [
                        {
                            name: t.value.coverName,
                            type: 'cover',
                            width: 1500,
                            height: 1500,
                            url: data.cover_url,
                            filename: 'cover-1500x1500.png'
                        }
                    ];
                }

            } catch (err) {
                console.error('Generation error:', err);
                error.value = err.message || t.value.genericError;
            } finally {
                isProcessing.value = false;
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
            if (savedLang && (savedLang === 'en' || savedLang === 'ru')) {
                lang.value = savedLang;
                document.documentElement.lang = savedLang;
            }
        });

        return {
            showContent,
            isDark,
            isDragover,
            lang,
            activeTab,
            t,
            fileInput,
            selectedFile,
            previewUrl,
            selectedColor,
            customColor,
            colors,
            isProcessing,
            processingText,
            results,
            error,
            toggleTheme,
            toggleLang,
            handleFileSelect,
            handleDrop,
            clearImage,
            generate
        };
    }
}).mount('#app');
