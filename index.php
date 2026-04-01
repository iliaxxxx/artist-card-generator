<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no">
    <title>Vauvision - Artist Card Generator</title>
    <link rel="stylesheet" href="css/style.css?v=3">
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
</head>
<body>
    <div id="app">
        <div class="app-container">
            <!-- Header -->
            <header class="header">
                <div class="header-inner">
                    <div class="spacer"></div>
                    <a href="https://vauvision.com" target="_blank" rel="noopener noreferrer" class="logo-link">
                        <img :src="isDark ? 'logo-white.png' : 'logo-black.png'" alt="VAUVISION" class="logo-img">
                    </a>
                    <div class="header-actions">
                        <button @click="toggleLang" class="lang-toggle-btn" :title="lang === 'ru' ? 'Switch to English' : 'Переключить на русский'">
                            {{ lang === 'ru' ? 'EN' : 'RU' }}
                        </button>
                        <button @click="toggleTheme" class="theme-toggle-btn" :title="isDark ? t.lightTheme : t.darkTheme">
                            <span v-if="isDark">☀️</span>
                            <span v-else>🌙</span>
                        </button>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="main-content">
                <div class="content-wrapper" :class="{ visible: showContent }">

                    <!-- Title -->
                    <div class="title-section">
                        <h1>{{ t.title }}</h1>
                        <p class="subtitle">{{ t.subtitle }}</p>
                        <div class="warning-notice">{{ t.warning }}</div>
                        <p class="info-notice">{{ t.notice }}</p>
                    </div>

                    <!-- Tabs -->
                    <div class="tabs">
                        <button
                            :class="['tab-btn', { active: activeTab === 'cards' }]"
                            @click="activeTab = 'cards'; results = []; error = null"
                        >{{ t.tabCards }}</button>
                        <button
                            :class="['tab-btn', { active: activeTab === 'covers' }]"
                            @click="activeTab = 'covers'; results = []; error = null"
                        >{{ t.tabCovers }}</button>
                    </div>

                    <!-- Covers description -->
                    <p v-if="activeTab === 'covers'" class="tab-description">{{ t.coversDescription }}</p>

                    <!-- Upload Card -->
                    <div class="card" v-if="!previewUrl">
                        <label class="card-label">{{ t.uploadLabel }}</label>

                        <div
                            class="upload-zone"
                            :class="{ dragover: isDragover }"
                            @drop.prevent="handleDrop"
                            @dragover.prevent="isDragover = true"
                            @dragleave="isDragover = false"
                            @click="fileInput.click()"
                        >
                            <input
                                type="file"
                                ref="fileInput"
                                @change="handleFileSelect"
                                accept="image/*"
                                style="display: none"
                            >
                            <div class="upload-icon">📷</div>
                            <p class="upload-text">{{ t.uploadText }}</p>
                            <p class="upload-hint">{{ t.uploadHint }}</p>
                        </div>
                    </div>

                    <!-- Preview & Settings -->
                    <div v-if="previewUrl" class="card">
                        <label class="card-label">{{ t.originalPhoto }}</label>

                        <div class="preview-container">
                            <img :src="previewUrl" class="preview-image" alt="Preview">
                            <button @click="clearImage" class="clear-btn">✕</button>
                        </div>
                    </div>

                    <!-- Background Color -->
                    <div v-if="previewUrl" class="card">
                        <label class="card-label">{{ t.bgColor }}</label>

                        <div class="color-options">
                            <button
                                v-for="color in colors"
                                :key="color.value"
                                @click="selectedColor = color.value"
                                :class="['color-btn', { active: selectedColor === color.value }]"
                                :style="{ background: color.bg }"
                                :title="color.name"
                            >
                                <span v-if="selectedColor === color.value">✓</span>
                            </button>
                            <div class="custom-color">
                                <input
                                    type="color"
                                    v-model="customColor"
                                    @input="selectedColor = customColor"
                                    class="color-picker"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Generate Button -->
                    <button
                        v-if="previewUrl"
                        @click="generate"
                        :disabled="isProcessing"
                        :class="['calc-btn', { disabled: isProcessing }]"
                    >
                        <span v-if="isProcessing" class="loading">
                            <svg class="spinner" viewBox="0 0 24 24" fill="none">
                                <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {{ processingText }}
                        </span>
                        <span v-else>🎨 {{ t.generate }}</span>
                    </button>

                    <!-- Results -->
                    <div v-if="results.length" class="results-section">
                        <div class="card" v-for="(result, idx) in results" :key="idx">
                            <label class="card-label">{{ result.name }}</label>
                            <p class="result-size">{{ result.width }}×{{ result.height }} px</p>

                            <div class="result-preview" :class="result.type">
                                <img :src="result.url" :alt="result.name">
                            </div>

                            <a :href="result.url" :download="result.filename" class="download-btn">
                                📥 {{ t.downloadPng }}
                            </a>
                        </div>
                    </div>

                    <!-- Error -->
                    <div v-if="error" class="error-card">
                        {{ error }}
                    </div>

                </div>
            </main>

            <!-- Footer -->
            <footer class="footer">
                © 2026 Vauvision
            </footer>
        </div>
    </div>

    <script src="js/app.js?v=3"></script>
</body>
</html>
