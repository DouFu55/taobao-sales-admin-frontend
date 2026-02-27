import api from '../utils/require'
export default{
    GetSalesItemDetailList(){
        return api.get('/api/sales')
    },
    ShipsImmediately(sub_order_id: string){
        return api.get('/api/sales/ship?soid=' + sub_order_id)
    },
    // 交易关闭
    CloseTransaction(sub_order_id: string){
        return api.get('/api/sales/close?soid=' + sub_order_id)
    },
    // 交易完成
    CompleteTransaction(sub_order_id: string){
        return api.get('/api/sales/complete?soid=' + sub_order_id)
    },
    // 删除子订单
    DeleteSalesItem(sub_order_id: string){
        return api.delete('/api/sales/delete?soid=' + sub_order_id)
    },
    // 获取成本列表
    GetCostList(){
        return api.get('/api/product/cost')
    },
    // 创建成本项
    CreateCostItem(data: any){
        return api.post('/api/product/cost', data)
    },
    // 删除成本项
    DeleteCostItem(id: number){
        return api.delete('/api/product/cost?id=' + id)
    },
    // 编辑成本项
    EditCostItem(data: any){
        return api.put('/api/product/cost', data)
    },
    // 获取推广支出
    GetPromotionList(){
        return api.get('/api/product/promotion')
    },
    // 创建推广支出
    CreatePromotionItem(data: any){
        return api.post('/api/product/promotion', data)
    },
    // 编辑推广支出
    EditPromotionItem(data: any){
        return api.put('/api/product/promotion', data)
    },
    // 删除推广支出
    DeletePromotionItem(id: number){
        return api.delete('/api/product/promotion?id=' + id)
    },
    // 获取其他支出
    GetOtherExpenseList(){
        return api.get('/api/product/otherexpense')
    },
    // 创建其他支出
    CreateOtherExpenseItem(data: any){
        return api.post('/api/product/otherexpense', data)
    },
    // 编辑其他支出
    EditOtherExpenseItem(data: any){
        return api.put('/api/product/otherexpense', data)
    },
    // 删除其他支出
    DeleteOtherExpenseItem(id: number){
        return api.delete('/api/product/otherexpense?id=' + id)
    },
    // 获取日报
    GetDailyReport(date: string){
        return api.get('/api/report/daily?date=' + date)
    },
    // 获取月报
    GetMonthlyReport(month: string){
        return api.get('/api/report/monthly?month=' + month)
    },
    // 获取年报
    GetYearlyReport(year: string){
        return api.get('/api/report/yearly?year=' + year)
    },
    // 获取自定义报表
    GetCustomReport(start_date: string, end_date: string){
        return api.get('/api/report/range?start_date=' + start_date + '&end_date=' + end_date)
    },
    // 退款退款金额
    RefundAmount(sub_order_id: string, amount: number){
        return api.get('/api/sales/refund?soid=' + sub_order_id + '&amount=' + amount)
    }  
}