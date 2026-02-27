<template>
  <div class="report-container">
    <!-- 顶部控制栏 -->
    <t-card :bordered="false" class="header-card shadow-sm">
      <div class="header-content">
        <div class="title-info">
          <h1>财务报表分析</h1>
          <t-tag variant="light-outline" theme="primary" v-if="reportData?.report_date">
            报告期：{{ reportData.report_date }}
          </t-tag>
        </div>

        <!-- 日期选择器 (左侧) -->
        <div class="date-picker-box">
          <t-date-picker v-if="['day', 'yesterday'].includes(activeTab)" v-model="selectedDate" @change="loadData" />
          <t-date-picker v-if="activeTab === 'month'" v-model="selectedMonth" mode="month" @change="loadData" />
          <t-date-picker v-if="activeTab === 'year'" v-model="selectedYear" mode="year" @change="loadData" />
          <t-date-range-picker v-if="['week', 'lastWeek', 'custom'].includes(activeTab)" v-model="selectedRange" allow-input @change="loadData" />
        </div>

        <!-- 快捷切换 -->
        <t-radio-group variant="default-filled" v-model="activeTab" @change="handleTabChange">
          <t-radio-button value="yesterday">昨日</t-radio-button>
          <t-radio-button value="day">今日</t-radio-button>
          <t-radio-button value="week">本周</t-radio-button>
          <t-radio-button value="lastWeek">上周</t-radio-button>
          <t-radio-button value="month">本月</t-radio-button>
          <t-radio-button value="year">全年</t-radio-button>
          <t-radio-button value="custom">自定义</t-radio-button>
        </t-radio-group>

        <t-button theme="primary" ghost @click="loadData">
          <template #icon><t-icon name="refresh" /></template>刷新
        </t-button>
      </div>
    </t-card>

    <!-- 第一层：顶层财务核心指标 -->
    <t-row :gutter="[16, 16]">
      <t-col :xs="12" :sm="6" :xl="3" v-for="(item, index) in summaryCards" :key="index">
        <t-card :title="item.title" :bordered="false" class="stat-card main-stat">
          <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
          <div class="stat-desc" v-html="item.desc"></div>
        </t-card>
      </t-col>
    </t-row>

    <!-- 第二层：图表 + 经营明细 (左右对齐) -->
    <t-row :gutter="[16, 16]" class="mt-16 content-main-row">
      <!-- 左侧：图表 + 经营表现卡片 -->
      <t-col :span="8" class="flex-column">
        <!-- 图表 -->
        <t-card title="收支对比分析" :bordered="false" class="chart-card">
          <div ref="chartRef" style="height: 380px; width: 100%"></div>
        </t-card>

        <!-- 新增：从明细中提取的经营表现卡片 (填充下方空白) -->
        <t-row :gutter="[16, 16]" class="mt-16">
          <t-col :span="4" v-for="(card, idx) in operationCards" :key="idx">
            <t-card :bordered="false" class="op-stat-card shadow-sm">
              <div class="op-title">{{ card.title }}</div>
              <div class="op-value">{{ card.value }}</div>
              <div class="op-footer" v-html="card.footer"></div>
            </t-card>
          </t-col>
        </t-row>
      </t-col>

      <!-- 右侧：成本明细列表 -->
      <t-col :span="4">
        <t-card title="成本与费用明细" :bordered="false" class="full-height-card detail-card shadow-sm">
          <div class="margin-box mb-16">
            <div class="margin-item">
              <span class="label">毛利率</span>
              <span class="value">{{ reportData?.profit_analysis.gross_margin || '0%' }}</span>
            </div>
            <div class="margin-item">
              <span class="label">净利率</span>
              <span class="value" :class="{'text-danger': parseFloat(reportData?.profit_analysis.net_margin) < 0}">
                {{ reportData?.profit_analysis.net_margin || '0%' }}
              </span>
            </div>
          </div>

          <div class="detail-list">
            <div v-for="(val, key) in costItems" :key="key" class="detail-row">
              <span class="detail-label">{{ key }}</span>
              <span class="detail-value" :class="{'text-danger': key.includes('退款') || (typeof val === 'number' && val < 0)}">
                 {{ typeof val === 'number' ? '¥' + formatTruncate(val) : val }}
              </span>
            </div>
          </div>
        </t-card>
      </t-col>
    </t-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Icon as TIcon } from 'tdesign-icons-vue-next';
import api from '../api/api';

dayjs.extend(isoWeek);

const formatTruncate = (num: any): string => {
  if (num === undefined || num === null || num === '') return '0.00';
  const val = Number(num);
  const sign = val < 0 ? -1 : 1;
  const absVal = Math.abs(val);
  const truncated = Math.floor(absVal * 100) / 100;
  return (truncated * sign).toFixed(2);
};

