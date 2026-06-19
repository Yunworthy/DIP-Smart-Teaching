/* ============================================================
 *  LabReportView.js — 实验报告（学生端）
 * ============================================================ */
var LabReportView = {
  name: 'LabReportView',
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">实验报告</h1>
          <p class="text-gray-500 mt-1">综合实验报告，系统分析与总结</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button v-for="tab in tabs" :key="tab.key"
                @click="activeTab = tab.key"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :class="activeTab === tab.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                :class="activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
      </div>

      <!-- Pending Tab -->
      <div v-if="!loading && activeTab === 'pending'" class="space-y-4">
        <div v-for="a in pendingAssignments" :key="a.id"
             class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">实验报告</span>
                <span class="text-xs text-gray-400">{{ a.chapter_title || '' }}</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-800">{{ a.title }}</h3>
              <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ a.description }}</p>
              <div class="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  截止: {{ formatDate(a.deadline) }}
                </span>
                <span>满分: {{ a.max_score }}分</span>
              </div>
            </div>
            <button @click="openSubmitModal(a)"
                    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all">
              提交报告
            </button>
          </div>
        </div>
        <div v-if="pendingAssignments.length === 0" class="text-center py-16">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-gray-400">太棒了！所有实验报告都已提交</p>
        </div>
      </div>

      <!-- Submitted Tab -->
      <div v-if="!loading && activeTab === 'submitted'" class="space-y-4">
        <div v-for="s in submittedSubmissions" :key="s.id"
             class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{{ s.assignment_title || '实验报告' }}</h3>
              <p class="text-sm text-gray-500 mt-1 whitespace-pre-line">{{ s.content }}</p>
              <span class="text-xs text-gray-400 mt-2 block">提交时间: {{ formatDate(s.submitted_at) }}</span>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-medium" :class="statusBadge(s.status)">
              {{ statusName(s.status) }}
            </span>
          </div>
        </div>
        <div v-if="submittedSubmissions.length === 0" class="text-center py-16 text-gray-400">
          <p>暂无已提交的实验报告</p>
        </div>
      </div>

      <!-- Graded Tab -->
      <div v-if="!loading && activeTab === 'graded'" class="space-y-4">
        <div v-for="s in gradedSubmissions" :key="s.id"
             class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-800">{{ s.assignment_title || '实验报告' }}</h3>
              <p class="text-sm text-gray-500 mt-1 whitespace-pre-line">{{ s.content }}</p>
              <div v-if="s.feedback" class="mt-3 p-3 bg-blue-50 rounded-lg">
                <p class="text-xs font-medium text-blue-700 mb-1">教师评语:</p>
                <p class="text-sm text-blue-600 whitespace-pre-line">{{ s.feedback }}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold" :class="s.score >= 60 ? 'text-green-600' : 'text-red-500'">{{ s.score }}</div>
              <div class="text-xs text-gray-400">/ {{ s.max_score || 100 }}分</div>
            </div>
          </div>
        </div>
        <div v-if="gradedSubmissions.length === 0" class="text-center py-16 text-gray-400">
          <p>暂无已批阅的实验报告</p>
        </div>
      </div>

      <!-- Submit Modal (Structured) -->
      <div v-if="showSubmitModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showSubmitModal = false">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold text-gray-800 mb-2">提交实验报告</h2>
          <p class="text-sm text-gray-500 mb-6">{{ submittingAssignment?.title }}</p>
          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- 实验目的 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  实验目的
                </span>
              </label>
              <textarea v-model="reportForm.purpose" rows="3" required
                        class="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                        placeholder="描述本次实验的目的和预期目标..."></textarea>
            </div>
            <!-- 实验原理 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  实验原理
                </span>
              </label>
              <textarea v-model="reportForm.principle" rows="3" required
                        class="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                        placeholder="阐述实验涉及的理论原理和方法..."></textarea>
            </div>
            <!-- 实验步骤 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  实验步骤
                </span>
              </label>
              <textarea v-model="reportForm.steps" rows="4" required
                        class="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                        placeholder="按步骤记录实验操作过程，包括参数设置、处理方法等..."></textarea>
            </div>
            <!-- 实验结果与分析 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  实验结果与分析
                </span>
              </label>
              <textarea v-model="reportForm.results" rows="4" required
                        class="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                        placeholder="记录实验结果，分析现象，总结规律和结论..."></textarea>
            </div>
            <!-- 附件上传 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  附件上传（可选）
                </span>
              </label>
              <div v-if="!selectedFile" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop"
                   class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 transition">
                <input ref="fileInput" type="file" accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,.zip" @change="handleFileSelect" class="hidden">
                <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                <p class="text-sm text-gray-400">点击或拖拽文件到此处上传</p>
                <p class="text-xs text-gray-300 mt-1">支持 .doc/.docx/.pdf/.png/.jpg/.zip，最大 10MB</p>
              </div>
              <div v-else class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <svg class="w-8 h-8 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate">{{ selectedFile.name }}</p>
                  <p class="text-xs text-gray-400">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                </div>
                <button type="button" @click="removeFile" class="text-gray-400 hover:text-red-500 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div class="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button type="button" @click="showSubmitModal = false"
                      class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                取消
              </button>
              <button type="submit" :disabled="submitting"
                      class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition disabled:opacity-60">
                {{ submitting ? '提交中...' : '确认提交' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      activeTab: 'pending',
      assignments: [],
      submissions: [],
      showSubmitModal: false,
      submittingAssignment: null,
      submitting: false,
      reportForm: {
        purpose: '',
        principle: '',
        steps: '',
        results: '',
      },
      selectedFile: null,
      uploading: false,
    };
  },
  computed: {
    labReportAssignments() {
      return this.assignments.filter(function(a) { return a.type === 'lab_report'; });
    },
    pendingAssignments() {
      var submittedIds = new Set(this.submissions.map(function(s) { return s.assignment_id; }));
      return this.labReportAssignments.filter(function(a) { return !submittedIds.has(a.id); });
    },
    labReportSubmissions() {
      var labReportIds = new Set(this.labReportAssignments.map(function(a) { return a.id; }));
      return this.submissions.filter(function(s) { return labReportIds.has(s.assignment_id); });
    },
    submittedSubmissions() {
      return this.labReportSubmissions.filter(function(s) { return s.status === 'pending' || s.status === 'reviewed'; });
    },
    gradedSubmissions() {
      return this.labReportSubmissions.filter(function(s) { return s.status === 'graded' || s.status === 'returned'; });
    },
    tabs() {
      return [
        { key: 'pending', label: '待提交', count: this.pendingAssignments.length },
        { key: 'submitted', label: '已提交', count: this.submittedSubmissions.length },
        { key: 'graded', label: '已批阅', count: this.gradedSubmissions.length },
      ];
    },
  },
  async mounted() {
    try {
      var results = await Promise.allSettled([
        api.getAssignments(),
        api.getMySubmissions(),
      ]);
      this.assignments = results[0].status === 'fulfilled' ? (Array.isArray(results[0].value) ? results[0].value : (results[0].value.assignments || [])) : [];
      this.submissions = results[1].status === 'fulfilled' ? (Array.isArray(results[1].value) ? results[1].value : (results[1].value.submissions || [])) : [];
    } catch (e) { console.error(e); }
    this.loading = false;
  },
  methods: {
    openSubmitModal(a) {
      this.submittingAssignment = a;
      this.reportForm.purpose = '';
      this.reportForm.principle = '';
      this.reportForm.steps = '';
      this.reportForm.results = '';
      this.selectedFile = null;
      this.uploading = false;
      this.showSubmitModal = true;
    },
    buildContent() {
      var parts = [];
      parts.push('【实验目的】');
      parts.push(this.reportForm.purpose.trim());
      parts.push('');
      parts.push('【实验原理】');
      parts.push(this.reportForm.principle.trim());
      parts.push('');
      parts.push('【实验步骤】');
      parts.push(this.reportForm.steps.trim());
      parts.push('');
      parts.push('【实验结果与分析】');
      parts.push(this.reportForm.results.trim());
      return parts.join('\n');
    },
    async handleSubmit() {
      if (!this.reportForm.purpose.trim() || !this.reportForm.principle.trim() ||
          !this.reportForm.steps.trim() || !this.reportForm.results.trim()) return;
      this.submitting = true;
      try {
        var filePath = null;
        if (this.selectedFile) {
          this.uploading = true;
          var formData = new FormData();
          formData.append('file', this.selectedFile);
          var uploadRes = await api.uploadFile(formData);
          filePath = uploadRes.filePath || uploadRes.url || uploadRes.path || null;
          this.uploading = false;
        }
        var submitData = {
          assignment_id: this.submittingAssignment.id,
          content: this.buildContent(),
        };
        if (filePath) submitData.filePath = filePath;
        await api.submitAssignment(submitData);
        store.notify('实验报告提交成功！', 'success');
        this.showSubmitModal = false;
        var subs = await api.getMySubmissions();
        this.submissions = Array.isArray(subs) ? subs : (subs.submissions || []);
      } catch (e) {
        this.uploading = false;
        store.notify('提交失败: ' + (e.message || ''), 'error');
      }
      this.submitting = false;
    },
    triggerFileInput() {
      this.$refs.fileInput && this.$refs.fileInput.click();
    },
    handleFileSelect(e) {
      var file = e.target.files && e.target.files[0];
      if (file) this._validateAndSetFile(file);
    },
    handleDrop(e) {
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) this._validateAndSetFile(file);
    },
    _validateAndSetFile(file) {
      var allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf', 'image/png', 'image/jpeg', 'application/zip'];
      var allowedExts = ['.doc', '.docx', '.pdf', '.png', '.jpg', '.jpeg', '.zip'];
      var ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (allowedTypes.indexOf(file.type) === -1 && allowedExts.indexOf(ext) === -1) {
        store.notify('不支持的文件类型，请上传 .doc/.docx/.pdf/.png/.jpg/.zip 文件', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        store.notify('文件大小不能超过 10MB', 'error');
        return;
      }
      this.selectedFile = file;
    },
    removeFile() {
      this.selectedFile = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },
    statusName(s) {
      return { pending: '待审核', reviewed: '已审核', returned: '已退回', graded: '已评分' }[s] || s;
    },
    statusBadge(s) {
      return { pending: 'bg-yellow-50 text-yellow-700', reviewed: 'bg-blue-50 text-blue-700', returned: 'bg-red-50 text-red-700', graded: 'bg-green-50 text-green-700' }[s] || 'bg-gray-100 text-gray-600';
    },
    formatDate(d) {
      if (!d) return '-';
      return new Date(d).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
  },
};
