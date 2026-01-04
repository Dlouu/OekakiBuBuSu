const MAX_HISTORY = 30;

const history = {
  bg: { undo: [], redo: [] },
  fg: { undo: [], redo: [] }
};

const bgCanvas = document.getElementById('bgCanvas');
const fgCanvas = document.getElementById('fgCanvas');

const bgCtx = bgCanvas.getContext('2d');
const fgCtx = fgCanvas.getContext('2d');

let activeCtx = fgCtx;
let activeCanvas = fgCanvas;

let tool = 'pen';
let painting = false;

function saveState(layer) {
  const ctx = layer === 'bg' ? bgCtx : fgCtx;
  const canvas = ctx.canvas;

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

  history[layer].undo.push(img);
  if (history[layer].undo.length > MAX_HISTORY) {
    history[layer].undo.shift();
  }

  history[layer].redo = [];
}

document.getElementById('saveBtn').onclick = () => {
  const temp = document.createElement('canvas');
  temp.width = bgCanvas.width;
  temp.height = bgCanvas.height;

  const tctx = temp.getContext('2d');
  tctx.drawImage(bgCanvas, 0, 0);
  tctx.drawImage(fgCanvas, 0, 0);

  temp.toBlob(blob => {
    const formData = new FormData();
    formData.append('drawing', blob);

    fetch('/upload', { method: 'POST', body: formData })
      .then(() => alert('🎉 Dessin sauvegardé !'));
  });
};

// outils UI
document.getElementById('penTool').onclick = () => tool = 'pen';
document.getElementById('eraserTool').onclick = () => tool = 'eraser';
document.getElementById('fillTool').onclick = () => tool = 'fill';

document.getElementById('bgLayer').onclick = () => {
  activeCtx = bgCtx;
  activeCanvas = bgCanvas;
};

document.getElementById('fgLayer').onclick = () => {
  activeCtx = fgCtx;
  activeCanvas = fgCanvas;
};

// dessin
function getPos(e) {
  const rect = activeCanvas.getBoundingClientRect();
  return {
    x: Math.floor(e.clientX - rect.left),
    y: Math.floor(e.clientY - rect.top)
  };
}

function startDraw(e) {
 if (tool === 'fill') {
  const { x, y } = getPos(e);
  floodFill(activeCtx, x, y);
  saveState(activeCanvas === bgCanvas ? 'bg' : 'fg');
  return;
}
  painting = true;
  draw(e);
}

function endDraw() {
  if (!painting) return;
  painting = false;
  activeCtx.beginPath();

  saveState(activeCanvas === bgCanvas ? 'bg' : 'fg');
}

function draw(e) {
  if (!painting) return;

  const { x, y } = getPos(e);
  activeCtx.lineWidth = document.getElementById('brushSize').value;
  activeCtx.lineCap = 'round';

  if (tool === 'eraser') {
    activeCtx.globalCompositeOperation = 'destination-out';
    activeCtx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    activeCtx.globalCompositeOperation = 'source-over';
    activeCtx.strokeStyle = document.getElementById('colorPicker').value;
  }

  activeCtx.lineTo(x, y);
  activeCtx.stroke();
  activeCtx.beginPath();
  activeCtx.moveTo(x, y);
}

fgCanvas.addEventListener('mousedown', startDraw);
fgCanvas.addEventListener('mouseup', endDraw);
fgCanvas.addEventListener('mousemove', draw);

bgCanvas.addEventListener('mousedown', startDraw);
bgCanvas.addEventListener('mouseup', endDraw);
bgCanvas.addEventListener('mousemove', draw);

function floodFill(ctx, startX, startY) {
  const canvas = ctx.canvas;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;

  const fillColor = hexToRgba(document.getElementById('colorPicker').value);
  const targetColor = getPixel(data, startX, startY, canvas.width);

  if (colorsMatch(targetColor, fillColor)) return;

  const stack = [[startX, startY]];

  while (stack.length) {
    const [x, y] = stack.pop();
    const current = getPixel(data, x, y, canvas.width);

    if (!colorsMatch(current, targetColor)) continue;

    setPixel(data, x, y, canvas.width, fillColor);

    if (x > 0) stack.push([x - 1, y]);
    if (x < canvas.width - 1) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y < canvas.height - 1) stack.push([x, y + 1]);
  }

  ctx.putImageData(img, 0, 0);
}

function getPixel(data, x, y, w) {
  const i = (y * w + x) * 4;
  return data.slice(i, i + 4);
}

function setPixel(data, x, y, w, color) {
  const i = (y * w + x) * 4;
  data[i] = color[0];
  data[i + 1] = color[1];
  data[i + 2] = color[2];
  data[i + 3] = 255;
}

function colorsMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function hexToRgba(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255,
    255
  ];
}

function undo(layer) {
  const ctx = layer === 'bg' ? bgCtx : fgCtx;
  const h = history[layer];

  if (h.undo.length === 0) return;

  const current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  h.redo.push(current);

  const prev = h.undo.pop();
  ctx.putImageData(prev, 0, 0);
}

function redo(layer) {
  const ctx = layer === 'bg' ? bgCtx : fgCtx;
  const h = history[layer];

  if (h.redo.length === 0) return;

  const current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  h.undo.push(current);

  const next = h.redo.pop();
  ctx.putImageData(next, 0, 0);
}

document.getElementById('undoBtn').onclick = () => {
  undo(activeCanvas === bgCanvas ? 'bg' : 'fg');
};

document.getElementById('redoBtn').onclick = () => {
  redo(activeCanvas === bgCanvas ? 'bg' : 'fg');
};

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo(activeCanvas === bgCanvas ? 'bg' : 'fg');
  }

  if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
    e.preventDefault();
    redo(activeCanvas === bgCanvas ? 'bg' : 'fg');
  }
});