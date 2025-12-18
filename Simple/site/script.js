const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
let painting = false;

function start(e){ painting = true; draw(e); }
function end(){ painting = false; ctx.beginPath(); }
function draw(e){
  if(!painting) return;
  ctx.lineWidth = document.getElementById('brushSize').value;
  ctx.lineCap = 'round';
  ctx.strokeStyle = document.getElementById('colorPicker').value;
  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

canvas.addEventListener('mousedown', start);
canvas.addEventListener('mouseup', end);
canvas.addEventListener('mousemove', draw);

document.getElementById('clearBtn').addEventListener('click', () => {
  ctx.clearRect(0,0,canvas.width,canvas.height);
});

document.getElementById('saveBtn').addEventListener('click', () => {
  canvas.toBlob(blob => {
    const formData = new FormData();
    formData.append('drawing', blob, 'drawing.png');
    fetch('/upload', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => alert('Dessins sauvegardé !'))
      .catch(err => alert('Erreur lors de la sauvegarde.'));
  });
});