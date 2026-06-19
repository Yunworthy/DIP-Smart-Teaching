var LoadingSpinner = {
  name: 'LoadingSpinner',
  props: {
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v),
    },
    text: {
      type: String,
      default: '',
    },
  },
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-6">
      <!-- Spinner -->
      <div
        :class="[
          'rounded-full border-t-transparent animate-spin',
          spinnerSize,
          borderColor
        ]"
      ></div>

      <!-- Optional text -->
      <p v-if="text" class="text-sm text-gray-400 font-medium">{{ text }}</p>
    </div>
  `,
  computed: {
    spinnerSize() {
      const map = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
      };
      return map[this.size] || map.md;
    },
    borderColor() {
      return 'border-indigo-200 border-t-indigo-600';
    },
  },
};
