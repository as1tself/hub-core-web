// src/pages/ApiHistoryPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useGetApiHistoryQuery } from "../store";
import { TableSkeleton } from "../components/Loading";
import { useLocale } from "../hooks";

const ApiHistoryPage: React.FC = () => {
    const { t } = useLocale();

    const sortOptions = [
        { value: "timestamp,desc", label: t.apiHistory.newest },
        { value: "timestamp,asc", label: t.apiHistory.oldest },
    ];

    useEffect(() => {
        document.title = `${t.apiHistory.title} - My App`;
    }, [t]);

    const [page, setPage] = useState(0);
    const [sort, setSort] = useState("timestamp,desc");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [sortOpen, setSortOpen] = useState(false);
    const size = 20;
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useGetApiHistoryQuery({ page, size, sort, search });

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setSortOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ESC 키로 드롭다운 닫기
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && sortOpen) {
                setSortOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [sortOpen]);

    const handleSearch = () => {
        setPage(0);
        setSearch(searchInput);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleSortSelect = (value: string) => {
        setSort(value);
        setPage(0);
        setSortOpen(false);
    };

    const currentSortLabel = sortOptions.find(opt => opt.value === sort)?.label || t.apiHistory.newest;
    const totalPages = data ? Math.ceil(data.total / data.pageable.pageSize) : 1;

    return (
        <div className="api-history-page">
            <div className="api-history-header">
                <h1>{t.apiHistory.title}</h1>
            </div>

            <div className="api-history-filters">
                <div className="filter-group">
                    <label id="sort-label">{t.apiHistory.sort}</label>
                    <div className="custom-dropdown" ref={dropdownRef}>
                        <button
                            type="button"
                            className="dropdown-toggle"
                            aria-labelledby="sort-label"
                            aria-expanded={sortOpen}
                            aria-haspopup="listbox"
                            onClick={() => setSortOpen(!sortOpen)}
                        >
                            {currentSortLabel}
                            <span className="dropdown-arrow" aria-hidden="true">▼</span>
                        </button>
                        {sortOpen && (
                            <ul className="dropdown-menu" role="listbox" aria-labelledby="sort-label">
                                {sortOptions.map((option) => (
                                    <li
                                        key={option.value}
                                        role="option"
                                        aria-selected={sort === option.value}
                                        className={sort === option.value ? "active" : ""}
                                        onClick={() => handleSortSelect(option.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                handleSortSelect(option.value);
                                            }
                                        }}
                                        tabIndex={0}
                                    >
                                        {option.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="filter-group filter-group-right">
                    <label htmlFor="search-input">{t.common.search}</label>
                    <input
                        id="search-input"
                        type="text"
                        placeholder={t.apiHistory.searchPlaceholder}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button type="button" className="search-btn" onClick={handleSearch}>
                        {t.common.search}
                    </button>
                </div>
            </div>

            <div className="api-history-table-container">
                <table className="api-history-table">
                    <thead>
                    <tr>
                        <th scope="col">{t.apiHistory.seq}</th>
                        <th scope="col">{t.apiHistory.status}</th>
                        <th scope="col">{t.apiHistory.method}</th>
                        <th scope="col">{t.apiHistory.path}</th>
                        <th scope="col">{t.apiHistory.clientIp}</th>
                        <th scope="col">{t.apiHistory.elapsed}</th>
                        <th scope="col">{t.apiHistory.timestamp}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {isLoading ? (
                        <TableSkeleton rows={10} columns={7} />
                    ) : data?.content && data.content.length > 0 ? (
                        data.content.map((item) => (
                            <tr key={item.seq}>
                                <td>{item.seq}</td>
                                <td>
                                    <span className={item.status >= 200 && item.status < 300 ? "status-ok" : "status-error"}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>
                                    <span className="method-badge">{item.requestMethod}</span>
                                </td>
                                <td>{item.path}</td>
                                <td>{item.clientIp}</td>
                                <td>
                                    <span className="elapsed-time">{item.elapsedMs}ms</span>
                                </td>
                                <td>{new Date(item.timestamp).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="no-data">{t.common.noData}</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            <nav className="pagination" aria-label="Page navigation">
                <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    disabled={page === 0}
                    aria-label={t.common.prev}
                >
                    {t.common.prev}
                </button>
                <span aria-live="polite">
                    {page + 1} / {totalPages}
                </span>
                <button
                    type="button"
                    onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                    disabled={page + 1 >= totalPages}
                    aria-label={t.common.next}
                >
                    {t.common.next}
                </button>
            </nav>
        </div>
    );
};

export default ApiHistoryPage;
