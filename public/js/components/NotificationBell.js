var NotificationBell = {
  name: 'NotificationBell',
  template: `
    <div ref="wrapper" class="relative">
      <button
        @click="toggleDropdown"
        class="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="通知"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span
          v-if="unreadCount > 0"
          class="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
        >{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <!-- Dropdown panel -->
      <div
        v-if="showDropdown"
        class="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span class="text-sm font-semibold text-gray-800">系统通知</span>
          <span
            v-if="unreadCount > 0"
            class="text-xs text-indigo-600 cursor-pointer hover:underline"
            @click="markAllRead"
          >全部已读</span>
        </div>
        <div class="max-h-80 overflow-y-auto">
          <div
            v-if="notifications.length === 0"
            class="px-4 py-8 text-center text-sm text-gray-400"
          >暂无通知</div>
          <div
            v-for="n in notifications"
            :key="n.id"
            @click="handleClick(n)"
            class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-indigo-50/50': !n.is_read }"
          >
            <span class="mt-0.5 flex-shrink-0 text-lg" v-html="getTypeIcon(n.type)"></span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate" :class="{ 'font-semibold': !n.is_read }">{{ n.title }}</p>
              <p class="text-xs text-gray-500 mt-0.5 truncate">{{ n.content }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ timeAgo(n.created_at) }}</p>
            </div>
            <span
              v-if="!n.is_read"
              class="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-indigo-500"
            ></span>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      showDropdown: false,
      notifications: [],
      unreadCount: 0,
      pollTimer: null,
    };
  },
  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
      if (this.showDropdown) {
        this.fetchNotifications();
      }
    },
    async fetchNotifications() {
      try {
        const res = await fetch('/api/notifications?size=10', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (res.ok) {
          const data = await res.json();
          this.notifications = data.notifications || [];
        }
      } catch (e) { /* ignore */ }
      this.fetchUnreadCount();
    },
    async fetchUnreadCount() {
      try {
        const res = await fetch('/api/notifications/unread-count', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (res.ok) {
          const data = await res.json();
          this.unreadCount = data.count || 0;
        }
      } catch (e) { /* ignore */ }
    },
    async markAllRead() {
      try {
        await fetch('/api/notifications/read-all', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        this.notifications.forEach(n => n.is_read = 1);
        this.unreadCount = 0;
      } catch (e) { /* ignore */ }
    },
    async handleClick(n) {
      if (!n.is_read) {
        try {
          await fetch('/api/notifications/' + n.id + '/read', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
          });
          n.is_read = 1;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        } catch (e) { /* ignore */ }
      }
      this.showDropdown = false;
      if (n.link && window.router) {
        window.router.push(n.link).catch(() => {});
      }
    },
    getTypeIcon(type) {
      const icons = {
        assignment_graded: '&#128221;',
        assignment_published: '&#128196;',
        exam_published: '&#128221;',
        system: '&#128276;',
        announcement: '&#128227;',
      };
      return icons[type] || '&#128276;';
    },
    timeAgo(dateStr) {
      if (!dateStr) return '';
      const now = new Date();
      const date = new Date(dateStr);
      const diff = Math.floor((now - date) / 1000);
      if (diff < 60) return '刚刚';
      if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
      if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
      if (diff < 2592000) return Math.floor(diff / 86400) + ' 天前';
      return date.toLocaleDateString('zh-CN');
    },
    handleClickOutside(e) {
      if (this.$refs.wrapper && !this.$refs.wrapper.contains(e.target)) {
        this.showDropdown = false;
      }
    },
  },
  mounted() {
    this.fetchUnreadCount();
    this.pollTimer = setInterval(() => this.fetchUnreadCount(), 30000);
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    document.removeEventListener('click', this.handleClickOutside);
  },
};
