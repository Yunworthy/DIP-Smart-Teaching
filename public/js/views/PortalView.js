/* ============================================================
 *  PortalView.js — 门户入口页（bypass 模式下替代登录页）
 *  提供学生端和教师端两个独立入口
 * ============================================================ */
var PortalView = {
  name: 'PortalView',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-teal-50 p-4">
      <!-- Background decorations -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200 rounded-full opacity-20 blur-3xl"></div>
        <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-200 rounded-full opacity-20 blur-3xl"></div>
        <div class="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-200 rounded-full opacity-15 blur-3xl"></div>
      </div>

      <div class="relative z-10 w-full max-w-3xl">
        <!-- Header -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-3 mb-6">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200">
              DIP
            </div>
            <div class="text-left">
              <h1 class="text-2xl font-bold text-gray-800">数字图像处理</h1>
              <p class="text-sm text-gray-500">智慧教学与虚拟仿真平台</p>
            </div>
          </div>
          <p class="text-gray-500 text-sm">请选择身份进入平台</p>
        </div>

        <!-- Entry Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Student Entry -->
          <div
            @click="enterAs('student')"
            class="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-indigo-200 transition-all duration-300 p-8 text-center"
          >
            <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 14l9-5-9-5-9 5 9 5z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-800 mb-2">学生端</h2>
            <p class="text-sm text-gray-500 leading-relaxed">进入学习中心，查看课程、<br>完成实验和作业</p>
            <div class="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
              点击进入
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

          <!-- Teacher Entry -->
          <div
            @click="enterAs('teacher')"
            class="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-teal-200 transition-all duration-300 p-8 text-center"
          >
            <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg class="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-800 mb-2">教师端</h2>
            <p class="text-sm text-gray-500 leading-relaxed">进入教学管理，管理课程、<br>批改作业和查看数据</p>
            <div class="mt-5 inline-flex items-center gap-1 text-sm font-medium text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
              点击进入
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-gray-400 mt-10">数字图像处理智慧教学平台 &copy; 2026</p>
      </div>
    </div>
  `,

  setup() {
    function enterAs(role) {
      store.initBypass(role);
      store.triggerWelcome(role);
      var target = role === 'student' ? '/student/courses' : '/teacher/courses';
      window.router.push(target);
    }

    return { enterAs };
  }
};
