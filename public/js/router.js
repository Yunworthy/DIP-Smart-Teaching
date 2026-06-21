/* ============================================================
 *  router.js — Vue Router configuration with route guards
 *  Uses hash mode; references global component variables.
 * ============================================================ */

// ------------------------------------------------------------------
//  Helper: resolve a global component by name, with a fallback
// ------------------------------------------------------------------
function resolveView(globalName, label) {
  // Return a getter so the component is resolved lazily at render time
  var wrapper = {
    name: globalName,
    render() {
      const Comp = window[globalName];
      if (Comp) {
        return Vue.h(Comp);
      }
      // Fallback placeholder while the real view script has not loaded
      return Vue.h('div', { class: 'flex items-center justify-center h-64' }, [
        Vue.h('div', { class: 'text-center text-gray-400' }, [
          Vue.h('svg', {
            class: 'mx-auto mb-4 w-16 h-16 text-gray-300',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
          }, [
            Vue.h('path', {
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              'stroke-width': '1.5',
              d: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
            }),
          ]),
          Vue.h('p', { class: 'text-lg font-medium' }, label || globalName),
          Vue.h('p', { class: 'text-sm mt-1' }, '页面加载中…'),
        ]),
      ]);
    },
  };

  // NOTE: Do NOT add beforeRouteLeave to the wrapper — it causes
  // unintended navigation issues with Vue Router 4 CDN build.
  // Exam protection is handled by the global beforeEach guard below.

  return wrapper;
}

// ------------------------------------------------------------------
//  Role constants
// ------------------------------------------------------------------
const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

// ------------------------------------------------------------------
//  Default dashboard for each role
// ------------------------------------------------------------------
const ROLE_DASHBOARDS = {
  student: '/student/courses',
  teacher: '/teacher/courses',
  admin: '/admin/dashboard',
};

