var UserManage = {
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">用户管理</h1>
        <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          <span>添加用户</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow border border-gray-100 p-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-48">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索用户名、姓名或学号..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="debounceSearch"
            />
          </div>
          <select v-model="roleFilter" @change="applyFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">全部角色</option>
            <option value="student">学生</option>
            <option value="teacher">教师</option>
            <option value="admin">管理员</option>
          </select>
          <select v-model="statusFilter" @change="applyFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="disabled">已禁用</option>
          </select>
          <div v-if="selectedUsers.length > 0" class="flex items-center space-x-2 ml-auto">
            <span class="text-sm text-gray-500">已选 {{ selectedUsers.length }} 人</span>
            <button @click="bulkDisable" class="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100">
              批量禁用
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- User Table -->
      <div v-else class="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="py-3 px-4 text-left w-10">
                  <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">用户名</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">姓名</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">角色</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">学号</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">班级</th>
                <th class="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                <th class="text-center py-3 px-4 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="8" class="text-center py-12 text-gray-400">
                  <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                  <p>{{ searchQuery || roleFilter || statusFilter ? '未找到匹配的用户' : '暂无用户数据' }}</p>
                </td>
              </tr>
              <tr v-for="u in paginatedUsers" :key="u.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                  <input type="checkbox" :checked="selectedUsers.includes(u.id)" @change="toggleSelect(u.id)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td class="py-3 px-4 text-gray-800 font-medium">{{ u.username }}</td>
                <td class="py-3 px-4 text-gray-700">{{ u.realName || u.real_name || '--' }}</td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded text-xs font-medium" :class="roleClass(u.role)">
                    {{ roleLabel(u.role) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600">{{ u.studentId || u.student_id || '--' }}</td>
                <td class="py-3 px-4 text-gray-600">{{ u.className || u.class || '--' }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center space-x-1">
                    <span class="w-2 h-2 rounded-full" :class="(u.status || 'active') === 'active' ? 'bg-green-500' : 'bg-red-500'"></span>
                    <span class="text-xs" :class="(u.status || 'active') === 'active' ? 'text-green-600' : 'text-red-500'">
                      {{ (u.status || 'active') === 'active' ? '正常' : '已禁用' }}
                    </span>
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <button @click="editUser(u)" class="text-blue-600 hover:text-blue-800 text-xs font-medium">编辑</button>
                    <button @click="toggleStatus(u)" class="text-xs font-medium" :class="(u.status || 'active') === 'active' ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'">
                      {{ (u.status || 'active') === 'active' ? '禁用' : '启用' }}
                    </button>
                    <button @click="resetPassword(u)" class="text-gray-500 hover:text-gray-700 text-xs font-medium">重置密码</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-gray-100 flex items-center justify-between">
          <p class="text-xs text-gray-500">
            共 {{ filteredUsers.length }} 个用户，第 {{ currentPage }} / {{ totalPages }} 页
          </p>
          <div class="flex items-center space-x-1">
            <button @click="currentPage = 1" :disabled="currentPage <= 1" class="px-2 py-1 rounded text-xs border" :class="currentPage <= 1 ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&laquo;</button>
            <button @click="currentPage--" :disabled="currentPage <= 1" class="px-2 py-1 rounded text-xs border" :class="currentPage <= 1 ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&lt;</button>
            <button v-for="p in visiblePages" :key="p" @click="currentPage = p" class="px-3 py-1 rounded text-xs border"
              :class="p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">
              {{ p }}
            </button>
            <button @click="currentPage++" :disabled="currentPage >= totalPages" class="px-2 py-1 rounded text-xs border" :class="currentPage >= totalPages ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&gt;</button>
            <button @click="currentPage = totalPages" :disabled="currentPage >= totalPages" class="px-2 py-1 rounded text-xs border" :class="currentPage >= totalPages ? 'text-gray-300 border-gray-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">&raquo;</button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ formMode === 'edit' ? '编辑用户' : '添加用户' }}</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                <input v-model="form.username" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" :disabled="formMode === 'edit'" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ formMode === 'edit' ? '新密码 (留空不修改)' : '密码 *' }}</label>
                <input v-model="form.password" type="password" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
                <input v-model="form.realName" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
                <select v-model="form.role" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="student">学生</option>
                  <option value="teacher">教师</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">学号</label>
                <input v-model="form.studentId" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">班级</label>
                <input v-model="form.className" type="text" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input v-model="form.email" type="email" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
            <button @click="saveUser" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" :disabled="!form.username || (formMode === 'create' && !form.password)">
              {{ formMode === 'edit' ? '保存修改' : '添加' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div v-if="toast" class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 text-sm"
        :class="toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'">
        {{ toast.message }}
      </div>
    </div>
  `,
  data() {
    return {
      loading: false,
      users: [],
      searchQuery: '',
      roleFilter: '',
      statusFilter: '',
      currentPage: 1,
      pageSize: 15,
      showModal: false,
      formMode: 'create',
      form: { id: null, username: '', password: '', realName: '', role: 'student', studentId: '', className: '', email: '' },
      selectedUsers: [],
      toast: null,
      searchTimer: null
    };
  },
  computed: {
    filteredUsers() {
      let list = this.users;
      if (this.roleFilter) list = list.filter(u => u.role === this.roleFilter);
      if (this.statusFilter) list = list.filter(u => (u.status || 'active') === this.statusFilter);
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(u =>
          (u.username || '').toLowerCase().includes(q) ||
          (u.realName || u.real_name || '').toLowerCase().includes(q) ||
          (u.studentId || u.student_id || '').includes(q)
        );
      }
      return list;
    },
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredUsers.slice(start, start + this.pageSize);
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const cur = this.currentPage;
      const start = Math.max(1, cur - 2);
      const end = Math.min(total, cur + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    },
    isAllSelected() {
      return this.paginatedUsers.length > 0 && this.paginatedUsers.every(u => this.selectedUsers.includes(u.id));
    }
  },
  async mounted() {
    await this.loadUsers();
  },
  methods: {
    async loadUsers() {
      this.loading = true;
      try {
        const res = await api.getUsers(this.currentPage, this.pageSize);
        const data = res.data || res;
        this.users = Array.isArray(data) ? data : (data.users || []);
      } catch (err) {
        this.showToast('加载用户列表失败', 'error');
      } finally {
        this.loading = false;
      }
    },
    debounceSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => { this.currentPage = 1; }, 300);
    },
    applyFilter() {
      this.currentPage = 1;
    },
    openCreateModal() {
      this.formMode = 'create';
      this.form = { id: null, username: '', password: '', realName: '', role: 'student', studentId: '', className: '', email: '' };
      this.showModal = true;
    },
    editUser(u) {
      this.formMode = 'edit';
      this.form = {
        id: u.id,
        username: u.username,
        password: '',
        realName: u.realName || u.real_name || '',
        role: u.role || 'student',
        studentId: u.studentId || u.student_id || '',
        className: u.className || u.class || '',
        email: u.email || ''
      };
      this.showModal = true;
    },
    async saveUser() {
      if (!this.form.username) return;
      if (this.formMode === 'create' && !this.form.password) return;
      try {
        const payload = {
          username: this.form.username,
          realName: this.form.realName,
          role: this.form.role,
          studentId: this.form.studentId,
          className: this.form.className,
          email: this.form.email
        };
        if (this.form.password) payload.password = this.form.password;

        if (this.formMode === 'edit') {
          if (api.updateUser) await api.updateUser(this.form.id, payload);
          const idx = this.users.findIndex(u => u.id === this.form.id);
          if (idx >= 0) this.users[idx] = { ...this.users[idx], ...payload };
          this.showToast('用户信息已更新', 'success');
        } else {
          payload.password = this.form.password;
          if (api.createUser) await api.createUser(payload);
          const newUser = { id: Date.now(), ...payload, status: 'active' };
          this.users.unshift(newUser);
          this.showToast('用户已添加', 'success');
        }
        this.showModal = false;
      } catch (err) {
        this.showToast('操作失败: ' + (err.message || ''), 'error');
      }
    },
    async toggleStatus(u) {
      const newStatus = (u.status || 'active') === 'active' ? 'disabled' : 'active';
      try {
        if (api.updateUser) await api.updateUser(u.id, { status: newStatus });
        u.status = newStatus;
        this.showToast(newStatus === 'active' ? '用户已启用' : '用户已禁用', 'success');
      } catch {
        this.showToast('操作失败', 'error');
      }
    },
    async resetPassword(u) {
      if (!confirm('确定重置 ' + (u.realName || u.username) + ' 的密码？')) return;
      try {
        if (api.resetPassword) await api.resetPassword(u.id);
        this.showToast('密码已重置为默认密码', 'success');
      } catch {
        this.showToast('重置失败', 'error');
      }
    },
    async bulkDisable() {
      if (!confirm('确定禁用选中的 ' + this.selectedUsers.length + ' 个用户？')) return;
      try {
        for (const id of this.selectedUsers) {
          const u = this.users.find(x => x.id === id);
          if (u) {
            if (api.updateUser) await api.updateUser(id, { status: 'disabled' });
            u.status = 'disabled';
          }
        }
        this.selectedUsers = [];
        this.showToast('批量禁用成功', 'success');
      } catch {
        this.showToast('部分操作失败', 'error');
      }
    },
    toggleSelect(id) {
      const idx = this.selectedUsers.indexOf(id);
      if (idx >= 0) this.selectedUsers.splice(idx, 1);
      else this.selectedUsers.push(id);
    },
    toggleSelectAll() {
      if (this.isAllSelected) {
        const ids = this.paginatedUsers.map(u => u.id);
        this.selectedUsers = this.selectedUsers.filter(id => !ids.includes(id));
      } else {
        const ids = this.paginatedUsers.map(u => u.id);
        ids.forEach(id => { if (!this.selectedUsers.includes(id)) this.selectedUsers.push(id); });
      }
    },
    roleClass(role) {
      const map = { admin: 'bg-red-100 text-red-700', teacher: 'bg-blue-100 text-blue-700', student: 'bg-green-100 text-green-700' };
      return map[role] || 'bg-gray-100 text-gray-700';
    },
    roleLabel(role) {
      const map = { admin: '管理员', teacher: '教师', student: '学生' };
      return map[role] || role;
    },
    showToast(message, type = 'success') {
      this.toast = { message, type };
      setTimeout(() => { this.toast = null; }, 3000);
    }
  }
};
