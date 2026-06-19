var ResourceLibrary = {
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">教学资源库</h1>
        <button
          v-if="isTeacher"
          @click="openUploadModal"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <span>上传资源</span>
        </button>
      </div>

      <!-- Section Tabs -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="sec in sections"
          :key="sec.key"
          @click="activeSection = sec.key"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="activeSection === sec.key ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'"
        >
          {{ sec.label }}
          <span class="ml-1 text-xs opacity-70">({{ getResourceCount(sec.key) }})</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-600">{{ error }}</p>
        <button @click="loadResources" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">重新加载</button>
      </div>

      <div v-else class="space-y-6">
        <!-- Resource Cards -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold text-gray-800">{{ currentSectionLabel }}</h2>
          </div>

          <div v-if="filteredResources.length === 0" class="bg-white rounded-xl shadow border border-gray-100 p-12 text-center text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
            </svg>
            <p>该分类暂无资源</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div v-for="res in filteredResources" :key="res.id" class="bg-white rounded-xl shadow border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="fileIconClass(res.file_type || res.category)">
                  <span class="text-lg">{{ fileIcon(res.file_type || res.category) }}</span>
                </div>
                <div v-if="isTeacher" class="flex space-x-1">
                  <button @click="deleteResource(res)" class="text-gray-400 hover:text-red-500 p-1" title="删除">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
              <h3 class="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{{ res.title }}</h3>
              <p class="text-xs text-gray-500 line-clamp-2 mb-3">{{ res.description || '' }}</p>
              <div class="flex items-center justify-between text-xs text-gray-400">
                <span>{{ formatFileSize(res.file_size) }}</span>
                <span>{{ formatDate(res.created_at) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-gray-400 mt-1">
                <span v-if="res.uploader_name">上传者: {{ res.uploader_name }}</span>
                <span v-if="res.download_count">下载: {{ res.download_count }}</span>
              </div>
              <div class="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                <a v-if="res.file_path || res.url" :href="getDownloadUrl(res)" target="_blank"
                  class="flex-1 text-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                  {{ isViewable(res) ? '查看' : '下载' }}
                </a>
                <a v-if="res.url" :href="res.url" target="_blank"
                  class="flex-1 text-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
                  外部链接
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Enterprise Cases -->
        <div v-if="activeSection === 'case'">
          <h2 class="text-lg font-semibold text-gray-800 mb-3">企业案例</h2>
          <div v-if="enterpriseCases.length === 0" class="bg-white rounded-xl shadow border border-gray-100 p-8 text-center text-gray-400 text-sm">
            暂无企业案例
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="c in enterpriseCases" :key="c.id" class="bg-white rounded-xl shadow border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {{ (c.title || c.name || '案')[0] }}
                </div>
                <div>
                  <h3 class="font-medium text-gray-800">{{ c.title || c.name }}</h3>
                  <p class="text-xs text-gray-500">{{ c.company || c.industry || '企业案例' }}</p>
                </div>
              </div>
              <p class="text-sm text-gray-600 line-clamp-3 mb-3">{{ c.description || '' }}</p>
              <div class="flex items-center justify-between">
                <div class="flex flex-wrap gap-1">
                  <span v-for="tag in (c.tags || []).slice(0, 3)" :key="tag" class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{{ tag }}</span>
                </div>
                <router-link v-if="c.id" :to="'/cases/' + c.id" class="text-sm text-blue-600 hover:text-blue-800">
                  详情 &rarr;
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      <div v-if="showUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">上传资源</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">资源名称 *</label>
              <input v-model="uploadForm.title" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select v-model="uploadForm.category" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option v-for="sec in uploadSections" :key="sec.key" :value="sec.key">{{ sec.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea v-model="uploadForm.description" rows="2" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">上传文件</label>
              <input ref="fileInput" type="file" @change="onFileSelected" class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <p v-if="selectedFile" class="text-xs text-green-600 mt-1">已选择: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">或填写文件 URL</label>
              <input v-model="uploadForm.url" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">关联章节</label>
              <select v-model="uploadForm.chapter_id" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option :value="null">不关联章节</option>
                <option v-for="ch in chapters" :key="ch.id" :value="ch.id">{{ ch.title }}</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click="showUploadModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
            <button @click="uploadResource" :disabled="uploading || !uploadForm.title"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ uploading ? '上传中...' : '上传' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div v-if="toast" class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 text-sm"
        :class="toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'">
        {{ toast.message }}
      </div>
    </div>
  `,
  data() {
    return {
      loading: false,
      uploading: false,
      error: null,
      activeSection: 'ppt',
      resources: [],
      enterpriseCases: [],
      chapters: [],
      showUploadModal: false,
      selectedFile: null,
      uploadForm: {
        title: '',
        category: 'ppt',
        description: '',
        url: '',
        chapter_id: null
      },
      toast: null,
      sections: [
        { key: 'ppt', label: 'PPT课件' },
        { key: 'experiment_guide', label: '实验指导书' },
        { key: 'case', label: '综合案例' },
        { key: 'video', label: '教学视频' },
        { key: 'document', label: '文档资料' },
        { key: 'other', label: '其他资源' }
      ],
      uploadSections: [
        { key: 'ppt', label: 'PPT课件' },
        { key: 'experiment_guide', label: '实验指导书' },
        { key: 'case', label: '综合案例' },
        { key: 'video', label: '教学视频' },
        { key: 'document', label: '文档资料' },
        { key: 'image', label: '图片素材' },
        { key: 'other', label: '其他' }
      ]
    };
  },
  computed: {
    isTeacher() {
      return store.user && (store.user.role === 'teacher' || store.user.role === 'admin');
    },
    currentSectionLabel() {
      var sec = this.sections.find(function(s) { return s.key === this.activeSection; }.bind(this));
      return sec ? sec.label : '';
    },
    filteredResources() {
      var key = this.activeSection;
      return this.resources.filter(function(r) { return r.category === key; });
    }
  },
  async mounted() {
    await this.loadResources();
  },
  methods: {
    async loadResources() {
      this.loading = true;
      this.error = null;
      try {
        var results = await Promise.allSettled([
          api.getResources(),
          api.getCases(),
          api.getChapters()
        ]);

        if (results[0].status === 'fulfilled') {
          var data = results[0].value;
          this.resources = Array.isArray(data) ? data : (data.resources || []);
        }
        if (results[1].status === 'fulfilled') {
          var caseData = results[1].value;
          this.enterpriseCases = Array.isArray(caseData) ? caseData : (caseData.cases || []);
        }
        if (results[2].status === 'fulfilled') {
          var chData = results[2].value;
          this.chapters = Array.isArray(chData) ? chData : (chData.chapters || []);
        }
      } catch (err) {
        this.error = '加载资源失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    getResourceCount(sectionKey) {
      if (sectionKey === 'case') {
        var dbCases = this.enterpriseCases.length;
        var dbResources = this.resources.filter(function(r) { return r.category === 'case'; }).length;
        return dbCases + dbResources;
      }
      return this.resources.filter(function(r) { return r.category === sectionKey; }).length;
    },
    openUploadModal() {
      this.selectedFile = null;
      this.uploadForm = {
        title: '',
        category: 'ppt',
        description: '',
        url: '',
        chapter_id: null
      };
      this.showUploadModal = true;
    },
    onFileSelected(event) {
      var files = event.target.files;
      this.selectedFile = files && files.length > 0 ? files[0] : null;
    },
    getDownloadUrl(res) {
      if (res.file_path) {
        return '/api/resources/' + res.id + '/download';
      }
      return res.url || '#';
    },
    async uploadResource() {
      if (!this.uploadForm.title) return;
      if (!this.selectedFile && !this.uploadForm.url) {
        this.showToast('请上传文件或填写文件URL', 'error');
        return;
      }

      this.uploading = true;
      try {
        var formData = new FormData();
        formData.append('title', this.uploadForm.title);
        formData.append('category', this.uploadForm.category);
        if (this.uploadForm.description) {
          formData.append('description', this.uploadForm.description);
        }
        if (this.uploadForm.url) {
          formData.append('url', this.uploadForm.url);
        }
        if (this.uploadForm.chapter_id) {
          formData.append('chapter_id', this.uploadForm.chapter_id);
        }
        if (this.selectedFile) {
          formData.append('file', this.selectedFile);
        }

        await api.uploadResource(formData);
        this.showUploadModal = false;
        this.showToast('资源上传成功', 'success');
        await this.loadResources();
      } catch (err) {
        this.showToast('上传失败: ' + (err.message || '未知错误'), 'error');
      } finally {
        this.uploading = false;
      }
    },
    async deleteResource(res) {
      if (!confirm('确定删除资源"' + res.title + '"？')) return;
      try {
        await api.deleteResource(res.id);
        this.showToast('资源已删除', 'success');
        await this.loadResources();
      } catch (err) {
        this.showToast('删除失败: ' + (err.message || '未知错误'), 'error');
      }
    },
    fileIcon(type) {
      var icons = {
        ppt: 'P', pptx: 'P', pdf: 'F',
        video: 'V', mp4: 'V', avi: 'V',
        doc: 'D', docx: 'D', document: 'D',
        image: 'I', png: 'I', jpg: 'I', jpeg: 'I',
        experiment_guide: 'G', case: 'C', other: 'R'
      };
      return icons[type] || icons.other;
    },
    fileIconClass(type) {
      var classes = {
        ppt: 'bg-orange-100 text-orange-600',
        pptx: 'bg-orange-100 text-orange-600',
        pdf: 'bg-red-100 text-red-600',
        video: 'bg-purple-100 text-purple-600',
        mp4: 'bg-purple-100 text-purple-600',
        doc: 'bg-blue-100 text-blue-600',
        docx: 'bg-blue-100 text-blue-600',
        document: 'bg-blue-100 text-blue-600',
        image: 'bg-green-100 text-green-600',
        png: 'bg-green-100 text-green-600',
        experiment_guide: 'bg-teal-100 text-teal-600',
        case: 'bg-indigo-100 text-indigo-600',
        other: 'bg-gray-100 text-gray-600'
      };
      return classes[type] || classes.other;
    },
    isViewable(res) {
      var t = res.file_type || res.category || '';
      return t === 'pdf' || t === 'image' || t === 'video' || t === 'png' || t === 'jpg' || t === 'jpeg' || t === 'mp4';
    },
    formatFileSize(bytes) {
      if (!bytes) return '';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    showToast(message, type) {
      this.toast = { message: message, type: type || 'success' };
      setTimeout(function() { this.toast = null; }.bind(this), 3000);
    }
  }
};
