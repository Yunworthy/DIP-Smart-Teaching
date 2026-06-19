var LogViewer = {
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">系统日志</h1>
        <div class="flex items-center space-x-3">
          <label class="flex items-center space-x-2 cursor-pointer select-none">
            <span class="text-sm text-gray-500">自动刷新</span>
            <button @click="toggleAutoRefresh" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="autoRefresh ? 'bg-blue-600' : 'bg-gray-300'">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="autoRefresh ? 'translate-x-6' : 'translate-x-1'"></span>
            </button>
          </label>
          <button @click="loadCurrentTab" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center space-x-2">
            <svg class="w-4 h-4" :class="loading ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span>刷新</span>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8">
          <button @click="switchTab('audit')" class="py-3 px-1 border-b-2 text-sm font-medium transition-colors"
            :class="activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
            审计日志
            <span v-if="auditTotal > 0" class="ml-1 px-2 py-0.5 rounded-full text-xs"
              :class="activeTab === 'audit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">{{ auditTotal }}</span>
          </button>
          <button @click="switchTab('request')" class="py-3 px-1 border-b-2 text-sm font-medium transition-colors"
            :class="activeTab === 'request' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
            请求日志
            <span v-if="requestTotal > 0" class="ml-1 px-2 py-0.5 rounded-full text-xs"
              :class="activeTab === 'request' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">{{ requestTotal }}</span>
          </button>
        </nav>
      </div>

      <!-- Audit Log Tab -->
      <div v-if="activeTab === 'audit'">
        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div class="flex flex-wrap items-center gap-3">
            <select v-model="auditFilter" @change="loadAuditLogs(1)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">全部操作类型</option>
              <option value="login">登录</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="submit">提交</option>
              <option value="grade">批改</option>
              <option value="publish">发布</option>
              <option value="import">导入</option>
            </select>
            <div class="flex items-center space-x-2 text-xs text-gray-400">
              <span class="flex items-center space-x-1"><span class="w-2 h-2 bg-blue-500 rounded-full inline-block"></span><span>登录</span></span>
              <span class="flex items-center space-x-1"><span class="w-2 h-2 bg-green-500 rounded-full inline-block"></span><span>创建</span></span>
              <span class="flex items-center space-x-1"><span class="w-2 h-2 bg-amber-500 rounded-full inline-block"></span><span>更新</span></span>
              <span class="flex items-center space-x-1"><span class="w-2 h-2 bg-red-500 rounded-full inline-block"></span><span>删除</span></span>
              <span class="flex items-center space-x-1"><span class="w-2 h-2 bg-purple-500 rounded-full inline-block"></span><span>提交</span></span>
            </div>
            <div class="flex-1"></div>
            <span class="text-sm text-gray-500">共 {{ auditTotal }} 条记录</span>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p class="text-red-600">{{ error }}</p>
          <button @click="loadAuditLogs(1)" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">重新加载</button>
        </div>

        <!-- Table -->
        <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-medium text-gray-600 w-10"></th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">时间</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">用户</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">资源</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">详情</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="auditLogs.length === 0">
                  <td colspan="7" class="text-center py-12 text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p>暂无审计日志</p>
                    <p class="text-xs mt-1 text-gray-300">用户操作后将自动记录审计日志</p>
                  </td>
                </tr>
                <tr v-for="log in auditLogs" :key="log.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td class="py-3 px-4">
                    <span class="w-2.5 h-2.5 rounded-full inline-block" :class="actionDotClass(log.action)"></span>
                  </td>
                  <td class="py-3 px-4 text-gray-600 text-xs whitespace-nowrap">{{ formatDateTime(log.created_at) }}</td>
                  <td class="py-3 px-4 text-gray-800">{{ log.username || '--' }}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-xs font-medium" :class="actionBadgeClass(log.action)">
                      {{ actionLabel(log.action) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-gray-600 text-xs">
                    <span v-if="log.resource_type">{{ resourceLabel(log.resource_type) }}<span v-if="log.resource_id"> #{{ log.resource_id }}</span></span>
                    <span v-else class="text-gray-300">--</span>
                  </td>
                  <td class="py-3 px-4 text-gray-600 max-w-xs truncate text-xs">{{ log.detail || '--' }}</td>
                  <td class="py-3 px-4 text-gray-500 font-mono text-xs whitespace-nowrap">{{ log.ip_address || '--' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="auditTotalPages > 1" class="p-4 border-t border-gray-100 flex items-center justify-between">
            <p class="text-xs text-gray-500">第 {{ auditPage }} / {{ auditTotalPages }} 页</p>
            <div class="flex space-x-1">
              <button @click="loadAuditLogs(auditPage - 1)" :disabled="auditPage <= 1" class="px-3 py-1 rounded text-xs border"
                :class="auditPage <= 1 ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&lt;</button>
              <button v-for="p in auditVisiblePages" :key="p" @click="loadAuditLogs(p)" class="px-3 py-1 rounded text-xs border"
                :class="p === auditPage ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">
                {{ p }}
              </button>
              <button @click="loadAuditLogs(auditPage + 1)" :disabled="auditPage >= auditTotalPages" class="px-3 py-1 rounded text-xs border"
                :class="auditPage >= auditTotalPages ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&gt;</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Log Tab -->
      <div v-if="activeTab === 'request'">
        <!-- Summary -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">共 {{ requestTotal }} 条请求记录</span>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p class="text-red-600">{{ error }}</p>
          <button @click="loadRequestLogs(1)" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">重新加载</button>
        </div>

        <!-- Table -->
        <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-medium text-gray-600">时间</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">方法</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">路径</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">耗时</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="requestLogs.length === 0">
                  <td colspan="6" class="text-center py-12 text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p>暂无请求日志</p>
                    <p class="text-xs mt-1 text-gray-300">API请求将自动记录到此日志</p>
                  </td>
                </tr>
                <tr v-for="log in requestLogs" :key="log.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td class="py-3 px-4 text-gray-600 text-xs whitespace-nowrap">{{ formatDateTime(log.created_at) }}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-xs font-mono font-medium" :class="methodClass(log.method)">{{ log.method }}</span>
                  </td>
                  <td class="py-3 px-4 text-gray-700 text-xs font-mono max-w-sm truncate">{{ log.path }}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-xs font-medium" :class="statusClass(log.status_code)">{{ log.status_code }}</span>
                  </td>
                  <td class="py-3 px-4 text-gray-600 text-xs">{{ log.response_time != null ? log.response_time + 'ms' : '--' }}</td>
                  <td class="py-3 px-4 text-gray-500 font-mono text-xs whitespace-nowrap">{{ log.ip_address || '--' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="requestTotalPages > 1" class="p-4 border-t border-gray-100 flex items-center justify-between">
            <p class="text-xs text-gray-500">第 {{ requestPage }} / {{ requestTotalPages }} 页</p>
            <div class="flex space-x-1">
              <button @click="loadRequestLogs(requestPage - 1)" :disabled="requestPage <= 1" class="px-3 py-1 rounded text-xs border"
                :class="requestPage <= 1 ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&lt;</button>
              <button v-for="p in requestVisiblePages" :key="p" @click="loadRequestLogs(p)" class="px-3 py-1 rounded text-xs border"
                :class="p === requestPage ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">
                {{ p }}
              </button>
              <button @click="loadRequestLogs(requestPage + 1)" :disabled="requestPage >= requestTotalPages" class="px-3 py-1 rounded text-xs border"
                :class="requestPage >= requestTotalPages ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      activeTab: 'audit',
      loading: false,
      error: null,
      // Audit logs
      auditLogs: [],
      auditPage: 1,
      auditTotal: 0,
      auditTotalPages: 1,
      auditFilter: '',
      // Request logs
      requestLogs: [],
      requestPage: 1,
      requestTotal: 0,
      requestTotalPages: 1,
      // Auto refresh
      autoRefresh: false,
      refreshTimer: null
    };
  },
  computed: {
    auditVisiblePages() {
      var pages = [];
      var total = this.auditTotalPages;
      var cur = this.auditPage;
      var start = Math.max(1, cur - 2);
      var end = Math.min(total, cur + 2);
      for (var i = start; i <= end; i++) pages.push(i);
      return pages;
    },
    requestVisiblePages() {
      var pages = [];
      var total = this.requestTotalPages;
      var cur = this.requestPage;
      var start = Math.max(1, cur - 2);
      var end = Math.min(total, cur + 2);
      for (var i = start; i <= end; i++) pages.push(i);
      return pages;
    }
  },
  async mounted() {
    await this.loadCurrentTab();
  },
  beforeUnmount() {
    this.stopAutoRefresh();
  },
  methods: {
    switchTab(tab) {
      this.activeTab = tab;
      this.error = null;
      this.loadCurrentTab();
    },
    async loadCurrentTab() {
      if (this.activeTab === 'audit') {
        await this.loadAuditLogs(this.auditPage);
      } else {
        await this.loadRequestLogs(this.requestPage);
      }
    },
    async loadAuditLogs(page) {
      this.loading = true;
      this.error = null;
      try {
        var url = '/api/admin/audit-logs?page=' + page + '&size=20';
        if (this.auditFilter) url += '&action=' + this.auditFilter;
        var data = await api.request('GET', url);
        this.auditLogs = data.logs || [];
        this.auditTotal = data.total || 0;
        this.auditPage = data.page || 1;
        this.auditTotalPages = data.totalPages || 1;
      } catch (err) {
        this.error = '加载审计日志失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    async loadRequestLogs(page) {
      this.loading = true;
      this.error = null;
      try {
        var url = '/api/admin/request-logs?page=' + page + '&size=50';
        var data = await api.request('GET', url);
        this.requestLogs = data.logs || [];
        this.requestTotal = data.total || 0;
        this.requestPage = data.page || 1;
        this.requestTotalPages = data.totalPages || 1;
      } catch (err) {
        this.error = '加载请求日志失败: ' + (err.message || '未知错误');
      } finally {
        this.loading = false;
      }
    },
    toggleAutoRefresh() {
      this.autoRefresh = !this.autoRefresh;
      if (this.autoRefresh) {
        this.refreshTimer = setInterval(function() { this.loadCurrentTab(); }.bind(this), 10000);
      } else {
        this.stopAutoRefresh();
      }
    },
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },
    actionDotClass(action) {
      var map = {
        login: 'bg-blue-500',
        create: 'bg-green-500',
        update: 'bg-amber-500',
        delete: 'bg-red-500',
        submit: 'bg-purple-500',
        grade: 'bg-indigo-500',
        publish: 'bg-teal-500',
        import: 'bg-cyan-500'
      };
      return map[action] || 'bg-gray-400';
    },
    actionBadgeClass(action) {
      var map = {
        login: 'bg-blue-100 text-blue-700',
        create: 'bg-green-100 text-green-700',
        update: 'bg-amber-100 text-amber-700',
        delete: 'bg-red-100 text-red-700',
        submit: 'bg-purple-100 text-purple-700',
        grade: 'bg-indigo-100 text-indigo-700',
        publish: 'bg-teal-100 text-teal-700',
        import: 'bg-cyan-100 text-cyan-700'
      };
      return map[action] || 'bg-gray-100 text-gray-600';
    },
    actionLabel(action) {
      var map = {
        login: '登录',
        create: '创建',
        update: '更新',
        delete: '删除',
        submit: '提交',
        grade: '批改',
        publish: '发布',
        import: '导入'
      };
      return map[action] || action || '其他';
    },
    resourceLabel(type) {
      var map = {
        assignment: '作业',
        resource: '资源',
        exam: '考试',
        submission: '提交',
        student: '学生'
      };
      return map[type] || type || '--';
    },
    methodClass(method) {
      var map = {
        GET: 'bg-green-100 text-green-700',
        POST: 'bg-blue-100 text-blue-700',
        PUT: 'bg-amber-100 text-amber-700',
        DELETE: 'bg-red-100 text-red-700',
        PATCH: 'bg-purple-100 text-purple-700'
      };
      return map[method] || 'bg-gray-100 text-gray-600';
    },
    statusClass(status) {
      if (!status) return 'bg-gray-100 text-gray-600';
      if (status >= 200 && status < 300) return 'bg-green-100 text-green-700';
      if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-700';
      if (status >= 400 && status < 500) return 'bg-amber-100 text-amber-700';
      if (status >= 500) return 'bg-red-100 text-red-700';
      return 'bg-gray-100 text-gray-600';
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '--';
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');
    }
  }
};
