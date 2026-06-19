var DataStatistics = {
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">数据统计</h1>
        <button @click="exportCSV" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span>导出 CSV</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-600">{{ error }}</p>
        <button @click="loadData" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">重新加载</button>
      </div>

      <div v-else class="space-y-6">
        <!-- Charts Row 1 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- User Growth -->
          <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">用户增长趋势</h3>
            <div ref="userGrowthChart" class="w-full h-72"></div>
            <div v-if="!stats.userGrowth || stats.userGrowth.length === 0" class="flex items-center justify-center h-72 text-gray-400 text-sm">
              暂无数据
            </div>
          </div>

          <!-- Submission Volume -->
          <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">提交量统计</h3>
            <div ref="submissionChart" class="w-full h-72"></div>
            <div v-if="!stats.submissionVolume || stats.submissionVolume.length === 0" class="flex items-center justify-center h-72 text-gray-400 text-sm">
              暂无数据
            </div>
          </div>
        </div>

        <!-- Charts Row 2 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Popular Experiments -->
          <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">热门实验 TOP 10</h3>
            <div ref="popularChart" class="w-full h-72"></div>
            <div v-if="!stats.popularExperiments || stats.popularExperiments.length === 0" class="flex items-center justify-center h-72 text-gray-400 text-sm">
              暂无数据
            </div>
          </div>

          <!-- Knowledge Mastery Distribution -->
          <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">知识点掌握分布</h3>
            <div ref="masteryChart" class="w-full h-72"></div>
            <div v-if="!stats.knowledgeMastery || stats.knowledgeMastery.length === 0" class="flex items-center justify-center h-72 text-gray-400 text-sm">
              暂无数据
            </div>
          </div>
        </div>

        <!-- Class Comparison Table -->
        <div class="bg-white rounded-xl shadow border border-gray-100">
          <div class="p-5 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-800">班级成绩对比</h3>
          </div>
          <div v-if="!stats.classComparison || stats.classComparison.length === 0" class="p-8 text-center text-gray-400">
            暂无班级对比数据
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-medium text-gray-600">班级</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-600">学生数</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-600">平均成绩</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-600">最高分</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-600">最低分</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-600">及格率</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-600">提交率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cls in stats.classComparison" :key="cls.name || cls.className" class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="py-3 px-4 text-gray-800 font-medium">{{ cls.name || cls.className }}</td>
                  <td class="py-3 px-4 text-center text-gray-600">{{ cls.studentCount || cls.students || 0 }}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="font-bold" :class="(cls.avgScore || cls.average || 0) >= 60 ? 'text-green-600' : 'text-red-500'">
                      {{ (cls.avgScore || cls.average || 0).toFixed(1) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center text-green-600 font-medium">{{ cls.maxScore || cls.max || '--' }}</td>
                  <td class="py-3 px-4 text-center text-red-500 font-medium">{{ cls.minScore || cls.min || '--' }}</td>
                  <td class="py-3 px-4 text-center">
                    <div class="flex items-center justify-center space-x-2">
                      <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full rounded-full" :class="(cls.passRate || 0) >= 80 ? 'bg-green-500' : (cls.passRate || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'" :style="{ width: (cls.passRate || 0) + '%' }"></div>
                      </div>
                      <span class="text-xs text-gray-600">{{ cls.passRate || 0 }}%</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-center text-gray-600">{{ cls.submissionRate || 0 }}%</td>
                </tr>
              </tbody>
            </table>
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
      stats: {},
      charts: [],
      toast: null
    };
  },
  async mounted() {
    await this.loadData();
  },
  beforeUnmount() {
    this.charts.forEach(c => { if (c) c.dispose(); });
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getAdminStats();
        const data = res.data || res;
        this.stats = {
          userGrowth: data.userGrowth || data.userGrowthTrend || [],
          submissionVolume: data.submissionVolume || data.submissionTrend || data.dailySubmissions || [],
          popularExperiments: data.popularExperiments || data.topExperiments || [],
          knowledgeMastery: data.knowledgeMastery || data.knowledgeDistribution || [],
          classComparison: data.classComparison || data.classStats || [],
          ...data
        };
        this.$nextTick(() => {
          this.renderUserGrowth();
          this.renderSubmissionChart();
          this.renderPopularChart();
          this.renderMasteryChart();
        });
      } catch (err) {
        this.error = '加载数据失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    initChart(ref) {
      if (!this.$refs[ref]) return null;
      const chart = echarts.init(this.$refs[ref]);
      this.charts.push(chart);
      window.addEventListener('resize', () => chart.resize());
      return chart;
    },
    renderUserGrowth() {
      const data = this.stats.userGrowth;
      if (!data || data.length === 0) return;
      const chart = this.initChart('userGrowthChart');
      if (!chart) return;
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: data.map(d => d.date || d.month || d.day), axisLabel: { fontSize: 10, rotate: 30 } },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: '新增用户',
          type: 'line',
          smooth: true,
          data: data.map(d => d.count || d.value || 0),
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59,130,246,0.3)' },
            { offset: 1, color: 'rgba(59,130,246,0.05)' }
          ])},
          lineStyle: { color: '#3B82F6', width: 2 },
          itemStyle: { color: '#3B82F6' }
        }]
      });
    },
    renderSubmissionChart() {
      const data = this.stats.submissionVolume;
      if (!data || data.length === 0) return;
      const chart = this.initChart('submissionChart');
      if (!chart) return;
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: data.map(d => d.date || d.day), axisLabel: { fontSize: 10, rotate: 30 } },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: '提交量',
          type: 'bar',
          data: data.map(d => d.count || d.value || 0),
          barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#10B981' },
              { offset: 1, color: '#6EE7B7' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }]
      });
    },
    renderPopularChart() {
      const data = this.stats.popularExperiments;
      if (!data || data.length === 0) return;
      const chart = this.initChart('popularChart');
      if (!chart) return;
      const sorted = [...data].sort((a, b) => (a.count || a.usage || 0) - (b.count || b.usage || 0)).slice(-10);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 100, right: 30, top: 10, bottom: 20 },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: sorted.map(d => d.title || d.name || ''), axisLabel: { fontSize: 11, width: 80, overflow: 'truncate' } },
        series: [{
          type: 'bar',
          data: sorted.map(d => d.count || d.usage || 0),
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#8B5CF6' },
              { offset: 1, color: '#C4B5FD' }
            ]),
            borderRadius: [0, 4, 4, 0]
          }
        }]
      });
    },
    renderMasteryChart() {
      const data = this.stats.knowledgeMastery;
      if (!data || data.length === 0) return;
      const chart = this.initChart('masteryChart');
      if (!chart) return;

      // Build histogram bins: 0-20, 20-40, 40-60, 60-80, 80-100
      const bins = [
        { label: '0-20%', count: 0 },
        { label: '20-40%', count: 0 },
        { label: '40-60%', count: 0 },
        { label: '60-80%', count: 0 },
        { label: '80-100%', count: 0 }
      ];
      data.forEach(d => {
        const v = d.score || d.value || d.mastery || 0;
        const idx = Math.min(Math.floor(v / 20), 4);
        bins[idx].count++;
      });

      const colors = ['#EF4444', '#F59E0B', '#FBBF24', '#34D399', '#10B981'];
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: bins.map(b => b.label) },
        yAxis: { type: 'value', minInterval: 1, name: '知识点数' },
        series: [{
          type: 'bar',
          data: bins.map((b, i) => ({ value: b.count, itemStyle: { color: colors[i], borderRadius: [4, 4, 0, 0] } })),
          barWidth: '50%'
        }]
      });
    },
    exportCSV() {
      try {
        const rows = [['班级', '学生数', '平均成绩', '最高分', '最低分', '及格率', '提交率']];
        (this.stats.classComparison || []).forEach(cls => {
          rows.push([
            cls.name || cls.className || '',
            cls.studentCount || cls.students || 0,
            (cls.avgScore || cls.average || 0).toFixed(1),
            cls.maxScore || cls.max || '',
            cls.minScore || cls.min || '',
            (cls.passRate || 0) + '%',
            (cls.submissionRate || 0) + '%'
          ]);
        });

        // Add submission data
        rows.push([]);
        rows.push(['日期', '提交量']);
        (this.stats.submissionVolume || []).forEach(d => {
          rows.push([d.date || d.day || '', d.count || d.value || 0]);
        });

        const csv = rows.map(r => r.join(',')).join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'platform_stats_' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('CSV 已导出', 'success');
      } catch (err) {
        this.showToast('导出失败', 'error');
      }
    },
    showToast(message, type = 'success') {
      this.toast = { message, type };
      setTimeout(() => { this.toast = null; }, 3000);
    }
  }
};
