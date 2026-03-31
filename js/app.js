const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        // State
        const showContent = ref(false);
        const isDark = ref(false);
        const isDragover = ref(false);
        
        const fileInput = ref(null);
        const selectedFile = ref(null);
        const previewUrl = ref(null);
        const selectedColor = ref('#808080');
        const customColor = ref('#808080');
        
        const isProcessing = ref(false);
        const processingText = ref('Обрабатываем...');
        const results = ref([]);
        const error = ref(null);
        
        // Preset colors
        const colors = [
            { name: 'Белый', value: '#ffffff', bg: '#ffffff' },
            { name: 'Чёрный', value: '#000000', bg: '#000000' },
            { name: 'Серый', value: '#808080', bg: '#808080' },
            { name: 'Бежевый', value: '#e4dfd8', bg: '#e4dfd8' },
            { name: 'Синий', value: '#1a1a2e', bg: '#1a1a2e' },
            { name: 'Бордовый', value: '#ab1115', bg: '#ab1115' },
        ];
        
        // Methods
        const toggleTheme = () => {
            isDark.value = !isDark.value;
            document.body.classList.toggle('dark', isDark.value);
            localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
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
                error.value = 'Файл слишком большой (макс. 10MB)';
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
            processingText.value = 'Загружаем фото...';
            error.value = null;
            results.value = [];
            
            try {
                const formData = new FormData();
                formData.append('image', selectedFile.value);
                formData.append('bg_color', selectedColor.value);
                
                processingText.value = 'AI удаляет фон...';
                
                const response = await fetch('api/process.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Ошибка обработки');
                }
                
                processingText.value = 'Готово!';
                
                results.value = [
                    {
                        name: 'VK Музыка — Веб',
                        type: 'web',
                        width: 1820,
                        height: 458,
                        url: data.web_url,
                        filename: 'vk-music-web-1820x458.png'
                    },
                    {
                        name: 'VK Музыка — Мобильная',
                        type: 'mobile',
                        width: 1500,
                        height: 1120,
                        url: data.mobile_url,
                        filename: 'vk-music-mobile-1500x1120.png'
                    }
                ];
                
            } catch (err) {
                console.error('Generation error:', err);
                error.value = err.message || 'Произошла ошибка';
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
        });
        
        return {
            showContent,
            isDark,
            isDragover,
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
            handleFileSelect,
            handleDrop,
            clearImage,
            generate
        };
    }
}).mount('#app');
