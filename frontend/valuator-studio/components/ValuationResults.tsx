"use client";

interface ValuationResult {
  final_value: number;
  sales_indicator: number;
  cost_indicator: number;
  income_indicator: number;
}

interface ValuationResultsProps {
  result: ValuationResult | null;
  loading: boolean;
}

export default function ValuationResults({ result, loading }: ValuationResultsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Calculating valuation...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <svg
            className="w-24 h-24 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg font-medium">No valuation yet</p>
          <p className="text-sm mt-2">Enter property details and click Calculate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Valuation Results</h2>

      {/* Final Value - Primary Display */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
        <p className="text-sm font-medium opacity-90 mb-2">Estimated Property Value</p>
        <p className="text-4xl font-bold">{formatCurrency(result.final_value)}</p>
        <p className="text-xs mt-2 opacity-75">
          Weighted average: 40% Sales, 30% Cost, 30% Income
        </p>
      </div>

      {/* Three Approaches Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          Approach Breakdown
        </h3>

        {/* Sales Comparison Approach */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Sales Comparison Approach
            </span>
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              40% Weight
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(result.sales_indicator)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Based on comparable sales with adjustments
          </p>
        </div>

        {/* Cost Approach */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cost Approach
            </span>
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
              30% Weight
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(result.cost_indicator)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Replacement cost minus depreciation
          </p>
        </div>

        {/* Income Approach */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Income Approach
            </span>
            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
              30% Weight
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(result.income_indicator)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gross Rent Multiplier (GRM) method
          </p>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-900 dark:text-white">Methodology:</strong> This valuation 
          employs the Three Approaches to Value standard in professional real estate appraisal. 
          The final estimate is a weighted reconciliation combining market data (Sales Comparison), 
          replacement cost analysis (Cost Approach), and income potential (Income Approach).
        </p>
      </div>
    </div>
  );
}
