var CourseManage = {
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">课程内容管理</h1>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-600">{{ error }}</p>
        <button @click="loadChapters" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
          重新加载
        </button>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Chapter List -->
        <div class="bg-white rounded-xl shadow border border-gray-100">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-800">章节目录</h3>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-if="chapters.length === 0" class="p-6 text-center text-gray-400">
              暂无章节数据
            </div>
            <div
              v-for="(ch, idx) in chapters"
              :key="ch.id"
              @click="selectChapter(ch)"
              :class="[
                'p-4 cursor-pointer transition-colors flex items-center justify-between',
                selectedChapter?.id === ch.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50 border-l-4 border-transparent'
              ]"
            >
              <div class="flex items-center space-x-3 min-w-0">
                <span class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ ch.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ ch.knowledge_point_count || 0 }} 个知识点</p>
                </div>
              </div>
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Right: Chapter Detail -->
        <div class="lg:col-span-2 space-y-6">
          <div v-if="!selectedChapter" class="bg-white rounded-xl shadow border border-gray-100 p-12 text-center text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <p>请选择左侧章节查看详情</p>
          </div>

          <template v-else>
            <!-- Chapter Detail Loading -->
            <div v-if="detailLoading" class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>

            <template v-else>
              <!-- Chapter Description -->
              <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold text-gray-800">章节描述</h3>
                  <button
                    v-if="!editingDescription"
                    @click="editingDescription = true; draftDescription = chapterDetail.description || ''"
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >编辑</button>
                  <div v-else class="flex space-x-2">
                    <button @click="saveDescription" class="text-sm text-green-600 hover:text-green-800 font-medium">保存</button>
                    <button @click="editingDescription = false" class="text-sm text-gray-500 hover:text-gray-700">取消</button>
                  </div>
                </div>
                <textarea
                  v-if="editingDescription"
                  v-model="draftDescription"
                  rows="4"
                  class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入章节描述..."
                ></textarea>
                <p v-else class="text-sm text-gray-600 leading-relaxed">{{ chapterDetail.description || '暂无描述' }}</p>
              </div>

              <!-- Knowledge Points -->
              <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold text-gray-800">知识点</h3>
                  <button @click="showKpModal = true; kpForm = { title: '', description: '' }" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    + 添加知识点
                  </button>
                </div>
                <div v-if="!chapterDetail.knowledgePoints || chapterDetail.knowledgePoints.length === 0" class="text-center py-6 text-gray-400 text-sm">
                  暂无知识点
                </div>
                <div v-else class="space-y-2">
                  <div v-for="(kp, idx) in chapterDetail.knowledgePoints" :key="kp.id || idx" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-800">{{ kp.title || kp.name }}</p>
                      <p v-if="kp.description" class="text-xs text-gray-500 mt-0.5 truncate">{{ kp.description }}</p>
                    </div>
                    <div class="flex space-x-2 ml-3 flex-shrink-0">
                      <button @click="editKp(kp)" class="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                      <button @click="deleteKp(kp, idx)" class="text-red-500 hover:text-red-700 text-sm">删除</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Linked Simulations -->
              <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
                <h3 class="font-semibold text-gray-800 mb-4">关联仿真实验</h3>
                <div v-if="!chapterDetail.simulations || chapterDetail.simulations.length === 0" class="text-center py-6 text-gray-400 text-sm">
                  暂无关联实验
                </div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="sim in chapterDetail.simulations" :key="sim.id" class="p-3 border border-gray-200 rounded-lg">
                    <p class="text-sm font-medium text-gray-800">{{ sim.title || sim.name }}</p>
                    <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ sim.description || '' }}</p>
                    <span class="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">{{ sim.type || '实验' }}</span>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- Knowledge Point Modal -->
      <div v-if="showKpModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ kpForm.id ? '编辑知识点' : '添加知识点' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input v-model="kpForm.title" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="知识点标题" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea v-model="kpForm.description" rows="3" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="知识点描述"></textarea>
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click="showKpModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
            <button @click="saveKp" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" :disabled="!kpForm.title">
              保存
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
      detailLoading: false,
      error: null,
      chapters: [],
      selectedChapter: null,
      chapterDetail: {},
      editingDescription: false,
      draftDescription: '',
      showKpModal: false,
      kpForm: { id: null, title: '', description: '' },
      toast: null
    };
  },
  async mounted() {
    await this.loadChapters();
  },
  methods: {
    async loadChapters() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getChapters();
        const data = res.data || res;
        this.chapters = Array.isArray(data) ? data : (data.chapters || []);
      } catch (err) {
        this.error = '加载章节失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    async selectChapter(ch) {
      this.selectedChapter = ch;
      this.detailLoading = true;
      this.editingDescription = false;
      try {
        const res = await api.getChapter(ch.id);
        const data = res.data || res;
        this.chapterDetail = {
          ...ch,
          ...data,
          knowledgePoints: data.knowledgePoints || data.knowledge_points || ch.knowledgePoints || [],
          simulations: data.simulations || [],
          description: data.description || ch.description || ''
        };
      } catch (err) {
        this.chapterDetail = { ...ch, knowledgePoints: ch.knowledgePoints || [], simulations: [], description: ch.description || '' };
        this.showToast('加载章节详情失败', 'error');
      } finally {
        this.detailLoading = false;
      }
    },
    async saveDescription() {
      try {
        this.chapterDetail.description = this.draftDescription;
        this.editingDescription = false;
        this.showToast('描述已保存', 'success');
      } catch (err) {
        this.showToast('保存失败', 'error');
      }
    },
    editKp(kp) {
      this.kpForm = { id: kp.id, title: kp.title || kp.name || '', description: kp.description || '' };
      this.showKpModal = true;
    },
    async saveKp() {
      if (!this.kpForm.title) return;
      const kps = this.chapterDetail.knowledgePoints || [];
      if (this.kpForm.id) {
        const idx = kps.findIndex(k => k.id === this.kpForm.id);
        if (idx >= 0) {
          kps[idx] = { ...kps[idx], title: this.kpForm.title, description: this.kpForm.description };
        }
      } else {
        kps.push({ id: Date.now(), title: this.kpForm.title, description: this.kpForm.description });
      }
      this.chapterDetail.knowledgePoints = [...kps];
      this.showKpModal = false;
      this.showToast('知识点已保存', 'success');
    },
    deleteKp(kp, idx) {
      if (!confirm('确定删除该知识点？')) return;
      const kps = [...(this.chapterDetail.knowledgePoints || [])];
      kps.splice(idx, 1);
      this.chapterDetail.knowledgePoints = kps;
      this.showToast('知识点已删除', 'success');
    },
    showToast(message, type = 'success') {
      this.toast = { message, type };
      setTimeout(() => { this.toast = null; }, 3000);
    }
  }
};
