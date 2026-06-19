var TeacherDashboard = {
  template: `
    <div class="space-y-6">
      <!-- Welcome Banner -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
        <h1 class="text-2xl font-bold">教学管理中心</h1>
        <p class="mt-1 text-blue-100">欢迎回来，{{ teacherName }} 老师</p>
        <p class="mt-2 text-sm text-blue-200">{{ currentDate }}</p>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">学生总数</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.studentCount || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">本周提交数</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.weekSubmissions || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">待批改数</p>
              <p class="text-2xl font-bold text-amber-600 mt-1">{{ stats.pendingReviews || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">平均成绩</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.avgScore ? stats.avgScore.toFixed(1) : '--' }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Submission Trend Chart -->
        <div class="lg:col-span-2 bg-white rounded-xl p-5 shadow border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">近7天提交趋势</h3>
          <div ref="trendChart" class="w-full h-72"></div>
          <div v-if="!loading && (!stats.submissionTrend || stats.submissionTrend.length === 0)" class="flex items-center justify-center h-72 text-gray-400">
            暂无提交数据
          </div>
        </div>

        <!-- Recent Announcements -->
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">最新公告</h3>
          <div v-if="announcements.length === 0" class="flex items-center justify-center h-48 text-gray-400">
            暂无公告
          </div>
          <div v-else class="space-y-3 max-h-72 overflow-y-auto">
            <div v-for="a in announcements" :key="a.id" class="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p class="text-sm font-medium text-gray-800">{{ a.title }}</p>
              <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ a.content }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatDate(a.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Reviews -->
      <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">待批改作业</h3>
          <router-link to="/teacher/grading" class="text-sm text-blue-600 hover:text-blue-800">
            查看全部 &rarr;
          </router-link>
        </div>
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div v-else-if="pendingSubmissions.length === 0" class="text-center py-8 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>暂无待批改作业</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-medium text-gray-600">学生</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">学号</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">作业</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">提交时间</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in pendingSubmissions" :key="sub.id" class="border-b border-gray-50 hover:bg-gray-50">
                <td class="py-3 px-4 text-gray-800">{{ sub.studentName || sub.username || '--' }}</td>
                <td class="py-3 px-4 text-gray-600">{{ sub.studentId || '--' }}</td>
                <td class="py-3 px-4 text-gray-800">{{ sub.assignmentTitle || '--' }}</td>
                <td class="py-3 px-4 text-gray-600">{{ formatDate(sub.createdAt) }}</td>
                <td class="py-3 px-4">
                  <router-link :to="'/teacher/grading?submission=' + sub.id" class="text-blue-600 hover:text-blue-800 font-medium">
                    批改
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 shadow-lg flex items-center space-x-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="text-gray-700">加载中...</span>
        </div>
      </div>

      <!-- Error Toast -->
      <div v-if="error" class="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ error }}</span>
          <button @click="error = null" class="ml-2 text-red-500 hover:text-red-700">&times;</button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      loading: false,
      error: null,
      stats: {},
      announcements: [],
      pendingSubmissions: [],
      trendChartInstance: null
    };
  },
  computed: {
    teacherName() {
      return store.user?.realName || store.user?.username || '老师';
    },
    currentDate() {
      const d = new Date();
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + weekdays[d.getDay()];
    }
  },
  async mounted() {
    await this.loadData();
  },
  beforeUnmount() {
    if (this.trendChartInstance) {
      this.trendChartInstance.dispose();
    }
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      try {
        const [statsRes, assignmentsRes] = await Promise.allSettled([
          api.getAdminStats(),
          api.getAssignments()
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          const data = statsRes.value.data || statsRes.value;
          this.stats = {
            studentCount: data.studentCount || data.totalStudents || 0,
            weekSubmissions: data.weekSubmissions || data.submissionsThisWeek || 0,
            pendingReviews: data.pendingReviews || data.pendingSubmissions || 0,
            avgScore: data.avgScore || data.averageScore || 0,
            submissionTrend: data.submissionTrend || data.dailySubmissions || []
          };
          this.announcements = data.announcements || data.recentAnnouncements || [];
        }

        if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value) {
          const adata = assignmentsRes.value.data || assignmentsRes.value;
          const assignments = Array.isArray(adata) ? adata : (adata.assignments || []);
          this.pendingSubmissions = [];
          for (const a of assignments.slice(0, 5)) {
            try {
              const subRes = await api.getAssignmentSubmissions(a.id);
              const subs = subRes.data || subRes;
              const subList = Array.isArray(subs) ? subs : (subs.submissions || []);
              const pending = subList.filter(s => s.status === 'pending').map(s => ({
                ...s,
                assignmentTitle: a.title
              }));
              this.pendingSubmissions.push(...pending);
            } catch(e) { /* skip */ }
          }
          this.pendingSubmissions = this.pendingSubmissions.slice(0, 10);
        }

        this.$nextTick(() => this.renderTrendChart());
      } catch (err) {
        this.error = '加载数据失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    renderTrendChart() {
      if (!this.$refs.trendChart) return;
      const trend = this.stats.submissionTrend || [];
      if (trend.length === 0) return;

      this.trendChartInstance = echarts.init(this.$refs.trendChart);
      const days = trend.map(t => t.date || t.day);
      const counts = trend.map(t => t.count || t.value || 0);

      this.trendChartInstance.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: days, axisLabel: { fontSize: 11 } },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          data: counts,
          type: 'line',
          smooth: true,
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59,130,246,0.3)' },
            { offset: 1, color: 'rgba(59,130,246,0.05)' }
          ])},
          lineStyle: { color: '#3B82F6', width: 2 },
          itemStyle: { color: '#3B82F6' }
        }]
      });

      window.addEventListener('resize', () => {
        if (this.trendChartInstance) this.trendChartInstance.resize();
      });
    },
    formatDate(dateStr) {
      if (!dateStr) return '--';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
  }
};
