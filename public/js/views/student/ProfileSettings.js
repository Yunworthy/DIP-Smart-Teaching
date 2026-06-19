var ProfileSettings = {
  name: 'ProfileSettings',
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">个人设置</h1>
        <p class="mt-1 text-sm text-gray-500">管理你的账户信息和学习数据</p>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left Column -->
        <div class="space-y-6">
          <!-- Profile Card -->
          <div class="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-center">
              <div class="mx-auto h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-4 border-white/30">
                {{ (user.real_name || user.username || 'U').charAt(0) }}
              </div>
            </div>
            <div class="p-5 -mt-6">
              <div class="text-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">{{ user.real_name || '未设置' }}</h3>
                <p class="text-sm text-gray-500">@{{ user.username || 'username' }}</p>
              </div>
              <div class="space-y-3 text-sm">
                <div class="flex items-center gap-3 py-2 border-b border-gray-50">
                  <svg class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/>
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-400">学号</p>
                    <p class="text-gray-700">{{ user.student_id || 'N/A' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 py-2 border-b border-gray-50">
                  <svg class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-400">班级</p>
                    <p class="text-gray-700">{{ user.class_name || 'N/A' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 py-2">
                  <svg class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-400">邮箱</p>
                    <p class="text-gray-700">{{ user.email || 'N/A' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Change Password -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">修改密码</h3>
            <form @submit.prevent="changePassword" class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">当前密码</label>
                <input v-model="passwordForm.oldPassword" type="password"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="输入当前密码"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">新密码</label>
                <input v-model="passwordForm.newPassword" type="password"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="至少6个字符"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">确认新密码</label>
                <input v-model="passwordForm.confirmPassword" type="password"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="再次输入新密码"/>
                <p v-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword"
                  class="mt-1 text-xs text-red-500">两次输入的密码不一致</p>
              </div>
              <button type="submit" :disabled="changingPassword"
                class="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {{ changingPassword ? '提交中...' : '修改密码' }}
              </button>
            </form>
          </div>
        </div>

        <!-- Right Column: Study Statistics -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Stats Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500">学习时长</p>
                  <p class="text-xl font-bold text-gray-900">{{ studyStats.totalHours }}h</p>
                </div>
              </div>
            </div>
            <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500">完成实验</p>
                  <p class="text-xl font-bold text-gray-900">{{ studyStats.completedExperiments }}</p>
                </div>
              </div>
            </div>
            <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                  <svg class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500">平均成绩</p>
                  <p class="text-xl font-bold text-gray-900">{{ studyStats.averageScore }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Radar Chart -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">知识掌握雷达图</h3>
            <div ref="radarChart" style="height: 380px"></div>
          </div>

          <!-- Recent Activity -->
          <div class="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">最近活动</h3>
            <div v-if="activities.length === 0" class="text-center py-8 text-gray-400 text-sm">暂无活动记录</div>
            <div class="space-y-3">
              <div v-for="(act, i) in activities" :key="i" class="flex items-start gap-3 py-2">
                <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  :class="act.type === 'experiment' ? 'bg-emerald-50' : act.type === 'master' ? 'bg-indigo-50' : 'bg-gray-50'">
                  <svg class="h-4 w-4" :class="act.type === 'experiment' ? 'text-emerald-500' : act.type === 'master' ? 'text-indigo-500' : 'text-gray-500'"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path v-if="act.type === 'experiment'" stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                    <path v-else stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-800">{{ act.message }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ act.time }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      changingPassword: false,
      studyStats: {
        totalHours: 0,
        completedExperiments: 0,
        averageScore: 0
      },
      activities: [],
      radarChart: null,
      progressData: []
    };
  },
  computed: {
    user() {
      return store.user || {};
    }
  },
  async mounted() {
    await this.loadStats();
    this.$nextTick(() => {
      this.initRadarChart();
    });
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.radarChart) {
      this.radarChart.dispose();
    }
  },
  methods: {
    async loadStats() {
      try {
        const progRes = await api.getMyProgress();
        const progress = progRes.data || progRes || [];
        const list = Array.isArray(progress) ? progress : [];
        this.progressData = list;
        this.studyStats.completedExperiments = list.filter(p => p.type === 'experiment' || (p.status === 'completed')).length;
        this.studyStats.totalHours = Math.round(list.length * 0.5);
        this.studyStats.averageScore = list.length > 0
          ? Math.round(list.reduce((sum, p) => sum + (p.mastery_level || p.score || 0), 0) / list.length)
          : 0;

        this.activities = list.slice(0, 8).map(p => ({
          type: p.mastery_level >= 80 ? 'master' : 'experiment',
          message: (p.mastery_level >= 80 ? '掌握了 ' : '完成了 ') + (p.name || p.title || '知识点'),
          time: p.updated_at || p.created_at || ''
        }));
      } catch (e) {
        console.error('Load stats error:', e);
      }
    },
    initRadarChart() {
      const container = this.$refs.radarChart;
      if (!container || typeof echarts === 'undefined') return;
      this.radarChart = echarts.init(container);

      const categories = [
        { name: '图像基础', max: 100 },
        { name: '点运算', max: 100 },
        { name: '空间滤波', max: 100 },
        { name: '频域处理', max: 100 },
        { name: '边缘检测', max: 100 },
        { name: '形态学', max: 100 },
        { name: '图像压缩', max: 100 },
        { name: '彩色处理', max: 100 }
      ];

      // Use real progress data if available, otherwise default to 0
      const progressList = this.progressData || [];
      const values = categories.map((cat, i) => {
        // Try to find a matching progress entry by category name or index
        const match = progressList.find(p =>
          (p.category && p.category === cat.name) ||
          (p.name && p.name.includes(cat.name)) ||
          (p.title && p.title.includes(cat.name))
        );
        if (match) return match.mastery_level || match.mastery || match.score || 0;
        // Fall back to using index-based entries
        if (progressList[i]) return progressList[i].mastery_level || progressList[i].mastery || progressList[i].score || 0;
        return 0;
      });

      const option = {
        tooltip: {},
        radar: {
          indicator: categories,
          shape: 'polygon',
          splitNumber: 4,
          axisName: {
            color: '#6b7280',
            fontSize: 12
          },
          splitLine: {
            lineStyle: { color: '#e5e7eb' }
          },
          splitArea: {
            areaStyle: { color: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db'] }
          },
          axisLine: {
            lineStyle: { color: '#e5e7eb' }
          }
        },
        series: [{
          type: 'radar',
          data: [{
            value: values,
            name: '掌握程度',
            areaStyle: {
              color: 'rgba(99, 102, 241, 0.15)'
            },
            lineStyle: {
              color: '#6366f1',
              width: 2
            },
            itemStyle: {
              color: '#6366f1'
            }
          }]
        }]
      };

      this.radarChart.setOption(option);
    },
    async changePassword() {
      if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword) {
        store.notify('请填写完整密码信息', 'error');
        return;
      }
      if (this.passwordForm.newPassword.length < 6) {
        store.notify('新密码至少6个字符', 'error');
        return;
      }
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        store.notify('两次输入的密码不一致', 'error');
        return;
      }
      this.changingPassword = true;
      try {
        await api.changePassword(this.passwordForm.oldPassword, this.passwordForm.newPassword);
        store.notify('密码修改成功', 'success');
        this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
      } catch (e) {
        store.notify('密码修改失败: ' + (e.message || '未知错误'), 'error');
      } finally {
        this.changingPassword = false;
      }
    },
    handleResize() {
      if (this.radarChart) this.radarChart.resize();
    }
  }
};
