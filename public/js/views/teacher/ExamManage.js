var ExamManage = {
  name: 'ExamManage',
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">考试管理</h1>
          <p class="text-gray-500 mt-1">创建和管理在线考试</p>
        </div>
        <button @click="showCreateModal = true; resetForm()"
          class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          创建考试
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Exam list -->
      <div v-else-if="exams.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-gray-500">暂无考试，点击上方按钮创建</p>
      </div>
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">考试名称</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">题目数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时长/满分</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">参加人数</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="exam in exams" :key="exam.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ exam.title }}</div>
                <div v-if="exam.description" class="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{{ exam.description }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ exam.question_actual || 0 }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ exam.duration_minutes }}分钟 / {{ exam.total_score }}分</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ exam.attempt_count || 0 }}</td>
              <td class="px-6 py-4">
                <span :class="exam.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                  class="inline-flex px-2 py-1 text-xs font-medium rounded-full">
                  {{ exam.is_published ? '已发布' : '草稿' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button @click="viewResults(exam)" class="text-sm text-blue-600 hover:text-blue-800">成绩</button>
                <button @click="editExam(exam)" class="text-sm text-indigo-600 hover:text-indigo-800">编辑</button>
                <button v-if="!exam.is_published" @click="publishExam(exam)" class="text-sm text-green-600 hover:text-green-800">发布</button>
                <button @click="deleteExam(exam)" class="text-sm text-red-600 hover:text-red-800">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
        <div class="bg-white rounded-xl shadow-2xl w-[700px] max-w-[95vw] my-8 mx-4">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">{{ editingExam ? '编辑考试' : '创建考试' }}</h3>
            <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">考试标题 *</label>
              <input v-model="form.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="输入考试标题" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="考试描述（可选）"></textarea>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">时长(分钟)</label>
                <input v-model.number="form.duration_minutes" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">满分</label>
                <input v-model.number="form.total_score" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">及格分</label>
                <input v-model.number="form.pass_score" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" v-model="form.shuffle_questions" class="rounded text-indigo-600" />
                题目随机排序
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" v-model="form.shuffle_options" class="rounded text-indigo-600" />
                选项随机排序
              </label>
            </div>

            <!-- Question selection -->
            <div class="border-t border-gray-200 pt-4">
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-medium text-gray-700">选择题目 (已选 {{ selectedQuestions.length }} 题)</label>
                <button @click="showQuestionPicker = true" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">从题库选择</button>
              </div>
              <div v-if="selectedQuestions.length === 0" class="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
                点击"从题库选择"添加考试题目
              </div>
              <div v-else class="space-y-2 max-h-48 overflow-y-auto">
                <div v-for="(sq, idx) in selectedQuestions" :key="sq.id"
                  class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                  <span class="text-gray-400 w-6 text-center">{{ idx + 1 }}</span>
                  <span class="flex-1 truncate text-gray-700">{{ sq.content }}</span>
                  <span class="text-xs text-gray-400">{{ typeLabel(sq.type) }}</span>
                  <span class="text-xs text-gray-400">{{ sq.score_weight }}分</span>
                  <button @click="removeQuestion(idx)" class="text-red-400 hover:text-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button @click="showCreateModal = false" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
            <button @click="saveExam" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">保存</button>
          </div>
        </div>
      </div>

      <!-- Question Picker Modal -->
      <div v-if="showQuestionPicker" class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
        <div class="bg-white rounded-xl shadow-2xl w-[800px] max-w-[95vw] my-8 mx-4">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">从题库选择题目</h3>
            <button @click="showQuestionPicker = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6">
            <!-- Filters -->
            <div class="flex gap-3 mb-4">
              <select v-model="pickerFilter.chapter_id" @change="loadPickerQuestions" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">全部章节</option>
                <option v-for="ch in chapters" :key="ch.id" :value="ch.id">{{ ch.title }}</option>
              </select>
              <select v-model="pickerFilter.type" @change="loadPickerQuestions" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">全部类型</option>
                <option value="single_choice">单选题</option>
                <option value="multi_choice">多选题</option>
                <option value="true_false">判断题</option>
                <option value="fill_blank">填空题</option>
                <option value="short_answer">简答题</option>
              </select>
              <select v-model="pickerFilter.difficulty" @change="loadPickerQuestions" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">全部难度</option>
                <option v-for="d in [1,2,3,4,5]" :key="d" :value="d">{{ d }} 级</option>
              </select>
            </div>
            <!-- Question list -->
            <div class="max-h-96 overflow-y-auto space-y-2">
              <div v-for="q in pickerQuestions" :key="q.id"
                :class="['flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition',
                  isSelected(q.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50']"
                @click="togglePickerQuestion(q)">
                <input type="checkbox" :checked="isSelected(q.id)" class="mt-1 rounded text-indigo-600" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-700 line-clamp-2">{{ q.content }}</p>
                  <div class="flex gap-2 mt-1">
                    <span class="text-xs text-gray-400">{{ typeLabel(q.type) }}</span>
                    <span class="text-xs text-gray-400">难度{{ q.difficulty }}</span>
                    <span class="text-xs text-gray-400">{{ q.score_weight }}分</span>
                  </div>
                </div>
              </div>
              <div v-if="pickerQuestions.length === 0" class="text-center text-gray-400 py-8">没有匹配的题目</div>
            </div>
          </div>
          <div class="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <span class="text-sm text-gray-500">已选择 {{ selectedQuestions.length }} 题</span>
            <button @click="showQuestionPicker = false" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">确定</button>
          </div>
        </div>
      </div>

      <!-- Results Modal -->
      <div v-if="showResultsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
        <div class="bg-white rounded-xl shadow-2xl w-[700px] max-w-[95vw] my-8 mx-4">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">考试成绩 - {{ resultsExam ? resultsExam.title : '' }}</h3>
            <button @click="showResultsModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6">
            <div v-if="resultsAttempts.length === 0" class="text-center text-gray-400 py-8">暂无考试记录</div>
            <table v-else class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">学生</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">班级</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">客观分</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">总分</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="a in resultsAttempts" :key="a.id" class="hover:bg-gray-50">
                  <td class="px-4 py-2 text-sm text-gray-900">{{ a.student_name }}</td>
                  <td class="px-4 py-2 text-sm text-gray-500">{{ a.student_number }}</td>
                  <td class="px-4 py-2 text-sm text-gray-500">{{ a.class_name }}</td>
                  <td class="px-4 py-2 text-sm text-gray-600">{{ a.objective_score !== null ? a.objective_score : '--' }}</td>
                  <td class="px-4 py-2 text-sm font-medium"
                    :class="a.total_score !== null ? (a.total_score >= (resultsExam ? resultsExam.pass_score : 60) ? 'text-green-600' : 'text-red-600') : 'text-gray-400'">
                    {{ a.total_score !== null ? a.total_score : '--' }}
                  </td>
                  <td class="px-4 py-2">
                    <span :class="attemptStatusClass(a.status)" class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full">
                      {{ attemptStatusLabel(a.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-2 text-sm">
                    <button v-if="a.status === 'submitted'" @click="gradeAttempt(a)" class="text-indigo-600 hover:text-indigo-800">批改</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      exams: [],
      chapters: [],
      showCreateModal: false,
      showQuestionPicker: false,
      showResultsModal: false,
      editingExam: null,
      resultsExam: null,
      resultsAttempts: [],
      form: {
        title: '',
        description: '',
        duration_minutes: 60,
        total_score: 100,
        pass_score: 60,
        shuffle_questions: true,
        shuffle_options: true,
      },
      selectedQuestions: [],
      pickerQuestions: [],
      pickerFilter: { chapter_id: '', type: '', difficulty: '' },
    };
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        this.exams = await api.request('GET', '/api/exam/exams');
      } catch (e) { /* */ }
      this.loading = false;
    },
    async loadChapters() {
      try {
        this.chapters = await api.request('GET', '/api/exam/chapters');
      } catch (e) { /* */ }
    },
    resetForm() {
      this.editingExam = null;
      this.form = { title: '', description: '', duration_minutes: 60, total_score: 100, pass_score: 60, shuffle_questions: true, shuffle_options: true };
      this.selectedQuestions = [];
    },
    editExam(exam) {
      this.editingExam = exam;
      this.form = {
        title: exam.title,
        description: exam.description || '',
        duration_minutes: exam.duration_minutes,
        total_score: exam.total_score,
        pass_score: exam.pass_score,
        shuffle_questions: !!exam.shuffle_questions,
        shuffle_options: !!exam.shuffle_options,
      };
      // Load exam questions
      api.request('GET', '/api/exam/exams/' + exam.id + '/questions').then(qs => {
        this.selectedQuestions = qs.map(q => ({
          id: q.id, content: q.content, type: q.type, difficulty: q.difficulty, score_weight: q.exam_score,
        }));
      }).catch(() => { this.selectedQuestions = []; });
      this.showCreateModal = true;
    },
    async saveExam() {
      if (!this.form.title) {
        if (window.store && window.store.notify) window.store.notify('请填写考试标题', 'warning');
        return;
      }
      const payload = {
        ...this.form,
        question_ids: this.selectedQuestions.map(q => ({ id: q.id, score: q.score_weight || 5 })),
      };
      try {
        if (this.editingExam) {
          await api.request('PUT', '/api/exam/exams/' + this.editingExam.id, payload);
        } else {
          await api.request('POST', '/api/exam/exams', payload);
        }
        this.showCreateModal = false;
        this.loadData();
      } catch (e) { /* */ }
    },
    async publishExam(exam) {
      if (!confirm('确定要发布考试"' + exam.title + '"吗？发布后学生即可参加。')) return;
      try {
        await api.request('POST', '/api/exam/exams/' + exam.id + '/publish');
        this.loadData();
      } catch (e) { /* */ }
    },
    async deleteExam(exam) {
      if (!confirm('确定要删除考试"' + exam.title + '"吗？此操作不可恢复。')) return;
      try {
        await api.request('DELETE', '/api/exam/exams/' + exam.id);
        this.loadData();
      } catch (e) { /* */ }
    },
    async viewResults(exam) {
      this.resultsExam = exam;
      try {
        const data = await api.request('GET', '/api/exam/exams/' + exam.id + '/attempts');
        this.resultsAttempts = data.attempts;
      } catch (e) {
        this.resultsAttempts = [];
      }
      this.showResultsModal = true;
    },
    async gradeAttempt(attempt) {
      // Simple prompt-based grading for subjective questions
      const scoreStr = prompt('请输入该学生的总分（客观分 ' + (attempt.objective_score || 0) + ' + 主观分）：');
      if (scoreStr === null) return;
      const total = parseInt(scoreStr);
      if (isNaN(total)) {
        if (window.store && window.store.notify) window.store.notify('请输入有效的分数', 'warning');
        return;
      }
      try {
        await api.request('PUT', '/api/exam/attempts/' + attempt.id + '/grade', { total_score: total });
        this.viewResults(this.resultsExam);
      } catch (e) { /* */ }
    },
    async loadPickerQuestions() {
      const params = new URLSearchParams();
      if (this.pickerFilter.chapter_id) params.set('chapter_id', this.pickerFilter.chapter_id);
      if (this.pickerFilter.type) params.set('type', this.pickerFilter.type);
      if (this.pickerFilter.difficulty) params.set('difficulty', this.pickerFilter.difficulty);
      params.set('size', '200');
      try {
        const data = await api.request('GET', '/api/exam/questions?' + params.toString());
        this.pickerQuestions = data.questions;
      } catch (e) {
        this.pickerQuestions = [];
      }
    },
    isSelected(qId) {
      return this.selectedQuestions.some(q => q.id === qId);
    },
    togglePickerQuestion(q) {
      const idx = this.selectedQuestions.findIndex(sq => sq.id === q.id);
      if (idx >= 0) {
        this.selectedQuestions.splice(idx, 1);
      } else {
        this.selectedQuestions.push({ id: q.id, content: q.content, type: q.type, difficulty: q.difficulty, score_weight: q.score_weight });
      }
    },
    removeQuestion(idx) {
      this.selectedQuestions.splice(idx, 1);
    },
    typeLabel(type) {
      const map = { single_choice: '单选', multi_choice: '多选', true_false: '判断', fill_blank: '填空', short_answer: '简答' };
      return map[type] || type;
    },
    attemptStatusClass(s) {
      const map = { in_progress: 'bg-blue-100 text-blue-800', submitted: 'bg-yellow-100 text-yellow-800', graded: 'bg-green-100 text-green-800', timed_out: 'bg-red-100 text-red-800' };
      return map[s] || 'bg-gray-100 text-gray-800';
    },
    attemptStatusLabel(s) {
      const map = { in_progress: '进行中', submitted: '待批改', graded: '已批改', timed_out: '已超时' };
      return map[s] || s;
    },
  },
  mounted() {
    this.loadData();
    this.loadChapters();
    this.loadPickerQuestions();
  },
  watch: {
    showQuestionPicker(val) {
      if (val) this.loadPickerQuestions();
    },
  },
};
