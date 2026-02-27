<template>
  <div class="main-container">
    <div class="header-section">
      <div class="page-title">
        <h1>其他支出管理</h1>
        <span class="record-count">共 {{ displayData.length }} 条记录</span>
      </div>
      
      <div class="action-bar">
        <div class="filter-group">
          <t-date-range-picker
            v-model="rangeValue"
            placeholder="按支出日期筛选"
            clearable
            @change="fetchData" 
            style="width: 300px;"
          />
        </div>
        <div class="action-buttons">
          <t-button class="action-btn" theme="primary" @click="handleAdd">
            <template #icon><t-icon name="add" /></template>
            添加支出数据
          </t-button>
        </div>
      </div>
    </div>

    <div class="data-card">
      <t-table
        :data="displayData" 
        :columns="columns"
        row-key="id"
        :hover="true"
        class="custom-table"
        :pagination="pagination"
        @page-change="onPageChange"
        size="medium"
      >
        <template #expense_type="{ row }">
          <t-tag :class="['type-tag', getExpenseTypeClass(row.expense_type)]" variant="light-outline">
            {{ getExpenseTypeText(row.expense_type) }}
          </t-tag>
        </template>

        <template #amount="{ row }">
          <div class="price-info">
            <span class="price-text">¥{{ row.amount.toFixed(2) }}</span>
          </div>
        </template>

        <template #expense_date="{ row }">
          <span class="date-text">{{ row.expense_date.split('T')[0] }}</span>
        </template>

        <template #created_at="{ row }">
          <span class="date-text-secondary">{{ formatDateTime(row.created_at) }}</span>
        </template>

        <template #operation="{ row }">
          <div class="table-actions">
            <t-button variant="text" theme="primary" @click="handleEdit(row)">修改</t-button>
            <t-button variant="text" theme="danger" @click="handleCopy(row)">复制</t-button>
            <t-button variant="text" theme="danger" @click="handleDelete(row)">删除</t-button>
          </div>
        </template>
      </t-table>
    </div>
  </div>
  <!-- 抽屉逻辑 (保持原样) -->
  <t-drawer v-model:visible="showDrawer" size="500px" :placement="'right'" @confirm="handleSubmit" :close-on-overlay-click="false">
    <template v-if="isEdit" #header>编辑其他支出</template>
    <template v-else #header>添加其他支出</template>
    <t-form ref="formRef" :rules="rules" :data="formData" :label-align="'right'" :label-width="120">
        <t-form-item label="支出日期" name="expense_date" required>
            <t-date-picker v-model="formData.expense_date" format="YYYY-MM-DD" style="width: 100%"/>
        </t-form-item>
        <t-form-item label="支出类型" name="expense_type" required>
            <t-select v-model="formData.expense_type" clearable>
                <t-option :value="1" label="办公用品" />
                <t-option :value="2" label="水电费" />
                <t-option :value="3" label="工资" />
                <t-option :value="4" label="交通费" />
                <t-option :value="5" label="差旅费" />
                <t-option :value="6" label="设备购置" />
                <t-option :value="7" label="其他" />
            </t-select>
        </t-form-item>
        <t-form-item label="项目名称" name="item_name" required>
            <t-input v-model="formData.item_name" :maxlength="200" />
        </t-form-item>
        <t-form-item label="金额(元)" name="amount" required>
            <t-input v-model="formData.amount" type="number" step="0.01">
                <template #prefix>¥</template>
            </t-input>
        </t-form-item>
        <t-form-item label="子订单号" name="sub_order_no">
            <t-input v-model="formData.sub_order_no" :maxlength="100" />
        </t-form-item>
        <t-form-item label="备注" name="remark">
            <t-textarea v-model="formData.remark" :maxlength="500" :autosize="{ minRows: 3 }" />
        </t-form-item>
    </t-form>
  </t-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed, nextTick } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import type { TableProps, FormRule } from 'tdesign-vue-next'
import api from '../api/api'

// --- 原有数据定义 ---
interface OtherExpenseItem {
  id: number; expense_date: string; expense_type: number; item_name: string;
  amount: number; sub_order_no: string; remark: string; created_at: string;
}

