import React, { useState } from 'react';
import {
  Globe2,
  RefreshCw,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react';
import { useTreasury } from '../../context/TreasuryContext';
import { CurrencyCode, FxRate } from '../../types/treasury';
import { convertFx } from '../../services/financialMath';

export const MultiCurrencyView: React.FC = () => {
  const { fxRates, bankAccounts, simulateFxFluctuation } = useTreasury();

  // FX Converter State
  const [calcAmount, setCalcAmount] = useState<number>(1000000);
  const [fromCcy, setFromCcy] = useState<CurrencyCode>('EUR');
  const [toCcy, setToCcy] = useState<CurrencyCode>('USD');

  const currencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'SGD', 'CAD', 'AUD', 'AED', 'INR'];

  const conversion = convertFx(calcAmount, fromCcy, toCcy, fxRates);

  // Group Currency Exposure Analysis
  const currencyExposureMap: Record<string, { totalCash: number; accountCount: number }> = {};
  bankAccounts.forEach((acc) => {
    if (!currencyExposureMap[acc.currency]) {
      currencyExposureMap[acc.currency] = { totalCash: 0, accountCount: 0 };
    }
    currencyExposureMap[acc.currency].totalCash += acc.bookBalance;
    currencyExposureMap[acc.currency].accountCount += 1;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Multi-Currency & Foreign Exchange (FX) Management
          </h1>
          <p className="text-xs text-slate-500">
            Real-time FX spot and forward rate feeds, cross-currency valuation, exposure monitoring, and precision conversion
          </p>
        </div>

        <button
          onClick={simulateFxFluctuation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Simulate FX Rate Feed Tick</span>
        </button>
      </div>

      {/* Live FX Interactive Calculator & Spot Rates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Converter Tool */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-teal-700" />
              <span>Multi-Currency Precision FX Converter</span>
            </h2>
            <p className="text-xs text-slate-500">Calculates direct and cross rates with no float drift</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Source Amount</label>
              <input
                type="number"
                min="1"
                step="1000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 p-2.5 font-mono text-base font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">From Currency</label>
                <select
                  value={fromCcy}
                  onChange={(e) => setFromCcy(e.target.value as CurrencyCode)}
                  className="w-full rounded-md border border-slate-300 p-2 bg-white font-mono font-bold text-slate-900"
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">To Currency</label>
                <select
                  value={toCcy}
                  onChange={(e) => setToCcy(e.target.value as CurrencyCode)}
                  className="w-full rounded-md border border-slate-300 p-2 bg-white font-mono font-bold text-slate-900"
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result Box */}
            <div className="rounded-xl bg-slate-900 text-white p-4 font-mono space-y-2 mt-4">
              <p className="text-[11px] text-teal-400 uppercase tracking-wider font-semibold">
                Conversion Calculation
              </p>
              <div className="text-xl font-bold tracking-tight">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: toCcy }).format(conversion.convertedAmount)}
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 flex justify-between">
                <span>Applied Rate:</span>
                <span className="text-white font-bold">1 {fromCcy} = {conversion.rateUsed} {toCcy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Rates Table */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Foreign Exchange Rate Feed Registry
            </h2>
            <span className="text-xs font-mono text-slate-500">Live Market Feeds</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Pair</th>
                  <th className="px-3 py-2.5 text-right">Spot Rate</th>
                  <th className="px-3 py-2.5 text-right">Bid / Ask</th>
                  <th className="px-3 py-2.5 text-right">24h Change</th>
                  <th className="px-3 py-2.5">Feed Source</th>
                  <th className="px-3 py-2.5">Tenor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                {fxRates.map((rate) => {
                  const isPositive = rate.changePercent >= 0;
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2.5 font-bold text-slate-900">{rate.pair}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">{rate.spotRate}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">
                        {rate.bidRate} / {rate.askRate}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {rate.changePercent}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-sans font-medium text-slate-600">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                          {rate.rateSource}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{rate.tenor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global Currency Exposure Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Group Currency Exposure & Position Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(currencyExposureMap).map(([ccy, data]) => (
            <div key={ccy} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm">{ccy}</span>
                <span className="text-[10px] text-slate-500 font-medium">{data.accountCount} Accounts</span>
              </div>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(data.totalCash)}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                ≈ {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(convertFx(data.totalCash, ccy as any, 'USD', fxRates).convertedAmount)} USD
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
