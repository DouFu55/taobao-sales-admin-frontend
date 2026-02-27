<template>
  <div class="main-container">
    <!-- 头部区域 - 统一样式 -->
    <div class="header-section">
      <div class="page-title">
        <h1>推广支出管理</h1>
        <span class="record-count">共 {{ displayData.length }} 条记录</span>
      </div>
      
      <div class="action-bar">
        <div class="filter-group">
          <t-date-range-picker
            v-model="rangeValue"
            placeholder="按推广日期筛选"
            clearable
            @change="fetchData" 
            style="width: 320px;"
          />
        </div>
        <div class="action-buttons">
          <t-button class="action-btn" theme="primary" @click="handleAdd">
            <template #icon><t-icon name="add" /></template>
            添加数据
          </t-button>
        </div>
      </div>
    </div>

    <!-- 数据表格 - 统一样式卡片包裹 -->
    <div class="data-card">
      <t-table
        :data="displayData" 
        :columns="columns"
        row-key="id"
        :hover="true"
        :pagination="pagination"
        @page-change="onPageChange"
        class="custom-table"
      >
        <!-- 推广类型列 -->
        <template #promotion_type="{ row }">
          <t-tag :class="['type-tag', getStatusClass(row.promotion_type)]" variant="light-outline">
            {{ getPromotionTypeText(row.promotion_type) }}
          </t-tag>
        </template>

        <!-- 消耗金额列 -->
        <template #expense_amount="{ row }">
          <span class="price-text">¥{{ row.expense_amount.toFixed(2) }}</span>
        </template>

        <!-- 推广日期 -->
        <template #promotion_date="{ row }">
          <span class="date-text">{{ row.promotion_date.split('T')[0] }}</span>
        </template>

        <!-- 创建时间 -->
        <template #created_at="{ row }">
          <span class="date-text-secondary">{{ formatDateTime(row.created_at) }}</span>
        </template>

        <!-- 操作栏 -->
        <template #operation="{ row }">
          <div class="table-actions">
            <t-button variant="text" theme="primary" @click="handleEdit(row)">修改</t-button>
            <t-button variant="text" theme="primary" @click="handleCopy(row)">复制</t-button>
            <t-button variant="text" theme="danger" @click="handleDelete(row)">删除</t-button>
          </div>
        </template>
      </t-table>
    </div>
  </div>

  <!-- 抽屉部分 - 逻辑保留 -->
  <t-drawer v-model:visible="showDrawer" size="500px" :placement="'right'" @confirm="handleSubmit" :close-on-overlay-click="true">
    <template v-if="isEdit" #header>编辑推广费用</template>
    <template v-else #header>添加推广费用</template>
    <t-form ref="formRef" :rules="rules" :data="formData" :label-align="'right'" :label-width="120" show-error-helper>
        <t-form-item label="推广日期" name="promotion_date" required>
            <t-date-picker v-model="formData.promotion_date" format="YYYY-MM-DD" style="width: 100%"/>
        </t-form-item>
        <t-form-item label="推广类型" name="promotion_type" required>
            <t-select v-model="formData.promotion_type" clearable>
                <t-option :value="1" label="商品全站推广" />
                <t-option :value="2" label="关键词推广" />
                <t-option :value="3" label="人群推广" />
                <t-option :value="4" label="内容推广" />
                <t-option :value="5" label="淘宝联盟" />
                <t-option :value="6" label="营销托管" />
                <t-option :value="7" label="其他" />
            </t-select>
        </t-form-item>
        <t-form-item label="计划ID" name="plan_id" required>
            <t-input v-model="formData.plan_id" :maxlength="100" />
        </t-form-item>
        <t-form-item label="消耗金额" name="expense_amount" required>
            <t-input v-model="formData.expense_amount" type="number" step="0.01">
                <template #prefix>¥</template>
            </t-input>
        </t-form-item>
        <t-form-item label="订单数" name="orders_count" required>
            <t-input v-model="formData.orders_count" type="number" />
        </t-form-item>
        <t-form-item label="备注" name="remark">
            <t-textarea v-model="formData.remark" :maxlength="200" :autosize="{ minRows: 3 }" />
        </t-form-item>
    </t-form>
  </t-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import type { TableProps, FormRule } from 'tdesign-vue-next'
