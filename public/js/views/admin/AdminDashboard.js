var AdminDashboard = {
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-lg">
        <h1 class="text-2xl font-bold">平台管理概览</h1>
        <p class="mt-1 text-gray-300">系统运行状态与数据统计</p>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">总用户数</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.totalUsers || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">活跃用户</p>
              <p class="text-2xl font-bold text-green-600 mt-1">{{ stats.activeUsers || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">总提交数</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.totalSubmissions || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">实验总数</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.totalExperiments || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- User Distribution Pie Chart -->
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">用户角色分布</h3>
          <div ref="pieChart" class="w-full h-72"></div>
          <div v-if="!loading && (!stats.roleDistribution || stats.roleDistribution.length === 0)" class="flex items-center justify-center h-72 text-gray-400 -mt-72 relative z-10">
            暂无数据
          </div>
        </div>

        <!-- Daily Active Users Line Chart -->
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">近30天活跃用户</h3>
          <div ref="lineChart" class="w-full h-72"></div>
          <div v-if="!loading && (!stats.dailyActive || stats.dailyActive.length === 0)" class="flex items-center justify-center h-72 text-gray-400 -mt-72 relative z-10">
            暂无数据
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Activity -->
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">最近活动</h3>
          <div v-if="activities.length === 0" class="flex items-center justify-center h-48 text-gray-400">
            暂无活动记录
          </div>
          <div v-else class="space-y-3 max-h-72 overflow-y-auto">
            <div v-for="(act, idx) in activities" :key="idx" class="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" :class="activityIconClass(act.type)">
                <span class="text-xs font-bold">{{ activityIcon(act.type) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm text-gray-800">{{ act.description || act.message }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ act.user || '' }} {{ formatDate(act.time || act.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- System Health -->
        <div class="bg-white rounded-xl p-5 shadow border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">系统状态</h3>
          <div class="space-y-4">
            <div v-for="item in healthItems" :key="item.label" class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-2.5 h-2.5 rounded-full" :class="item.status === 'ok' ? 'bg-green-500' : item.status === 'warn' ? 'bg-amber-500' : 'bg-red-500'"></div>
                <span class="text-sm text-gray-700">{{ item.label }}</span>
              </div>
              <span class="text-sm font-medium" :class="item.status === 'ok' ? 'text-green-600' : item.status === 'warn' ? 'text-amber-600' : 'text-red-600'">
                {{ item.value }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 shadow-lg flex items-center space-x-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          <span class="text-gray-700">加载中...</span>
        </div>
      </div>

      <!-- Error Toast -->
      <div v-if="error" class="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
        <div class="flex items-center space-x-2">
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
      activities: [],
      pieChartInstance: null,
      lineChartInstance: null
    };
  },
  computed: {
    healthItems() {
      const s = this.stats;
      return [
        { label: '数据库连接', status: s.dbStatus || 'ok', value: s.dbStatus === 'error' ? '异常' : '正常' },
        { label: 'API 服务', status: s.apiStatus || 'ok', value: s.apiStatus === 'error' ? '异常' : '正常' },
        { label: '存储空间', status: (s.storageUsage || 0) > 80 ? 'warn' : 'ok', value: (s.storageUsage || 35) + '%' },
        { label: 'CPU 使用率', status: (s.cpuUsage || 0) > 80 ? 'warn' : 'ok', value: (s.cpuUsage || 20) + '%' },
        { label: '内存使用率', status: (s.memoryUsage || 0) > 80 ? 'warn' : 'ok', value: (s.memoryUsage || 40) + '%' },
        { label: '系统版本', status: 'ok', value: s.version || 'v1.0.0' }
      ];
    }
  },
  async mounted() {
    await this.loadData();
  },
  beforeUnmount() {
    if (this.pieChartInstance) this.pieChartInstance.dispose();
    if (this.lineChartInstance) this.lineChartInstance.dispose();
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.getAdminStats();
        const data = res.data || res;
        this.stats = {
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || data.activeUsersToday || 0,
          totalSubmissions: data.totalSubmissions || 0,
          totalExperiments: data.totalExperiments || data.totalSimulations || 0,
          roleDistribution: data.roleDistribution || data.userByRole || [],
          dailyActive: data.dailyActive || data.dailyActiveUsers || [],
          ...data
        };
        this.activities = data.recentActivities || data.activities || [];
        this.$nextTick(() => {
          this.renderPieChart();
          this.renderLineChart();
        });
      } catch (err) {
        this.error = '加载数据失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    renderPieChart() {
      if (!this.$refs.pieChart) return;
      const dist = this.stats.roleDistribution;
      if (!dist || dist.length === 0) return;

      this.pieChartInstance = echarts.init(this.$refs.pieChart);
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      const pieData = dist.map((d, i) => ({
        name: d.role || d.name || d.label,
        value: d.count || d.value || 0,
        itemStyle: { color: colors[i % colors.length] }
      }));

      this.pieChartInstance.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, textStyle: { fontSize: 12 } },
        series: [{
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          label: { show: true, formatter: '{b}\n{c}人' },
          data: pieData
        }]
      });

      window.addEventListener('resize', () => { if (this.pieChartInstance) this.pieChartInstance.resize(); });
    },
    renderLineChart() {
      if (!this.$refs.lineChart) return;
      const daily = this.stats.dailyActive;
      if (!daily || daily.length === 0) return;

      this.lineChartInstance = echarts.init(this.$refs.lineChart);
      const days = daily.map(d => d.date || d.day);
      const counts = daily.map(d => d.count || d.value || 0);

      this.lineChartInstance.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: days, axisLabel: { fontSize: 10, rotate: 30 } },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          data: counts,
          type: 'line',
          smooth: true,
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16,185,129,0.3)' },
            { offset: 1, color: 'rgba(16,185,129,0.05)' }
          ])},
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' }
        }]
      });

      window.addEventListener('resize', () => { if (this.lineChartInstance) this.lineChartInstance.resize(); });
    },
    activityIcon(type) {
      const icons = { login: 'L', submit: 'S', review: 'R', register: 'N', system: 'Y' };
      return icons[type] || 'A';
    },
    activityIconClass(type) {
      const classes = {
        login: 'bg-blue-100 text-blue-600',
        submit: 'bg-green-100 text-green-600',
        review: 'bg-purple-100 text-purple-600',
        register: 'bg-amber-100 text-amber-600',
        system: 'bg-gray-200 text-gray-600'
      };
      return classes[type] || 'bg-gray-100 text-gray-600';
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
  }
};
