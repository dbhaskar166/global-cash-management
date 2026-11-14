import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: (row: T) => string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  exportFileName?: string;
  actions?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  searchPlaceholder = 'Filter records...',
  searchKey,
  pageSize = 10,
  onRowClick,
  exportFileName = 'treasury_export',
  actions,
  emptyMessage = 'No financial records found matching current criteria.',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      if (searchKey) {
        return searchKey(row).toLowerCase().includes(term);
      }
      return Object.values(row as Record<string, unknown>).some((val) =>
        String(val || '').toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = (a as Record<string, unknown>)[sortKey];
      const valB = (b as Record<string, unknown>)[sortKey];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA || '');
      const strB = String(valB || '');
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const exportCsv = () => {
    if (!data.length) return;
    const headers = columns.map((c) => c.header).join(',');
    const rows = sortedData.map((row) =>
      columns
        .map((c) => {
          const val = (row as Record<string, unknown>)[c.key];
          const clean = String(val ?? '').replace(/"/g, '""');
          return `"${clean}"`;
        })
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white shadow-xs">
      {/* Table Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-navy-600/20 focus:border-slate-400 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Surface */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 select-none ${col.className || ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="text-slate-400">
                        {sortKey === col.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-800" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-800" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id ? String(row.id) : idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40'
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-2.5 whitespace-nowrap ${col.className || ''}`}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
        <div>
          Showing{' '}
          <span className="font-medium text-slate-900">
            {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-medium text-slate-900">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </span>{' '}
          of <span className="font-medium text-slate-900">{sortedData.length}</span> entries
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