import api from '../api/api'

// --- 数据定义 ---
interface PromotionItem {
  id: number; promotion_date: string; promotion_type: number; plan_id: string;
  expense_amount: number; orders_count: number; remark: string;
  deleted_at: string | null; created_at: string; updated_at: string;
}

const tableData = ref<PromotionItem[]>([])
const rangeValue = ref([]) 
const showDrawer = ref(false)
const isEdit = ref(false)
const formRef = ref()

// --- 分页配置 (新增) ---
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showJumper: true,
  showPageSize: true,
  pageSizeOptions: [10, 20, 50],
  size: 'small' // 统一使用成本管理的小尺寸风格
})

const onPageChange = (pageInfo: any) => {
  pagination.current = pageInfo.current
  pagination.pageSize = pageInfo.pageSize
}

const handleCopy = (row: PromotionItem) => {
  clearForm()
  Object.assign(formData, { ...row, id: undefined })
  formData.promotion_date = row.promotion_date.split('T')[0] || ''
  isEdit.value = false
  showDrawer.value = true
}

// --- 排序与筛选逻辑 ---
const displayData = computed(() => {
  let list = [...tableData.value]
  if (rangeValue.value && rangeValue.value.length === 2 && rangeValue.value[0]) {
    const start = new Date(rangeValue.value[0] as string).getTime()
    const end = new Date(rangeValue.value[1]! as string).getTime()
    list = list.filter(item => {
      const itemTime = new Date(item.promotion_date).getTime()
      return itemTime >= start && itemTime <= end
    })
  }
  // 同步分页总数
  pagination.total = list.length
  return list.sort((a, b) => new Date(b.promotion_date).getTime() - new Date(a.promotion_date).getTime())
})

const columns: TableProps['columns'] = [
  { title: 'ID', colKey: 'id', width: 80, align: 'center' },
  { title: '推广日期', colKey: 'promotion_date', width: 140 },
  { title: '推广类型', colKey: 'promotion_type', width: 140, align: 'center' },
  { title: '计划ID', colKey: 'plan_id', width: 140 },
  { title: '消耗金额', colKey: 'expense_amount', width: 130, align: 'right' },
  { title: '订单数', colKey: 'orders_count', width: 100, align: 'center' },
  { title: '备注', colKey: 'remark', ellipsis: true },
  { title: '创建时间', colKey: 'created_at', width: 190 },
  { title: '操作', colKey: 'operation', width: 140, align: 'center', fixed: 'right' }
]

// --- 辅助函数 ---
const promotionTypeMap: Record<number, string> = {
    1: '商品全站推广', 2: '关键词推广', 3: '人群推广', 4: '内容推广', 5: '淘宝联盟', 6: '营销托管', 7: '其他'
}
const getPromotionTypeText = (type: number): string => promotionTypeMap[type] || `类型${type}`
const getStatusClass = (type: number): string => {
  const classes: Record<number, string> = {
    1: 'status-info', 2: 'status-primary', 3: 'status-secondary', 4: 'status-success', 5: 'status-warning', 6: 'status-tertiary', 7: 'status-default'
  }
  return classes[type] || 'status-default'
}

