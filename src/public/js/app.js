// Minimal chart drawing placeholder
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('sentimentChart') || document.getElementById('analyticsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Simple donut
  const total = 100;
  const pos = 50, neg = 30, neu = 20;
  let start = 0;
  const draw = (fraction, color) => {
    ctx.beginPath();
    ctx.moveTo(150,150);
    ctx.fillStyle = color;
    ctx.arc(150,150,140,start,start + 2*Math.PI*(fraction/total));
    ctx.closePath();
    ctx.fill();
    start += 2*Math.PI*(fraction/total);
  };
  draw(pos,'#7bc96f');
  draw(neg,'#ff6b6b');
  draw(neu,'#cfd8dc');
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(150,150,80,0,2*Math.PI);
  ctx.fill();
});

// Word cloud very simple renderer
document.addEventListener('DOMContentLoaded', () => {
  const cloud = document.getElementById('wordCloud');
  if (!cloud) return;
  const words = [
    ['customer', 28], ['support', 22], ['delay', 18], ['packaging', 15], ['fantastic', 20], ['frustrating', 16],
    ['smooth', 14], ['helpful', 12], ['satisfaction', 10], ['complaints', 9]
  ];
  cloud.innerHTML = '';
  words.forEach(([w, s]) => {
    const span = document.createElement('span');
    span.textContent = w + ' ';
    span.style.fontSize = (8 + s) + 'px';
    span.style.margin = '4px';
    span.style.display = 'inline-block';
    span.style.transform = `rotate(${(Math.random() * 10 - 5)}deg)`;
    cloud.appendChild(span);
  });
});



