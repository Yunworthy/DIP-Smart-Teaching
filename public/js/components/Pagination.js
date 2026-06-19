var Pagination = {
  name: 'Pagination',
  props: {
    currentPage: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  emits: ['page-change'],
  template: `
    <div class="flex items-center justify-between gap-4 px-2 py-3">
      <!-- Info text -->
      <span class="text-sm text-gray-500 hidden sm:block">
        Total {{ total }} items, page {{ currentPage }} / {{ totalPages }}
      </span>

      <!-- Navigation buttons -->
      <nav class="flex items-center gap-1 ml-auto">
        <!-- Previous -->
        <button
          @click="goTo(currentPage - 1)"
          :disabled="currentPage <= 1"
          :class="[
            'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors',
            currentPage <= 1
              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
              : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="hidden sm:inline">Previous</span>
        </button>

        <!-- Page numbers -->
        <template v-for="page in visiblePages" :key="page">
          <span
            v-if="page === '...'"
            class="px-2 py-1.5 text-sm text-gray-400"
          >...</span>
          <button
            v-else
            @click="goTo(page)"
            :class="[
              'min-w-[36px] h-9 flex items-center justify-center text-sm rounded-lg border transition-colors',
              page === currentPage
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            ]"
          >{{ page }}</button>
        </template>

        <!-- Next -->
        <button
          @click="goTo(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          :class="[
            'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors',
            currentPage >= totalPages
              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
              : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          ]"
        >
          <span class="hidden sm:inline">Next</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  `,
  computed: {
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
        return pages;
      }

      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(total);

      return pages;
    },
  },
  methods: {
    goTo(page) {
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.$emit('page-change', page);
      }
    },
  },
};
