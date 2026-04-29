import React from 'react';
import { MoodboardItem } from '../../types';
import { formatDate } from '../../utils';
import './MoodboardItemCard.css';

interface MoodboardItemCardProps {
  item: MoodboardItem;
  onClick?: () => void;
  onDelete?: () => void;
}

const MoodboardItemCard: React.FC<MoodboardItemCardProps> = ({
  item,
  onClick,
  onDelete,
}) => {
  return (
    <div className="moodboard-item-card" onClick={onClick}>
      <div className="card-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} />
        ) : item.color ? (
          <div
            className="color-swatch"
            style={{ backgroundColor: item.color }}
          ></div>
        ) : (
          <div className="placeholder">{item.category}</div>
        )}
      </div>

      <div className="card-content">
        <h3 className="card-title">{item.title}</h3>
        {item.description && (
          <p className="card-description">{item.description}</p>
        )}
        <div className="card-meta">
          <span className="category-badge">{item.category}</span>
          <span className="date">{formatDate(item.createdAt)}</span>
        </div>
        {item.tags.length > 0 && (
          <div className="card-tags">
            {item.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card-actions">
        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          aria-label="Delete item"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default MoodboardItemCard;
