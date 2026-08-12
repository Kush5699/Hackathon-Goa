const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const updated = content.replace(
/const file = new File.*?window\.open\(twitterIntent, '_blank'\);\s*}/s,
`// Upload to backend, then open X intent directly
      const formData = new FormData();
      formData.append('image', blob, 'builder-id.png');
      
      const response = await fetch('/api/share', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to upload to server");
      
      const { id } = await response.json();
      const shareUrl = \`\${window.location.origin}/s/\${id}\`;
      
      const tweetText = encodeURIComponent(\`I'm building at Hacker House Goa 2026 \uD83C\uDF34\uD83D\uDCBB #FrameInGoa\\n\\n\`);
      const twitterIntent = \`https://twitter.com/intent/tweet?text=\${tweetText}&url=\${encodeURIComponent(shareUrl)}\`;
      window.open(twitterIntent, '_blank');`
);

fs.writeFileSync('src/App.tsx', updated);
