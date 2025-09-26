// src/pages/APIHistory.tsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetApiHistoryQuery } from "../store/apiHistoryApi";
import type { RootState } from "../store/store";

const APIHistory: React.FC = () => {
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.user.user);

    const [page, setPage] = useState(0);
    const size = 20;

    const { data, refetch, isFetching } = useGetApiHistoryQuery({ page, size });

    // 로그인 여부 확인 → 없으면 "/"로 이동
    useEffect(() => {
        if (!user) {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    const handleRefresh = () => {
        refetch();
    };

    return (
        <div className="api-history-page">
            <div className="api-history-header">
                <h1>API 성공/오류 내역</h1>
                <button onClick={handleRefresh} disabled={isFetching}>
                    {isFetching ? "갱신 중..." : "갱신"}
                </button>
            </div>

            <div className="api-history-table-container">
                <table className="api-history-table">
                    <thead>
                    <tr>
                        <th>Seq</th>
                        <th>Status</th>
                        <th>Username</th>
                        <th>Path</th>
                        <th>Client Ip</th>
                        <th>Timestamp</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data?.content.map((item) => (
                        <tr key={item.seq}>
                            <td>{item.seq}</td>
                            <td className={item.status === 200 ? "status-ok" : "status-error"}>
                                {item.status}
                            </td>
                            <td>{item.username}</td>
                            <td>{item.path}</td>
                            <td>{item.clientIp}</td>
                            <td>{new Date(item.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}>
                    이전
                </button>
                <span>
          {page + 1} / {data ? Math.ceil(data.total / data.pageable.pageSize) : 1}
        </span>
                <button
                    onClick={() =>
                        setPage((p) =>
                            data ? (p + 1 < Math.ceil(data.total / data.pageable.pageSize) ? p + 1 : p) : p
                        )
                    }
                    disabled={data && page + 1 >= Math.ceil(data.total / data.pageable.pageSize)}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default APIHistory;
