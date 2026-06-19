var ExamList = {
  name: 'ExamList',
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">在线考试</h1>
        <p class="text-gray-500 mt-1">查看所有可参加的考试</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- My Attempts -->
      <div v-if="!loading && attempts.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">我的考试记录</h2>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">考试名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时长</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">得分</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">开始时间</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="a in attempts" :key="a.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ a.exam_title }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ a.duration_minutes }} 分钟</td>
                <td class="px-6 py-4 text-sm">
                  <span v-if="a.total_score !== null" :class="a.total_score >= a.pass_score ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                    {{ a.total_score }} / {{ a.exam_total_score }}
                  </span>
                  <span v-else class="text-gray-400">--</span>
                </td>
                <td class="px-6 py-4">
                  <span :class="statusClass(a.status)" class="inline-flex px-2 py-1 text-xs font-medium rounded-full">
                    {{ statusLabel(a.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ formatTime(a.started_at) }}</td>
                <td class="px-6 py-4 text-sm">
                  <button v-if="a.status === 'in_progress'"
                    @click="goToExam(a.exam_id)"
                    class="text-indigo-600 hover:text-indigo-800 font-medium">继续考试</button>
                  <span v-else-if="a.status === 'submitted'" class="text-yellow-600">待批改</span>
                  <span v-else-if="a.status === 'graded'" class="text-green-600">已完成</span>
                  <span v-else class="text-gray-400">已超时</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Available Exams -->
      <div v-if="!loading">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">可参加的考试</h2>
        <div v-if="availableExams.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-gray-500">暂无可参加的考试</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="exam in availableExams" :key="exam.id"
            class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-3">
              <h3 class="text-base font-semibold text-gray-800 leading-tight">{{ exam.title }}</h3>
              <span class="flex-shrink-0 ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                :class="examStatusClass(exam)">
                {{ examStatusLabel(exam) }}
              </span>
            </div>
            <p v-if="exam.description" class="text-sm text-gray-500 mb-3 line-clamp-2">{{ exam.description }}</p>
            <div class="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{{ exam.duration_minutes }} 分钟</span>
              </div>
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <span>{{ exam.question_count }} 题</span>
              </div>
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
                <span>满分 {{ exam.total_score }}</span>
              </div>
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>及格 {{ exam.pass_score }}</span>
              </div>
            </div>
            <button
              v-if="!hasAttemptFor(exam.id)"
              @click="goToExam(exam.id)"
              class="w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              开始考试
            </button>
            <div v-else class="w-full py-2 px-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg text-center">
              {{ getAttemptStatus(exam.id) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      exams: [],
      attempts: [],
    };
  },
  computed: {
    availableExams() {
      return this.exams.filter(e => e.is_published);
    },
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [exams, attempts] = await Promise.all([
          api.request('GET', '/api/exam/exams'),
          api.request('GET', '/api/exam/attempts/mine'),
        ]);
        this.exams = exams;
        this.attempts = attempts;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    },
    hasAttemptFor(examId) {
      return this.attempts.some(a => a.exam_id === examId && (a.status === 'submitted' || a.status === 'graded'));
    },
    getAttemptStatus(examId) {
      const a = this.attempts.find(a => a.exam_id === examId);
      if (!a) return '';
      if (a.status === 'graded') return '已完成 - ' + (a.total_score !== null ? a.total_score + '分' : '待评分');
      if (a.status === 'submitted') return '已提交 - 待批改';
      return '已完成';
    },
    goToExam(examId) {
      this.$router.push('/student/exams/' + examId);
    },
    statusLabel(s) {
      const map = { in_progress: '进行中', submitted: '待批改', graded: '已批改', timed_out: '已超时' };
      return map[s] || s;
    },
    statusClass(s) {
      const map = {
        in_progress: 'bg-blue-100 text-blue-800',
        submitted: 'bg-yellow-100 text-yellow-800',
        graded: 'bg-green-100 text-green-800',
        timed_out: 'bg-red-100 text-red-800',
      };
      return map[s] || 'bg-gray-100 text-gray-800';
    },
    examStatusClass(exam) {
      const now = new Date();
      if (exam.end_time && new Date(exam.end_time) < now) return 'bg-gray-100 text-gray-600';
      if (exam.start_time && new Date(exam.start_time) > now) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    },
    examStatusLabel(exam) {
      const now = new Date();
      if (exam.end_time && new Date(exam.end_time) < now) return '已结束';
      if (exam.start_time && new Date(exam.start_time) > now) return '未开始';
      return '进行中';
    },
    formatTime(t) {
      if (!t) return '--';
      return new Date(t + (t.includes('Z') ? '' : 'Z')).toLocaleString('zh-CN');
    },
  },
  mounted() {
    this.loadData();
  },
};
