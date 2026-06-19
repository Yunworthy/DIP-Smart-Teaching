var ConfirmDialog = {
  name: 'ConfirmDialog',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '确认操作',
    },
    message: {
      type: String,
      default: '确定要执行此操作吗？',
    },
    confirmText: {
      type: String,
      default: '确认',
    },
    cancelText: {
      type: String,
      default: '取消',
    },
    type: {
      type: String,
      default: 'info',
      validator: (v) => ['danger', 'warning', 'info'].includes(v),
    },
  },
  emits: ['confirm', 'cancel'],
  template: `
    <teleport to="body">
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="show"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="$emit('cancel')"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

          <!-- Dialog -->
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="show"
              class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <!-- Header with icon -->
              <div class="flex items-start gap-4 px-6 pt-6 pb-2">
                <div
                  :class="[
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    iconBgClass
                  ]"
                >
                  <!-- Danger icon -->
                  <svg v-if="type === 'danger'" class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <!-- Warning icon -->
                  <svg v-else-if="type === 'warning'" class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <!-- Info icon -->
                  <svg v-else class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-semibold text-gray-900">{{ title }}</h3>
                  <p class="mt-1.5 text-sm text-gray-500 leading-relaxed">{{ message }}</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 px-6 py-4 mt-2">
                <button
                  @click="$emit('cancel')"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                >
                  {{ cancelText }}
                </button>
                <button
                  @click="$emit('confirm')"
                  :class="[
                    'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                    confirmBtnClass
                  ]"
                >
                  {{ confirmText }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>
  `,
  computed: {
    iconBgClass() {
      const map = {
        danger: 'bg-red-100',
        warning: 'bg-yellow-100',
        info: 'bg-blue-100',
      };
      return map[this.type] || map.info;
    },
    confirmBtnClass() {
      const map = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400',
        info: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
      };
      return map[this.type] || map.info;
    },
  },
  watch: {
    show(val) {
      if (val) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },
  },
  beforeUnmount() {
    document.body.style.overflow = '';
  },
};
