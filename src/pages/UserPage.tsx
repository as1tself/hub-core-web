import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useGetUserQuery } from "../store";
import { useLocale } from "../hooks";
import { Skeleton } from "../components/Loading";
import { ProfileCard } from "../components/ProfileCard";
import { Lock, Key, Shield } from "lucide-react";
import "../styles/pages/user.css";

function UserPage() {
    const { t } = useLocale();

    useEffect(() => {
        document.title = `${t.user.title} - My App`;
    }, [t]);

    const { isLoading, error } = useGetUserQuery();
    const storedUser = useSelector((s: RootState) => s.user.user);

    if (isLoading) {
        return (
            <div className="user-page">
                <header className="user-page__header">
                    <h1>{t.user.title}</h1>
                    <p className="user-page__subtitle">{t.user.subtitle}</p>
                </header>
                <div className="user-page__content">
                    <div className="user-page__skeleton-card">
                        <Skeleton width="100%" height={120} />
                        <div className="user-page__skeleton-body">
                            <Skeleton width={96} height={96} />
                            <Skeleton width="40%" height={24} />
                            <Skeleton width="30%" height={16} />
                            <div className="user-page__skeleton-grid">
                                <Skeleton width="100%" height={60} />
                                <Skeleton width="100%" height={60} />
                                <Skeleton width="100%" height={60} />
                                <Skeleton width="100%" height={60} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-page">
                <div className="user-page__error">
                    <p>{t.common.noData}</p>
                </div>
            </div>
        );
    }

    if (!storedUser) {
        return (
            <div className="user-page">
                <div className="user-page__error">
                    <p>{t.common.noData}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="user-page">
            <header className="user-page__header">
                <h1>{t.user.title}</h1>
                <p className="user-page__subtitle">{t.user.subtitle}</p>
            </header>

            <div className="user-page__content">
                {/* 프로필 카드 */}
                <section className="user-page__profile">
                    <ProfileCard user={storedUser} />
                </section>

                {/* 보안 설정 */}
                <section className="user-page__security">
                    <div className="security-header">
                        <Shield size={20} />
                        <h2>{t.user.securitySettings}</h2>
                    </div>

                    <div className="security-options">
                        <button
                            className="security-option"
                            disabled={storedUser.social}
                        >
                            <div className="security-option__icon">
                                <Lock size={20} />
                            </div>
                            <div className="security-option__content">
                                <span className="security-option__title">{t.user.changePassword}</span>
                                <span className="security-option__desc">
                                    {storedUser.social
                                        ? t.user.socialUserCannotChange
                                        : t.user.changePasswordDesc}
                                </span>
                            </div>
                            <span className="security-option__action">{t.user.change}</span>
                        </button>

                        <button className="security-option" disabled>
                            <div className="security-option__icon">
                                <Key size={20} />
                            </div>
                            <div className="security-option__content">
                                <span className="security-option__title">{t.user.twoFactorAuth}</span>
                                <span className="security-option__desc">
                                    {t.user.twoFactorDesc}
                                </span>
                            </div>
                            <span className="security-option__action disabled">{t.user.comingSoon}</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default UserPage;
