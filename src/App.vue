<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { ChartBarIcon, SystemSettingIcon, DataIcon, DashboardIcon } from 'tdesign-icons-vue-next'

const route = useRoute()

// 核心逻辑：获取当前路由的路径，用于匹配菜单的 value
const activeMenu = computed(() => {
  return route.path
})
</script>

<template>
  <t-layout class="app-layout">
    <t-aside class="app-aside">

      <!-- 将 default-value 换成 :value 绑定计算属性 -->
      <t-menu expand-mutex :value="activeMenu" theme="light" style="margin-right: 50px" height="100%">
        <template #logo>
          <p class="aside-title">数据报表</p>
        </template>
        
        <!-- 将 value 修改为对应的路由路径，以便自动高亮 -->
        <t-menu-item value="/dashboard" to="/dashboard">
          <template #icon>
            <dashboard-icon :fill-color='"transparent"' :stroke-color='"currentColor"' :stroke-width="2.5"/>
          </template>
          仪表盘
        </t-menu-item>

        <!-- 保留原始注释部分 -->
        <!-- <t-submenu value="2">
          <template #icon>
            <chart-bar-icon :fill-color='"transparent"' :stroke-color='"currentColor"' :stroke-width="2.5" />
          </template>
          <template #title>
            <span>数据报表</span>
          </template>
          <t-menu-item value="2-1" title="日数据">今日数据</t-menu-item>
          <t-menu-item value="2-2" title="月数据">本月数据</t-menu-item>
          <t-menu-item value="2-3" title="年数据">本年数据</t-menu-item>
        </t-submenu> -->

        <t-submenu value="3">
          <template #icon>
            <data-icon :fill-color='"transparent"' :stroke-color='"currentColor"' :stroke-width="2.5" />
          </template>
          <template #title>
            <span>数据信息</span>
          </template>
          <!-- 将 value 修改为与 to 属性一致 -->
          <t-menu-item value="/sales/item-detail" title="商品销售明细" to="/sales/item-detail">商品销售明细</t-menu-item>
          <t-menu-item value="/product/costs" title="商品成本管理" to="/product/costs">商品成本管理</t-menu-item>
          <t-menu-item value="/promotion/management" title="推广支出管理" to="/promotion/management">推广支出管理</t-menu-item>
          <t-menu-item value="/other-expense" title="其他支出管理" to="/other-expense">其他支出管理</t-menu-item>
        </t-submenu>

        <!-- 保留原始注释部分 -->
        <!-- <t-menu-item value="4">
          <template #icon>
            <system-setting-icon :fill-color='"transparent"' :stroke-color='"currentColor"' :stroke-width="2.5" />
          </template>
          设置
        </t-menu-item> -->
      </t-menu>
    </t-aside>
    <t-layout class="app-main-layout">
      <t-content class="app-content">
        <RouterView />
      </t-content>
      <t-footer class="app-footer">Copyright @ 2019-{{ new Date().getFullYear() }} Tusi. All Rights
        Reserved</t-footer>
    </t-layout>
  </t-layout>
</template>

<style></style>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>

<style scoped>
.app-layout {
  height: 100%;
}

.app-aside {
  height: 100%;
}

.aside-title{
  text-align: center;
  font-size: 28px;
  padding: 20px 0;
}

.app-main-layout {
  height: 100%;
  flex: 1;
}

.app-content {
  height: calc(100% - 20px);
  overflow: auto;
  background: #fff;
}

.app-footer {
  height: 10px;
  line-height: 10px;
  text-align: center;
  display: none;
}
</style>