const tableData = ref<OtherExpenseItem[]>([])
const rangeValue = ref([]) 
const showDrawer = ref(false)
const isEdit = ref(false)
const formRef = ref()

// --- 分页配置 ---
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showJumper: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50],
  size: 'small', // 关键：使用小尺寸分页
})

// --- 逻辑处理 ---
const displayData = computed(() => {
  let list = [...tableData.value]
  if (rangeValue.value && rangeValue.value.length === 2 && rangeValue.value[0]) {
    const start = new Date(rangeValue.value[0] as string).getTime()
    const end = new Date(rangeValue.value[1]! as string).getTime()
    list = list.filter(item => {
      const itemTime = new Date(item.expense_date).getTime()
      return itemTime >= start && itemTime <= end
    })
  }
  // 排序
  const sorted = list.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
  // 同步分页总数
  pagination.total = sorted.length
  return sorted
})

const onPageChange = (pageInfo: any) => {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
}

const handleCopy = (row: OtherExpenseItem) => {
  clearFormData()
  Object.assign(formData, { ...row, id: undefined })
  formData.expense_date = row.expense_date?.split('T')[0] || ''
  isEdit.value = false
  showDrawer.value = true
}

const columns: TableProps['columns'] = [
  { title: 'ID', colKey: 'id', width: 80, align: 'center' },
  { title: '支出日期', colKey: 'expense_date', width: 140 },
  { title: '支出类型', colKey: 'expense_type', width: 120, align: 'center' },
  { title: '项目名称', colKey: 'item_name', width: 180, ellipsis: true },
  { title: '金额(元)', colKey: 'amount', width: 120, align: 'right' },
  { title: '子订单号', colKey: 'sub_order_no', width: 150 },
  { title: '备注', colKey: 'remark', width: 180, ellipsis: true },
  { title: '创建时间', colKey: 'created_at', width: 190 },
  { title: '操作', colKey: 'operation', width: 140, align: 'center', fixed: 'right' }
]

// --- 辅助函数 ---
const expenseTypeMap: Record<number, string> = {
  1: '办公用品', 2: '水电费', 3: '工资', 4: '交通费', 5: '差旅费', 6: '设备购置', 7: '其他'
}
const getExpenseTypeText = (type: number): string => expenseTypeMap[type] || `类型${type}`
const getExpenseTypeClass = (type: number): string => {
  const statusClasses: Record<number, string> = {
    1: 'status-default', 2: 'status-info', 3: 'status-warning', 4: 'status-primary', 5: 'status-secondary', 6: 'status-success', 7: 'status-tertiary'
  }
  return statusClasses[type] || 'status-default'
}

