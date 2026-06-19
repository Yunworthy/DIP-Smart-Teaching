var ExamTake = {
  name: 'ExamTake',
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Top bar -->
      <div class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div class="flex items-center justify-between px-6 py-3">
          <div class="flex items-center gap-4">
            <h1 class="text-lg font-bold text-gray-800">{{ exam.title || '考试中' }}</h1>
            <span class="text-sm text-gray-500">共 {{ questions.length }} 题</span>
          </div>
          <div class="flex items-center gap-4">
            <!-- Timer -->
            <div :class="['flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold', timerClass]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ timerDisplay }}</span>
            </div>
            <button @click="saveProgress" class="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">保存进度</button>
            <button @click="confirmSubmit" class="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">提交试卷</button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-screen">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p class="text-gray-500">加载考试中...</p>
        </div>
      </div>

      <!-- Exam content -->
      <div v-else class="pt-20 pb-8 px-6 flex gap-6 max-w-[1400px] mx-auto">
        <!-- Question navigation panel -->
        <div class="w-56 flex-shrink-0">
          <div class="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">答题卡</h3>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="(q, idx) in questions" :key="q.id"
                @click="currentIdx = idx"
                :class="[
                  'w-9 h-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center',
                  idx === currentIdx ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300' :
                  isAnswered(q.id) ? 'bg-green-100 text-green-700 border border-green-300' :
                  'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                ]">
                {{ idx + 1 }}
              </button>
            </div>
            <div class="mt-4 space-y-1.5 text-xs text-gray-500">
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-green-100 border border-green-300"></span>已答</div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-gray-100 border border-gray-200"></span>未答</div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-indigo-600"></span>当前</div>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100">
              <div class="text-xs text-gray-500">
                已答 <span class="font-semibold text-green-600">{{ answeredCount }}</span> / {{ questions.length }}
              </div>
            </div>
          </div>
        </div>

        <!-- Question area -->
        <div class="flex-1 min-w-0">
          <div v-if="currentQuestion" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <!-- Question header -->
            <div class="flex items-center gap-3 mb-6">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                {{ currentIdx + 1 }}
              </span>
              <span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                {{ typeLabel(currentQuestion.type) }}
              </span>
              <span class="text-xs text-gray-400">{{ currentQuestion.exam_score }} 分</span>
              <span class="text-xs text-gray-400 ml-auto">难度 {{ difficultyStars(currentQuestion.difficulty) }}</span>
            </div>

            <!-- Question content -->
            <div class="text-base text-gray-800 leading-relaxed mb-6 whitespace-pre-wrap">{{ currentQuestion.content }}</div>

            <!-- Answer input based on type -->
            <!-- Single choice -->
            <div v-if="currentQuestion.type === 'single_choice'" class="space-y-3">
              <label v-for="(opt, optIdx) in parsedOptions" :key="optIdx"
                :class="['flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  answers[currentQuestion.id] == optIdx ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50']">
                <input type="radio" :name="'q_' + currentQuestion.id" :value="String(optIdx)"
                  v-model="answers[currentQuestion.id]"
                  class="mt-1 text-indigo-600 focus:ring-indigo-500" />
                <span class="text-sm text-gray-700">{{ optionLabel(optIdx) }}. {{ opt }}</span>
              </label>
            </div>

            <!-- Multi choice -->
            <div v-if="currentQuestion.type === 'multi_choice'" class="space-y-3">
              <p class="text-sm text-gray-500 mb-2">（多选题，请选择所有正确答案）</p>
              <label v-for="(opt, optIdx) in parsedOptions" :key="optIdx"
                :class="['flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  isMultiChecked(optIdx) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50']">
                <input type="checkbox" :checked="isMultiChecked(optIdx)"
                  @change="toggleMultiChoice(optIdx)"
                  class="mt-1 text-indigo-600 focus:ring-indigo-500 rounded" />
                <span class="text-sm text-gray-700">{{ optionLabel(optIdx) }}. {{ opt }}</span>
              </label>
            </div>

            <!-- True/False -->
            <div v-if="currentQuestion.type === 'true_false'" class="space-y-3">
              <label :class="['flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                answers[currentQuestion.id] === 'true' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300']">
                <input type="radio" :name="'q_' + currentQuestion.id" value="true"
                  v-model="answers[currentQuestion.id]"
                  class="text-indigo-600 focus:ring-indigo-500" />
                <span class="text-sm text-gray-700 font-medium">对 (True)</span>
              </label>
              <label :class="['flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                answers[currentQuestion.id] === 'false' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300']">
                <input type="radio" :name="'q_' + currentQuestion.id" value="false"
                  v-model="answers[currentQuestion.id]"
                  class="text-indigo-600 focus:ring-indigo-500" />
                <span class="text-sm text-gray-700 font-medium">错 (False)</span>
              </label>
            </div>

            <!-- Fill blank -->
            <div v-if="currentQuestion.type === 'fill_blank'">
              <input type="text" v-model="answers[currentQuestion.id]"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="请输入答案..." />
            </div>

            <!-- Short answer -->
            <div v-if="currentQuestion.type === 'short_answer'">
              <textarea v-model="answers[currentQuestion.id]" rows="6"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="请输入答案..."></textarea>
            </div>

            <!-- Navigation buttons -->
            <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button @click="prevQuestion" :disabled="currentIdx === 0"
                :class="['px-5 py-2 text-sm font-medium rounded-lg transition',
                  currentIdx === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']">
                上一题
              </button>
              <span class="text-sm text-gray-400">{{ currentIdx + 1 }} / {{ questions.length }}</span>
              <button @click="nextQuestion" :disabled="currentIdx === questions.length - 1"
                :class="['px-5 py-2 text-sm font-medium rounded-lg transition',
                  currentIdx === questions.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700']">
                下一题
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit confirmation dialog -->
      <div v-if="showConfirmDialog" class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">确认提交</h3>
          <p class="text-sm text-gray-600 mb-1">您已回答 {{ answeredCount }} / {{ questions.length }} 题。</p>
          <p v-if="answeredCount < questions.length" class="text-sm text-red-500 mb-4">还有 {{ questions.length - answeredCount }} 题未作答！</p>
          <p v-else class="text-sm text-gray-500 mb-4">所有题目均已作答。</p>
          <div class="flex justify-end gap-3">
            <button @click="showConfirmDialog = false" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">继续作答</button>
            <button @click="submitExam" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">确认提交</button>
          </div>
        </div>
      </div>

      <!-- Result dialog -->
      <div v-if="showResult" class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-xl shadow-2xl p-8 w-96 max-w-[90vw] text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            :class="resultData && resultData.objective_score >= exam.pass_score ? 'bg-green-100' : 'bg-red-100'">
            <svg class="w-8 h-8" :class="resultData && resultData.objective_score >= exam.pass_score ? 'text-green-600' : 'text-red-600'"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="resultData && resultData.status === 'graded'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ resultData ? resultData.message : '' }}</h3>
          <div v-if="resultData" class="text-3xl font-bold mb-4"
            :class="resultData.objective_score >= exam.pass_score ? 'text-green-600' : 'text-red-600'">
            {{ resultData.objective_score }} <span class="text-base font-normal text-gray-400">/ {{ exam.total_score }}</span>
          </div>
          <button @click="backToList" class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">返回考试列表</button>
        </div>
      </div>
    </div>
  `,
  props: {
    id: { type: [String, Number], default: null },
  },
  data() {
    return {
      loading: true,
      exam: {},
      attempt: {},
      questions: [],
      answers: {},
      currentIdx: 0,
      remainingSeconds: 0,
      timer: null,
      showConfirmDialog: false,
      showResult: false,
      resultData: null,
      saving: false,
    };
  },
  computed: {
    examId() {
      return this.id || (this.$route && this.$route.params.id);
    },
    currentQuestion() {
      return this.questions[this.currentIdx] || null;
    },
    parsedOptions() {
      if (!this.currentQuestion || !this.currentQuestion.options) return [];
      try { return JSON.parse(this.currentQuestion.options); }
      catch { return []; }
    },
    answeredCount() {
      return Object.keys(this.answers).filter(k => {
        const v = this.answers[k];
        return v !== undefined && v !== null && v !== '';
      }).length;
    },
    timerDisplay() {
      const m = Math.floor(this.remainingSeconds / 60);
      const s = this.remainingSeconds % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    },
    timerClass() {
      if (this.remainingSeconds <= 60) return 'bg-red-100 text-red-700';
      if (this.remainingSeconds <= 300) return 'bg-yellow-100 text-yellow-700';
      return 'bg-green-100 text-green-700';
    },
  },
  methods: {
    async loadExam() {
      this.loading = true;
      try {
        const data = await api.request('GET', '/api/exam/exams/' + this.examId + '/start');
        this.exam = data.exam;
        this.attempt = data.attempt;
        this.questions = data.questions;
        this.savedAnswers = data.savedAnswers || {};
        // Restore saved answers
        if (data.savedAnswers) {
          this.answers = { ...data.savedAnswers };
        }
        // Calculate remaining time
        const startedAt = new Date(this.attempt.started_at + (this.attempt.started_at.includes('Z') ? '' : 'Z'));
        const elapsed = (Date.now() - startedAt.getTime()) / 1000;
        this.remainingSeconds = Math.max(0, (this.exam.duration_minutes * 60) - Math.floor(elapsed));
        // Start timer
        this.startTimer();
      } catch (e) {
        console.error(e);
        if (this.$router) this.$router.push('/student/exams');
      }
      this.loading = false;
    },
    startTimer() {
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds--;
        } else {
          clearInterval(this.timer);
          this.timer = null;
          this.autoSubmit();
        }
      }, 1000);
    },
    isAnswered(qId) {
      const v = this.answers[qId];
      return v !== undefined && v !== null && v !== '';
    },
    isMultiChecked(optIdx) {
      const val = this.answers[this.currentQuestion.id];
      if (!val) return false;
      return String(val).split(',').includes(String(optIdx));
    },
    toggleMultiChoice(optIdx) {
      const qId = this.currentQuestion.id;
      let current = this.answers[qId] ? String(this.answers[qId]).split(',').filter(s => s !== '') : [];
      const idxStr = String(optIdx);
      if (current.includes(idxStr)) {
        current = current.filter(s => s !== idxStr);
      } else {
        current.push(idxStr);
      }
      current.sort((a, b) => Number(a) - Number(b));
      this.answers[qId] = current.join(',');
    },
    optionLabel(idx) {
      return String.fromCharCode(65 + idx);
    },
    typeLabel(type) {
      const map = {
        single_choice: '单选题',
        multi_choice: '多选题',
        true_false: '判断题',
        fill_blank: '填空题',
        short_answer: '简答题',
      };
      return map[type] || type;
    },
    difficultyStars(d) {
      return '\u2605'.repeat(d || 1) + '\u2606'.repeat(5 - (d || 1));
    },
    prevQuestion() {
      if (this.currentIdx > 0) this.currentIdx--;
    },
    nextQuestion() {
      if (this.currentIdx < this.questions.length - 1) this.currentIdx++;
    },
    confirmSubmit() {
      this.showConfirmDialog = true;
    },
    async saveProgress() {
      if (this.saving) return;
      this.saving = true;
      try {
        await api.request('POST', '/api/exam/exams/' + this.examId + '/save-progress', { answers: this.answers });
        if (window.store && window.store.notify) window.store.notify('进度已保存', 'success');
      } catch (e) { /* ignore */ }
      this.saving = false;
    },
    async submitExam() {
      this.showConfirmDialog = false;
      try {
        const result = await api.request('POST', '/api/exam/exams/' + this.examId + '/submit', { answers: this.answers });
        this.resultData = result;
        this.showResult = true;
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
      } catch (e) {
        console.error(e);
      }
    },
    async autoSubmit() {
      try {
        const result = await api.request('POST', '/api/exam/exams/' + this.examId + '/submit', { answers: this.answers });
        this.resultData = result;
        this.showResult = true;
        if (window.store && window.store.notify) window.store.notify('考试时间已到，已自动提交', 'warning');
      } catch (e) {
        console.error(e);
      }
    },
    backToList() {
      if (this.$router) this.$router.push('/student/exams');
    },
  },
  mounted() {
    this.loadExam();
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
};
