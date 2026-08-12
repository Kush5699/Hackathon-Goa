import React, { useState, useEffect } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({ text, className }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  
  // Hacker-ish characters for the noise
  const chars = '!<>-_\\\\/[]{}—=+*^?#_01';

  // Trigger scramble when the target text changes
  useEffect(() => {
    setIsScrambling(true);
  }, [text]);

  useEffect(() => {
    let frame: number;
    let iteration = 0;

    if (isScrambling) {
      const scramble = () => {
        setDisplayText((prev) => 
          text.split('').map((char, index) => {
            // Don't scramble spaces
            if (char === ' ') return ' ';
            
            // If the iteration has passed this index, reveal the true character
            if (index < iteration) {
              return text[index];
            }
            
            // Otherwise, show noise
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );

        // Speed of the reveal (lower is slower)
        if (iteration >= text.length) {
          setIsScrambling(false);
          return;
        }

        iteration += 1 / 3;
        frame = requestAnimationFrame(scramble);
      };
      frame = requestAnimationFrame(scramble);
    } else {
      setDisplayText(text);
    }

    return () => cancelAnimationFrame(frame);
  }, [isScrambling, text]);

  return (
    <span 
      onMouseEnter={() => setIsScrambling(true)}
      className={`inline-block cursor-crosshair ${className || ''}`}
    >
      {displayText}
    </span>
  );
};
