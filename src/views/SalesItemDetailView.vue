<template>
    <div class="main-container">
        <!-- 头部区域 -->
        <div class="header-section">
            <div class="page-title">
                <h1>销售明细</h1>
                <span class="record-count">{{ filteredData.length }} 条记录</span>
            </div>

            <div class="action-bar">
                <!-- 搜索框 -->
                <div class="search-container">
                    <t-input v-model="searchKeyword" placeholder="搜索订单号" clearable class="search-input"
                        @enter="handleSearch" @clear="handleClearSearch">
                        <template #prefix-icon>
                            <t-icon name="search" />
                        </template>
                    </t-input>
                </div>

                <!-- 金额过滤 -->
                <div class="filter-container">
                    <t-radio-group v-model="priceFilter" variant="default-filled" size="medium">
                        <t-radio-button value="all">全部订单</t-radio-button>
                        <t-radio-button value="paid">实付大于0</t-radio-button>
                    </t-radio-group>
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                    <t-upload action="http://127.0.0.1:30001/api/sales/execl/upload" theme="custom"
                        :onSuccess="uploadExeclsuccess" :onFail="uploadExeclfail" />
                    <t-button theme="primary" class="action-btn">
                        新建
                    </t-button>
                </div>
            </div>
        </div>

        <!-- 数据表格 -->
        <div class="data-table">
            <t-table row-key="id" :data="filteredData" :columns="columns" :loading="loading" :bordered="false"
                :hover="true" size="medium" :pagination="pagination" @page-change="handlePageChange">
                <!-- 商品信息列 -->
                <template #product="{ row }">
                    <div class="product-info">
                        <div class="product-title">{{ row.product_title }}</div>
                        <div v-if="row.product_attr" class="product-attr">{{ row.product_attr }}</div>
                        <div v-if="row.sku_code" class="product-sku">{{ row.sku_code }}</div>
                    </div>
                </template>

                <!-- 价格列 -->
                <template #price="{ row }">
                    <div class="price-info">
                        <div class="actual-price">¥{{ row.buyer_paid }}</div>
                        <div class="original-price">¥{{ row.product_price }}</div>
                    </div>
                </template>

                <!-- 状态列 -->
                <template #status="{ row }">
                    <div class="status-badge" :class="getStatusClass(row.order_status)">
                        {{ getStatusText(row.order_status) }}
                    </div>
                </template>

                <!-- 操作列 -->
                <template #actions="{ row }">
                    <div class="table-actions">
                        <t-button variant="text" size="small" @click="shipsImmediately(row)">
                            发货
                        </t-button>&nbsp;
                        <t-button variant="text" size="small" @click="handleRefund(row)">
                            退款
                        </t-button>&nbsp;
                        <t-button variant="text" size="small" @click="completeTransaction(row)">
                            完成
                        </t-button>&nbsp;
                        <t-button variant="text" size="small" @click="closeTransaction(row)">
                            关闭
                        </t-button>
                    </div>
                    <div class="table-actions">
                        <t-button variant="text" size="small" @click="showDetail(row)">
                            详情
                        </t-button>&nbsp;
                        <t-button variant="text" size="small" @click="deleteSalesItem(row)">
                            删除
                        </t-button>
                    </div>
                </template>
            </t-table>
        </div>

        <!-- 详情弹窗 -->
        <t-dialog v-model:visible="detailVisible" header="订单详情" :footer="false" width="800px" @close="handleCloseDialog"
            class="detail-dialog">
            <div v-if="currentDetail" class="detail-content">
                <div class="detail-layout">
                    <!-- 左侧信息 -->
                    <div class="detail-left">
                        <div class="detail-section">
                            <h3 class="section-title">订单信息</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">子订单号</span>
                                    <span class="value">{{ currentDetail.sub_order_id }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">主订单号</span>
                                    <span class="value">{{ currentDetail.main_order_id }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">商品ID</span>
                                    <span class="value">{{ currentDetail.product_id }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">SKU编码</span>
                                    <span class="value">{{ currentDetail.sku_code || '-' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">套餐信息：{{ currentDetail.meal_info || "无" }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">卖家备注：{{ currentDetail.seller_remark || "无" }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h3 class="section-title">商品信息</h3>
                            <div class="info-item">
                                <span class="label">商品标题：</span>
                                <span class="value">{{ currentDetail.product_title }}</span>
                            </div>
                            <div v-if="currentDetail.product_attr" class="info-item">
                                <span class="label">商品规格：</span>
                                <span class="value">{{ currentDetail.product_attr }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">购买数量：{{ currentDetail.quantity }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧信息 -->
                    <div class="detail-right">
                        <div class="detail-section">
                            <h3 class="section-title">金额信息</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">商品标价：¥{{ currentDetail.product_price }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">实付金额：¥{{ currentDetail.buyer_paid }}</span>
                                </div>
                                <div v-if="currentDetail.refund_amount > 0" class="info-item">
                                    <span class="label">退款金额：¥{{ currentDetail.refund_amount }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h3 class="section-title">状态信息</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">订单状态</span>
                                    <t-tag :theme="getStatusTagTheme(currentDetail.order_status)" size="small">
                                        {{ currentDetail.order_status }}
                                    </t-tag>
                                </div>
                                <div class="info-item">
                                    <span class="label">退款状态</span>
                                    <span class="value">{{ currentDetail.refund_status }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h3 class="section-title">时间信息</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">下单时间：{{ formatDate(currentDetail.order_create_time) }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">支付时间：{{ formatDate(currentDetail.order_pay_time) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </t-dialog>
    </div>

    <t-dialog v-model:visible="refundDialogVisible" header="退款" placement="center" width="400px" confirmBtn="退款"
        :onConfirm="refundSubmit" @close="handleCloseRefundDialog" class="refund-dialog">
        <t-input label="退款金额：" suffix="元" type="number" v-model="refundAmountInput" />
    </t-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import type { PrimaryTableCol, PageInfo } from 'tdesign-vue-next';
import api from '../api/api';

// 定义数据类型
interface SalesItem {
    id: number;
    sub_order_id: string;
    main_order_id: string;
    product_title: string;
    meal_info?: string;
    product_price: number;
    quantity: number;
    product_attr?: string;
    order_status: string;
    sku_code?: string;
    buyer_paid: number;
    refund_status: string;
    refund_amount: number;
    order_create_time: string;
    order_pay_time: string;
    product_id: string;
    seller_remark?: string;
    created_at: string;
    updated_at: string;
}

// 响应式数据
const tableData = ref<SalesItem[]>([]);
const loading = ref(false);
const searchKeyword = ref('');
const detailVisible = ref(false);
const currentDetail = ref<SalesItem | null>(null);
const priceFilter = ref<'all' | 'paid'>('all');
const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0,
    showJumper: true,
    showPageSize: true,
    pageSizeOptions: [10, 20, 50, 100],
});

// 表格列定义
const columns: PrimaryTableCol<SalesItem>[] = [
    {
        title: '订单号',
        colKey: 'sub_order_id',
        width: 200,
    },
    {
        title: '商品信息',
        colKey: 'product',
        width: 300,
    },
    {
        title: '金额',
        colKey: 'price',
        width: 120,
        align: 'right',
    },
    {
        title: '数量',
        colKey: 'quantity',
        width: 80,
        align: 'center',
    },
    {
        title: '状态',
        colKey: 'status',
        width: 100,
        align: 'center',
    },
    {
        title: '下单时间',
        colKey: 'order_create_time',
        width: 180,
        cell: (h, { row }) => formatDate(row.order_create_time),
    },
    {
        title: '操作',
        colKey: 'actions',
        width: 180,
        align: 'center',
        fixed: 'right',
    },
];

/**
 * 过滤并排序后的数据
 * 包含：搜索过滤、金额过滤、以及【下单时间倒序排序】
 */
const filteredData = computed(() => {
    // 1. 获取基础数据副本（防止直接修改原数组）
    let data = [...tableData.value];

    // 2. 搜索过滤
    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.toLowerCase();
        data = data.filter(item =>
            item.sub_order_id.toLowerCase().includes(keyword) ||
            item.main_order_id.toLowerCase().includes(keyword)
        );
    }

    // 3. 金额过滤
    if (priceFilter.value === 'paid') {
        data = data.filter(item => item.buyer_paid > 0);
    }

    // 4. 下单时间排序（新的订单在前面）
    data.sort((a, b) => {
        const dateA = new Date(a.order_create_time).getTime();
        const dateB = new Date(b.order_create_time).getTime();
        return dateB - dateA; // 降序排列
    });

    return data;
});

// 状态处理函数
const getStatusText = (status: string) => {
    const map: Record<string, string> = {
        '买家已付款': '待发货',
        '已发货': '已发货',
        '交易成功': '已完成',
        '交易关闭': '已关闭',
    };

    for (const [key, value] of Object.entries(map)) {
        if (status.includes(key)) return value;
    }
    return status;
};

const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
        '买家已付款': 'status-pending',
        '已发货': 'status-warning',
        '交易成功': 'status-success',
        '交易关闭': 'status-default',
    };

    for (const [key, value] of Object.entries(map)) {
        if (status.includes(key)) return value;
    }
    return 'status-default';
};

const getStatusTagTheme = (status: string) => {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'default'> = {
        '买家已付款': 'primary',
        '已发货': 'warning',
        '交易成功': 'success',
        '交易关闭': 'default',
    };

    for (const [key, value] of Object.entries(map)) {
        if (status.includes(key)) return value;
    }
    return 'primary';
};

/**
 * 日期格式化
 * 解决 UTC 时区显示不一致的问题（2026-02-07T22:19:40Z -> 2026-02-08 06:19:40）
 */
const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    // 直接操作字符串，不进行 Date 对象转换
    // 假设输入是 "2026-02-08T21:10:10Z" 或 "2026-02-08 21:10:10+00"
    let formatted = dateString
        .replace('T', ' ')    // 把中间的 T 换成空格
        .replace('Z', '')    // 去掉结尾的 Z
        .split('.')[0]!       // 去掉毫秒（如果有的话）
        .split('+')[0];      // 去掉时区偏移量（如 +00:00）

    return formatted; // 结果直接就是 "2026-02-08 21:10:10"
};

// 弹窗操作
const showDetail = (row: SalesItem) => {
    currentDetail.value = row;
    detailVisible.value = true;
};

const handleCloseDialog = () => {
    detailVisible.value = false;
    setTimeout(() => {
        currentDetail.value = null;
    }, 300);
};

// 搜索操作
const handleSearch = () => {
    if (!searchKeyword.value.trim()) {
        MessagePlugin.warning('请输入订单号');
        return;
    }
};

const handleClearSearch = () => {
    searchKeyword.value = '';
};

// 分页处理
const handlePageChange = (pageInfo: PageInfo) => {
    pagination.value.current = pageInfo.current;
    pagination.value.pageSize = pageInfo.pageSize;
    pagination.value.total = filteredData.value.length;
};

// 获取数据
const fetchData = async () => {
    try {
        loading.value = true;
        const response = await api.GetSalesItemDetailList();

        if (response && response.data) {
            if (response.data.code === 200 && response.data.data) {
                tableData.value = response.data.data;
            } else if (Array.isArray(response.data)) {
                tableData.value = response.data;
            } else if (response.data.code === 200 && Array.isArray(response.data.data)) {
                tableData.value = response.data.data;
            } else {
                tableData.value = [];
            }
        } else if (Array.isArray(response)) {
            tableData.value = response;
        } else {
            tableData.value = [];
        }

        pagination.value.total = tableData.value.length;

    } catch (error) {
        console.error('获取数据失败:', error);
        MessagePlugin.error('获取数据失败');
        pagination.value.total = tableData.value.length;
    } finally {
        loading.value = false;
    }
};

const refundDialogVisible = ref(false);
const refundOrderId = ref('');
const refundAmountInput = ref(0);

const handleCloseRefundDialog = () => {
    refundDialogVisible.value = false;
};

const handleRefund = (row: SalesItem) => {
    refundAmountInput.value = 0;
    refundOrderId.value = row.sub_order_id;
    refundDialogVisible.value = true;
};

const refundSubmit = () => {
    refundAmount(refundOrderId.value, refundAmountInput.value);
    refundDialogVisible.value = false;
}

const refundAmount = async (sub_order_id: string, amount: number) => {
    if (amount <= 0) {
        MessagePlugin.warning('无可退款金额');
        return;
    }
    try {
        await api.RefundAmount(sub_order_id, amount);
        MessagePlugin.success(`订单 ${sub_order_id} 已退款 ¥${amount}`);
        fetchData();
    } catch (error) {
        MessagePlugin.error('退款失败');
    }
};

const uploadExeclsuccess = () => {
    MessagePlugin.success('导入成功');
    fetchData();
};

const uploadExeclfail = () => {
    MessagePlugin.error('导入失败');
};

const shipsImmediately = async (row: SalesItem) => {
    try {
        await api.ShipsImmediately(row.sub_order_id);
        MessagePlugin.success(`订单 ${row.sub_order_id} 已发货`);
        fetchData();
    } catch (error) {
        MessagePlugin.error('发货失败');
    }
};

const closeTransaction = async (row: SalesItem) => {
    try {
        await api.CloseTransaction(row.sub_order_id);
        MessagePlugin.success(`订单 ${row.sub_order_id} 已关闭`);
        fetchData();
    } catch (error) {
        MessagePlugin.error('关闭交易失败');
    }
};

const completeTransaction = async (row: SalesItem) => {
    try {
        await api.CompleteTransaction(row.sub_order_id);
        MessagePlugin.success(`订单 ${row.sub_order_id} 已完成`);
        fetchData();
    } catch (error) {
        MessagePlugin.error('完成交易失败');
    }
};

const deleteSalesItem = async (row: SalesItem) => {
    try {
        await api.DeleteSalesItem(row.sub_order_id);
        MessagePlugin.success(`订单 ${row.sub_order_id} 已删除`);
        fetchData();
    } catch (error) {
        MessagePlugin.error('删除订单失败');
    }
};

onMounted(() => {
    fetchData();
});
</script>

<style scoped>
.main-container {
    padding: 20px;
    background-color: #f5f7fa;
    min-height: 100vh;
}

/* 头部区域 */
.header-section {
    margin-bottom: 20px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.page-title h1 {
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
    margin: 0;
}

.record-count {
    font-size: 14px;
    color: #86909c;
    background: #f2f3f5;
    padding: 4px 8px;
    border-radius: 4px;
}

.action-bar {
    display: flex;
    align-items: center;
    gap: 16px;
}

.search-container {
    flex: 1;
    max-width: 300px;
}

.search-input {
    border-radius: 6px;
}

.filter-container {
    flex-shrink: 0;
}

.action-buttons {
    display: flex;
    gap: 12px;
}

.action-btn {
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 数据表格 */
.data-table {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.t-table) {
    border: none;
}

:deep(.t-table__header) {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
}

:deep(.t-table__header th) {
    font-weight: 500;
    color: #333;
    padding: 12px 16px;
    border: none;
    font-size: 14px;
}

:deep(.t-table__cell) {
    padding: 12px 16px;
    border: none;
    color: #333;
    font-size: 14px;
}

:deep(.t-table__body tr) {
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s;
}

:deep(.t-table__body tr:hover) {
    background: #fafafa;
}

/* 自定义单元格样式 */
.product-info {
    line-height: 1.4;
}

.product-title {
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
    font-size: 14px;
}

.product-attr {
    font-size: 12px;
    color: #666;
    margin-bottom: 2px;
}

.product-sku {
    font-size: 12px;
    color: #999;
    font-family: 'SF Mono', monospace;
}

.price-info {
    text-align: right;
}

.actual-price {
    font-weight: 600;
    color: #f60;
    font-size: 14px;
}

.original-price {
    font-size: 12px;
    color: #999;
    text-decoration: line-through;
    margin-top: 2px;
}

.status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-pending {
    background: #e6f7ff;
    color: #1890ff;
}

.status-success {
    background: #f6ffed;
    color: #52c41a;
}

.status-warning {
    background: #fff7e6;
    color: #fa8c16;
}

.status-default {
    background: #fafafa;
    color: #999;
}

.table-actions {
    display: flex;
    justify-content: center;
}

:deep(.t-button--variant-text) {
    padding: 0;
    height: auto;
}

/* 详情弹窗 */
.detail-dialog :deep(.t-dialog) {
    border-radius: 8px;
    overflow: hidden;
}

.detail-dialog :deep(.t-dialog__header) {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    background: #fff;
}

.detail-dialog :deep(.t-dialog__body) {
    padding: 0;
    max-height: none !important;
}

.detail-content {
    padding: 0;
    background: #fff;
}

.detail-layout {
    display: flex;
    gap: 15px;
    max-height: 70vh;
    padding: 20px;
    overflow: hidden;
}

.detail-left,
.detail-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    padding-right: 8px;
}

.detail-section {
    background: #fafafa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #f0f0f0;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e8e8e8;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.info-item .label {
    font-size: 12px;
    color: #666;
}

.info-item .value {
    font-size: 12px;
    color: #333;
    word-break: break-all;
    line-height: 1.4;
}

/* 分页样式 */
:deep(.t-pagination) {
    padding: 16px;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
}

/* 滚动条 */
.detail-left::-webkit-scrollbar,
.detail-right::-webkit-scrollbar {
    width: 6px;
}

.detail-left::-webkit-scrollbar-thumb,
.detail-right::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}
</style>