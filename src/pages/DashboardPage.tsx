import React, { useEffect } from 'react';

const DashboardPage: React.FC = () => {
    useEffect(() => {
        document.title = '대시보드 - My App';
    }, []);

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome to your dashboard!</p>
        </div>
    );
};

export default DashboardPage;
