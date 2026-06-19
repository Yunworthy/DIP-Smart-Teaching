var ExperimentDesign = {
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">实验设计</h1>
        <div class="flex space-x-3">
          <button
            @click="viewMode = viewMode === 'list' ? 'preview' : 'list'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="viewMode === 'preview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'"
          >
            {{ viewMode === 'preview' ? '返回列表' : '预览模式' }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-600">{{ error }}</p>
        <button @click="loadSimulations" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">重新加载</button>
      </div>

      <!-- Preview Mode -->
      <div v-else-if="viewMode === 'preview' && selectedSim" class="bg-white rounded-xl shadow border border-gray-100 p-6">
        <div class="border-b border-gray-200 pb-4 mb-6">
          <span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mb-2">学生视角预览</span>
          <h2 class="text-xl font-bold text-gray-800">{{ selectedSim.title || selectedSim.name }}</h2>
          <p class="text-sm text-gray-600 mt-2 whitespace-pre-line">{{ selectedSim.description }}</p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold text-gray-800 mb-3">实验参数</h3>
            <div class="bg-gray-50 rounded-lg p-4 space-y-3">
              <div v-for="(val, key) in parsedParams" :key="key" class="flex items-center justify-between">
                <span class="text-sm text-gray-600">{{ key }}</span>
                <span class="text-sm font-mono text-gray-800">{{ val }}</span>
              </div>
              <div v-if="Object.keys(parsedParams).length === 0" class="text-gray-400 text-sm text-center py-4">无参数配置</div>
            </div>
          </div>
          <div>
            <h3 class="font-semibold text-gray-800 mb-3">样本图片</h3>
            <div v-if="selectedSim.sampleImage" class="border border-gray-200 rounded-lg overflow-hidden">
              <img :src="selectedSim.sampleImage" class="w-full h-48 object-cover" />
            </div>
            <div v-else class="border border-gray-200 rounded-lg p-8 text-center text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p class="text-sm">暂无样本图片</p>
            </div>
            <div v-if="selectedSim.caseText" class="mt-4">
              <h4 class="font-medium text-gray-700 mb-2">案例说明</h4>
              <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                {{ selectedSim.caseText }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List Mode -->
      <div v-else>
        <!-- Empty State -->
        <div v-if="simulations.length === 0" class="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
          </svg>
          <p class="text-gray-400">暂无仿真实验</p>
        </div>

        <!-- Simulation Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="sim in simulations"
            :key="sim.id"
            @click="openEditor(sim)"
            class="bg-white rounded-xl shadow border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div class="flex items-start justify-between mb-3">
              <h3 class="font-semibold text-gray-800">{{ sim.title || sim.name }}</h3>
              <span class="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{{ sim.type || '实验' }}</span>
            </div>
            <p class="text-sm text-gray-500 line-clamp-2 mb-3">{{ sim.description || '暂无描述' }}</p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>{{ countParams(sim.parameters) }} 个参数</span>
              <span>{{ sim.chapterTitle || (sim.chapter_id ? '章节 ' + sim.chapter_id : '') }}</span>
            </div>
            <div v-if="sim.sampleImage" class="mt-3 border border-gray-100 rounded-lg overflow-hidden">
              <img :src="sim.sampleImage" class="w-full h-28 object-cover" />
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-800">编辑实验</h3>
            <button @click="showEditModal = false" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">实验标题</label>
              <input v-model="editForm.title" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea v-model="editForm.description" rows="3" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">参数配置 (JSON)</label>
              <textarea
                v-model="editForm.parameters"
                rows="8"
                class="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="jsonError ? 'border-red-400' : ''"
              ></textarea>
              <p v-if="jsonError" class="text-xs text-red-500 mt-1">{{ jsonError }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">样本图片 URL</label>
              <input v-model="editForm.sampleImage" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://..." />
              <div v-if="editForm.sampleImage" class="mt-2 border border-gray-200 rounded-lg overflow-hidden w-32">
                <img :src="editForm.sampleImage" class="w-full h-20 object-cover" @error="$event.target.style.display='none'" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">案例说明</label>
              <textarea v-model="editForm.caseText" rows="4" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
          </div>
          <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <button @click="viewMode = 'preview'; showEditModal = false" class="text-sm text-blue-600 hover:text-blue-800">
              预览实验 &rarr;
            </button>
            <div class="flex space-x-3">
              <button @click="showEditModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
              <button @click="saveSimulation" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" :disabled="!!jsonError">
                保存修改
              </button>
            </div>
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
      error: null,
      simulations: [],
      selectedSim: null,
      showEditModal: false,
      editForm: { title: '', description: '', parameters: '{}', sampleImage: '', caseText: '' },
      jsonError: null,
      viewMode: 'list',
      toast: null
    };
  },
  computed: {
    parsedParams() {
      if (!this.selectedSim) return {};
      try {
        const p = this.selectedSim.parameters;
        if (typeof p === 'string') return JSON.parse(p);
        return p || {};
      } catch { return {}; }
    }
  },
  watch: {
    'editForm.parameters'(val) {
      try {
        JSON.parse(val);
        this.jsonError = null;
      } catch (e) {
        this.jsonError = 'JSON 格式错误: ' + e.message;
      }
    }
  },
  async mounted() {
    await this.loadSimulations();
  },
  methods: {
    async loadSimulations() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getSimulations();
        const data = res.data || res;
        this.simulations = Array.isArray(data) ? data : (data.simulations || []);
      } catch (err) {
        this.error = '加载实验列表失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    openEditor(sim) {
      this.selectedSim = sim;
      const params = sim.parameters;
      this.editForm = {
        title: sim.title || sim.name || '',
        description: sim.description || '',
        parameters: typeof params === 'string' ? params : JSON.stringify(params || {}, null, 2),
        sampleImage: sim.sampleImage || sim.sample_image || '',
        caseText: sim.caseText || sim.case_text || ''
      };
      this.jsonError = null;
      this.showEditModal = true;
    },
    async saveSimulation() {
      if (this.jsonError) return;
      try {
        const payload = {
          ...this.selectedSim,
          title: this.editForm.title,
          description: this.editForm.description,
          parameters: JSON.parse(this.editForm.parameters),
          sampleImage: this.editForm.sampleImage,
          caseText: this.editForm.caseText
        };
        Object.assign(this.selectedSim, payload);
        const idx = this.simulations.findIndex(s => s.id === this.selectedSim.id);
        if (idx >= 0) this.simulations[idx] = { ...this.simulations[idx], ...payload };
        this.showEditModal = false;
        this.showToast('实验配置已保存', 'success');
      } catch (err) {
        this.showToast('保存失败: ' + (err.message || ''), 'error');
      }
    },
    countParams(params) {
      try {
        const p = typeof params === 'string' ? JSON.parse(params) : params;
        return p ? Object.keys(p).length : 0;
      } catch { return 0; }
    },
    showToast(message, type = 'success') {
      this.toast = { message, type };
      setTimeout(() => { this.toast = null; }, 3000);
    }
  }
};
