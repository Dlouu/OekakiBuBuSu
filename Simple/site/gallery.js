const gallery = document.getElementById('gallery');
fetch('/drawings')
  .then(res => res.json())
  .then(files => {
    files.forEach(file => {
      const img = document.createElement('img');
      img.src = `/drawings/${file}`;
      gallery.appendChild(img);
    });
  });