const activeTab = ref('month');
const reportData = ref<any>(null);
const chartRef = ref<HTMLElement | null>(null);
let myChart: echarts.ECharts | null = null;
const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const selectedMonth = ref(dayjs().format('YYYY-MM'));
const selectedYear = ref(dayjs().format('YYYY'));
const selectedRange = ref<string[]>([]);

// 基础计算
const refundRate = computed(() => {
  const refund = reportData.value?.sales_summary.refund_amount || 0;
  const total = reportData.value?.sales_summary.total_amount || 0;
  return total === 0 ? '0.00' : formatTruncate((refund / total) * 100);
});

const roiMetrics = computed(() => {
  const totalSales = reportData.value?.sales_summary.total_amount || 0;
  const netSales = reportData.value?.sales_summary.net_amount || 0;
  const promoExpense = reportData.value?.expense_summary.promotion_expenses || 0;
  const marginRate = parseFloat((reportData.value?.profit_analysis.gross_margin || "0").replace('%', '')) / 100;
  return {
    roi: promoExpense > 0 ? (totalSales / promoExpense).toFixed(2) : '0.00',
    netRoi: promoExpense > 0 ? (netSales / promoExpense).toFixed(2) : '0.00',
    breakEvenRoi: marginRate > 0 ? (1 / marginRate).toFixed(2) : '0.00'
  };
});

// 1. 顶层卡片
const summaryCards = computed(() => [
  { 
    title: '销售总额', 
    value: `¥${formatTruncate(reportData.value?.sales_summary.total_amount)}`, 
    desc: `订单数: ${reportData.value?.sales_summary.order_count || 0} 单`, 
    color: '#0052D9' 
  },
  { 
    title: '有效净销售额', 
    value: `¥${formatTruncate(reportData.value?.sales_summary.net_amount)}`, 
    desc: `退款: <span style="color:#d54941">¥${formatTruncate(reportData.value?.sales_summary.refund_amount)}</span>`, 
    color: '#2BA471' 
  },
  { 
    title: '净利润表现', 
    value: `¥${formatTruncate(reportData.value?.profit_analysis.net_profit)}`, 
    desc: `毛利: ¥${formatTruncate(reportData.value?.profit_analysis.gross_profit)}`, 
    color: (reportData.value?.profit_analysis.net_profit >= 0) ? '#2BA471' : '#D54941'
  },
  { 
    title: '总支出 (含成本+费用)', 
    value: `¥${formatTruncate( (reportData.value?.expense_summary.total_expenses || 0) + (reportData.value?.cost_summary.total_cost || 0) )}`, 
    desc: `物流/包装: ¥${formatTruncate((reportData.value?.cost_summary.shipping_cost||0)+(reportData.value?.cost_summary.handling_cost||0))}`, 
    color: '#E37318' 
  },
]);

// 2. 经营表现卡片 (从原明细中提取)
const operationCards = computed(() => [
  { 
    title: '推广投产比 (ROI)', 
    value: roiMetrics.value.roi, 
    footer: `净 ROI: <b style="color:#0052d9">${roiMetrics.value.netRoi}</b>` 
  },
  { 
    title: '保本 ROI 线', 
    value: roiMetrics.value.breakEvenRoi, 
    footer: `当前退款率: <b style="color:#ed7b14">${refundRate.value}%</b>` 
  },
  { 
    title: '销售规模', 
    value: (reportData.value?.sales_summary.item_count || 0) + ' 件', 
    footer: `客单价: <b>¥${formatTruncate(reportData.value?.sales_summary.avg_order_value)}</b>` 
  }
]);

// 3. 右侧精简成本明细
const costItems = computed(() => ({
  "产品采购成本": reportData.value?.cost_summary.product_cost || 0,
  "物流运费支出": reportData.value?.cost_summary.shipping_cost || 0,
  "包装操作成本": reportData.value?.cost_summary.handling_cost || 0,
  "平台推广费用": reportData.value?.expense_summary.promotion_expenses || 0,
  "其他经营支出": reportData.value?.expense_summary.other_expenses || 0,
  "销售退款金额": reportData.value?.sales_summary.refund_amount || 0,
  "退款订单数量": (reportData.value?.sales_summary.refund_count || 0) + ' 单',
}));

