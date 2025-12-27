// src/components/Loading/Skeleton.tsx
import React from "react";

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = "100%",
    height = "20px",
    borderRadius = "4px",
    className = "",
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
                borderRadius,
            }}
        />
    );
};

// 테이블 행 스켈레톤
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 6 }) => {
    return (
        <tr className="skeleton-row">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i}>
                    <Skeleton height={16} />
                </td>
            ))}
        </tr>
    );
};

// 테이블 스켈레톤
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 20,
    columns = 6,
}) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} columns={columns} />
            ))}
        </>
    );
};

// 카드 스켈레톤
export const CardSkeleton: React.FC = () => {
    return (
        <div className="skeleton-card">
            <Skeleton height={24} width="60%" className="mb-sm" />
            <Skeleton height={16} width="100%" className="mb-xs" />
            <Skeleton height={16} width="80%" className="mb-xs" />
            <Skeleton height={16} width="90%" />
        </div>
    );
};

export default Skeleton;
