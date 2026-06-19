var StudentDashboard = {
  name: 'StudentDashboard',
  template: `
    <div class="space-y-6">
      <!-- Welcome Banner -->
      <div class="relative overflow-hidden rounded-2xl welcome-gradient p-8 text-white shadow-lg">
        <div class="relative z-10">
          <h1 class="text-3xl font-bold mb-2">{{ greeting }}，{{ user.real_name || '同学' }}</h1>
          <p class="text-indigo-100 text-lg">学号: {{ user.student_id || 'N/A' }} · 班级: {{ user.class_name || 'N/A' }}</p>
          <p class="text-indigo-200 mt-2 text-sm">{{ todayStr }}</p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 animate-float"></div>
        <div class="absolute -bottom-4 right-16 h-24 w-24 rounded-full bg-white/10 animate-float" style="animation-delay:2s"></div>
        <div class="absolute right-1/3 top-1/2 h-16 w-16 rounded-full bg-white/5 animate-float" style="animation-delay:4s"></div>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <!-- 课程进度 -->
        <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all card-lift">
          <div class="flex items-center gap-4">
            <div class="stat-icon-gradient" style="background: linear-gradient(135deg, #6366f1, #4338ca);">
              <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500">课程进度</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.completedChapters }}<span class="text-base font-normal text-gray-400">/12 章</span></p>
              <div class="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div class="bg-indigo-500 h-1.5 rounded-full transition-all duration-700" :style="{ width: Math.min(stats.completedChapters / 12 * 100, 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 已完成实验 -->
        <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all card-lift">
          <div class="flex items-center gap-4">
            <div class="stat-icon-gradient" style="background: linear-gradient(135deg, #10b981, #059669);">
              <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500">已完成实验</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.completedExperiments }}</p>
              <p class="text-xs text-emerald-600 mt-1 font-medium">持续加油!</p>
            </div>
          </div>
        </div>

        <!-- 待提交作业 -->
        <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all card-lift">
          <div class="flex items-center gap-4">
            <div class="stat-icon-gradient" :style="stats.pendingAssignments > 0 ? 'background: linear-gradient(135deg, #f59e0b, #d97706);' : 'background: linear-gradient(135deg, #3b82f6, #2563eb);'">
              <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500">待提交作业</p>
              <p class="mt-1 text-2xl font-bold" :class="stats.pendingAssignments > 0 ? 'text-amber-600' : 'text-gray-900'">
                {{ stats.pendingAssignments }}
              </p>
              <p v-if="stats.pendingAssignments > 0" class="text-xs text-amber-600 mt-1 font-medium">请尽快提交</p>
              <p v-else class="text-xs text-blue-600 mt-1 font-medium">全部已提交</p>
            </div>
          </div>
        </div>

        <!-- 知识点掌握 -->
        <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all card-lift">
          <div class="flex items-center gap-4">
            <div class="stat-icon-gradient" style="background: linear-gradient(135deg, #a855f7, #7c3aed);">
              <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500">知识点掌握</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">{{ stats.masteredPoints }}<span class="text-base font-normal text-gray-400">/106</span></p>
              <div class="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div class="bg-purple-500 h-1.5 rounded-full transition-all duration-700" :style="{ width: Math.min(stats.masteredPoints / 106 * 100, 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button @click="$router.push('/student/courses')"
          class="flex flex-col items-center gap-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all card-lift btn-press group">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-300 transition-all">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <span class="text-sm font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors">继续学习</span>
        </button>
        <button @click="$router.push('/student/experiments')"
          class="flex flex-col items-center gap-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all card-lift btn-press group">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-200 group-hover:shadow-lg group-hover:shadow-emerald-300 transition-all">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
          </div>
          <span class="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">仿真实验</span>
        </button>
        <button @click="$router.push('/student/cases')"
          class="flex flex-col items-center gap-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all card-lift btn-press group">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-md shadow-amber-200 group-hover:shadow-lg group-hover:shadow-amber-300 transition-all">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <span class="text-sm font-semibold text-gray-700 group-hover:text-amber-700 transition-colors">企业案例</span>
        </button>
        <button @click="$router.push('/student/homework')"
          class="flex flex-col items-center gap-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all card-lift btn-press group">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-md shadow-rose-200 group-hover:shadow-lg group-hover:shadow-rose-300 transition-all">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <span class="text-sm font-semibold text-gray-700 group-hover:text-rose-700 transition-colors">提交作业</span>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Recent Announcements -->
        <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">最新公告</h2>
            <button @click="$router.push('/student/announcements')" class="text-sm text-indigo-600 hover:text-indigo-800">查看全部</button>
          </div>
          <div v-if="announcements.length === 0" class="text-center py-8 text-gray-400">暂无公告</div>
          <div class="space-y-3">
            <div v-for="item in announcements" :key="item.id"
              class="flex gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-50">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <svg class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
                <p class="text-xs text-gray-500 mt-1 line-clamp-1">{{ item.content }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ item.created_at }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Deadlines -->
        <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">即将到期</h2>
            <button @click="$router.push('/student/homework')" class="text-sm text-indigo-600 hover:text-indigo-800">全部作业</button>
          </div>
          <div v-if="deadlines.length === 0" class="text-center py-8 text-gray-400">暂无待提交作业</div>
          <div class="space-y-3">
            <div v-for="item in deadlines" :key="item.id"
              class="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors border border-gray-50">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                :class="isUrgent(item.deadline) ? 'bg-red-50' : 'bg-amber-50'">
                <svg class="h-5 w-5" :class="isUrgent(item.deadline) ? 'text-red-500' : 'text-amber-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
                <p class="text-xs text-gray-500">{{ item.course_name || '课程作业' }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-xs font-medium" :class="isUrgent(item.deadline) ? 'text-red-600' : 'text-gray-600'">
                  {{ formatDate(item.deadline) }}
                </p>
                <p class="text-xs text-gray-400">{{ daysLeft(item.deadline) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Exams & Notifications Row -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Upcoming/Recent Exams -->
        <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">考试动态</h2>
            <button @click="$router.push('/student/exams')" class="text-sm text-indigo-600 hover:text-indigo-800">全部考试</button>
          </div>
          <div v-if="publishedExams.length === 0" class="text-center py-8 text-gray-400">暂无考试安排</div>
          <div class="space-y-3">
            <div v-for="exam in publishedExams.slice(0, 4)" :key="exam.id"
              class="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors border border-gray-50 cursor-pointer"
              @click="$router.push('/student/exams')">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                :class="examStatusClass(exam) === 'ended' ? 'bg-gray-100' : examStatusClass(exam) === 'ongoing' ? 'bg-green-50' : 'bg-yellow-50'">
                <svg class="h-5 w-5" :class="examStatusClass(exam) === 'ended' ? 'text-gray-400' : examStatusClass(exam) === 'ongoing' ? 'text-green-500' : 'text-yellow-500'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ exam.title }}</p>
                <p class="text-xs text-gray-500">{{ exam.duration_minutes }}分钟 · 满分{{ exam.total_score }}分</p>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="examStatusClass(exam) === 'ended' ? 'bg-gray-100 text-gray-600' : examStatusClass(exam) === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'">
                  {{ examStatusLabel(exam) }}
                </span>
                <p v-if="getAttemptScore(exam.id) !== null" class="text-xs text-gray-500 mt-1">
                  得分: {{ getAttemptScore(exam.id) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notification Summary -->
        <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">消息通知</h2>
            <span v-if="unreadCount > 0" class="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {{ unreadCount }} 条未读
            </span>
            <span v-else class="text-xs text-gray-400">全部已读</span>
          </div>
          <div v-if="store.notifications.length === 0" class="text-center py-8 text-gray-400">暂无新通知</div>
          <div class="space-y-3">
            <div v-for="n in store.notifications.slice(0, 5)" :key="n.id"
              class="flex gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors border border-gray-50">
              <span class="mt-1 flex-shrink-0 w-2 h-2 rounded-full"
                :class="{
                  'bg-green-400': n.type === 'success',
                  'bg-red-400': n.type === 'error',
                  'bg-yellow-400': n.type === 'warning',
                  'bg-blue-400': n.type === 'info'
                }"></span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-700 truncate">{{ n.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-gray-900">最近活动</h2>
          <button @click="$router.push('/student/experiments')" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">查看全部</button>
        </div>
        <div v-if="recentActivities.length === 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="n in 3" :key="n" class="rounded-xl border border-gray-100 overflow-hidden">
            <div class="h-20 skeleton-shimmer"></div>
            <div class="p-4 space-y-2">
              <div class="h-4 w-3/4 skeleton-shimmer rounded"></div>
              <div class="h-3 w-1/2 skeleton-shimmer rounded"></div>
            </div>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="activity in recentActivities" :key="activity.id"
            class="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer card-lift group"
            @click="activity.link && $router.push(activity.link)">
            <div class="h-20 relative overflow-hidden" :class="'exp-cover-ch' + (activity.chapter_id || 1)">
              <div class="absolute inset-0 flex items-center justify-center">
                <svg class="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                </svg>
              </div>
              <span class="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/90 backdrop-blur-sm"
                :class="activity.statusClass || 'bg-emerald-50 text-emerald-600'">{{ activity.statusText || '已完成' }}</span>
            </div>
            <div class="p-4">
              <p class="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">{{ activity.title }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ activity.subtitle }}</p>
              <p class="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ activity.time }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      stats: {
        completedChapters: 0,
        completedExperiments: 0,
        pendingAssignments: 0,
        masteredPoints: 0
      },
      announcements: [],
      deadlines: [],
      recentActivities: [],
      exams: [],
      examAttempts: [],
      todayStr: ''
    };
  },
  computed: {
    user() {
      return store.user || {};
    },
    unreadCount() {
      return store.notifications ? store.notifications.length : 0;
    },
    publishedExams() {
      return this.exams.filter(e => e.is_published);
    },
    upcomingExams() {
      const now = new Date();
      return this.publishedExams.filter(e => !e.end_time || new Date(e.end_time) > now);
    },
    greeting() {
      const hour = new Date().getHours();
      if (hour < 6) return '夜深了';
      if (hour < 12) return '早上好';
      if (hour < 14) return '中午好';
      if (hour < 18) return '下午好';
      return '晚上好';
    }
  },
  async mounted() {
    const now = new Date();
    this.todayStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + ['日','一','二','三','四','五','六'][now.getDay()] + '曜日';
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const [chaptersRes, progressRes, assignmentsRes, announcementsRes, examsRes, attemptsRes] = await Promise.allSettled([
          api.getChapters(),
          api.getMyProgress(),
          api.getAssignments ? api.getAssignments() : Promise.resolve({ data: [] }),
          api.getAnnouncements(),
          api.request('GET', '/api/exam/exams'),
          api.request('GET', '/api/exam/attempts/mine')
        ]);

        if (chaptersRes.status === 'fulfilled' && chaptersRes.value) {
          const chapters = chaptersRes.value.data || chaptersRes.value || [];
          const progress = progressRes.status === 'fulfilled' ? (progressRes.value.data || progressRes.value || []) : [];
          const completedSet = new Set();
          let mastered = 0;
          if (Array.isArray(progress)) {
            progress.forEach(p => {
              if (p.mastery_level >= 80 || p.status === 'mastered') {
                mastered++;
                if (p.chapter_id) completedSet.add(p.chapter_id);
              }
            });
          }
          this.stats.masteredPoints = mastered;
          this.stats.completedChapters = completedSet.size || Math.min(Math.floor(mastered / 6), 12);
        }

        if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value) {
          const assignments = assignmentsRes.value.data || assignmentsRes.value || [];
          // Assignments are published; count those with future deadlines as pending
          const now = new Date();
          const pending = Array.isArray(assignments)
            ? assignments.filter(a => !a.deadline || new Date(a.deadline) > now)
            : [];
          this.stats.pendingAssignments = pending.length;
          this.deadlines = pending
            .filter(a => a.deadline)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5);
        }

        if (announcementsRes.status === 'fulfilled' && announcementsRes.value) {
          var annData = announcementsRes.value.data || announcementsRes.value || [];
          // Handle paginated response {announcements:[...]} or plain array
          this.announcements = (Array.isArray(annData) ? annData : (annData.announcements || [])).slice(0, 3);
        }

        if (examsRes.status === 'fulfilled' && examsRes.value) {
          const examList = examsRes.value.data || examsRes.value || [];
          this.exams = Array.isArray(examList) ? examList : [];
        }

        if (attemptsRes.status === 'fulfilled' && attemptsRes.value) {
          const attList = attemptsRes.value.data || attemptsRes.value || [];
          this.examAttempts = Array.isArray(attList) ? attList : [];
        }

        if (progressRes.status === 'fulfilled' && progressRes.value) {
          const progress = progressRes.value.data || progressRes.value || [];
          if (Array.isArray(progress)) {
            this.stats.completedExperiments = progress.filter(p => p.type === 'experiment' && (p.status === 'completed' || p.mastery_level >= 80)).length;
            // Build recent activities from progress records
            const recentItems = progress
              .filter(p => p.updated_at || p.completed_at || p.created_at)
              .sort((a, b) => new Date(b.updated_at || b.completed_at || b.created_at) - new Date(a.updated_at || a.completed_at || a.created_at))
              .slice(0, 6);
            this.recentActivities = recentItems.map((p, idx) => ({
              id: p.id || idx,
              title: p.title || p.experiment_title || ('实验 ' + (idx + 1)),
              subtitle: p.chapter_title || p.course_name || '图像处理实验',
              chapter_id: p.chapter_id || 1,
              statusText: p.status === 'completed' || p.mastery_level >= 80 ? '已完成' : (p.status === 'in_progress' ? '进行中' : '待完成'),
              statusClass: p.status === 'completed' || p.mastery_level >= 80 ? 'bg-emerald-50 text-emerald-600' : (p.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'),
              time: p.updated_at || p.completed_at || p.created_at || '',
              link: p.sim_key ? '/student/experiments/' + p.sim_key : '/student/experiments'
            }));
          }
        }
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      }
    },
    isUrgent(deadline) {
      if (!deadline) return false;
      const diff = new Date(deadline) - new Date();
      return diff < 3 * 24 * 60 * 60 * 1000;
    },
    formatDate(d) {
      if (!d) return '';
      const date = new Date(d);
      return (date.getMonth() + 1) + '/' + date.getDate();
    },
    daysLeft(deadline) {
      if (!deadline) return '';
      const diff = new Date(deadline) - new Date();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (days < 0) return '已过期';
      if (days === 0) return '今天';
      return days + ' 天后';
    },
    examStatusClass(exam) {
      const now = new Date();
      if (exam.end_time && new Date(exam.end_time) < now) return 'ended';
      if (exam.start_time && new Date(exam.start_time) > now) return 'upcoming';
      return 'ongoing';
    },
    examStatusLabel(exam) {
      const status = this.examStatusClass(exam);
      if (status === 'ended') return '已结束';
      if (status === 'upcoming') return '未开始';
      return '进行中';
    },
    getAttemptScore(examId) {
      const attempt = this.examAttempts.find(a => a.exam_id === examId && (a.status === 'submitted' || a.status === 'graded'));
      if (!attempt) return null;
      return attempt.total_score !== null ? attempt.total_score : '待评分';
    }
  }
};
