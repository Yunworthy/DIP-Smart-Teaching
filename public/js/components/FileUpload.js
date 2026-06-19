var FileUpload = {
  name: 'FileUpload',
  props: {
    accept: {
      type: String,
      default: '',
    },
    maxSize: {
      type: Number,
      default: 10,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['upload'],
  template: `
    <div class="w-full">
      <!-- Drop zone -->
      <div
        :class="[
          'relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerInput"
      >
        <!-- Upload icon -->
        <div :class="['w-12 h-12 rounded-full flex items-center justify-center', isDragging ? 'bg-indigo-100' : 'bg-gray-200']">
          <svg
            :class="['w-6 h-6', isDragging ? 'text-indigo-600' : 'text-gray-500']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <!-- Text -->
        <div class="text-center">
          <p class="text-sm font-medium text-gray-700">
            <span class="text-indigo-600 hover:underline">Click to upload</span> or drag and drop
          </p>
          <p class="mt-1 text-xs text-gray-400">
            {{ acceptLabel }} (max {{ maxSize }}MB)
          </p>
        </div>

        <!-- Error message -->
        <p v-if="errorMsg" class="text-xs text-red-500 font-medium">{{ errorMsg }}</p>

        <!-- Hidden input -->
        <input
          ref="fileInput"
          type="file"
          :accept="accept"
          :multiple="multiple"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          @change="handleInputChange"
        />
      </div>

      <!-- Selected files list -->
      <div v-if="selectedFiles.length > 0" class="mt-3 space-y-2">
        <div
          v-for="(file, idx) in selectedFiles"
          :key="idx"
          class="flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <!-- File icon -->
          <div class="flex-shrink-0 w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <!-- File info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ file.name }}</p>
            <p class="text-xs text-gray-400">{{ formatSize(file.size) }}</p>
          </div>
          <!-- Remove button -->
          <button
            @click.stop="removeFile(idx)"
            class="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      isDragging: false,
      selectedFiles: [],
      errorMsg: '',
    };
  },
  computed: {
    acceptLabel() {
      if (!this.accept) return 'All file types';
      return this.accept.split(',').map(a => a.trim().toUpperCase()).join(', ');
    },
  },
  methods: {
    triggerInput() {
      this.$refs.fileInput && this.$refs.fileInput.click();
    },
    handleInputChange(e) {
      const files = Array.from(e.target.files || []);
      this.processFiles(files);
      e.target.value = '';
    },
    handleDrop(e) {
      this.isDragging = false;
      const files = Array.from(e.dataTransfer.files || []);
      this.processFiles(files);
    },
    processFiles(files) {
      this.errorMsg = '';
      const valid = [];

      for (const file of files) {
        // Check file type
        if (this.accept) {
          const acceptTypes = this.accept.split(',').map(a => a.trim().toLowerCase());
          const ext = '.' + file.name.split('.').pop().toLowerCase();
          const mime = file.type.toLowerCase();
          const matched = acceptTypes.some(t => {
            if (t.startsWith('.')) return ext === t;
            if (t.endsWith('/*')) return mime.startsWith(t.replace('/*', '/'));
            return mime === t;
          });
          if (!matched) {
            this.errorMsg = 'File type not accepted: ' + file.name;
            continue;
          }
        }

        // Check file size
        if (file.size > this.maxSize * 1024 * 1024) {
          this.errorMsg = 'File too large: ' + file.name + ' (max ' + this.maxSize + 'MB)';
          continue;
        }

        valid.push(file);
      }

      if (this.multiple) {
        this.selectedFiles = [...this.selectedFiles, ...valid];
      } else {
        this.selectedFiles = valid.slice(0, 1);
      }

      for (const f of valid) {
        this.$emit('upload', f);
      }
    },
    removeFile(idx) {
      this.selectedFiles.splice(idx, 1);
    },
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
  },
};
