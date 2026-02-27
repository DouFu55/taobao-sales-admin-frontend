<template>
  <div class="main-container">
    <!-- 头部区域 - 统一样式 -->
    <div class="header-section">
      <div class="page-title">
        <h1>产品成本管理</h1>
        <span class="record-count">共 {{ displayData.length }} 条记录</span>
      </div>

      <div class="action-bar">
        <div class="filter-group">
          <!-- 搜索框 -->
          <t-input 
            v-model="searchText" 
            placeholder="搜索SKU/商品名称/供应商..." 
            clearable 
            class="search-input"
            @change="handleSearch" 
            style="width: 280px;"
          >
            <template #prefix-icon><t-icon name="search" /></template>
          </t-input>
          <!-- 日期筛选 -->
          <t-date-range-picker
            v-model="rangeValue"
            placeholder="按创建时间筛选"
            clearable
            style="width: 300px;"
          />
        </div>

        <div class="action-buttons">
          <t-button theme="primary" @click="handleAdd" class="action-btn">
            <template #icon><t-icon name="add" /></template>
            添加数据
          </t-button>
          <t-button variant="outline" @click="refreshData" class="action-btn">
            <template #icon><t-icon name="refresh" /></template>
            刷新数据
          </t-button>
        </div>
      </div>
    </div>

    <!-- 数据表格 - 统一样式卡片包裹 -->
    <div class="data-card">
      <t-table 
        :data="displayData" 
        :columns="columns" 
        :loading="loading" 
        row-key="id" 
        :pagination="pagination"
        @page-change="handlePageChange" 
        size="medium" 
        :hover="true"
        class="custom-table"
      >
        <!-- 商品信息列插槽 -->
        <template #productInfo="{ row }">
          <div class="product-info-cell">
            <div class="product-title">{{ row.product_name }}</div>
            <div class="product-sku">SKU: {{ row.sku || '无' }}</div>
            <div v-if="row.spec_info" class="product-attr">{{ row.spec_info }}</div>
          </div>
        </template>

        <!-- 价格明细列插槽 -->
        <template #priceInfo="{ row }">
          <div class="price-detail">
            <div class="price-text">¥{{ row.total_cost.toFixed(2) }}</div>
            <div class="cost-label">采购: ¥{{ row.purchase_price.toFixed(2) }}</div>
          </div>
        </template>

        <!-- 状态列插槽 -->
        <template #statusCell="{ row }">
          <t-tag :theme="row.is_active ? 'success' : 'default'" variant="light-outline" class="type-tag">
            {{ row.is_active ? '有效' : '无效' }}
          </t-tag>
        </template>

        <!-- 操作列插槽 -->
        <template #op="{ row }">
          <div class="table-actions">
            <t-button variant="text" theme="primary" @click="handleEdit(row)">修改</t-button>
            <t-button variant="text" theme="primary" @click="handleCopy(row)">复制</t-button>
            <t-button variant="text" theme="danger" @click="handleDelete(row)">删除</t-button>
          </div>
        </template>
      </t-table>
    </div>
  </div>

  <!-- 抽屉表单 (保持原样) -->
  <t-drawer v-model:visible="showDrawer" size="520px" :placement="'right'" @confirm="handleSubmit" :close-on-overlay-click="false">
    <template v-if="IsEdit" #header>编辑产品成本记录</template>
    <template v-else #header>添加产品成本记录</template>
    
    <t-form ref="formRef" :rules="rules" :data="formData" label-align="right" :label-width="120">
      <t-form-item label="SKU编号" name="sku" required>
        <t-input v-model="formData.sku" placeholder="如：CG-MC-GBC-26"></t-input>
      </t-form-item>
      <t-form-item label="商品ID" name="product_id" required>
        <t-input v-model="formData.product_id" type="number" placeholder="请输入商品ID"></t-input>
      </t-form-item>
      <t-form-item label="商品名称" name="product_name" required>
        <t-input v-model="formData.product_name" placeholder="请输入商品名称"></t-input>
      </t-form-item>
      <t-form-item label="规格信息" name="spec_info" required>
        <t-input v-model="formData.spec_info" placeholder="请输入规格颜色等信息"></t-input>
      </t-form-item>
      
      <t-divider align="left" style="font-size: 12px; color: #bbb; margin: 24px 0 16px;">费用成本明细 (元)</t-divider>
      
      <t-form-item label="采购价" name="purchase_price" required>
        <t-input v-model="formData.purchase_price" type="number" step="0.01"><template #prefix>¥</template></t-input>
      </t-form-item>
      <t-form-item label="运费" name="shipping_cost" required>
        <t-input v-model="formData.shipping_cost" type="number" step="0.01"><template #prefix>¥</template></t-input>
      </t-form-item>
      <t-form-item label="操作费" name="handling_cost" required>
        <t-input v-model="formData.handling_cost" type="number" step="0.01"><template #prefix>¥</template></t-input>
      </t-form-item>
      <t-form-item label="其他费用" name="other_cost" required>
        <t-input v-model="formData.other_cost" type="number" step="0.01"><template #prefix>¥</template></t-input>
      </t-form-item>
      <t-form-item label="计算总成本" name="total_cost">
        <t-input v-model="formData.total_cost" readonly class="readonly-input"><template #prefix>¥</template></t-input>
      </t-form-item>

      <t-divider align="left" style="font-size: 12px; color: #bbb; margin: 24px 0 16px;">供应及库存</t-divider>

      <t-form-item label="供应商" name="supplier" required>
        <t-input v-model="formData.supplier" placeholder="供应商名称"></t-input>
      </t-form-item>
      <t-form-item label="当前库存" name="stock" required>
        <t-input v-model="formData.stock" type="number" placeholder="0"></t-input>
      </t-form-item>
      <t-form-item label="数据状态" name="is_active">
        <t-switch v-model="formData.is_active" :label="['启用', '禁用']"></t-switch>
      </t-form-item>
    </t-form>
  </t-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import type { TableProps } from 'tdesign-vue-next'
