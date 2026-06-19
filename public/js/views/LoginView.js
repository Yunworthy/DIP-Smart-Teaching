/* ============================================================
 *  LoginView.js — 登录页面
 * ============================================================ */
var LoginView = {
  name: 'LoginView',
  template: `
    <div class="min-h-screen flex">
      <!-- Left Panel: Branding -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 items-center justify-center p-12">
        <!-- Decorative circles -->
        <div class="absolute -top-20 -left-20 w-72 h-72 bg-indigo-500 rounded-full opacity-20 animate-pulse"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 bg-teal-500 rounded-full opacity-10 animate-pulse" style="animation-delay:1s"></div>
        <div class="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-500 rounded-full opacity-15 animate-pulse" style="animation-delay:2s"></div>
        
        <div class="relative z-10 text-white max-w-lg">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
              DIP
            </div>
            <div>
              <h1 class="text-3xl font-bold">数字图像处理</h1>
              <p class="text-indigo-200 text-sm mt-1">智慧教学与虚拟仿真平台</p>
            </div>
          </div>
          
          <h2 class="text-4xl font-bold leading-tight mb-6">
            集教学、实验、管理<br>于一体的智慧化<br>图像处理学习系统
          </h2>
          
          <div class="space-y-4 text-indigo-200">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </div>
              <span>12 个课程章节，106 个知识点系统化学习</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
              </div>
              <span>72 个交互式仿真实验，实时参数调节</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <span>21 个校企合作综合案例，理论结合实践</span>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              </div>
              <span>交互式知识图谱，可视化学习进度</span>
            </div>
          </div>
          
          <div class="mt-10 text-indigo-300 text-sm">
            河北水利电力学院 · 数字图像处理课程
          </div>
        </div>
      </div>
      
      <!-- Right Panel: Login Form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div class="w-full max-w-md">
          <!-- Mobile logo -->
          <div class="lg:hidden text-center mb-8">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-xl font-bold mb-4">
              DIP
            </div>
            <h1 class="text-2xl font-bold text-gray-800">数字图像处理</h1>
            <p class="text-gray-500 text-sm">智慧教学与虚拟仿真平台</p>
          </div>
          
          <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">欢迎登录</h2>
            <p class="text-gray-500 mb-8">请输入您的账号和密码</p>
            
            <form @submit.prevent="handleLogin" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <input v-model="username" type="text" required
                         class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                         placeholder="请输入用户名" autocomplete="username" />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" required
                         class="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                         placeholder="请输入密码" autocomplete="current-password" />
                  <button type="button" @click="showPassword = !showPassword"
                          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div v-if="errorMsg" class="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                {{ errorMsg }}
              </div>
              
              <button type="submit" :disabled="loading"
                      class="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg v-if="loading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>{{ loading ? '登录中...' : '登 录' }}</span>
              </button>
            </form>
            
            <div class="mt-6 pt-6 border-t border-gray-100">
              <p class="text-xs text-gray-400 text-center">预置测试账号</p>
              <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
                <button @click="fillAccount('admin','admin123')" class="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition">
                  管理员
                </button>
                <button @click="fillAccount('teacher','teacher123')" class="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition">
                  教师
                </button>
                <button @click="fillAccount('student01','stu123456')" class="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition">
                  学生
                </button>
              </div>
            </div>
          </div>
          
          <p class="text-center text-xs text-gray-400 mt-6">
            &copy; 2026 河北水利电力学院 · 数字图像处理课程
          </p>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      username: '',
      password: '',
      showPassword: false,
      loading: false,
      errorMsg: '',
    };
  },
  methods: {
    fillAccount(u, p) {
      this.username = u;
      this.password = p;
    },
    async handleLogin() {
      this.errorMsg = '';
      if (!this.username || !this.password) {
        this.errorMsg = '请输入用户名和密码';
        return;
      }
      this.loading = true;
      try {
        const data = await api.login(this.username, this.password);
        store.login(data.token, data.user);
        store.notify('登录成功，欢迎回来！', 'success');
        const dashboards = { student: '/student/dashboard', teacher: '/teacher/dashboard', admin: '/admin/dashboard' };
        this.$router.push(dashboards[data.user.role] || '/student/dashboard');
      } catch (err) {
        this.errorMsg = err.message || '登录失败，请检查用户名和密码';
      } finally {
        this.loading = false;
      }
    },
  },
};
