var ModalDialog = {
  name: 'ModalDialog',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v),
    },
  },
  emits: ['close'],
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
          @click.self="$emit('close')"
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
              :class="[
                'relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full',
                sizeClasses
              ]"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
                <button
                  @click="$emit('close')"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Body -->
              <div class="px-6 py-4 overflow-y-auto flex-1">
                <slot></slot>
              </div>

              <!-- Footer (optional) -->
              <div v-if="$slots.footer" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                <slot name="footer"></slot>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>
  `,
  computed: {
    sizeClasses() {
      const map = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-3xl',
      };
      return map[this.size] || map.md;
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
