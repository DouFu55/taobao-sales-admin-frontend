export interface ReportData {
  report_date: string;
  sales_summary: {
    total_amount: number;
    net_amount: number;
    order_count: number;
    item_count: number;
    avg_order_value: number;
    refund_amount: number;
    refund_count: number;
  };
  cost_summary: {
    product_cost: number;
    shipping_cost: number;
    handling_cost: number;
    other_cost: number;
    total_cost: number;
  };
  expense_summary: {
    promotion_expenses: number;
    other_expenses: number;
    total_expenses: number;
  };
  profit_analysis: {
    gross_profit: number;
    operating_profit: number;
    net_profit: number;
    gross_margin: string;
    net_margin: string;
  };
}