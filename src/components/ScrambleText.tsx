import React, { useState, useEffect, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({ text, className }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const originalText = useRef(text);
  
  // Hacker-ish characters for the noise
  const chars = '!<>-_\\\\/[]{}—=+*^?#_01';

  useEffect(() => {
    let frame: number;
    let iteration = 0;

    if (isHovering) {
      const scramble = () => {
        setDisplayText((prev) => 
          prev.split('').map((char, index) => {
            // Don't scramble spaces
            if (originalText.current[index] === ' ') return ' ';
            
            // If the iteration has passed this index, reveal the true character
            if (index < iteration) {
              return originalText.current[index];
            }
            
            // Otherwise, show noise
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );

        // Speed of the reveal (lower is slower)
        if (iteration >= originalText.current.length) {
          setIsHovering(false);
          return;
        }

        iteration += 1 / 3;
        frame = requestAnimationFrame(scramble);
      };
      frame = requestAnimationFrame(scramble);
    } else {
      setDisplayText(originalText.current);
    }

    return () => cancelAnimationFrame(frame);
  }, [isHovering]);

  return (
    <span 
      onMouseEnter={() => setIsHovering(true)}
      className={`inline-block cursor-crosshair ${className || ''}`}
    >
      {displayText}
    </span>
  );
};
