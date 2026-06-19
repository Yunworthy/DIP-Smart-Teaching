var NotificationToast = {
  name: 'NotificationToast',
  template: `
    <teleport to="body">
      <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <transition-group
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 translate-x-8 scale-95"
          enter-to-class="opacity-100 translate-x-0 scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-x-0 scale-100"
          leave-to-class="opacity-0 translate-x-8 scale-95"
          move-class="transition-all duration-300"
        >
          <div
            v-for="toast in toasts"
            :key="toast.id"
            :class="[
              'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm',
              toastClasses(toast.type)
            ]"
          >
            <!-- Icon -->
            <div class="flex-shrink-0 mt-0.5">
              <svg v-if="toast.type === 'success'" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else-if="toast.type === 'warning'" class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Message -->
            <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>

            <!-- Close button -->
            <button
              @click="dismiss(toast.id)"
              class="flex-shrink-0 p-0.5 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Progress bar -->
            <div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
              <div
                :class="progressBarClass(toast.type)"
                :style="{ animation: 'shrink ' + (toast.duration || 3000) + 'ms linear forwards' }"
              ></div>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- Inject keyframes for progress bar -->
      <style>
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      </style>
    </teleport>
  `,
  setup() {
    const store = window.store;
    return { store };
  },
  data() {
    return {
      toasts: [],
      timers: {},
    };
  },
  watch: {
    'store.notifications': {
      handler(newList) {
        if (!newList) return;
        for (const n of newList) {
          if (!this.toasts.find(t => t.id === n.id)) {
            this.addToast(n);
          }
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    addToast(notification) {
      const toast = {
        id: notification.id || Date.now() + Math.random(),
        message: notification.message,
        type: notification.type || 'info',
        duration: notification.duration || 3000,
      };
      this.toasts.push(toast);

      // Auto-dismiss
      const timer = setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
      this.timers[toast.id] = timer;
    },
    dismiss(id) {
      if (this.timers[id]) {
        clearTimeout(this.timers[id]);
        delete this.timers[id];
      }
      this.toasts = this.toasts.filter(t => t.id !== id);

      // Also remove from store
      const storeList = this.store.notifications;
      if (storeList) {
        const idx = storeList.findIndex(n => n.id === id);
        if (idx !== -1) storeList.splice(idx, 1);
      }
    },
    toastClasses(type) {
      const map = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
      };
      return map[type] || map.info;
    },
    progressBarClass(type) {
      const map = {
        success: 'bg-green-400',
        error: 'bg-red-400',
        warning: 'bg-yellow-400',
        info: 'bg-blue-400',
      };
      return map[type] || map.info;
    },
  },
  beforeUnmount() {
    Object.values(this.timers).forEach(t => clearTimeout(t));
  },
};