// ------------------------------------------------------------------
//  Route definitions
// ------------------------------------------------------------------
const routes = [
  // ---- Public ----
  {
    path: '/login',
    name: 'Login',
    component: resolveView('LoginView', '登录'),
    meta: { guest: true },
  },

  // ---- Root: Portal (bypass) or redirect by role ----
  {
    path: '/',
    name: 'Root',
    component: AUTH_BYPASS ? resolveView('PortalView', '平台入口') : resolveView('RootRedirect', '跳转中'),
    beforeEnter(to, from, next) {
      if (AUTH_BYPASS) return next(); // Show portal page
      if (!store.isLoggedIn) return next('/login');
      const dash = ROLE_DASHBOARDS[store.user?.role] || '/student/dashboard';
      return next(dash);
    },
  },

  // ================================================================
  //  Student routes
  // ================================================================
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: resolveView('StudentDashboard', '学生仪表盘'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },
  {
    path: '/student/courses',
    name: 'CourseList',
    component: resolveView('CourseList', '课程列表'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },
  {
    path: '/student/courses/:id',
    name: 'CourseDetail',
    component: resolveView('CourseDetail', '课程详情'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
    props: true,
  },
  {
    path: '/student/experiments',
    name: 'ExperimentLab',
    component: resolveView('ExperimentLab', '仿真实验室'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },
  {
    path: '/student/experiments/:key',
    name: 'ExperimentDetail',
    component: resolveView('ExperimentLab', '仿真实验'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
    props: true,
  },
  {
    path: '/student/knowledge-graph',
    name: 'KnowledgeMap',
    component: resolveView('KnowledgeMap', '知识图谱'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },
  {
    path: '/student/cases',
    name: 'EnterpriseCases',
    component: resolveView('EnterpriseCaseView', '企业案例'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },
  {
    path: '/student/cases/:id',
    name: 'CaseDetail',
    component: resolveView('CaseDetailView', '案例详情'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
    props: true,
  },
  {
    path: '/student/homework',
    name: 'Homework',
    component: resolveView('HomeworkView', '平时作业'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },
  {
    path: '/student/assignments',
    name: 'MyAssignments',
    component: resolveView('MyAssignmentsView', '我的作业'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },
  {
    path: '/student/lab-reports',
    name: 'LabReports',
    component: resolveView('LabReportView', '实验报告'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },
  {
    path: '/student/profile',
    name: 'StudentProfile',
    component: resolveView('ProfileSettings', '个人设置'),
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
  },

  // ================================================================
  //  Teacher routes
  // ================================================================
  {
    path: '/teacher/dashboard',
    name: 'TeacherDashboard',
    component: resolveView('TeacherDashboard', '教师仪表盘'),
    meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] },
  },
  {
    path: '/teacher/assignments',
    name: 'AssignmentGrading',
    component: resolveView('AssignmentGrading', '作业批改'),
    meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] },
  },
  {
    path: '/teacher/assignments/:id',
    name: 'AssignmentGradingDetail',
    component: resolveView('AssignmentGrading', '作业详情'),
    meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] },
    props: true,
  },
  {
    path: '/teacher/students',
    name: 'StudentAnalytics',
    component: resolveView('StudentAnalytics', '学生分析'),
    meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] },
  },
  {
    path: '/teacher/courses',
    name: 'CourseManage',
    component: resolveView('CourseManage', '课程管理'),
    meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] },
  },
  {
    path: '/teacher/student-import',
    name: 'StudentImport',
    component: resolveView('StudentImport', '学生导入'),
    meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] },
  },

  // ================================================================
  //  Admin routes
  // ================================================================
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: resolveView('AdminDashboard', '管理后台'),
    meta: { requiresAuth: true, roles: [ROLES.ADMIN] },
  },
  {
    path: '/admin/users',
    name: 'UserManage',
    component: resolveView('UserManage', '用户管理'),
    meta: { requiresAuth: true, roles: [ROLES.ADMIN] },
  },
  {
    path: '/admin/settings',
    name: 'SystemConfig',
    component: resolveView('SystemConfig', '系统配置'),
    meta: { requiresAuth: true, roles: [ROLES.ADMIN] },
  },

  // ---- Exam routes ----
  { path: '/student/exams', name: 'ExamList', component: resolveView('ExamList', '在线考试'), meta: { requiresAuth: true, roles: [ROLES.STUDENT] } },
  { path: '/student/exams/:id', name: 'ExamTake', component: resolveView('ExamTake', '考试中'), meta: { requiresAuth: true, roles: [ROLES.STUDENT] }, props: true },
  { path: '/teacher/exams', name: 'ExamManage', component: resolveView('ExamManage', '考试管理'), meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] } },
  { path: '/teacher/questions', name: 'QuestionBank', component: resolveView('QuestionBank', '题库管理'), meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] } },

  // ---- Additional routes ----
  { path: '/student/report', name: 'ExperimentReport', component: resolveView('ExperimentReport', '实验报告'), meta: { requiresAuth: true, roles: [ROLES.STUDENT] } },
  { path: '/teacher/experiments', name: 'ExperimentDesign', component: resolveView('ExperimentDesign', '实验设计'), meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] } },
  { path: '/teacher/resources', name: 'ResourceLibrary', component: resolveView('ResourceLibrary', '资源库'), meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] } },
  { path: '/admin/statistics', name: 'DataStatistics', component: resolveView('DataStatistics', '数据统计'), meta: { requiresAuth: true, roles: [ROLES.ADMIN] } },
  { path: '/admin/logs', name: 'LogViewer', component: resolveView('LogViewer', '系统日志'), meta: { requiresAuth: true, roles: [ROLES.ADMIN] } },

  // ---- Announcement routes ----
  { path: '/student/announcements', name: 'Announcements', component: resolveView('AnnouncementList', '系统公告'), meta: { requiresAuth: true, roles: [ROLES.STUDENT] } },
  { path: '/teacher/announcements', name: 'TeacherAnnouncements', component: resolveView('AnnouncementList', '系统公告'), meta: { requiresAuth: true, roles: [ROLES.TEACHER, ROLES.ADMIN] } },

  // ---- 404 catch-all ----
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      name: 'NotFound',
      render() {
        return Vue.h('div', { class: 'flex items-center justify-center h-screen bg-gray-50' }, [
          Vue.h('div', { class: 'text-center' }, [
            Vue.h('h1', { class: 'text-6xl font-bold text-gray-300 mb-4' }, '404'),
            Vue.h('p', { class: 'text-xl text-gray-500 mb-8' }, '页面不存在'),
            Vue.h('button', {
              class: 'px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition',
              onClick: () => {
                const dash = ROLE_DASHBOARDS[store.user?.role] || '/login';
                window.router.push(dash);
              },
            }, '返回首页'),
          ]),
        ]);
      },
    },
  },
];

