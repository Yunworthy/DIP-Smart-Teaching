var AnnouncementList = {
  name: 'AnnouncementList',
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">系统公告</h1>
      </div>

      <div v-if="loading" class="flex items-center justify-center h-48">
        <div class="text-gray-400">加载中...</div>
      </div>

      <div v-else-if="announcements.length === 0" class="flex flex-col items-center justify-center h-48 text-gray-400">
        <svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <p>暂无公告</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="a in announcements"
          :key="a.id"
          class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5"
        >
          <div class="flex items-start gap-3">
            <span v-if="a.is_pinned" class="flex-shrink-0 mt-1 text-amber-500" title="置顶">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z"/>
              </svg>
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h2 class="text-lg font-semibold text-gray-800 truncate">{{ a.title }}</h2>
                <span
                  v-if="a.is_pinned"
                  class="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full"
                >置顶</span>
              </div>
              <p class="text-sm text-gray-600 leading-relaxed mb-3 whitespace-pre-line">{{ truncate(a.content, 200) }}</p>
              <div class="flex items-center gap-4 text-xs text-gray-400">
                <span v-if="a.author_name">发布者：{{ a.author_name }}</span>
                <span>{{ formatDate(a.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
        <button
          @click="changePage(page - 1)"
          :disabled="page <= 1"
          class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >上一页</button>
        <span class="text-sm text-gray-500">{{ page }} / {{ totalPages }}</span>
        <button
          @click="changePage(page + 1)"
          :disabled="page >= totalPages"
          class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >下一页</button>
      </div>
    </div>
  `,
  data() {
    return {
      announcements: [],
      loading: true,
      page: 1,
      totalPages: 1,
      total: 0,
    };
  },
  methods: {
    async fetchAnnouncements() {
      this.loading = true;
      try {
        const res = await fetch('/api/announcements?page=' + this.page + '&size=10', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (res.ok) {
          const data = await res.json();
          this.announcements = data.announcements || [];
          this.total = data.total || 0;
          this.totalPages = data.totalPages || 1;
        }
      } catch (e) {
        console.error('Failed to fetch announcements:', e);
      }
      this.loading = false;
    },
    changePage(p) {
      if (p < 1 || p > this.totalPages) return;
      this.page = p;
      this.fetchAnnouncements();
    },
    truncate(text, len) {
      if (!text) return '';
      return text.length > len ? text.substring(0, len) + '...' : text;
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
  },
  mounted() {
    this.fetchAnnouncements();
  },
};
