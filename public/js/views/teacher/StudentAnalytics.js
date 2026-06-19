var StudentAnalytics = {
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">学生分析</h1>
        <button
          v-if="selectedStudent"
          @click="selectedStudent = null; studentDetail = null"
          class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
        >
          &larr; 返回学生列表
        </button>
      </div>

      <!-- Filters and Export Toolbar -->
      <div class="bg-white rounded-xl shadow border border-gray-100 p-4">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">按作业筛选</label>
            <select v-model="filterAssignmentId" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[160px]">
              <option value="">全部作业</option>
              <option v-for="a in filterAssignments" :key="a.id" :value="a.id">{{ a.title }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">按章节筛选</label>
            <select v-model="filterChapterId" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[160px]">
              <option value="">全部章节</option>
              <option v-for="ch in filterChapters" :key="ch.id" :value="ch.id">{{ ch.title }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">按班级筛选</label>
            <select v-model="filterClassName" class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[160px]">
              <option value="">全部班级</option>
              <option v-for="c in filterClasses" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="flex items-end gap-2 ml-auto">
            <button @click="exportGrades" :disabled="exporting" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>{{ exporting ? '导出中...' : '导出成绩CSV' }}</span>
            </button>
            <button @click="exportSummary" :disabled="exporting" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>{{ exporting ? '导出中...' : '导出班级汇总CSV' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- Student Detail View -->
      <div v-else-if="selectedStudent && studentDetail" class="space-y-6">
        <!-- Student Info Header -->
        <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xl font-bold">
              {{ (selectedStudent.realName || selectedStudent.username || '?')[0] }}
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">{{ selectedStudent.realName || selectedStudent.username }}</h2>
              <p class="text-sm text-gray-500">学号: {{ selectedStudent.studentId || selectedStudent.student_id || '--' }} | 班级: {{ selectedStudent.className || selectedStudent.class || '--' }}</p>
            </div>
            <div class="ml-auto flex space-x-6 text-center">
              <div>
                <p class="text-xl font-bold text-blue-600">{{ studentDetail.submissionCount || 0 }}</p>
                <p class="text-xs text-gray-500">提交次数</p>
              </div>
              <div>
                <p class="text-xl font-bold text-green-600">{{ studentDetail.avgScore ? studentDetail.avgScore.toFixed(1) : '--' }}</p>
                <p class="text-xs text-gray-500">平均成绩</p>
              </div>
              <div>
                <p class="text-xl font-bold text-purple-600">{{ studentDetail.completionRate || 0 }}%</p>
                <p class="text-xs text-gray-500">完成率</p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Knowledge Mastery Radar -->
          <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 class="font-semibold text-gray-800 mb-4">知识掌握度</h3>
            <div ref="radarChart" class="w-full h-72"></div>
            <div v-if="!studentDetail.knowledgeMastery || studentDetail.knowledgeMastery.length === 0" class="flex items-center justify-center h-72 text-gray-400 text-sm -mt-72 relative z-10">
              暂无掌握度数据
            </div>
          </div>

          <!-- Experiment Completion -->
          <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 class="font-semibold text-gray-800 mb-4">实验完成情况</h3>
            <div v-if="!studentDetail.experiments || studentDetail.experiments.length === 0" class="flex items-center justify-center h-72 text-gray-400 text-sm">
              暂无实验数据
            </div>
            <div v-else class="space-y-3 max-h-72 overflow-y-auto">
              <div v-for="exp in studentDetail.experiments" :key="exp.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ exp.title || exp.name }}</p>
                  <p class="text-xs text-gray-500">{{ exp.submittedAt ? formatDate(exp.submittedAt) : '未提交' }}</p>
                </div>
                <span class="px-2 py-1 rounded text-xs font-medium"
                  :class="exp.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
                  {{ exp.completed ? '已完成' : '未完成' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Submission History Timeline -->
        <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
          <h3 class="font-semibold text-gray-800 mb-4">提交历史</h3>
          <div v-if="!studentDetail.submissions || studentDetail.submissions.length === 0" class="text-center py-8 text-gray-400 text-sm">
            暂无提交记录
          </div>
          <div v-else class="relative border-l-2 border-blue-200 ml-4 space-y-4">
            <div v-for="sub in studentDetail.submissions" :key="sub.id" class="pl-6 relative">
              <div class="absolute -left-1.5 top-1 w-3 h-3 rounded-full"
                :class="sub.status === 'approved' ? 'bg-green-500' : sub.status === 'returned' ? 'bg-red-500' : 'bg-amber-400'"></div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-800">{{ sub.assignmentTitle || sub.title || '作业' }}</p>
                  <span v-if="sub.score != null" class="text-sm font-bold" :class="sub.score >= 60 ? 'text-green-600' : 'text-red-500'">
                    {{ sub.score }}分
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(sub.createdAt) }}</p>
                <p v-if="sub.feedback" class="text-xs text-gray-600 mt-1 italic whitespace-pre-line">反馈: {{ sub.feedback }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Student List View -->
      <div v-else>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Student Table -->
          <div class="lg:col-span-2 bg-white rounded-xl shadow border border-gray-100">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-semibold text-gray-800">学生列表</h3>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索学生..."
                class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
              />
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="text-left py-3 px-4 font-medium text-gray-600">姓名</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">学号</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">班级</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">提交数</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">平均分</th>
                    <th class="text-center py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredStudents.length === 0">
                    <td colspan="6" class="text-center py-8 text-gray-400">
                      {{ searchQuery ? '未找到匹配的学生' : '暂无学生数据' }}
                    </td>
                  </tr>
                  <tr v-for="s in paginatedStudents" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50">
                    <td class="py-3 px-4 text-gray-800 font-medium">{{ s.realName || s.username || '--' }}</td>
                    <td class="py-3 px-4 text-gray-600">{{ s.studentId || s.student_id || '--' }}</td>
                    <td class="py-3 px-4 text-gray-600">{{ s.className || s.class || '--' }}</td>
                    <td class="py-3 px-4 text-center text-gray-800">{{ s.submissionCount || 0 }}</td>
                    <td class="py-3 px-4 text-center">
                      <span :class="(s.avgScore || 0) >= 60 ? 'text-green-600' : 'text-red-500'" class="font-medium">
                        {{ s.avgScore ? s.avgScore.toFixed(1) : '--' }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <button @click="viewStudent(s)" class="text-blue-600 hover:text-blue-800 font-medium">详情</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination -->
            <div v-if="totalPages > 1" class="p-4 border-t border-gray-100 flex items-center justify-between">
              <p class="text-xs text-gray-500">共 {{ filteredStudents.length }} 名学生</p>
              <div class="flex space-x-1">
                <button @click="currentPage--" :disabled="currentPage <= 1" class="px-3 py-1 rounded text-sm border" :class="currentPage <= 1 ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&lt;</button>
                <button v-for="p in visiblePages" :key="p" @click="currentPage = p" class="px-3 py-1 rounded text-sm border"
                  :class="p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">
                  {{ p }}
                </button>
                <button @click="currentPage++" :disabled="currentPage >= totalPages" class="px-3 py-1 rounded text-sm border" :class="currentPage >= totalPages ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&gt;</button>
              </div>
            </div>
          </div>

          <!-- Class Comparison Chart -->
          <div class="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 class="font-semibold text-gray-800 mb-4">班级成绩对比</h3>
            <div ref="barChart" class="w-full h-64"></div>
            <div v-if="!classComparison || classComparison.length === 0" class="flex items-center justify-center h-64 text-gray-400 text-sm">
              暂无班级对比数据
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
        {{ error }}
        <button @click="error = null" class="ml-2 text-red-500 hover:text-red-700">&times;</button>
      </div>
    </div>
  `,
  data() {
    return {
      loading: false,
      error: null,
      students: [],
      classComparison: [],
      selectedStudent: null,
      studentDetail: null,
      searchQuery: '',
      currentPage: 1,
      pageSize: 10,
      radarChartInstance: null,
      barChartInstance: null,
      filterAssignmentId: '',
      filterChapterId: '',
      filterClassName: '',
      filterAssignments: [],
      filterChapters: [],
      filterClasses: [],
      exporting: false
    };
  },
  computed: {
    filteredStudents() {
      if (!this.searchQuery) return this.students;
      const q = this.searchQuery.toLowerCase();
      return this.students.filter(s =>
        (s.realName || '').toLowerCase().includes(q) ||
        (s.username || '').toLowerCase().includes(q) ||
        (s.studentId || s.student_id || '').includes(q)
      );
    },
    totalPages() {
      return Math.ceil(this.filteredStudents.length / this.pageSize) || 1;
    },
    paginatedStudents() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredStudents.slice(start, start + this.pageSize);
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const cur = this.currentPage;
      const start = Math.max(1, cur - 2);
      const end = Math.min(total, cur + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    }
  },
  async mounted() {
    await Promise.all([this.loadData(), this.loadFilters()]);
  },
  beforeUnmount() {
    if (this.radarChartInstance) this.radarChartInstance.dispose();
    if (this.barChartInstance) this.barChartInstance.dispose();
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getAdminStats();
        const data = res.data || res;
        this.students = data.students || data.studentList || [];
        this.classComparison = data.classComparison || data.classStats || [];
        this.$nextTick(() => this.renderBarChart());
      } catch (err) {
        this.error = '加载数据失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    async viewStudent(student) {
      this.selectedStudent = student;
      this.studentDetail = {
        submissionCount: student.submissionCount || 0,
        avgScore: student.avgScore || 0,
        completionRate: student.completionRate || 0,
        knowledgeMastery: student.knowledgeMastery || student.knowledge_mastery || [],
        submissions: student.submissions || student.recentSubmissions || [],
        experiments: student.experiments || []
      };
      this.$nextTick(() => this.renderRadarChart());
    },
    renderRadarChart() {
      if (!this.$refs.radarChart) return;
      const mastery = this.studentDetail?.knowledgeMastery || [];
      if (mastery.length === 0) return;

      if (this.radarChartInstance) this.radarChartInstance.dispose();
      this.radarChartInstance = echarts.init(this.$refs.radarChart);

      const indicators = mastery.map(m => ({ name: m.name || m.label, max: 100 }));
      const values = mastery.map(m => m.score || m.value || 0);

      this.radarChartInstance.setOption({
        tooltip: {},
        radar: {
          indicator: indicators,
          shape: 'polygon',
          splitNumber: 4,
          axisName: { color: '#6B7280', fontSize: 11 }
        },
        series: [{
          type: 'radar',
          data: [{
            value: values,
            name: '掌握度',
            areaStyle: { color: 'rgba(59,130,246,0.2)' },
            lineStyle: { color: '#3B82F6' },
            itemStyle: { color: '#3B82F6' }
          }]
        }]
      });
    },
    renderBarChart() {
      if (!this.$refs.barChart) return;
      if (!this.classComparison || this.classComparison.length === 0) return;

      this.barChartInstance = echarts.init(this.$refs.barChart);
      const names = this.classComparison.map(c => c.name || c.className || '');
      const scores = this.classComparison.map(c => c.avgScore || c.average || 0);

      this.barChartInstance.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 10, bottom: 30 },
        xAxis: { type: 'category', data: names, axisLabel: { fontSize: 10, rotate: 30 } },
        yAxis: { type: 'value', min: 0, max: 100 },
        series: [{
          type: 'bar',
          data: scores,
          barWidth: '40%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#93C5FD' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }]
      });
    },
    async loadFilters() {
      try {
        const [assignRes, chapRes] = await Promise.allSettled([
          api.getAssignments(),
          api.getChapters()
        ]);
        if (assignRes.status === 'fulfilled') {
          const data = assignRes.value.data || assignRes.value;
          this.filterAssignments = Array.isArray(data) ? data : (data.assignments || []);
        }
        if (chapRes.status === 'fulfilled') {
          const data = chapRes.value.data || chapRes.value;
          this.filterChapters = Array.isArray(data) ? data : (data.chapters || []);
        }
        // Extract unique class names from students list
        this.$watch(() => this.students, (val) => {
          const classes = [...new Set(val.map(s => s.className || s.class_name || s.class || '').filter(Boolean))];
          this.filterClasses = classes.sort();
        }, { immediate: true });
      } catch (err) {
        console.warn('加载筛选项失败:', err);
      }
    },
    async exportGrades() {
      this.exporting = true;
      try {
        const params = new URLSearchParams();
        if (this.filterAssignmentId) params.set('assignment_id', this.filterAssignmentId);
        if (this.filterChapterId) params.set('chapter_id', this.filterChapterId);
        if (this.filterClassName) params.set('class_name', this.filterClassName);
        const url = '/api/export/grades' + (params.toString() ? '?' + params.toString() : '');
        const token = localStorage.getItem('dip-token');
        const res = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('导出失败 (' + res.status + ')');
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '成绩导出.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } catch (err) {
        this.error = '导出成绩失败: ' + (err.message || '未知错误');
      } finally {
        this.exporting = false;
      }
    },
    async exportSummary() {
      this.exporting = true;
      try {
        const url = '/api/export/summary';
        const token = localStorage.getItem('dip-token');
        const res = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('导出失败 (' + res.status + ')');
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '班级汇总.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } catch (err) {
        this.error = '导出汇总失败: ' + (err.message || '未知错误');
      } finally {
        this.exporting = false;
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '--';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
  }
};
