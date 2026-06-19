var DataTable = {
  name: 'DataTable',
  props: {
    columns: {
      type: Array,
      required: true,
      // Each: { key, label, sortable?, width? }
    },
    data: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['sort'],
  template: `
    <div class="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table class="w-full text-sm text-left">
        <thead class="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="col.width ? { width: col.width } : {}"
              :class="[
                'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none',
                col.sortable ? 'cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors' : ''
              ]"
              @click="col.sortable && handleSort(col.key)"
            >
              <div class="flex items-center gap-1.5">
                <span>{{ col.label }}</span>
                <span v-if="col.sortable" class="inline-flex flex-col">
                  <svg
                    :class="sortKey === col.key && sortDir === 'asc' ? 'text-indigo-600' : 'text-gray-300'"
                    class="w-3 h-3 -mb-0.5" fill="currentColor" viewBox="0 0 20 20"
                  >
                    <path d="M5 12l5-5 5 5H5z" />
                  </svg>
                  <svg
                    :class="sortKey === col.key && sortDir === 'desc' ? 'text-indigo-600' : 'text-gray-300'"
                    class="w-3 h-3 -mt-0.5" fill="currentColor" viewBox="0 0 20 20"
                  >
                    <path d="M5 8l5 5 5-5H5z" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="r in 5" :key="'skel-' + r" class="animate-pulse">
              <td v-for="col in columns" :key="'skel-' + col.key" class="px-4 py-3">
                <div class="h-4 bg-gray-200 rounded" :style="{ width: randomWidth() }"></div>
              </td>
            </tr>
          </template>

          <!-- Data rows -->
          <template v-else-if="data.length > 0">
            <tr
              v-for="(row, idx) in data"
              :key="idx"
              class="hover:bg-indigo-50/40 transition-colors"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-gray-700"
              >
                <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else>
            <td :colspan="columns.length" class="px-4 py-12 text-center text-gray-400">
              <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              No data available
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  data() {
    return {
      sortKey: null,
      sortDir: null,
    };
  },
  methods: {
    handleSort(key) {
      if (this.sortKey === key) {
        if (this.sortDir === 'asc') {
          this.sortDir = 'desc';
        } else if (this.sortDir === 'desc') {
          this.sortKey = null;
          this.sortDir = null;
        }
      } else {
        this.sortKey = key;
        this.sortDir = 'asc';
      }
      this.$emit('sort', this.sortKey, this.sortDir);
    },
    randomWidth() {
      return Math.floor(Math.random() * 40 + 40) + '%';
    },
  },
};
