<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no">
    <title>Vauvision - Карточки для музыкальных площадок</title>
    <link rel="stylesheet" href="css/style.css?v=6">
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
</head>
<body>
    <div id="app">
        <div class="app-container">
            <!-- Header -->
            <header class="header">
                <div class="header-inner">
                    <div class="header-left">
                        <button @click="toggleLang" class="lang-toggle-btn">
                            {{ lang === 'ru' ? 'EN' : 'RU' }}
                        </button>
                    </div>
                    <a href="https://vauvision.com" target="_blank" rel="noopener noreferrer" class="logo-link">
                        <img :src="isDark ? 'logo-white.png' : 'logo-black.png'" alt="VAUVISION" class="logo-img">
                    </a>
                    <div class="header-right">
                        <button @click="toggleTheme" class="theme-toggle-btn">
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
                        <h1>{{ currentTitle }}</h1>
                        <p class="subtitle">{{ currentSubtitle }}</p>
                    </div>

                    <!-- Mode Tabs -->
                    <div class="mode-tabs">
                        <button 
                            @click="setMode('cards')" 
                            :class="['mode-tab', { active: mode === 'cards' }]"
                        >
                            {{ t.modeCards }}
                        </button>
                        <button 
                            @click="setMode('cover')" 
                            :class="['mode-tab', { active: mode === 'cover' }]"
                        >
                            {{ t.modeCover }}
                        </button>
                    </div>

                    <!-- Upload Card -->
                    <div class="card" v-if="!imageLoaded">
                        <label class="card-label">{{ t.uploadLabel }}</label>
                        
                        <div 
                            class="upload-zone"
                            :class="{ dragover: isDragover }"
                            @drop.prevent="handleDrop"
                            @dragover.prevent="isDragover = true"
                            @dragleave="isDragover = false"
                            @click="$refs.fileInput.click()"
                        >
                            <input 
                                type="file" 
                                ref="fileInput" 
                                @change="handleFileSelect" 
                                accept="image/*"
                                style="display: none"
                            >
                            <div class="upload-icon">📷</div>
                            <div class="upload-content">
                                <p class="upload-text">{{ t.uploadText }}</p>
                                <p class="upload-hint">{{ t.uploadHint }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Editor -->
                    <div v-if="imageLoaded" class="editor-section">
                        
                        <!-- Format Tabs (Cards mode) -->
                        <div class="format-tabs" v-if="mode === 'cards'">
                            <button 
                                v-for="(format, key) in cardFormats"
                                :key="key"
                                @click="setActiveFormat(key)" 
                                :class="['format-tab', { active: activeFormat === key }]"
                            >
                                {{ format.label }}
                            </button>
                        </div>

                        <!-- Canvas Editor -->
                        <div class="card editor-card">
                            <label class="card-label">{{ currentFormat.label }} — {{ currentFormat.width }}×{{ currentFormat.height }}</label>
                            <p class="editor-hint">{{ t.editorHint }}</p>
                            
                            <div 
                                class="canvas-wrapper"
                                :style="{ aspectRatio: currentFormat.width + '/' + currentFormat.height }"
                            >
                                <canvas 
                                    ref="canvas"
                                    @mousedown="startDrag"
                                    @mousemove="onDrag"
                                    @mouseup="endDrag"
                                    @mouseleave="endDrag"
                                    @touchstart.prevent="startDrag"
                                    @touchmove.prevent="onDrag"
                                    @touchend="endDrag"
                                    @wheel.prevent="onWheel"
                                ></canvas>
                            </div>

                            <!-- Zoom Slider -->
                            <div class="zoom-control">
                                <span class="zoom-label">🔍</span>
                                <input 
                                    type="range" 
                                    v-model="zoom" 
                                    :min="minZoom"
                                    max="3" 
                                    step="0.01"
                                    @input="onZoomChange"
                                    class="zoom-slider"
                                >
                                <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
                            </div>

                            <!-- Reset & Change -->
                            <div class="editor-actions">
                                <button @click="resetPosition" class="btn-secondary">↺ {{ t.reset }}</button>
                                <button @click="clearImage" class="btn-secondary">✕ {{ t.changePhoto }}</button>
                            </div>
                        </div>

                        <!-- Download Button -->
                        <button @click="downloadAll" :disabled="isGenerating" class="calc-btn">
                            <span v-if="isGenerating">⏳ {{ t.generating }}</span>
                            <span v-else>📥 {{ mode === 'cards' ? t.downloadAll : t.downloadCover }}</span>
                        </button>

                    </div>

                    <!-- Warning -->
                    <div class="warning-card">
                        <p class="warning-text">{{ currentWarning }}</p>
                    </div>

                    <!-- Info -->
                    <div class="info-card">
                        <p class="info-text" v-html="currentInfo"></p>
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

    <script src="js/app.js?v=6"></script>
</body>
</html>
