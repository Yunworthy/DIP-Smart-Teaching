var AssignmentGrading = {
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">作业管理与批改</h1>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            @click="activeTab = 'manage'"
            class="pb-3 px-1 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'manage' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >作业管理</button>
          <button
            @click="activeTab = 'grade'"
            class="pb-3 px-1 text-sm font-medium border-b-2 transition-colors relative"
            :class="activeTab === 'grade' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            作业批改
            <span v-if="totalPending > 0" class="absolute -top-1 -right-4 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {{ totalPending > 99 ? '99+' : totalPending }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- Tab 1: Assignment Management -->
      <div v-else-if="activeTab === 'manage'" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">共 {{ filteredAssignments.length }} 个作业</p>
          <div class="flex items-center gap-2">
            <select v-model="typeFilter" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
              <option value="">全部类型</option>
              <option value="homework">平时作业</option>
              <option value="lab_report">实验报告</option>
            </select>
            <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>创建作业</span>
            </button>
          </div>
        </div>

        <!-- Assignment List -->
        <div v-if="filteredAssignments.length === 0" class="bg-white rounded-xl shadow border border-gray-100 p-12 text-center text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p>暂无作业，点击"创建作业"开始</p>
        </div>

        <div v-else class="space-y-3">
          <div v-for="a in filteredAssignments" :key="a.id" class="bg-white rounded-xl shadow border border-gray-100 p-5">
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <h3 class="font-semibold text-gray-800">{{ a.title }}</h3>
                  <span class="px-2 py-0.5 text-xs rounded" :class="a.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                    {{ a.is_published ? '已发布' : '未发布' }}
                  </span>
                  <span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">{{ a.type || '普通' }}</span>
                </div>
                <p class="text-sm text-gray-500 line-clamp-2">{{ a.description || '暂无描述' }}</p>
                <div class="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span v-if="a.deadline">截止: {{ formatDate(a.deadline) }}</span>
                  <span v-if="a.max_score">满分: {{ a.max_score }}</span>
                  <span>提交: {{ a.submissionCount || 0 }}</span>
                  <span v-if="a.chapter_title">章节: {{ a.chapter_title }}</span>
                </div>
              </div>
              <div class="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button @click="exportAssignmentGrades(a.id, a.title)" class="px-3 py-1.5 bg-green-50 border border-green-200 text-green-600 rounded-lg text-xs hover:bg-green-100">导出成绩</button>
                <button @click="togglePublish(a)" class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  :class="a.is_published ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : 'border-green-300 text-green-600 hover:bg-green-50'">
                  {{ a.is_published ? '取消发布' : '发布' }}
                </button>
                <button @click="editAssignment(a)" class="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50">编辑</button>
                <button @click="deleteAssignment(a)" class="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Grading -->
      <div v-else class="space-y-4">
        <!-- Batch grading toolbar -->
        <div v-if="groupedSubmissions.length > 0" class="flex items-center justify-between bg-white rounded-xl shadow border border-gray-100 p-3">
          <div class="flex items-center space-x-3">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300" @change="toggleSelectAll($event)" />
              <span class="text-sm text-gray-600">全选待批改</span>
            </label>
            <span v-if="selectedCount > 0" class="text-sm text-blue-600 font-medium">已选 {{ selectedCount }} 份</span>
          </div>
          <button v-if="selectedCount > 0" @click="openBatchModal" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center space-x-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            <span>批量评分</span>
          </button>
        </div>

        <div v-if="groupedSubmissions.length === 0" class="bg-white rounded-xl shadow border border-gray-100 p-12 text-center text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>暂无待批改作业</p>
        </div>

        <div v-for="group in groupedSubmissions" :key="group.assignmentId" class="bg-white rounded-xl shadow border border-gray-100">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <h3 class="font-semibold text-gray-800">{{ group.assignmentTitle }}</h3>
              <span class="text-xs text-gray-500">{{ group.submissions.length }} 份待批改</span>
            </div>
            <button @click="exportAssignmentGrades(group.assignmentId, group.assignmentTitle)" class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 flex items-center space-x-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>导出本次作业成绩</span>
            </button>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-for="sub in group.submissions" :key="sub.id" class="p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-start space-x-3">
                  <input type="checkbox" :checked="selectedSubmissions[sub.id] || false" @change="toggleSelectSubmission(sub.id, $event)" class="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ sub.studentName || sub.username || '未知学生' }}</p>
                    <p class="text-xs text-gray-500">学号: {{ sub.studentId || sub.student_id || '--' }} | 提交: {{ formatDate(sub.createdAt) }}</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 text-xs rounded" :class="statusClass(sub.status)">{{ statusLabel(sub.status) }}</span>
              </div>

              <!-- Submission Content -->
              <div class="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                <p v-if="sub.content" class="whitespace-pre-line">{{ sub.content }}</p>
                <div v-if="sub.file_path" class="mt-2">
                  <p class="text-xs text-gray-500">附件:</p>
                  <a :href="sub.file_path" target="_blank" class="text-xs text-blue-600 hover:underline block">
                    查看上传文件
                  </a>
                </div>
                <div v-if="sub.attachments && sub.attachments.length > 0" class="mt-2 space-y-1">
                  <p class="text-xs text-gray-500">附件:</p>
                  <a v-for="att in sub.attachments" :key="att.url || att" :href="att.url || att" target="_blank" class="text-xs text-blue-600 hover:underline block">
                    {{ att.name || att }}
                  </a>
                </div>
                <p v-if="!sub.content && (!sub.attachments || sub.attachments.length === 0) && !sub.file_path" class="text-gray-400 text-center">无提交内容</p>
              </div>

              <!-- Grading Panel -->
              <div v-if="sub.status === 'pending' || sub._editing" class="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">评分 (0 - {{ sub.maxScore || group.maxScore || 100 }})</label>
                    <div class="flex items-center space-x-3">
                      <input
                        type="range"
                        v-model.number="sub._score"
                        min="0"
                        :max="sub.maxScore || group.maxScore || 100"
                        class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        v-model.number="sub._score"
                        min="0"
                        :max="sub.maxScore || group.maxScore || 100"
                        class="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">反馈</label>
                    <textarea v-model="sub._feedback" rows="2" class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入评语..."></textarea>
                  </div>
                </div>
                <div class="flex items-center space-x-2 mt-3">
                  <button @click="submitGrade(sub, 'approved')" class="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                    通过
                  </button>
                  <button @click="submitGrade(sub, 'returned')" class="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">
                    退回
                  </button>
                  <button @click="submitGradeAndNext(sub, group, 'approved')" class="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 border border-green-200">
                    通过并下一个
                  </button>
                  <div v-if="sub._saving" class="flex items-center space-x-1 text-sm text-gray-500">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>保存中...</span>
                  </div>
                </div>
              </div>
              <div v-else class="flex items-center space-x-3">
                <span v-if="sub.score != null" class="text-sm font-bold" :class="sub.score >= 60 ? 'text-green-600' : 'text-red-500'">
                  得分: {{ sub.score }}
                </span>
                <span v-if="sub.feedback" class="text-xs text-gray-500 italic whitespace-pre-line">{{ sub.feedback }}</span>
                <button @click="sub._editing = true; sub._score = sub.score || 0; sub._feedback = sub.feedback || ''" class="text-xs text-blue-600 hover:text-blue-800 ml-auto">
                  修改评分
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ formMode === 'edit' ? '编辑作业' : '创建作业' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
              <input v-model="form.title" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea v-model="form.description" rows="3" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select v-model="form.type" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="homework">作业</option>
                  <option value="experiment">实验</option>
                  <option value="case">案例分析</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">满分</label>
                <input v-model.number="form.max_score" type="number" min="0" max="100" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">章节</label>
                <select v-model="form.chapter_id" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">不限</option>
                  <option v-for="ch in chapters" :key="ch.id" :value="ch.id">{{ ch.title }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">仿真实验</label>
                <select v-model="form.simulation_key" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">不限</option>
                  <option v-for="sim in simulations" :key="sim.key || sim.id" :value="sim.key || sim.id">{{ sim.title || sim.name }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">截止时间</label>
              <input v-model="form.deadline" type="datetime-local" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
            <button @click="saveAssignment" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" :disabled="!form.title">
              {{ formMode === 'edit' ? '保存修改' : '创建' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Batch Grading Modal -->
      <div v-if="showBatchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">批量评分</h3>
          <p class="text-sm text-gray-500 mb-4">已选择 {{ selectedCount }} 份待批改提交，将统一评分。</p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">评分</label>
              <input v-model.number="batchForm.score" type="number" min="0" max="100" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select v-model="batchForm.status" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="graded">已评分</option>
                <option value="approved">已通过</option>
                <option value="returned">已退回</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">统一评语（可选）</label>
              <textarea v-model="batchForm.feedback" rows="3" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="输入统一评语..."></textarea>
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click="showBatchModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
            <button @click="submitBatchGrade" :disabled="batchSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
              {{ batchSubmitting ? '提交中...' : '确认批量评分' }}
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
      error: null,
      activeTab: 'manage',
      assignments: [],
      chapters: [],
      simulations: [],
      allSubmissions: {},
      showModal: false,
      formMode: 'create',
      form: { id: null, title: '', description: '', type: 'homework', chapter_id: '', simulation_key: '', deadline: '', max_score: 100, is_published: false },
      toast: null,
      typeFilter: '',
      selectedSubmissions: {},
      showBatchModal: false,
      batchForm: { score: 85, feedback: '', status: 'graded' },
      batchSubmitting: false,
    };
  },
  computed: {
    filteredAssignments() {
      if (!this.typeFilter) return this.assignments;
      var filter = this.typeFilter;
      return this.assignments.filter(function(a) {
        return a.type === filter;
      });
    },
    totalPending() {
      let count = 0;
      Object.values(this.allSubmissions).forEach(subs => {
        count += subs.filter(s => s.status === 'pending').length;
      });
      return count;
    },
    groupedSubmissions() {
      const groups = [];
      for (const a of this.assignments) {
        const subs = this.allSubmissions[a.id] || [];
        const pending = subs.filter(s => s.status === 'pending' || s.status === 'returned');
        if (pending.length > 0) {
          groups.push({
            assignmentId: a.id,
            assignmentTitle: a.title,
            maxScore: a.max_score || 100,
            submissions: pending.map(s => ({
              ...s,
              _score: s.score || 0,
              _feedback: s.feedback || '',
              _editing: false,
              _saving: false
            }))
          });
        }
      }
      return groups;
    },
    selectedCount() {
      return Object.keys(this.selectedSubmissions).filter(k => this.selectedSubmissions[k]).length;
    }
  },
  async mounted() {
    await this.loadData();
    const querySubId = this.$route?.query?.submission;
    if (querySubId) {
      this.activeTab = 'grade';
    }
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      try {
        const [assignRes, chapRes, simRes] = await Promise.allSettled([
          api.getAssignments(),
          api.getChapters(),
          api.getSimulations()
        ]);

        if (assignRes.status === 'fulfilled') {
          const data = assignRes.value.data || assignRes.value;
          this.assignments = Array.isArray(data) ? data : (data.assignments || []);
        }
        if (chapRes.status === 'fulfilled') {
          const data = chapRes.value.data || chapRes.value;
          this.chapters = Array.isArray(data) ? data : (data.chapters || []);
        }
        if (simRes.status === 'fulfilled') {
          const data = simRes.value.data || simRes.value;
          this.simulations = Array.isArray(data) ? data : (data.simulations || []);
        }

        // Load submissions for each assignment
        for (const a of this.assignments) {
          try {
            const subRes = await api.getAssignmentSubmissions(a.id);
            const subData = subRes.data || subRes;
            this.allSubmissions[a.id] = Array.isArray(subData) ? subData : (subData.submissions || []);
          } catch { this.allSubmissions[a.id] = []; }
        }
        this.allSubmissions = { ...this.allSubmissions };
      } catch (err) {
        this.error = '加载数据失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    openCreateModal() {
      this.formMode = 'create';
      this.form = { id: null, title: '', description: '', type: 'homework', chapter_id: '', simulation_key: '', deadline: '', max_score: 100, is_published: false };
      this.showModal = true;
    },
    editAssignment(a) {
      this.formMode = 'edit';
      this.form = {
        id: a.id,
        title: a.title,
        description: a.description || '',
        type: a.type || 'homework',
        chapter_id: a.chapter_id || '',
        simulation_key: a.simulation_key || '',
        deadline: a.deadline || '',
        max_score: a.max_score || 100,
        is_published: a.is_published || false
      };
      this.showModal = true;
    },
    async saveAssignment() {
      if (!this.form.title) return;
      try {
        const payload = {
          title: this.form.title,
          description: this.form.description,
          type: this.form.type,
          chapter_id: this.form.chapter_id || undefined,
          simulation_key: this.form.simulation_key || undefined,
          deadline: this.form.deadline || undefined,
          max_score: this.form.max_score,
          is_published: this.form.is_published
        };

        if (this.formMode === 'edit') {
          const updated = await api.updateAssignment(this.form.id, payload);
          const idx = this.assignments.findIndex(a => a.id === this.form.id);
          if (idx >= 0) this.assignments[idx] = { ...this.assignments[idx], ...(updated || payload) };
          this.showToast('作业已更新', 'success');
        } else {
          const newA = await api.createAssignment(payload);
          this.assignments.unshift(newA || { id: Date.now(), ...payload, submissionCount: 0 });
          this.showToast('作业已创建', 'success');
        }
        this.showModal = false;
      } catch (err) {
        this.showToast('保存失败: ' + (err.message || ''), 'error');
      }
    },
    async deleteAssignment(a) {
      if (!confirm('确定删除作业"' + a.title + '"？')) return;
      try {
        if (api.deleteAssignment) await api.deleteAssignment(a.id);
        this.assignments = this.assignments.filter(x => x.id !== a.id);
        this.showToast('作业已删除', 'success');
      } catch (err) {
        this.showToast('删除失败', 'error');
      }
    },
    async togglePublish(a) {
      const newPublished = !a.is_published;
      try {
        await api.updateAssignment(a.id, { is_published: newPublished, title: a.title, type: a.type });
        a.is_published = newPublished;
        this.showToast(a.is_published ? '已发布' : '已取消发布', 'success');
      } catch (err) {
        this.showToast('操作失败: ' + (err.message || ''), 'error');
      }
    },
    async submitGrade(sub, status) {
      sub._saving = true;
      try {
        if (api.reviewSubmission) {
          await api.reviewSubmission(sub.id, { score: sub._score, feedback: sub._feedback, status });
        }
        sub.status = status;
        sub.score = sub._score;
        sub.feedback = sub._feedback;
        sub._editing = false;
        this.showToast('评分已保存', 'success');
      } catch (err) {
        this.showToast('评分失败', 'error');
      } finally {
        sub._saving = false;
      }
    },
    async submitGradeAndNext(sub, group, status) {
      await this.submitGrade(sub, status);
      const idx = group.submissions.findIndex(s => s.id === sub.id);
      const next = group.submissions[idx + 1];
      if (next && next.status === 'pending') {
        next._editing = true;
        next._score = 0;
        next._feedback = '';
      }
    },
    async exportAssignmentGrades(assignmentId, assignmentTitle) {
      try {
        const url = '/api/export/grades?assignment_id=' + encodeURIComponent(assignmentId);
        const token = localStorage.getItem('dip-token');
        const res = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('导出失败 (' + res.status + ')');
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (assignmentTitle || '作业') + '_成绩导出.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        this.showToast('成绩已导出', 'success');
      } catch (err) {
        this.showToast('导出失败: ' + (err.message || '未知错误'), 'error');
      }
    },
    statusClass(status) {
      const map = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', returned: 'bg-red-100 text-red-700' };
      return map[status] || 'bg-gray-100 text-gray-500';
    },
    statusLabel(status) {
      const map = { pending: '待批改', approved: '已通过', returned: '已退回' };
      return map[status] || status;
    },
    formatDate(dateStr) {
      if (!dateStr) return '--';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    },
    toggleSelectAll(event) {
      const checked = event.target.checked;
      const newSelected = {};
      if (checked) {
        for (const group of this.groupedSubmissions) {
          for (const sub of group.submissions) {
            newSelected[sub.id] = true;
          }
        }
      }
      this.selectedSubmissions = newSelected;
    },
    toggleSelectSubmission(id, event) {
      const newSelected = { ...this.selectedSubmissions };
      if (event.target.checked) {
        newSelected[id] = true;
      } else {
        delete newSelected[id];
      }
      this.selectedSubmissions = newSelected;
    },
    openBatchModal() {
      this.batchForm = { score: 85, feedback: '', status: 'graded' };
      this.showBatchModal = true;
    },
    async submitBatchGrade() {
      if (this.batchSubmitting) return;
      this.batchSubmitting = true;
      try {
        const submissionIds = Object.keys(this.selectedSubmissions)
          .filter(k => this.selectedSubmissions[k])
          .map(k => Number(k));
        await api.batchReviewSubmissions({
          submission_ids: submissionIds,
          score: this.batchForm.score,
          feedback: this.batchForm.feedback,
          status: this.batchForm.status
        });
        this.showToast('批量评分完成，已更新 ' + submissionIds.length + ' 份', 'success');
        this.showBatchModal = false;
        this.selectedSubmissions = {};
        await this.loadData();
      } catch (err) {
        this.showToast('批量评分失败: ' + (err.message || ''), 'error');
      } finally {
        this.batchSubmitting = false;
      }
    },
    showToast(message, type = 'success') {
      this.toast = { message, type };
      setTimeout(() => { this.toast = null; }, 3000);
    }
  }
};