// 逻辑处理
const handleTabChange = (val: any) => {
  const now = dayjs();
  if (val === 'yesterday') selectedDate.value = now.subtract(1, 'day').format('YYYY-MM-DD');
  else if (val === 'day') selectedDate.value = now.format('YYYY-MM-DD');
  else if (val === 'week') selectedRange.value = [now.startOf('isoWeek').format('YYYY-MM-DD'), now.endOf('isoWeek').format('YYYY-MM-DD')];
  else if (val === 'lastWeek') {
    const lw = now.subtract(1, 'week');
    selectedRange.value = [lw.startOf('isoWeek').format('YYYY-MM-DD'), lw.endOf('isoWeek').format('YYYY-MM-DD')];
  }
  else if (val === 'month') selectedMonth.value = now.format('YYYY-MM');
  else if (val === 'year') selectedYear.value = now.format('YYYY');
  loadData();
};

const loadData = async () => {
  try {
    let res: any;
    if (['day', 'yesterday'].includes(activeTab.value)) res = await api.GetDailyReport(selectedDate.value);
    else if (activeTab.value === 'month') res = await api.GetMonthlyReport(selectedMonth.value);
    else if (activeTab.value === 'year') res = await api.GetYearlyReport(selectedYear.value);
    else res = await api.GetCustomReport(selectedRange.value[0]!, selectedRange.value[1]!);

    const result = res?.code ? res : res?.data;
    if (result?.code === 200) {
      reportData.value = result.data;
      nextTick(() => renderChart());
    }
  } catch (e) { console.error(e); }
};

const renderChart = () => {
  if (!chartRef.value || !reportData.value) return;
  if (!myChart) myChart = echarts.init(chartRef.value);
  const data = reportData.value;
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: '10%', left: '3%', right: '3%', bottom: '8%', containLabel: true },
    xAxis: { type: 'category', data: ['净销售', '采购成本', '推广支出', '其他支出', '净利润'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar', barWidth: '40%',
      data: [
        { value: data.sales_summary.net_amount, itemStyle: { color: '#0052D9' } },
        { value: data.cost_summary.product_cost, itemStyle: { color: '#ED7B14' } },
        { value: data.expense_summary.promotion_expenses, itemStyle: { color: '#BE5A29' } },
        { value: data.expense_summary.other_expenses, itemStyle: { color: '#86909C' } },
        { value: data.profit_analysis.net_profit, itemStyle: { color: data.profit_analysis.net_profit >= 0 ? '#00A870' : '#D54941' } },
      ],
      label: { show: true, position: 'top', formatter: (p: any) => '¥' + formatTruncate(p.value) }
    }]
  };
  myChart.setOption(option);
};

onMounted(() => { loadData(); window.addEventListener('resize', () => myChart?.resize()); });
</script>

<style scoped>
.report-container { padding: 24px; background-color: #f3f5f8; min-height: 100vh; }
.header-card { margin-bottom: 16px; border-radius: 8px; }
.header-content { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.title-info { display: flex; align-items: center; gap: 12px; margin-right: auto; }
.title-info h1 { font-size: 20px; font-weight: 600; margin: 0; }
.date-picker-box { min-width: 220px; }

/* 顶层大卡片 */
.main-stat { border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.stat-value { font-size: 30px; font-weight: bold; margin: 8px 0; font-family: 'Din Alternate', sans-serif; }
.stat-desc { font-size: 13px; color: #86909c; }

/* 中间层：图表与明细 */
.content-main-row { display: flex; align-items: stretch; }
.chart-card { border-radius: 8px; flex: 1; }

/* 经营表现卡片 (填充图表下方) */
.op-stat-card { padding: 16px; border-radius: 8px; text-align: center; background: #fff; height: 100%; transition: transform 0.2s; }
.op-stat-card:hover { transform: translateY(-3px); }
.op-title { font-size: 13px; color: #86909c; margin-bottom: 8px; }
.op-value { font-size: 22px; font-weight: 800; color: #1d2129; margin-bottom: 4px; font-family: 'Din Alternate', sans-serif;}
.op-footer { font-size: 12px; color: #4e5969; }

/* 右侧明细 */
.detail-card { border-radius: 8px; height: 100%; }
.margin-box { display: flex; justify-content: space-around; background: #f0f4ff; padding: 14px; border-radius: 8px; border: 1px solid #d0e1ff; }
.margin-item { text-align: center; }
.margin-item .label { display: block; font-size: 12px; color: #4e5969; }
.margin-item .value { font-size: 18px; font-weight: bold; color: #0052D9; }

.detail-row { display: flex; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #f0f2f5; }
.detail-label { font-size: 15px; color: #4e5969; }
.detail-value { font-size: 16px; font-weight: 700; font-family: 'SFMono-Regular', monospace; }

.text-danger { color: #d54941 !important; }
.mt-16 { margin-top: 16px; }
.mb-16 { margin-bottom: 16px; }
.shadow-sm { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.flex-column { display: flex; flex-direction: column; }
</style>