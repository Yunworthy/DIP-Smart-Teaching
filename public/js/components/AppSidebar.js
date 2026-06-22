var AppSidebar = {
  name: 'AppSidebar',
  template: `
    <div>
      <!-- Mobile overlay -->
      <div
        v-if="store.sidebarOpen"
        class="fixed inset-0 z-30 bg-black/40 lg:hidden"
        @click="closeSidebar"
      ></div>

      <aside
        :class="[
          'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-slate-800 text-gray-300 transition-all duration-300 mobile-sidebar',
          collapsed ? 'w-16' : 'w-64',
          store.sidebarOpen ? 'open' : ''
        ]"
      >
      <!-- Logo area -->
      <div class="flex items-center gap-3 h-16 px-4 border-b border-slate-700 flex-shrink-0">
        <div class="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
          DIP
        </div>
        <div v-if="!collapsed" class="flex flex-col min-w-0">
          <span class="text-sm font-semibold text-white truncate">数字图像处理</span>
          <span class="text-[10px] text-slate-400 truncate">智慧教学平台</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <template v-for="item in menuItems" :key="item.path">
          <a
            href="#"
            @click.prevent="navigateTo(item.path)"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
              isActive(item.path)
                ? 'bg-indigo-600/20 text-white border-l-3 border-indigo-400'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white border-l-3 border-transparent'
            ]"
            :title="collapsed ? item.label : ''"
          >
            <span class="flex-shrink-0 w-5 h-5" v-html="item.icon"></span>
            <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            <!-- Tooltip on collapsed -->
            <div
              v-if="collapsed"
              class="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
            >{{ item.label }}</div>
          </a>
        </template>
      </nav>

      <!-- Bottom user card -->
      <div class="flex-shrink-0 border-t border-slate-700 p-3">
        <div v-if="!collapsed" class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ store.user ? store.user.real_name : 'Guest' }}</p>
            <span
              :class="[
                'inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded',
                roleBadgeClass
              ]"
            >{{ roleLabel }}</span>
          </div>
          <button
            @click="handleLogout"
            class="flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
            title="退出登录"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        <button
          v-else
          @click="handleLogout"
          class="w-full flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
          title="退出登录"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
      </aside>
    </div>
  `,
  props: {
    collapsed: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const store = window.store;
    return { store };
  },
  computed: {
    userRole() {
      return this.store.user ? this.store.user.role : 'student';
    },
    userInitial() {
      const name = this.store.user ? this.store.user.real_name : '';
      return name ? name.charAt(0).toUpperCase() : 'G';
    },
    roleLabel() {
      const map = { student: '学生', teacher: '教师', admin: '管理员' };
      return map[this.userRole] || '学生';
    },
    roleBadgeClass() {
      const map = {
        student: 'bg-blue-500/20 text-blue-300',
        teacher: 'bg-emerald-500/20 text-emerald-300',
        admin: 'bg-amber-500/20 text-amber-300',
      };
      return map[this.userRole] || 'bg-blue-500/20 text-blue-300';
    },
    menuItems() {
      const icons = {
        dashboard: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/></svg>',
        courses: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
        simulation: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
        knowledge: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
        cases: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
        homework: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
        report: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
        settings: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
        overview: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
        review: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        progress: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
        grades: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
        manageCourses: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
        adminOverview: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',
        users: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197V21"/></svg>',
        systemSettings: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>',
        statistics: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
        logs: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
        exam: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>',
        questionBank: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
        announcement: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>',
      };

      const studentMenu = [
        { label: '课程学习', path: '#/student/courses', icon: icons.courses },
        { label: '仿真实验', path: '#/student/experiments', icon: icons.simulation },
        { label: '知识图谱', path: '#/student/knowledge-graph', icon: icons.knowledge },
        { label: '企业案例', path: '#/student/cases', icon: icons.cases },
        { label: '平时作业', path: '#/student/homework', icon: icons.homework },
        { label: '实验报告', path: '#/student/lab-reports', icon: icons.report },
        { label: '在线考试', path: '#/student/exams', icon: icons.exam },
        { label: '系统公告', path: '#/student/announcements', icon: icons.announcement },
        { label: '个人设置', path: '#/student/profile', icon: icons.settings },
      ];

      const teacherMenu = [
        { label: '作业审核', path: '#/teacher/assignments', icon: icons.review },
        { label: '学生进度', path: '#/teacher/students', icon: icons.progress },
        { label: '课程管理', path: '#/teacher/courses', icon: icons.manageCourses },
        { label: '学生导入', path: '#/teacher/student-import', icon: icons.users },
        { label: '考试管理', path: '#/teacher/exams', icon: icons.exam },
        { label: '题库管理', path: '#/teacher/questions', icon: icons.questionBank },
        { label: '系统公告', path: '#/teacher/announcements', icon: icons.announcement },
      ];

      const adminMenu = [
        { label: '管理概览', path: '#/admin/dashboard', icon: icons.adminOverview },
        { label: '用户管理', path: '#/admin/users', icon: icons.users },
        { label: '系统设置', path: '#/admin/settings', icon: icons.systemSettings },
      ];

      const map = { student: studentMenu, teacher: teacherMenu, admin: adminMenu };
      return map[this.userRole] || studentMenu;
    },
  },
  methods: {
    isActive(path) {
      // Use reactive $route for proper Vue re-rendering
      if (this.$route) {
        var currentHash = '#' + this.$route.path;
        // Exact match or parent path match (e.g. '#/student/exams' matches '#/student/exams/1')
        return currentHash === path || currentHash.startsWith(path + '/');
      }
      return window.location.hash === path;
    },
    navigateTo(path) {
      // Use Vue Router for navigation — ensures beforeEach guards (exam protection) fire properly
      var routePath = path.replace(/^#/, '');
      if (window.router) {
        window.router.push(routePath).catch(function(err) {
          // Ignore NavigationDuplicated errors
          if (err && err.name !== 'NavigationDuplicated') {
            console.error('Navigation error:', err);
          }
        });
      } else {
        window.location.hash = path;
      }
    },
    closeSidebar() {
      this.store.sidebarOpen = false;
      localStorage.setItem('dip-sidebar', 'false');
    },
    handleLogout() {
      this.store.logout();
      window.location.hash = (typeof AUTH_BYPASS !== 'undefined' && AUTH_BYPASS) ? '#/' : '#/login';
    },
  },
};
