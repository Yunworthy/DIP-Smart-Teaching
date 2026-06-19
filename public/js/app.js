/* ============================================================
 *  app.js — Vue 3 application bootstrap (must load last)
 * ============================================================ */

(function () {
  // ------------------------------------------------------------------
  //  Create the Vue application
  // ------------------------------------------------------------------
  const app = Vue.createApp({
    name: 'ImageSimulationPlatform',

    setup() {
      // Provide store to all components via provide/inject if desired
      // (Components can also access the global `store` directly)
      return { store };
    },

    template: `
      <div id="platform-root" class="min-h-screen bg-gray-50">
        <!-- Sidebar (only when logged in and not on login page) -->
        <app-sidebar v-if="showLayout" :collapsed="store.sidebarCollapsed" />

        <!-- Main content area -->
        <div :class="[
          'transition-all duration-300',
          showLayout ? (store.sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''
        ]">
          <!-- Header (only when logged in) -->
          <app-header v-if="showLayout" @toggle-sidebar="store.toggleSidebar()" />

          <!-- Page content -->
          <main :class="[showLayout ? 'pt-16 min-h-screen p-6' : '']">
            <router-view />
          </main>
        </div>

        <!-- Toast notifications -->
        <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
             style="max-width: 380px;">
          <transition-group name="toast">
            <div v-for="n in store.notifications"
                 :key="n.id"
                 v-show="n.visible"
                 class="pointer-events-auto rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 transition-all duration-300"
                 :class="{
                   'bg-green-50 text-green-800 border border-green-200': n.type === 'success',
                   'bg-red-50 text-red-800 border border-red-200':     n.type === 'error',
                   'bg-yellow-50 text-yellow-800 border border-yellow-200': n.type === 'warning',
                   'bg-blue-50 text-blue-800 border border-blue-200':  n.type === 'info',
                 }">
              <!-- Icon -->
              <span class="flex-shrink-0 mt-0.5">
                <svg v-if="n.type === 'success'" class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <svg v-else-if="n.type === 'error'" class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <svg v-else-if="n.type === 'warning'" class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <svg v-else class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </span>
              <span class="text-sm font-medium flex-1">{{ n.message }}</span>
              <button class="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition"
                      @click="store.dismissNotification(n.id)">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </transition-group>
        </div>

        <!-- Welcome overlay -->
        <transition name="welcome-fade">
          <div v-if="store.showWelcome"
               class="fixed inset-0 z-[100] flex items-center justify-center"
               :style="welcomeBg">
            <!-- Decorative circles -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl welcome-circle-1"></div>
              <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl welcome-circle-2"></div>
              <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl welcome-circle-3"></div>
            </div>
            <!-- Content -->
            <div class="relative text-center welcome-content">
              <!-- Logo -->
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm shadow-2xl mb-8 welcome-logo">
                <span class="text-4xl font-bold text-white tracking-tight">DIP</span>
              </div>
              <!-- Title -->
              <h1 class="text-3xl font-bold text-white mb-3 welcome-title">{{ welcomeTitle }}</h1>
              <!-- Subtitle -->
              <p class="text-lg text-white/70 mb-2 welcome-subtitle">{{ welcomeSubtitle }}</p>
              <!-- Loading dots -->
              <div class="flex items-center justify-center gap-1.5 mt-8 welcome-dots">
                <span class="w-2 h-2 rounded-full bg-white/60 welcome-dot" style="animation-delay: 0s"></span>
                <span class="w-2 h-2 rounded-full bg-white/60 welcome-dot" style="animation-delay: 0.2s"></span>
                <span class="w-2 h-2 rounded-full bg-white/60 welcome-dot" style="animation-delay: 0.4s"></span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    `,
    computed: {
      showLayout() {
        // Use router.currentRoute (reactive ref) instead of window.location.hash (non-reactive)
        var path = router.currentRoute.value.path;
        if (!path || path === '/' || path === '/login') {
          return false;
        }
        // In bypass mode, show layout as soon as user is set
        if (AUTH_BYPASS) return !!store.user;
        // Normal mode
        return store.isLoggedIn && store.user;
      },
      welcomeTitle() {
        var map = {
          student: '欢迎进入学习中心',
          teacher: '欢迎进入教学管理中心',
          admin: '欢迎进入管理后台',
        };
        return map[store.welcomeRole] || '欢迎使用';
      },
      welcomeSubtitle() {
        var map = {
          student: '课程学习 · 仿真实验 · 知识探索',
          teacher: '课程管理 · 作业批改 · 学情分析',
          admin: '用户管理 · 系统配置 · 数据监控',
        };
        return map[store.welcomeRole] || '数字图像处理智慧教学平台';
      },
      welcomeBg() {
        var map = {
          student: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
          teacher: 'background: linear-gradient(135deg, #2A5298 0%, #1e3a5f 100%);',
          admin: 'background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);',
        };
        return map[store.welcomeRole] || 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
      },
    },
  });

  // ------------------------------------------------------------------
  //  Register global components (uncomment as they become available)
  // ------------------------------------------------------------------
  // The sidebar / navbar are typically part of layout components.
  // Register them here once their scripts define the globals.
  function registerIfGlobal(name) {
    if (window[name]) {
      app.component(name, window[name]);
    }
  }

  registerIfGlobal('AppSidebar');
  registerIfGlobal('AppHeader');
  registerIfGlobal('AppNavbar');
  registerIfGlobal('AppFooter');
  registerIfGlobal('LoadingSpinner');
  registerIfGlobal('EmptyState');
  registerIfGlobal('ConfirmDialog');
  registerIfGlobal('KnowledgeGraph');
  registerIfGlobal('ChartPanel');
  registerIfGlobal('ImagePreview');
  registerIfGlobal('CodeEditor');
  registerIfGlobal('ConceptAnimation');
  registerIfGlobal('NotificationBell');

  // ------------------------------------------------------------------
  //  Provide store globally so components can inject it
  // ------------------------------------------------------------------
  app.provide('store', store);
  app.provide('api', api);

  // ------------------------------------------------------------------
  //  Install plugins
  // ------------------------------------------------------------------
  app.use(router);

  // ------------------------------------------------------------------
  //  Mount the application
  // ------------------------------------------------------------------
  app.mount('#app');

  // Expose for debugging in dev tools
  window.__app = app;

  console.log('[DIP] 图像仿真平台已启动');
})();