import { Icon as TIcon } from 'tdesign-icons-vue-next'
import api from '../api/api'

// --- 类型定义 ---
interface ProductCost {
  id: number;
  sku: string;
  product_id: number;
  product_name: string;
  spec_info: string;
  purchase_price: number;
  shipping_cost: number;
  handling_cost: number;
  other_cost: number;
  total_cost: number;
  supplier: string;
  stock: number;
  is_active: boolean;
  created_at?: string;
}

// --- 响应式状态 ---
const tableData = ref<ProductCost[]>([])
const loading = ref(false)
const searchText = ref('')
const rangeValue = ref([])
const showDrawer = ref(false)
const IsEdit = ref(false)
const formRef = ref()

const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showJumper: true,
  showPageSize: true,
  size: 'small'
})

const formData = ref({
  id: '',
  sku: '',
  product_id: '',
  product_name: '',
  spec_info: '',
  purchase_price: '',
  shipping_cost: '',
  handling_cost: '',
  other_cost: '',
  total_cost: '',
  supplier: '',
  stock: '',
  is_active: true
})

// --- 表格列定义 (修复 TS 2339 错误的核心：放在顶层作用域) ---
const columns: TableProps['columns'] = [
  { title: 'ID', colKey: 'id', width: 80, align: 'center' },
  { title: '商品信息', colKey: 'productInfo', minWidth: 280 },
  { title: '商品ID', colKey: 'product_id', width: 140 },
  { title: '成本明细', colKey: 'priceInfo', width: 150, align: 'right' },
  { title: '供应商', colKey: 'supplier', width: 150, ellipsis: true },
  { 
    title: '库存', 
    colKey: 'stock', 
    width: 100, 
    align: 'center',
    cell: (h, { row }) => {
      const stock = Number(row.stock)
      const colorClass = stock <= 0 ? 'stock-empty' : (stock < 50 ? 'stock-low' : '')
      return h('span', { class: colorClass }, stock.toLocaleString())
    }
  },
  { title: '状态', colKey: 'statusCell', width: 100, align: 'center' },
  { 
    title: '创建时间', 
    colKey: 'created_at', 
    width: 180,
    cell: (h, { row }) => formatDateTime(row.created_at)
  },
  { title: '操作', colKey: 'op', width: 140, align: 'center', fixed: 'right' }
]