const formatDateTime = (dateString: string): string => {
  if (!dateString || dateString.startsWith('0001')) return '-'
  const date = new Date(dateString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// --- 表单与业务逻辑 ---
const formData = reactive({
    id: undefined as number | undefined,
    promotion_date: '',
    promotion_type: undefined as number | undefined,
    plan_id: '',
    expense_amount: undefined as number | undefined,
    orders_count: undefined as number | undefined,
    remark: ''
})

const rules: Record<string, FormRule[]> = {
    promotion_date: [{ required: true, message: '必填', type: 'error' }],
    promotion_type: [{ required: true, message: '必填', type: 'error' }],
    plan_id: [{ required: true, message: '必填', type: 'error' }],
    expense_amount: [{ required: true, message: '必填', type: 'error' }],
    orders_count: [{ required: true, message: '必填', type: 'error' }]
}

const clearForm = () => {
    Object.assign(formData, { id: undefined, promotion_date: '', promotion_type: undefined, plan_id: '', expense_amount: undefined, orders_count: undefined, remark: '' })
    nextTick(() => { formRef.value?.clearValidate() })
}

const handleSubmit = async () => {
    const validateResult = await formRef.value.validate()
    if (validateResult === true) {
        if (isEdit.value) {
            api.EditPromotionItem(formData).then((res: any) => {
                if (res.code === 200) { MessagePlugin.success('修改成功'); showDrawer.value = false; fetchData() }
                else { MessagePlugin.error(res.message) }
            })
        } else {
            api.CreatePromotionItem(formData).then((res: any) => {
                if (res.code === 200) { MessagePlugin.success('添加成功'); showDrawer.value = false; fetchData() }
                else { MessagePlugin.error(res.message) }
            })
        }
    }
}

const fetchData = async () => {
    const res = await api.GetPromotionList() as any
    if (res.code === 200) tableData.value = res.data
}

const handleAdd = () => { isEdit.value = false; clearForm(); showDrawer.value = true }

const handleEdit = (row: PromotionItem) => {
    clearForm()
    const date = new Date(row.promotion_date)
    Object.assign(formData, {
        ...row,
        promotion_date: `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}`,
        promotion_type: Number(row.promotion_type)
    })
    isEdit.value = true
    showDrawer.value = true
}

const handleDelete = (row: PromotionItem) => {
    api.DeletePromotionItem(row.id).then((res: any) => {
        if (res.code === 200) { MessagePlugin.success('删除成功'); fetchData() }
    })
}

watch(showDrawer, (val) => { if (!val) clearForm() })
onMounted(() => fetchData())
</script>

<style scoped>
/* 统一样式：基础容器 */
.main-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.header-section { margin-bottom: 20px; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }

/* 统一样式：标题栏 */
.page-title { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.page-title h1 { font-size: 20px; font-weight: 600; color: #1d2129; margin: 0; }
.record-count { font-size: 13px; color: #86909c; background: #f2f3f5; padding: 4px 10px; border-radius: 4px; }

/* 统一样式：操作栏 */
.action-bar { display: flex; justify-content: space-between; align-items: center; }
.filter-group { display: flex; gap: 16px; }
.action-buttons { display: flex; gap: 12px; }

/* 统一样式：数据卡片与表格 */
.data-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
:deep(.t-table__header th) { background-color: #f7f8fa; font-weight: 600; color: #4e5969; }

/* 统一样式：价格与日期 */
.price-text { font-weight: 700; color: var(--td-error-color); font-family: 'Din alternate', sans-serif; font-size: 16px; }
.date-text { color: #4e5969; }
.date-text-secondary { color: #86909c; font-size: 13px; }
.type-tag { border-radius: 4px; font-weight: 500; }
.table-actions { display: flex; justify-content: center; gap: 4px; }

/* 统一样式：分页 (Small) */
:deep(.t-pagination) { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f2f3f5; }

/* 业务状态色值 */
.status-default { background-color: #f2f3f5; color: #86909c; border-color: #e5e6eb; }
.status-info { background-color: #e8f3ff; color: #165dff; border-color: #c9e0ff; }
.status-warning { background-color: #fff7e8; color: #ff7d00; border-color: #ffe4ba; }
.status-primary { background-color: #e8fffb; color: #00b42a; border-color: #aff4e9; }
.status-secondary { background-color: #f5e8ff; color: #722ed1; border-color: #e2c6ff; }
.status-success { background-color: #e8ffea; color: #00b42a; border-color: #aff0b5; }
.status-tertiary { background-color: #fff2e8; color: #f53f3f; border-color: #ffcfac; }
</style>