// ------------------------------------------------------------------
//  Create router instance
// ------------------------------------------------------------------
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
  // Scroll to top on every route change
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

// ------------------------------------------------------------------
//  Navigation guards
// ------------------------------------------------------------------
router.beforeEach(async (to, from, next) => {
  // ================================================================
  //  EXAM PROTECTION — prevent accidental navigation away from exam.
  //  Only fires when actually leaving an exam route with an active exam.
  // ================================================================
  if (store.examInProgress && from.name === 'ExamTake' && to.name !== 'ExamTake') {
    var done = window.ExamTake && window.ExamTake._examDone;
    if (!done) {
      if (!window.confirm('考试进行中，离开将丢失未保存的答案！确定要离开吗？')) {
        return next(false);
      }
    }
    store.examInProgress = false;
  }

  // ---- Bypass mode: auto-set mock user based on route ----
  if (AUTH_BYPASS) {
    // Portal page: no user needed
    if (to.path === '/' || to.path === '/login') return next();

    // Determine role from route path
    var role = 'student';
    if (to.path.startsWith('/teacher')) role = 'teacher';
    else if (to.path.startsWith('/admin')) role = 'admin';

    // Auto-init bypass user if not set or role mismatch
    store.initBypass(role);

    // Check role permissions (still enforce role-based routing)
    if (to.meta.requiresAuth) {
      var allowedRoles = to.meta.roles || [];
      var userRole = store.user?.role;
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        var dash = ROLE_DASHBOARDS[userRole] || '/student/dashboard';
        store.notify('您没有权限访问该页面', 'warning');
        return next(dash);
      }
    }
    return next();
  }

  // ---- Normal mode (AUTH_BYPASS = false) ----

  // 1. Guest-only pages (login): redirect away if already logged in
  if (to.meta.guest) {
    if (store.isLoggedIn && store.user) {
      const dash = ROLE_DASHBOARDS[store.user.role] || '/student/dashboard';
      return next(dash);
    }
    // Allow access if not logged in, or token exists but user not fetched yet
    if (store.isLoggedIn && !store.user) {
      // Try to fetch user first
      try {
        const data = await api.getMe();
        store.user = data.user || data;
        const dash = ROLE_DASHBOARDS[store.user.role] || '/student/dashboard';
        return next(dash);
      } catch {
        store.logout();
        return next();
      }
    }
    return next();
  }

  // 2. No token and route requires auth → login
  if (!store.isLoggedIn && to.path !== '/login') {
    return next('/login');
  }

  // 3. Has token but user info not loaded yet → fetch it
  if (store.isLoggedIn && !store.user) {
    try {
      const data = await api.getMe();
      store.user = data.user || data;
    } catch {
      // Token invalid → clean up and go to login
      store.logout();
      return next('/login');
    }
  }

  // 4. Check role permissions
  if (to.meta.requiresAuth) {
    const allowedRoles = to.meta.roles || [];
    const userRole = store.user?.role;

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // Redirect to user's own dashboard
      const dash = ROLE_DASHBOARDS[userRole] || '/student/dashboard';
      store.notify('您没有权限访问该页面', 'warning');
      return next(dash);
    }
  }

  next();
});

// Expose router globally
window.router = router;
