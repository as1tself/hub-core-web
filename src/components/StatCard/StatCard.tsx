import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import "./StatCard.css";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean | null;
    };
    color?: "primary" | "success" | "error" | "warning";
}

const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "primary",
}: StatCardProps) => {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.isPositive === null) return <Minus size={14} />;
        return trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
    };

    const getTrendClass = () => {
        if (!trend || trend.isPositive === null) return "neutral";
        return trend.isPositive ? "positive" : "negative";
    };

    return (
        <div className={`stat-card stat-card--${color}`}>
            <div className="stat-card__header">
                <div className="stat-card__icon-wrapper">
                    <Icon size={24} strokeWidth={2} />
                </div>
                {trend && (
                    <div className={`stat-card__trend ${getTrendClass()}`}>
                        {getTrendIcon()}
                        <span>{trend.value === 0 ? "0.0" : Math.abs(trend.value).toFixed(1)}%</span>
                    </div>
                )}
            </div>
            <div className="stat-card__body">
                <span className="stat-card__title">{title}</span>
                <div className="stat-card__value-row">
                    <span className="stat-card__value">{value}</span>
                    {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
