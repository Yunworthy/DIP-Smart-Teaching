var CourseList = {
  name: 'CourseList',
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">课程学习</h1>
          <p class="mt-1 text-sm text-gray-500">图像仿真处理技术 · 共12个章节</p>
        </div>
        <div class="flex gap-3">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input v-model="search" type="text" placeholder="搜索章节..."
              class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-64"/>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>

      <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="chapter in filteredChapters" :key="chapter.id"
          class="group rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-200">
          <div class="p-6">
            <div class="flex items-start justify-between mb-3">
              <span class="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold">
                {{ chapter.sort_order || chapter.chapter_number || chapter.order || (filteredChapters.indexOf(chapter) + 1) }}
              </span>
              <span class="text-xs text-gray-400">{{ getProgress(chapter) }}%</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
              {{ chapter.title }}
            </h3>
            <p v-if="chapter.subtitle" class="text-sm text-indigo-500 mb-2">{{ chapter.subtitle }}</p>
            <p class="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
              {{ chapter.description || '本章介绍图像仿真的核心概念与实践方法。' }}
            </p>
            <div class="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span class="flex items-center gap-1">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                {{ chapter.knowledge_point_count || chapter.knowledge_points_count || chapter.kp_count || 0 }} 个知识点
              </span>
              <span class="flex items-center gap-1">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                </svg>
                {{ chapter.simulation_count || chapter.experiments_count || chapter.exp_count || 0 }} 个实验
              </span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-1.5 mb-4">
              <div class="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                :style="{ width: getProgress(chapter) + '%' }"></div>
            </div>
          </div>
          <div class="border-t border-gray-50 px-6 py-3 bg-gray-50/50">
            <button @click="openChapter(chapter)"
              class="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              {{ getProgress(chapter) > 0 ? '继续学习' : '开始学习' }}
              <svg class="inline-block ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      chapters: [],
      progress: [],
      search: '',
      loading: true
    };
  },
  computed: {
    filteredChapters() {
      if (!this.search) return this.chapters;
      const q = this.search.toLowerCase();
      return this.chapters.filter(c =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
      );
    }
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const [chapRes, progRes] = await Promise.allSettled([
          api.getChapters(),
          api.getMyProgress()
        ]);
        if (chapRes.status === 'fulfilled') {
          this.chapters = chapRes.value.data || chapRes.value || [];
        }
        if (progRes.status === 'fulfilled') {
          this.progress = progRes.value.data || progRes.value || [];
        }
      } catch (e) {
        console.error('CourseList error:', e);
      } finally {
        this.loading = false;
      }
    },
    getProgress(chapter) {
      const kps = Array.isArray(this.progress) ? this.progress.filter(p => p.chapter_id === chapter.id) : [];
      if (kps.length === 0) return 0;
      const mastered = kps.filter(p => p.mastery_level >= 80 || p.status === 'mastered').length;
      return Math.round((mastered / Math.max(kps.length, 1)) * 100);
    },
    openChapter(chapter) {
      this.$router.push('/student/courses/' + chapter.id);
    }
  }
};
