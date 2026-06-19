var SystemConfig = {
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">系统配置</h1>
        <button @click="saveAllSettings" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" :disabled="saving">
          {{ saving ? '保存中...' : '保存所有设置' }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <div v-else class="space-y-6">
        <!-- Platform Settings -->
        <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>平台信息</span>
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">平台名称</label>
              <input v-model="settings.platformName" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">版本号</label>
              <input v-model="settings.version" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">平台描述</label>
              <textarea v-model="settings.platformDescription" rows="3" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
          </div>
        </div>

        <!-- Semester Settings -->
        <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span>学期设置</span>
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">当前学期</label>
              <input v-model="settings.currentSemester" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="如: 2024-2025第一学期" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">学期开始日期</label>
              <input v-model="settings.semesterStart" type="date" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">学期结束日期</label>
              <input v-model="settings.semesterEnd" type="date" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        <!-- Grading Policy -->
        <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <span>成绩权重设置</span>
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">作业权重</label>
              <div class="flex items-center space-x-3">
                <input type="range" v-model.number="settings.homeworkWeight" min="0" max="100" class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                <span class="text-sm font-bold text-gray-800 w-12 text-right">{{ settings.homeworkWeight }}%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">实验权重</label>
              <div class="flex items-center space-x-3">
                <input type="range" v-model.number="settings.experimentWeight" min="0" max="100" class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                <span class="text-sm font-bold text-gray-800 w-12 text-right">{{ settings.experimentWeight }}%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">案例权重</label>
              <div class="flex items-center space-x-3">
                <input type="range" v-model.number="settings.caseWeight" min="0" max="100" class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                <span class="text-sm font-bold text-gray-800 w-12 text-right">{{ settings.caseWeight }}%</span>
              </div>
            </div>
          </div>
          <div class="mt-3 p-3 rounded-lg text-sm"
            :class="totalWeight === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
            当前总权重: {{ totalWeight }}%
            <span v-if="totalWeight !== 100"> (建议调整为 100%)</span>
            <span v-else> &#10003;</span>
          </div>
        </div>

        <!-- Announcements -->
        <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.833c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
              <span>公告管理</span>
            </h3>
            <button @click="openAnnouncementModal()" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              + 新建公告
            </button>
          </div>

          <div v-if="announcements.length === 0" class="text-center py-8 text-gray-400">
            <p>暂无公告</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="a in announcements" :key="a.id" class="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="font-medium text-gray-800">{{ a.title }}</h4>
                  <span class="px-2 py-0.5 text-xs rounded" :class="a.pinned ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'">
                    {{ a.pinned ? '置顶' : '普通' }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 line-clamp-2">{{ a.content }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(a.createdAt) }}</p>
              </div>
              <div class="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button @click="openAnnouncementModal(a)" class="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                <button @click="deleteAnnouncement(a)" class="text-red-500 hover:text-red-700 text-sm">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Announcement Modal -->
      <div v-if="showAnnModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ annForm.id ? '编辑公告' : '新建公告' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
              <input v-model="annForm.title" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
              <textarea v-model="annForm.content" rows="5" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div class="flex items-center space-x-2">
              <input type="checkbox" v-model="annForm.pinned" id="ann-pinned" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label for="ann-pinned" class="text-sm text-gray-700">置顶公告</label>
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click="showAnnModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
            <button @click="saveAnnouncement" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" :disabled="!annForm.title || !annForm.content">
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
      saving: false,
      settings: {
        platformName: '图像仿真教学平台',
        platformDescription: '',
        version: 'v1.0.0',
        currentSemester: '',
        semesterStart: '',
        semesterEnd: '',
        homeworkWeight: 40,
        experimentWeight: 40,
        caseWeight: 20
      },
      announcements: [],
      showAnnModal: false,
      annForm: { id: null, title: '', content: '', pinned: false },
      toast: null
    };
  },
  computed: {
    totalWeight() {
      return (this.settings.homeworkWeight || 0) + (this.settings.experimentWeight || 0) + (this.settings.caseWeight || 0);
    }
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const results = await Promise.allSettled([
          api.getAdminStats ? api.getAdminStats() : Promise.resolve({}),
          api.getAnnouncements ? api.getAnnouncements() : Promise.resolve({ data: [] })
        ]);

        if (results[0].status === 'fulfilled') {
          const data = results[0].value.data || results[0].value;
          if (data.settings) Object.assign(this.settings, data.settings);
          if (data.platformName) this.settings.platformName = data.platformName;
        }
        if (results[1].status === 'fulfilled') {
          const data = results[1].value.data || results[1].value;
          this.announcements = Array.isArray(data) ? data : (data.announcements || []);
        }
      } catch (err) {
        this.showToast('加载配置失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    async saveAllSettings() {
      this.saving = true;
      try {
        // Save settings (API call if available)
        if (api.updateSettings) {
          await api.updateSettings(this.settings);
        }
        this.showToast('设置已保存', 'success');
      } catch (err) {
        this.showToast('保存失败', 'error');
      } finally {
        this.saving = false;
      }
    },
    openAnnouncementModal(ann) {
      if (ann) {
        this.annForm = { id: ann.id, title: ann.title, content: ann.content, pinned: ann.pinned || false };
      } else {
        this.annForm = { id: null, title: '', content: '', pinned: false };
      }
      this.showAnnModal = true;
    },
    async saveAnnouncement() {
      if (!this.annForm.title || !this.annForm.content) return;
      try {
        if (this.annForm.id) {
          if (api.updateAnnouncement) await api.updateAnnouncement(this.annForm.id, this.annForm);
          const idx = this.announcements.findIndex(a => a.id === this.annForm.id);
          if (idx >= 0) this.announcements[idx] = { ...this.announcements[idx], ...this.annForm };
        } else {
          if (api.createAnnouncement) await api.createAnnouncement(this.annForm);
          this.announcements.unshift({ id: Date.now(), ...this.annForm, createdAt: new Date().toISOString() });
        }
        this.showAnnModal = false;
        this.showToast('公告已保存', 'success');
      } catch (err) {
        this.showToast('保存失败', 'error');
      }
    },
    async deleteAnnouncement(ann) {
      if (!confirm('确定删除公告"' + ann.title + '"？')) return;
      try {
        if (api.deleteAnnouncement) await api.deleteAnnouncement(ann.id);
        this.announcements = this.announcements.filter(a => a.id !== ann.id);
        this.showToast('公告已删除', 'success');
      } catch {
        this.showToast('删除失败', 'error');
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    },
    showToast(message, type = 'success') {
      this.toast = { message, type };
      setTimeout(() => { this.toast = null; }, 3000);
    }
  }
};
