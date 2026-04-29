import React, { useState } from 'react';
import { MoodboardItem } from '../../types';
import { generateId, validation } from '../../utils';
import './AddItemForm.css';

interface AddItemFormProps {
  onSubmit: (item: MoodboardItem) => void;
}

type ItemCategory = 'image' | 'color' | 'texture' | 'mood' | 'other';

const AddItemForm: React.FC<AddItemFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('#667eea');
  const [category, setCategory] = useState<ItemCategory>('image');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (category === 'image' && imageUrl && !validation.isValidImageUrl(imageUrl)) {
      newErrors.imageUrl = 'Please provide a valid image URL';
    }

    if (category === 'color' && !validation.isValidHexColor(color)) {
      newErrors.color = 'Please provide a valid hex color';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newItem: MoodboardItem = {
      id: generateId(),
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl: category === 'image' ? imageUrl : undefined,
      color: category === 'color' ? color : undefined,
      category,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onSubmit(newItem);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setColor('#667eea');
    setCategory('image');
    setTags('');
    setErrors({});
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <h2>Add New Item</h2>

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Item title"
          className={errors.title ? 'error' : ''}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Item description (optional)"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ItemCategory)}
        >
          <option value="image">Image</option>
          <option value="color">Color</option>
          <option value="texture">Texture</option>
          <option value="mood">Mood</option>
          <option value="other">Other</option>
        </select>
      </div>

      {category === 'image' && (
        <div className="form-group">
          <label htmlFor="imageUrl">Image URL</label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={errors.imageUrl ? 'error' : ''}
          />
          {errors.imageUrl && (
            <span className="error-message">{errors.imageUrl}</span>
          )}
        </div>
      )}

      {category === 'color' && (
        <div className="form-group">
          <label htmlFor="color">Color</label>
          <div className="color-input-wrapper">
            <input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#667eea"
              className={errors.color ? 'error' : ''}
            />
          </div>
          {errors.color && (
            <span className="error-message">{errors.color}</span>
          )}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Separate tags with commas"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Add Item
        </button>
        <button type="button" className="btn-secondary" onClick={resetForm}>
          Reset
        </button>
      </div>
    </form>
  );
};

export default AddItemForm;
