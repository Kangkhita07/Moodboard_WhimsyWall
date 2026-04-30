import type { CSSProperties } from 'react';
import eastFrame from '../assets/animation/rotations/east.png';
import northEastFrame from '../assets/animation/rotations/north-east.png';
import northWestFrame from '../assets/animation/rotations/north-west.png';
import northFrame from '../assets/animation/rotations/north.png';
import southEastFrame from '../assets/animation/rotations/south-east.png';
import southWestFrame from '../assets/animation/rotations/south-west.png';
import southFrame from '../assets/animation/rotations/south.png';
import westFrame from '../assets/animation/rotations/west.png';
import starAsset from '../../Animation asset/states/create_a_sparkly_star_in_pixel/rotations/unknown.png';

type LandingPageProps = {
  onStart: () => void;
};

const rotationFrames = [
  southFrame,
  southEastFrame,
  eastFrame,
  northEastFrame,
  northFrame,
  northWestFrame,
  westFrame,
  southWestFrame,
];

const whimsicalIdeas = [
  'Build a moodboard for a secret moonlit bakery.',
  'Collect colors for a teacup-sized daydream.',
  'Design a room where every corner hums softly.',
  'Pin textures that feel like wishes with buttons.',
  'Sketch a palette for a cloud with excellent taste.',
  'Gather tiny clues for your next impossible idea.',
];

function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="app-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="title-wrap">
            <img
              src={starAsset}
              alt=""
              className="title-star title-star-left"
              aria-hidden="true"
            />
            <h1 className="hero-title">WhimsyWall</h1>
            <img
              src={starAsset}
              alt=""
              className="title-star title-star-right"
              aria-hidden="true"
            />
          </div>
          <div className="title-animation" aria-hidden="true">
            {rotationFrames.map((frame, index) => (
              <img
                key={frame}
                src={frame}
                alt=""
                className="animation-frame"
                style={{ '--frame-index': index } as CSSProperties}
              />
            ))}
          </div>
          <div className="hero-subtitle" aria-label="Whimsical moodboard ideas">
            {whimsicalIdeas.map((idea, index) => (
              <span
                key={idea}
                className="subtitle-idea"
                style={{ '--idea-index': index } as CSSProperties}
              >
                {idea}
              </span>
            ))}
          </div>
          
          <button 
            className="start-button"
            onClick={onStart}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
