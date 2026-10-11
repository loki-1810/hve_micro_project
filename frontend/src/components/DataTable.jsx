import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';

export default function DataTable({ columns = [], rows = [], pageSize = 10, title = 'Dataset Records' }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Filter rows based on search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
      })
    );
  }, [rows, columns, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, safeCurrentPage, rowsPerPage]);

  return (
    <div style={{ width: '100%' }}>
      {/* Table Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {title}
          </span>
          <span className="badge badge-neutral">
            {filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search table values..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input"
              style={{ paddingLeft: '2rem', height: '32px', fontSize: '0.8rem', width: '200px' }}
            />
          </div>

          {/* Rows per page selector */}
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="form-select"
            style={{ height: '32px', fontSize: '0.8rem', width: 'auto', padding: '0 0.5rem' }}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '48px', color: 'var(--text-muted)' }}>#</th>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => {
                const globalIndex = (safeCurrentPage - 1) * rowsPerPage + idx + 1;
                return (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {globalIndex}
                    </td>
                    {columns.map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined || val === '' || val === 'NaN';
                      return (
                        <td key={col}>
                          {isNull ? (
                            <span className="cell-null">null</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <FileText size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                  No records match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div>
          Showing {filteredRows.length > 0 ? (safeCurrentPage - 1) * rowsPerPage + 1 : 0} to{' '}
          {Math.min(safeCurrentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} entries
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.5rem' }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ padding: '0 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.5rem' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
