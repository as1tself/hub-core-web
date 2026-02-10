import { User, Mail, AtSign, Link2, Edit2 } from "lucide-react";
import type { User as UserType } from "../../types";
import { useLocale } from "../../hooks";
import "./ProfileCard.css";

interface ProfileCardProps {
    user: UserType;
    onEdit?: () => void;
}

const ProfileCard = ({ user, onEdit }: ProfileCardProps) => {
    const { t } = useLocale();
    return (
        <div className="profile-card">
            {/* Cover */}
            <div className="profile-card__cover">
                <div className="profile-card__cover-gradient" />
            </div>

            {/* Avatar */}
            <div className="profile-card__avatar-section">
                <div className="profile-card__avatar-wrapper">
                    <div className="profile-card__avatar">
                        <User size={40} strokeWidth={1.5} />
                    </div>
                    <div className="profile-card__status-indicator" />
                </div>
            </div>

            {/* User Info */}
            <div className="profile-card__content">
                <div className="profile-card__header">
                    <div className="profile-card__name-section">
                        <h2 className="profile-card__name">{user.nickname || user.username}</h2>
                        <p className="profile-card__role">{t.user.systemAdmin}</p>
                    </div>
                    {onEdit && (
                        <button className="profile-card__edit-btn" onClick={onEdit}>
                            <Edit2 size={16} />
                            <span>{t.user.editInfo}</span>
                        </button>
                    )}
                </div>

                <div className="profile-card__info-grid">
                    <div className="profile-card__info-item">
                        <span className="profile-card__info-label">{t.user.userId}</span>
                        <div className="profile-card__info-value">
                            <AtSign size={16} />
                            <span>{user.username}</span>
                        </div>
                    </div>

                    <div className="profile-card__info-item">
                        <span className="profile-card__info-label">{t.user.nickname}</span>
                        <div className="profile-card__info-value">
                            <User size={16} />
                            <span>{user.nickname || "-"}</span>
                        </div>
                    </div>

                    <div className="profile-card__info-item">
                        <span className="profile-card__info-label">{t.user.email}</span>
                        <div className="profile-card__info-value">
                            <Mail size={16} />
                            <span>{user.email || "-"}</span>
                        </div>
                    </div>

                    <div className="profile-card__info-item">
                        <span className="profile-card__info-label">{t.user.socialLogin}</span>
                        <div className="profile-card__info-value">
                            <Link2 size={16} />
                            <span>{user.social ? t.user.connected : t.user.notConnected}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
