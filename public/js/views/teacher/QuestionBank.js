var QuestionBank = {
  name: 'QuestionBank',
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">题库管理</h1>
          <p class="text-gray-500 mt-1">管理考试题目，共 {{ total }} 题</p>
        </div>
        <div class="flex gap-2">
          <button disabled class="px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed" title="功能开发中">
            批量导入
          </button>
          <button @click="openAddModal()"
            class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            添加题目
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div class="flex flex-wrap gap-3">
          <select v-model="filter.chapter_id" @change="loadQuestions" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">全部章节</option>
            <option v-for="ch in chapters" :key="ch.id" :value="ch.id">{{ ch.title }}</option>
          </select>
          <select v-model="filter.type" @change="loadQuestions" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">全部类型</option>
            <option value="single_choice">单选题</option>
            <option value="multi_choice">多选题</option>
            <option value="true_false">判断题</option>
            <option value="fill_blank">填空题</option>
            <option value="short_answer">简答题</option>
          </select>
          <select v-model="filter.difficulty" @change="loadQuestions" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">全部难度</option>
            <option v-for="d in [1,2,3,4,5]" :key="d" :value="d">{{ d }} 级</option>
          </select>
          <input v-model="filter.keyword" @keyup.enter="loadQuestions" type="text" placeholder="搜索题目内容..."
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[200px]" />
          <button @click="loadQuestions" class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">搜索</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Question table -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">题目内容</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">章节</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">难度</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分值</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="q in questions" :key="q.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-500">{{ q.id }}</td>
              <td class="px-4 py-3">
                <div class="text-sm text-gray-900 max-w-md truncate">{{ q.content }}</div>
              </td>
              <td class="px-4 py-3">
                <span :class="typeClass(q.type)" class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full">
                  {{ typeLabel(q.type) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ q.chapter_title || '--' }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">
                <span class="text-yellow-500">{{ '\u2605'.repeat(q.difficulty || 1) }}</span>
                <span class="text-gray-300">{{ '\u2606'.repeat(5 - (q.difficulty || 1)) }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ q.score_weight }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button @click="openEditModal(q)" class="text-sm text-indigo-600 hover:text-indigo-800">编辑</button>
                <button @click="deleteQuestion(q)" class="text-sm text-red-600 hover:text-red-800">删除</button>
              </td>
            </tr>
            <tr v-if="questions.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-gray-400">暂无题目</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
        <span class="text-sm text-gray-500">第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
        <div class="flex gap-2">
          <button @click="page > 1 && (page--, loadQuestions())" :disabled="page <= 1"
            class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg" :class="page <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'">上一页</button>
          <button @click="page < totalPages && (page++, loadQuestions())" :disabled="page >= totalPages"
            class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg" :class="page >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'">下一页</button>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
        <div class="bg-white rounded-xl shadow-2xl w-[700px] max-w-[95vw] my-8 mx-4">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">{{ editingQ ? '编辑题目' : '添加题目' }}</h3>
            <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">题目类型 *</label>
                <select v-model="qForm.type" @change="onTypeChange" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="single_choice">单选题</option>
                  <option value="multi_choice">多选题</option>
                  <option value="true_false">判断题</option>
                  <option value="fill_blank">填空题</option>
                  <option value="short_answer">简答题</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">所属章节</label>
                <select v-model="qForm.chapter_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">无</option>
                  <option v-for="ch in chapters" :key="ch.id" :value="ch.id">{{ ch.title }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">题目内容 *</label>
              <textarea v-model="qForm.content" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="输入题目内容"></textarea>
            </div>

            <!-- Options for choice questions -->
            <div v-if="qForm.type === 'single_choice' || qForm.type === 'multi_choice'">
              <label class="block text-sm font-medium text-gray-700 mb-1">选项</label>
              <div class="space-y-2">
                <div v-for="(opt, idx) in qForm.optionsList" :key="idx" class="flex items-center gap-2">
                  <span class="text-sm text-gray-500 w-6 text-center font-medium">{{ String.fromCharCode(65 + idx) }}</span>
                  <input :value="opt" @input="qForm.optionsList[idx] = $event.target.value"
                    type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" :placeholder="'选项' + String.fromCharCode(65 + idx)" />
                  <button v-if="qForm.optionsList.length > 2" @click="qForm.optionsList.splice(idx, 1)"
                    class="text-red-400 hover:text-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <button v-if="qForm.optionsList.length < 8" @click="qForm.optionsList.push('')"
                class="mt-2 text-sm text-indigo-600 hover:text-indigo-800">+ 添加选项</button>
            </div>

            <!-- Answer -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">正确答案 *</label>
              <!-- Single choice answer -->
              <div v-if="qForm.type === 'single_choice'" class="flex flex-wrap gap-2">
                <label v-for="(opt, idx) in qForm.optionsList" :key="idx"
                  :class="['flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm',
                    qForm.answer === String(idx) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200']">
                  <input type="radio" :value="String(idx)" v-model="qForm.answer" class="text-indigo-600" />
                  {{ String.fromCharCode(65 + idx) }}
                </label>
              </div>
              <!-- Multi choice answer -->
              <div v-if="qForm.type === 'multi_choice'" class="flex flex-wrap gap-2">
                <label v-for="(opt, idx) in qForm.optionsList" :key="idx"
                  :class="['flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm',
                    multiAnswerChecked(idx) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200']">
                  <input type="checkbox" :checked="multiAnswerChecked(idx)" @change="toggleMultiAnswer(idx)" class="text-indigo-600 rounded" />
                  {{ String.fromCharCode(65 + idx) }}
                </label>
              </div>
              <!-- True/False answer -->
              <div v-if="qForm.type === 'true_false'" class="flex gap-4">
                <label :class="['flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm',
                  qForm.answer === 'true' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200']">
                  <input type="radio" value="true" v-model="qForm.answer" class="text-indigo-600" /> 对
                </label>
                <label :class="['flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm',
                  qForm.answer === 'false' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200']">
                  <input type="radio" value="false" v-model="qForm.answer" class="text-indigo-600" /> 错
                </label>
              </div>
              <!-- Fill blank / Short answer -->
              <input v-if="qForm.type === 'fill_blank'" v-model="qForm.answer" type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="输入正确答案" />
              <textarea v-if="qForm.type === 'short_answer'" v-model="qForm.answer" rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="输入参考答案"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">解析</label>
              <textarea v-model="qForm.explanation" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="题目解析（可选）"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">难度 (1-5)</label>
                <input v-model.number="qForm.difficulty" type="number" min="1" max="5" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">默认分值</label>
                <input v-model.number="qForm.score_weight" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
            <button @click="saveQuestion" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">保存</button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      questions: [],
      chapters: [],
      total: 0,
      page: 1,
      totalPages: 1,
      filter: { chapter_id: '', type: '', difficulty: '', keyword: '' },
      showModal: false,
      editingQ: null,
      qForm: {
        type: 'single_choice',
        chapter_id: '',
        content: '',
        optionsList: ['', '', '', ''],
        answer: '0',
        explanation: '',
        difficulty: 3,
        score_weight: 5,
      },
    };
  },
  methods: {
    async loadQuestions() {
      this.loading = true;
      const params = new URLSearchParams();
      params.set('page', this.page);
      params.set('size', 20);
      if (this.filter.chapter_id) params.set('chapter_id', this.filter.chapter_id);
      if (this.filter.type) params.set('type', this.filter.type);
      if (this.filter.difficulty) params.set('difficulty', this.filter.difficulty);
      if (this.filter.keyword) params.set('keyword', this.filter.keyword);
      try {
        const data = await api.request('GET', '/api/exam/questions?' + params.toString());
        this.questions = data.questions;
        this.total = data.total;
        this.totalPages = data.totalPages;
      } catch (e) { /* */ }
      this.loading = false;
    },
    async loadChapters() {
      try {
        this.chapters = await api.request('GET', '/api/exam/chapters');
      } catch (e) { /* */ }
    },
    openAddModal() {
      this.editingQ = null;
      this.qForm = {
        type: 'single_choice',
        chapter_id: '',
        content: '',
        optionsList: ['', '', '', ''],
        answer: '0',
        explanation: '',
        difficulty: 3,
        score_weight: 5,
      };
      this.showModal = true;
    },
    openEditModal(q) {
      this.editingQ = q;
      let optionsList = ['', '', '', ''];
      if (q.options) {
        try { optionsList = JSON.parse(q.options); } catch (e) { /* */ }
      }
      this.qForm = {
        type: q.type,
        chapter_id: q.chapter_id || '',
        content: q.content,
        optionsList: optionsList,
        answer: q.answer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 3,
        score_weight: q.score_weight || 5,
      };
      this.showModal = true;
    },
    onTypeChange() {
      if (this.qForm.type === 'single_choice') {
        if (this.qForm.optionsList.length < 2) this.qForm.optionsList = ['', '', '', ''];
        this.qForm.answer = '0';
      } else if (this.qForm.type === 'multi_choice') {
        if (this.qForm.optionsList.length < 2) this.qForm.optionsList = ['', '', '', ''];
        this.qForm.answer = '';
      } else if (this.qForm.type === 'true_false') {
        this.qForm.optionsList = [];
        this.qForm.answer = 'true';
      } else {
        this.qForm.optionsList = [];
        this.qForm.answer = '';
      }
    },
    multiAnswerChecked(idx) {
      return this.qForm.answer.split(',').includes(String(idx));
    },
    toggleMultiAnswer(idx) {
      let parts = this.qForm.answer ? this.qForm.answer.split(',').filter(s => s !== '') : [];
      const idxStr = String(idx);
      if (parts.includes(idxStr)) {
        parts = parts.filter(s => s !== idxStr);
      } else {
        parts.push(idxStr);
      }
      parts.sort((a, b) => Number(a) - Number(b));
      this.qForm.answer = parts.join(',');
    },
    async saveQuestion() {
      if (!this.qForm.content) {
        if (window.store && window.store.notify) window.store.notify('请填写题目内容', 'warning');
        return;
      }
      if (this.qForm.answer === '' || this.qForm.answer === null || this.qForm.answer === undefined) {
        if (window.store && window.store.notify) window.store.notify('请填写正确答案', 'warning');
        return;
      }

      const isChoice = ['single_choice', 'multi_choice'].includes(this.qForm.type);
      const options = isChoice ? JSON.stringify(this.qForm.optionsList.filter(o => o.trim())) : null;

      const payload = {
        type: this.qForm.type,
        chapter_id: this.qForm.chapter_id || null,
        content: this.qForm.content,
        options: options,
        answer: this.qForm.answer,
        explanation: this.qForm.explanation || null,
        difficulty: this.qForm.difficulty,
        score_weight: this.qForm.score_weight,
      };

      try {
        if (this.editingQ) {
          await api.request('PUT', '/api/exam/questions/' + this.editingQ.id, payload);
        } else {
          await api.request('POST', '/api/exam/questions', payload);
        }
        this.showModal = false;
        this.loadQuestions();
      } catch (e) { /* */ }
    },
    async deleteQuestion(q) {
      if (!confirm('确定要删除这道题目吗？')) return;
      try {
        await api.request('DELETE', '/api/exam/questions/' + q.id);
        this.loadQuestions();
      } catch (e) { /* */ }
    },
    typeLabel(type) {
      const map = { single_choice: '单选', multi_choice: '多选', true_false: '判断', fill_blank: '填空', short_answer: '简答' };
      return map[type] || type;
    },
    typeClass(type) {
      const map = {
        single_choice: 'bg-blue-100 text-blue-800',
        multi_choice: 'bg-purple-100 text-purple-800',
        true_false: 'bg-green-100 text-green-800',
        fill_blank: 'bg-yellow-100 text-yellow-800',
        short_answer: 'bg-red-100 text-red-800',
      };
      return map[type] || 'bg-gray-100 text-gray-800';
    },
  },
  mounted() {
    this.loadChapters();
    this.loadQuestions();
  },
};
