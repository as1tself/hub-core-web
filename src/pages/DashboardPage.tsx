import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, CheckCircle, Users, ArrowRight } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { useGetApiHistoryQuery } from "../store";
import { Skeleton } from "../components/Loading";
import { useLocale } from "../hooks";
import "../styles/pages/dashboard.css";

const DashboardPage = () => {
    const { t } = useLocale();

    useEffect(() => {
        document.title = `${t.dashboard.title} - My App`;
    }, [t]);

    const { data: recentCalls, isLoading } = useGetApiHistoryQuery({
        page: 0,
        size: 5,
        sort: "timestamp,desc",
    });

    const totalRequests = recentCalls?.total || 0;
    const successCount = recentCalls?.content?.filter((c) => c.status >= 200 && c.status < 300).length || 0;
    const totalInPage = recentCalls?.content?.length || 1;
    const successRate = totalInPage > 0 ? Math.round((successCount / totalInPage) * 100) : 0;

    const formatRelativeTime = (timestamp: string): string => {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t.time.justNow;
        if (minutes < 60) return t.time.minutesAgo(minutes);
        if (hours < 24) return t.time.hoursAgo(hours);
        return t.time.daysAgo(days);
    };

    const getStatusText = (status: number): string => {
        if (status === 200) return t.dashboard.ok;
        if (status === 201) return t.dashboard.created;
        if (status >= 500) return t.dashboard.error;
        return "";
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1>{t.dashboard.title}</h1>
                    <p className="dashboard-subtitle">
                        {t.dashboard.subtitle}
                    </p>
                </div>
            </header>

            {/* 통계 카드 */}
            <section className="stats-grid">
                <StatCard
                    title={t.dashboard.totalRequests}
                    value={isLoading ? "-" : totalRequests.toLocaleString()}
                    subtitle={t.dashboard.perMonth}
                    icon={Activity}
                    trend={{ value: 12.5, isPositive: true }}
                    color="primary"
                />
                <StatCard
                    title={t.dashboard.successRate}
                    value={isLoading ? "-" : `${successRate}%`}
                    subtitle={t.dashboard.uptime}
                    icon={CheckCircle}
                    trend={{ value: 0.8, isPositive: true }}
                    color="success"
                />
                <StatCard
                    title={t.dashboard.activeUsers}
                    value="1,204"
                    subtitle={t.dashboard.currentlyOnline}
                    icon={Users}
                    trend={{ value: 0, isPositive: null }}
                    color="warning"
                />
            </section>

            {/* 최근 API 호출 */}
            <section className="recent-calls-section">
                <div className="section-header">
                    <h2>{t.dashboard.recentApiCalls}</h2>
                    <Link to="/api/history" className="view-all-link">
                        {t.dashboard.viewAll}
                        <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="recent-calls-table-wrapper">
                    <table className="recent-calls-table">
                        <thead>
                            <tr>
                                <th>{t.dashboard.status}</th>
                                <th>{t.dashboard.method}</th>
                                <th>{t.dashboard.path}</th>
                                <th>{t.dashboard.latency}</th>
                                <th>{t.dashboard.time}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><Skeleton width={60} height={24} /></td>
                                        <td><Skeleton width={50} height={20} /></td>
                                        <td><Skeleton width={150} height={20} /></td>
                                        <td><Skeleton width={50} height={20} /></td>
                                        <td><Skeleton width={80} height={20} /></td>
                                    </tr>
                                ))
                            ) : recentCalls?.content?.length ? (
                                recentCalls.content.map((item) => (
                                    <tr key={item.seq}>
                                        <td>
                                            <span className={`status-badge ${item.status >= 200 && item.status < 300 ? "success" : item.status >= 400 && item.status < 500 ? "warning" : "error"}`}>
                                                {item.status} {getStatusText(item.status)}
                                            </span>
                                        </td>
                                        <td className="method-cell">{item.requestMethod}</td>
                                        <td className="path-cell">{item.path}</td>
                                        <td className="latency-cell">
                                            {item.elapsedMs}ms
                                        </td>
                                        <td className="time-cell">
                                            {formatRelativeTime(item.timestamp)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="empty-cell">
                                        {t.common.noData}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default DashboardPage;
