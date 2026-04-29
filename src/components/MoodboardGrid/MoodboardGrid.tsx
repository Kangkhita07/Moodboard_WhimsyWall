import React from 'react';
import { MoodboardItem } from '../../types';
import MoodboardItemCard from '../MoodboardItemCard/MoodboardItemCard';
import './MoodboardGrid.css';

interface MoodboardGridProps {
  items: MoodboardItem[];
  onItemClick?: (item: MoodboardItem) => void;
  onItemDelete?: (id: string) => void;
  columnsPerRow?: number;
}

const MoodboardGrid: React.FC<MoodboardGridProps> = ({
  items,
  onItemClick,
  onItemDelete,
  columnsPerRow = 3,
}) => {
  return (
    <div
      className="moodboard-grid"
      style={
        {
          '--columns': columnsPerRow,
        } as React.CSSProperties & { '--columns': number }
      }
    >
      {items.length === 0 ? (
        <div className="empty-state">
          <p>No items in this moodboard yet. Start adding some!</p>
        </div>
      ) : (
        items.map((item) => (
          <MoodboardItemCard
            key={item.id}
            item={item}
            onClick={() => onItemClick?.(item)}
            onDelete={() => onItemDelete?.(item.id)}
          />
        ))
      )}
    </div>
  );
};

export default MoodboardGrid;
