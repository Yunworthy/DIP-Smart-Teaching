var ImagePreview = {
  name: 'ImagePreview',
  props: {
    originalSrc: {
      type: String,
      default: '',
    },
    processedSrc: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
  },
  template: `
    <div class="w-full rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      <!-- Header -->
      <div v-if="title" class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-800">{{ title }}</h3>
        <div class="flex items-center gap-1">
          <!-- View mode toggle -->
          <div class="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              @click="viewMode = 'side'"
              :class="[
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                viewMode === 'side'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              并排对比
            </button>
            <button
              @click="viewMode = 'overlay'"
              :class="[
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                viewMode === 'overlay'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              叠加对比
            </button>
          </div>

          <!-- Zoom controls -->
          <button
            @click="zoomOut"
            class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Zoom out"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span class="text-xs text-gray-500 min-w-[40px] text-center">{{ Math.round(zoom * 100) }}%</span>
          <button
            @click="zoomIn"
            class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Zoom in"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            @click="resetZoom"
            class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Reset zoom"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          <!-- Download -->
          <button
            @click="downloadImage"
            class="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-1"
            title="Download processed image"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Image area -->
      <div
        class="relative overflow-auto bg-gray-50"
        style="min-height: 300px; max-height: 600px;"
        @wheel.prevent="handleWheel"
      >
        <!-- Side by side mode -->
        <div v-if="viewMode === 'side'" class="flex gap-0">
          <!-- Original -->
          <div class="flex-1 relative border-r border-gray-200">
            <div class="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/50 text-white text-[10px] font-medium rounded-md">
              原图
            </div>
            <div
              class="flex items-center justify-center p-4 transition-transform duration-200"
              :style="{ transform: 'scale(' + zoom + ')', transformOrigin: 'top left' }"
            >
              <img
                v-if="originalSrc"
                :src="originalSrc"
                alt="Original"
                class="max-w-full object-contain"
                draggable="false"
                @error="originalError = true"
              />
              <div v-else-if="originalError" class="flex flex-col items-center gap-2 py-12 text-gray-400">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs">加载失败</span>
              </div>
              <div v-else class="flex flex-col items-center gap-2 py-12 text-gray-300">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs">暂无图像</span>
              </div>
            </div>
          </div>

          <!-- Processed -->
          <div class="flex-1 relative">
            <div class="absolute top-2 left-2 z-10 px-2 py-0.5 bg-indigo-600/80 text-white text-[10px] font-medium rounded-md">
              处理后
            </div>
            <div
              class="flex items-center justify-center p-4 transition-transform duration-200"
              :style="{ transform: 'scale(' + zoom + ')', transformOrigin: 'top left' }"
            >
              <img
                v-if="processedSrc"
                :src="processedSrc"
                alt="Processed"
                class="max-w-full object-contain"
                draggable="false"
                @error="processedError = true"
              />
              <div v-else-if="processedError" class="flex flex-col items-center gap-2 py-12 text-gray-400">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs">加载失败</span>
              </div>
              <div v-else class="flex flex-col items-center gap-2 py-12 text-gray-300">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs">暂无图像</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Overlay mode -->
        <div v-else class="relative flex items-center justify-center p-4" style="min-height: 300px;">
          <div
            class="relative transition-transform duration-200"
            :style="{ transform: 'scale(' + zoom + ')', transformOrigin: 'center center' }"
          >
            <!-- Base image (original) -->
            <img
              v-if="originalSrc"
              :src="originalSrc"
              alt="Original"
              class="max-w-full object-contain"
              draggable="false"
            />
            <!-- Overlay image (processed) with adjustable opacity -->
            <img
              v-if="processedSrc"
              :src="processedSrc"
              alt="Processed"
              class="absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-200"
              :style="{ opacity: overlayOpacity }"
              draggable="false"
            />
          </div>

          <!-- Opacity slider -->
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full">
            <span class="text-[10px] text-white/70">原图</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="overlayOpacity"
              class="w-32 h-1 accent-indigo-500 cursor-pointer"
            />
            <span class="text-[10px] text-white/70">处理后</span>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      viewMode: 'side',
      zoom: 1,
      overlayOpacity: 0.5,
      originalError: false,
      processedError: false,
    };
  },
  watch: {
    originalSrc() { this.originalError = false; },
    processedSrc() { this.processedError = false; },
  },
  methods: {
    zoomIn() {
      this.zoom = Math.min(this.zoom * 1.2, 5);
    },
    zoomOut() {
      this.zoom = Math.max(this.zoom / 1.2, 0.2);
    },
    resetZoom() {
      this.zoom = 1;
    },
    handleWheel(e) {
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    },
    downloadImage() {
      const src = this.processedSrc || this.originalSrc;
      if (!src) return;
      const a = document.createElement('a');
      a.href = src;
      a.download = src.split('/').pop() || 'image.png';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
  },
};