// 格式化日期时间：YYYY-MM-DD HH:mm:ss
const formatDateTime = (dateString: string): string => {
  if (!dateString || dateString.startsWith('0001')) return '-'
  const date = new Date(dateString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const formData = reactive({
    id: undefined as number | undefined,
    expense_date: '',
    expense_type: undefined as number | undefined,
    item_name: '',
    amount: undefined as number | undefined,
    sub_order_no: '',
    remark: ''
})

const rules: Record<string, FormRule[]> = {
    expense_date: [{ required: true, message: '必填', type: 'error' }],
    expense_type: [{ required: true, message: '必填', type: 'error' }],
    item_name: [{ required: true, message: '必填', type: 'error' }],
    amount: [{ required: true, message: '必填', type: 'error' }]
}

const clearFormData = () => {
    Object.assign(formData, { id: undefined, expense_date: '', expense_type: undefined, item_name: '', amount: undefined, sub_order_no: '', remark: '' })
    nextTick(() => { formRef.value?.clearValidate() })
}

const handleSubmit = async () => {
    const validateResult = await formRef.value?.validate()
    if (validateResult === true) {
        const loadingMessage = MessagePlugin.loading('正在保存...')
        try {
            if (isEdit.value) {
              const response = await api.EditOtherExpenseItem({
                    ...formData,
                    id: formData.id!,
                    expense_date: formData.expense_date + 'T00:00:00Z'
                }) as any
                if (response.code === 200) { MessagePlugin.success('操作成功'); fetchData(); showDrawer.value = false }else {
                  MessagePlugin.error('操作失败，请稍后重试')
                }
            } else {
                const response = await api.CreateOtherExpenseItem({
                    ...formData,
                    expense_date: formData.expense_date + 'T00:00:00Z'
                }) as any
                if (response.code === 200) { MessagePlugin.success('操作成功'); fetchData(); showDrawer.value = false }else {
                  MessagePlugin.error('操作失败，请稍后重试')
                }
            }
        }catch (error) {
            MessagePlugin.close(loadingMessage) 
            MessagePlugin.error('操作失败，请稍后重试') 
          }
        finally {
            MessagePlugin.close(loadingMessage)
          }
    }
}

const fetchData = async () => {
  const response = await api.GetOtherExpenseList() as any
  if (response.code === 200) tableData.value = response.data
}

const handleAdd = () => { isEdit.value = false; clearFormData(); showDrawer.value = true }
const handleEdit = (row: OtherExpenseItem) => {
    clearFormData()
    Object.assign(formData, row)
    formData.expense_date = row.expense_date?.split('T')[0] || ''
    isEdit.value = true
    showDrawer.value = true
}
const handleDelete = async (row: OtherExpenseItem) => {
  try {
    var confirm = true
    
    if (confirm) {
      const loadingMessage = MessagePlugin.loading('正在删除...')
      try {
        const response = await api.DeleteOtherExpenseItem( row.id) as any
        if (response.code === 200) {
          MessagePlugin.success('删除成功')
          fetchData()
        } else {
          MessagePlugin.error('删除失败，请稍后重试')
        }
      } catch (error) {
        MessagePlugin.error('删除失败，请稍后重试')
      } finally {
        MessagePlugin.close(loadingMessage)
      }
    }
  } catch {
    // 用户取消删除，无需处理
  }
}

watch(showDrawer, (newVal) => { if (!newVal) clearFormData() })
onMounted(() => { fetchData() })
</script>

<style scoped>
/* 核心容器与头部样式 */
.main-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.header-section { margin-bottom: 20px; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
.page-title { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.page-title h1 { font-size: 20px; font-weight: 600; color: #1d2129; margin: 0; }
.record-count { font-size: 13px; color: #86909c; background: #f2f3f5; padding: 4px 10px; border-radius: 4px; }
.action-bar { display: flex; justify-content: space-between; align-items: center; }
.filter-group { display: flex; gap: 16px; }
.action-buttons { display: flex; gap: 12px; }

/* 数据卡片 */
.data-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }

/* 文字与标签 */
.price-text { font-weight: 700; color: var(--td-error-color); font-family: 'Din alternate', sans-serif; font-size: 16px; }
.date-text { color: #4e5969; }
.date-text-secondary { color: #86909c; font-size: 12px; }
.type-tag { border-radius: 4px; font-weight: 500; }

/* 表格与操作 */
.table-actions { display: flex; justify-content: center; gap: 4px; }
:deep(.t-table__header th) { background-color: #f7f8fa; font-weight: 600; color: #4e5969; }

/* 统一分页样式 (Small) */
:deep(.t-pagination) { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f2f3f5; }

/* 业务状态色 (保留原有逻辑) */
.status-default { background-color: #f2f3f5; color: #86909c; border-color: #e5e6eb; }
.status-info { background-color: #e8f3ff; color: #165dff; border-color: #c9e0ff; }
.status-warning { background-color: #fff7e8; color: #ff7d00; border-color: #ffe4ba; }
.status-primary { background-color: #e8fffb; color: #00b42a; border-color: #aff4e9; }
.status-secondary { background-color: #f5e8ff; color: #722ed1; border-color: #e2c6ff; }
.status-success { background-color: #e8ffea; color: #00b42a; border-color: #aff0b5; }
.status-tertiary { background-color: #fff2e8; color: #f53f3f; border-color: #ffcfac; }
</style>