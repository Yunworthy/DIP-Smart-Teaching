var StudentImport = {
  name: 'StudentImport',
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-800">学生账号管理</h1>
        <p class="text-gray-500 mt-1">批量导入学生账号，支持 CSV 和 Excel (.xlsx) 格式</p>
      </div>

      <!-- File Upload -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">批量导入学生</h2>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 class="text-sm font-semibold text-blue-800 mb-2">文件格式说明</h3>
          <p class="text-sm text-blue-700 mb-2">支持 CSV 或 Excel (.xlsx) 文件，需包含以下三列：</p>
          <code class="block bg-white rounded p-2 text-sm text-gray-700 border border-blue-100">学号,姓名,班级<br>2023010051,张三,电信23-1班<br>2023010052,李四,电信23-2班</code>
          <p class="text-xs text-blue-600 mt-2">提示：第一行为表头（可选），初始密码为学号后6位。已存在的学生会自动跳过。</p>
        </div>

        <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
             @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p class="text-sm text-gray-600 mb-1">点击选择或拖拽文件到此处</p>
          <p class="text-xs text-gray-400">支持 .csv 和 .xlsx 格式</p>
          <input ref="fileInput" type="file" accept=".csv,.xlsx,.xls" class="hidden" @change="handleFile">
        </div>

        <div v-if="selectedFile" class="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm text-gray-700">{{ selectedFile.name }}</span>
            <span class="text-xs text-gray-400">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
          </div>
          <button @click="removeFile" class="text-xs text-red-500 hover:text-red-700">移除</button>
        </div>

        <button v-if="selectedFile && !importing" @click="doImport"
                class="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          开始导入
        </button>
        <div v-if="importing" class="mt-4 w-full py-3 bg-gray-200 rounded-lg text-center text-gray-500 text-sm">
          正在导入...
        </div>
      </div>

      <!-- Import Results -->
      <div v-if="importResult" class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">导入结果</h2>
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ importResult.success }}</div>
            <div class="text-xs text-green-700">成功导入</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-yellow-600">{{ importResult.skipped }}</div>
            <div class="text-xs text-yellow-700">已跳过(已存在)</div>
          </div>
          <div class="bg-red-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-600">{{ importResult.failed }}</div>
            <div class="text-xs text-red-700">导入失败</div>
          </div>
        </div>
        <div v-if="importResult.errors && importResult.errors.length > 0" class="bg-red-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-red-800 mb-2">错误详情:</h3>
          <ul class="text-xs text-red-700 space-y-1">
            <li v-for="(err, i) in importResult.errors" :key="i">{{ err }}</li>
          </ul>
        </div>
      </div>

      <!-- Student List -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">已有学生账号</h2>
          <span class="text-sm text-gray-500">共 {{ students.length }} 名学生</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left">
                <th class="py-2 px-3 font-medium text-gray-600">学号</th>
                <th class="py-2 px-3 font-medium text-gray-600">姓名</th>
                <th class="py-2 px-3 font-medium text-gray-600">班级</th>
                <th class="py-2 px-3 font-medium text-gray-600">用户名</th>
                <th class="py-2 px-3 font-medium text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in students" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50">
                <td class="py-2 px-3 text-gray-700">{{ s.student_id }}</td>
                <td class="py-2 px-3 text-gray-700">{{ s.real_name }}</td>
                <td class="py-2 px-3 text-gray-600">{{ s.class_name }}</td>
                <td class="py-2 px-3 font-mono text-xs text-gray-500">{{ s.username }}</td>
                <td class="py-2 px-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
                    {{ s.is_active ? '正常' : '禁用' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      selectedFile: null,
      importing: false,
      importResult: null,
      students: [],
    };
  },
  async mounted() {
    await this.loadStudents();
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    isValidFile(file) {
      if (!file) return false;
      const name = file.name.toLowerCase();
      return name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
    },
    handleFile(e) {
      const file = e.target.files[0];
      if (this.isValidFile(file)) {
        this.selectedFile = file;
        this.importResult = null;
      } else {
        store.notify('请上传 CSV 或 Excel (.xlsx) 格式文件', 'warning');
      }
    },
    handleDrop(e) {
      const file = e.dataTransfer.files[0];
      if (this.isValidFile(file)) {
        this.selectedFile = file;
        this.importResult = null;
      }
    },
    removeFile() {
      this.selectedFile = null;
      this.importResult = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },
    async doImport() {
      if (!this.selectedFile) return;
      this.importing = true;
      this.importResult = null;
      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        const res = await fetch('/api/student-import', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + (store.token || localStorage.getItem('dip-token')) },
          body: formData,
        });
        const data = await res.json();
        this.importResult = data;
        if (data.success > 0) {
          store.notify('成功导入 ' + data.success + ' 名学生', 'success');
        }
        await this.loadStudents();
      } catch (e) {
        this.importResult = { success: 0, skipped: 0, failed: 1, errors: [e.message] };
      }
      this.importing = false;
    },
    async loadStudents() {
      try {
        const res = await fetch('/api/admin/students', {
          headers: { 'Authorization': 'Bearer ' + (store.token || localStorage.getItem('dip-token')) }
        });
        if (res.ok) {
          this.students = await res.json();
        } else {
          // Fallback: try getting students via admin users endpoint
          const users = await api.getUsers(1, 200);
          const list = users.data || users.users || users || [];
          this.students = Array.isArray(list) ? list.filter(u => u.role === 'student') : [];
        }
      } catch (e) {
        this.students = [];
      }
    },
  },
};