// --- 辅助函数：时间格式化 (YYYY-MM-DD HH:mm:ss) ---
const formatDateTime = (dateString?: string): string => {
  if (!dateString || dateString.startsWith('0001')) return '-'
  const date = new Date(dateString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const handleCopy = (row: ProductCost) => {
  clearForm()
  Object.assign(formData.value, { ...row, id: '' })
  formData.value.product_id = row.product_id.toString()
  formData.value.purchase_price = row.purchase_price.toString()
  formData.value.shipping_cost = row.shipping_cost.toString()
  formData.value.handling_cost = row.handling_cost.toString()
  formData.value.other_cost = row.other_cost.toString()
  formData.value.total_cost = row.total_cost.toString()
  formData.value.stock = row.stock.toString()
  IsEdit.value = false
  showDrawer.value = true
} 

// --- 计算属性：搜索、筛选与排序逻辑 ---
const displayData = computed(() => {
  let list = [...tableData.value]
  
  // 1. 文本搜索
  if (searchText.value.trim()) {
    const term = searchText.value.toLowerCase()
    list = list.filter(item => 
      (item.sku?.toLowerCase().includes(term)) ||
      (item.product_name?.toLowerCase().includes(term)) ||
      (item.supplier?.toLowerCase().includes(term))
    )
  }

  // 2. 日期范围筛选
  if (rangeValue.value && rangeValue.value.length === 2 && rangeValue.value[0]) {
    const start = new Date(rangeValue.value[0] as string).getTime()
    const end = new Date(rangeValue.value[1]! as string).getTime()
    list = list.filter(item => {
      const time = new Date(item.created_at || '').getTime()
      return time >= start && time <= end
    })
  }

  // 3. 排序：按 ID 降序排列
  return list.sort((a, b) => b.id - a.id)
})

// --- 监听成本变化：自动计算总和 ---
watch(
  () => [formData.value.purchase_price, formData.value.shipping_cost, formData.value.handling_cost, formData.value.other_cost],
  () => {
    const p = Number(formData.value.purchase_price) || 0
    const s = Number(formData.value.shipping_cost) || 0
    const h = Number(formData.value.handling_cost) || 0
    const o = Number(formData.value.other_cost) || 0
    formData.value.total_cost = (p + s + h + o).toFixed(2)
  }, { deep: true }
)

// --- 业务逻辑函数 ---
const clearForm = () => {
  formData.value = {
    id: '', sku: '', product_id: '', product_name: '', spec_info: '',
    purchase_price: '', shipping_cost: '', handling_cost: '', other_cost: '',
    total_cost: '', supplier: '', stock: '', is_active: true
  }
  // 关键修复：使用 nextTick 在数据重置后清除表单红字校验
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api.GetCostList() as any
    if (res.code === 200) {
      tableData.value = res.data
      pagination.value.total = res.data.length
    }
  } catch (err) {
    MessagePlugin.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const validateResult = await formRef.value.validate()
  if (validateResult === true) {
    const submitData = {
      ...formData.value,
      id: IsEdit.value ? Number(formData.value.id) : undefined,
      product_id: Number(formData.value.product_id),
      purchase_price: Number(formData.value.purchase_price),
      shipping_cost: Number(formData.value.shipping_cost),
      handling_cost: Number(formData.value.handling_cost),
      other_cost: Number(formData.value.other_cost),
      total_cost: Number(formData.value.total_cost),
      stock: Number(formData.value.stock)
    }

    try {
      if (IsEdit.value) {
        await api.EditCostItem(submitData)
        MessagePlugin.success('数据更新成功')
      } else {
        await api.CreateCostItem(submitData)
        MessagePlugin.success('数据添加成功')
      }
      showDrawer.value = false
      fetchData()
    } catch (err) {
      MessagePlugin.error('提交失败，请检查网络')
    }
  }
}

const handleAdd = () => {
  IsEdit.value = false
  clearForm()
  showDrawer.value = true
}

const handleEdit = (row: ProductCost) => {
  clearForm() // 先清理校验状态
  IsEdit.value = true
  formData.value = {
    ...row,
    id: row.id.toString(),
    product_id: row.product_id.toString(),
    purchase_price: row.purchase_price.toString(),
    shipping_cost: row.shipping_cost.toString(),
    handling_cost: row.handling_cost.toString(),
    other_cost: row.other_cost.toString(),
    total_cost: row.total_cost.toString(),
    stock: row.stock.toString(),
  }
  showDrawer.value = true
}

const handleDelete = (row: ProductCost) => {
  const confirmDialog = DialogPlugin.confirm({
    header: '确认删除',
    body: `确定要永久删除商品 [${row.product_name}] 的成本记录吗？`,
    onConfirm: async () => {
      await api.DeleteCostItem(row.id)
      MessagePlugin.success('删除成功')
      fetchData()
      confirmDialog.destroy()
    }
  })
}

const handlePageChange = (p: any) => {
  pagination.value.current = p.current
  pagination.value.pageSize = p.pageSize
}

const handleSearch = () => { pagination.value.current = 1 }
const refreshData = () => { fetchData(); searchText.value = ''; rangeValue.value = [] }

// --- 校验规则 ---
const rules = {
  sku: [{ required: true, message: '请输入SKU', trigger: 'blur' }],
  product_id: [{ required: true, message: '请输入商品ID', trigger: 'blur' }],
  product_name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  purchase_price: [{ required: true, message: '金额不能为空', trigger: 'blur' }],
  supplier: [{ required: true, message: '请输入供应商', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

onMounted(() => fetchData())
</script>

<style scoped>
/* 核心容器样式 */
.main-container { padding: 24px; background-color: #f5f7fa; min-height: 100vh; }
.header-section { margin-bottom: 20px; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }

/* 标题样式 */
.page-title { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.page-title h1 { font-size: 20px; font-weight: 600; color: #1d2129; margin: 0; }
.record-count { font-size: 13px; color: #86909c; background: #f2f3f5; padding: 4px 10px; border-radius: 4px; }

/* 操作栏样式 */
.action-bar { display: flex; justify-content: space-between; align-items: center; }
.filter-group { display: flex; gap: 16px; }
.action-buttons { display: flex; gap: 12px; }

/* 数据卡片 */
.data-card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }

/* 单元格排版 */
.product-info-cell { line-height: 1.6; }
.product-title { font-weight: 600; color: #1d2129; font-size: 14px; }
.product-sku { font-size: 12px; color: #86909c; font-family: 'SF Mono', 'Courier New', monospace; }
.product-attr { font-size: 12px; color: var(--td-brand-color); }

.price-detail { text-align: right; }
.price-text { font-weight: 700; color: var(--td-error-color); font-size: 16px; font-family: 'Din alternate', 'SF Mono', sans-serif; }
.cost-label { font-size: 12px; color: #86909c; }

.type-tag { border-radius: 4px; font-weight: 500; }

/* 表单内部样式 */
.readonly-input :deep(.t-input) { background-color: #f9fafb; color: var(--td-brand-color); font-weight: 600; }

/* 表格全局修饰 */
.table-actions { display: flex; justify-content: center; gap: 4px; }
:deep(.t-table__header th) { background-color: #f7f8fa; font-weight: 600; color: #4e5969; }
:deep(.t-pagination) { margin-top: 16px; }

/* 库存警示颜色 */
.stock-empty { color: var(--td-error-color); font-weight: bold; }
.stock-low { color: var(--td-warning-color); font-weight: bold; }
</style>