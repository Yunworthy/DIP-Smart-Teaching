var AppHeader = {
  name: 'AppHeader',
  template: `
    <header class="fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm">
      <!-- Left section: hamburger + breadcrumb -->
      <div class="flex items-center gap-3">
        <button
          @click="toggleSidebar"
          class="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Toggle sidebar"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <nav class="hidden sm:flex items-center gap-1.5 text-sm">
          <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
            <span v-if="idx > 0" class="text-gray-300 mx-0.5">/</span>
            <span
              :class="idx === breadcrumbs.length - 1
                ? 'text-gray-900 font-medium'
                : 'text-gray-400 cursor-pointer hover:text-gray-600'"
              @click="idx < breadcrumbs.length - 1 && navigateTo(crumb)"
            >{{ crumb.label }}</span>
          </template>
        </nav>
      </div>

      <!-- Right section: notifications + user dropdown -->
      <div class="flex items-center gap-2">
        <!-- Notification bell -->
        <notification-bell />

        <!-- Divider -->
        <div class="w-px h-8 bg-gray-200 mx-1"></div>

        <!-- User dropdown -->
        <div class="relative" ref="userDropdown">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {{ userInitial }}
            </div>
            <span class="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
              {{ store.user ? store.user.real_name : 'Guest' }}
            </span>
            <svg class="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- User menu -->
          <transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showUserMenu"
              class="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
            >
              <div class="px-4 py-2 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-800 truncate">{{ store.user ? store.user.real_name : '' }}</p>
                <p class="text-xs text-gray-400 truncate">{{ store.user ? store.user.email : '' }}</p>
              </div>
              <button
                @click="goToSettings"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                个人设置
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>
  `,
  emits: ['toggle-sidebar', 'navigate'],
  setup() {
    const store = window.store;
    return { store };
  },
  data() {
    return {
      showUserMenu: false,
    };
  },
  computed: {
    userInitial() {
      const name = this.store.user ? (this.store.user.real_name || '') : '';
      return name ? name.charAt(0).toUpperCase() : 'G';
    },
    breadcrumbs() {
      const path = this.$route ? this.$route.path : '/';
      const routeMap = {
        '/student/dashboard': [{ label: '首页', path: '/student/dashboard' }, { label: '学生仪表盘', path: '/student/dashboard' }],
        '/student/courses': [{ label: '首页', path: '/student/dashboard' }, { label: '课程学习', path: '/student/courses' }],
        '/student/experiments': [{ label: '首页', path: '/student/dashboard' }, { label: '仿真实验', path: '/student/experiments' }],
        '/student/knowledge-graph': [{ label: '首页', path: '/student/dashboard' }, { label: '知识图谱', path: '/student/knowledge-graph' }],
        '/student/cases': [{ label: '首页', path: '/student/dashboard' }, { label: '企业案例', path: '/student/cases' }],
        '/student/homework': [{ label: '首页', path: '/student/dashboard' }, { label: '平时作业', path: '/student/homework' }],
        '/student/lab-reports': [{ label: '首页', path: '/student/dashboard' }, { label: '实验报告', path: '/student/lab-reports' }],
        '/student/exams': [{ label: '首页', path: '/student/dashboard' }, { label: '在线考试', path: '/student/exams' }],
        '/student/profile': [{ label: '首页', path: '/student/dashboard' }, { label: '个人设置', path: '/student/profile' }],
        '/student/report': [{ label: '首页', path: '/student/dashboard' }, { label: '实验报告', path: '/student/report' }],
        '/student/announcements': [{ label: '首页', path: '/student/dashboard' }, { label: '系统公告', path: '/student/announcements' }],
        '/teacher/dashboard': [{ label: '首页', path: '/teacher/dashboard' }, { label: '教学概览', path: '/teacher/dashboard' }],
        '/teacher/assignments': [{ label: '首页', path: '/teacher/dashboard' }, { label: '作业审核', path: '/teacher/assignments' }],
        '/teacher/students': [{ label: '首页', path: '/teacher/dashboard' }, { label: '学生进度', path: '/teacher/students' }],
        '/teacher/courses': [{ label: '首页', path: '/teacher/dashboard' }, { label: '课程管理', path: '/teacher/courses' }],
        '/teacher/experiments': [{ label: '首页', path: '/teacher/dashboard' }, { label: '实验设计', path: '/teacher/experiments' }],
        '/teacher/resources': [{ label: '首页', path: '/teacher/dashboard' }, { label: '资源库', path: '/teacher/resources' }],
        '/teacher/student-import': [{ label: '首页', path: '/teacher/dashboard' }, { label: '学生导入', path: '/teacher/student-import' }],
        '/teacher/exams': [{ label: '首页', path: '/teacher/dashboard' }, { label: '考试管理', path: '/teacher/exams' }],
        '/teacher/questions': [{ label: '首页', path: '/teacher/dashboard' }, { label: '题库管理', path: '/teacher/questions' }],
        '/teacher/announcements': [{ label: '首页', path: '/teacher/dashboard' }, { label: '系统公告', path: '/teacher/announcements' }],
        '/admin/dashboard': [{ label: '首页', path: '/admin/dashboard' }, { label: '管理概览', path: '/admin/dashboard' }],
        '/admin/users': [{ label: '首页', path: '/admin/dashboard' }, { label: '用户管理', path: '/admin/users' }],
        '/admin/settings': [{ label: '首页', path: '/admin/dashboard' }, { label: '系统设置', path: '/admin/settings' }],
        '/admin/statistics': [{ label: '首页', path: '/admin/dashboard' }, { label: '数据统计', path: '/admin/statistics' }],
        '/admin/logs': [{ label: '首页', path: '/admin/dashboard' }, { label: '系统日志', path: '/admin/logs' }],
      };

      // Exact match first
      if (routeMap[path]) return routeMap[path];

      // Prefix match for routes with params (e.g. /student/courses/3)
      for (const [prefix, crumbs] of Object.entries(routeMap)) {
        if (path.startsWith(prefix + '/')) return crumbs;
      }

      return [{ label: '首页' }];
    },
  },
  methods: {
    toggleSidebar() {
      this.store.sidebarOpen = !this.store.sidebarOpen;
      localStorage.setItem('dip-sidebar', this.store.sidebarOpen);
    },
    navigateTo(crumb) {
      if (crumb.path && this.$router) {
        this.$router.push(crumb.path).catch(() => {});
      }
    },
    goToSettings() {
      this.showUserMenu = false;
      if (this.$router) {
        const role = this.store.user ? this.store.user.role : 'student';
        this.$router.push('/' + role + '/profile').catch(() => {});
      }
    },
    handleLogout() {
      this.showUserMenu = false;
      if (this.store.examInProgress) {
        if (!window.confirm('考试进行中，退出登录将丢失未提交的答题！确定要退出吗？')) {
          return;
        }
        // User confirmed — clear exam state
        if (window.ExamTake) window.ExamTake._examDone = true;
        this.store.examInProgress = false;
      }
      this.store.logout();
      if (this.$router) {
        this.$router.push('/login').catch(() => {});
      } else {
        window.location.hash = '#/login';
      }
    },
    handleClickOutside(e) {
      if (this.$refs.userDropdown && !this.$refs.userDropdown.contains(e.target)) {
        this.showUserMenu = false;
      }
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
};
