const imageLoader = document.getElementById("imageLoader");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const modeSelect = document.getElementById("mode");
const ampSlider = document.getElementById("amplitude");
const freqSlider = document.getElementById("frequency");
const phaseSlider = document.getElementById("phase");

const ampNum = document.getElementById("amplitudeNum");
const freqNum = document.getElementById("frequencyNum");
const phaseNum = document.getElementById("phaseNum");

let originalImage = null;

function syncSliders(slider, number) {
  slider.addEventListener("input", () => number.value = slider.value);
  number.addEventListener("input", () => slider.value = number.value);
}
syncSliders(ampSlider, ampNum);
syncSliders(freqSlider, freqNum);
syncSliders(phaseSlider, phaseNum);

imageLoader.addEventListener("change", handleImage, false);
[modeSelect, ampSlider, freqSlider, phaseSlider, ampNum, freqNum, phaseNum].forEach(el =>
  el.addEventListener("input", applyEffect)
);

function handleImage(e) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applyEffect();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
}

function applyEffect() {
  if (!originalImage) return;

  const mode = modeSelect.value;
  const amplitude = parseFloat(ampSlider.value);
  const frequency = parseFloat(freqSlider.value);
  const phase = parseFloat(phaseSlider.value) * Math.PI / 180;

  const src = originalImage.data;
  const w = originalImage.width;
  const h = originalImage.height;
  const dstImage = ctx.createImageData(w, h);
  const dst = dstImage.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let offsetX = 0, offsetY = 0;

      switch (mode) {
        case "horizontal":
          offsetX = amplitude * Math.sin((y / h) * frequency + phase);
          break;
        case "vertical":
          offsetY = amplitude * Math.sin((x / w) * frequency + phase);
          break;
        case "circular":
          const dx = x - w / 2;
          const dy = y - h / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const distortion = amplitude * Math.sin(distance / frequency + phase);
          offsetX = distortion * Math.cos(angle);
          offsetY = distortion * Math.sin(angle);
          break;
        case "diagonal":
          offsetX = amplitude * Math.sin((x + y) / frequency + phase);
          offsetY = amplitude * Math.sin((x + y) / frequency + phase);
          break;
        case "bulge":
          const cx = x - w / 2;
          const cy = y - h / 2;
          const r = Math.sqrt(cx * cx + cy * cy);
          const bulgeAmount = amplitude * Math.sin(r / frequency + phase);
          offsetX = (cx / (r || 1)) * bulgeAmount;
          offsetY = (cy / (r || 1)) * bulgeAmount;
          break;
        case "stretch-h":
          offsetX = amplitude * Math.sin(x / frequency + phase);
          break;
        case "stretch-v":
          offsetY = amplitude * Math.sin(y / frequency + phase);
          break;
      }

      const srcX = Math.round(x + offsetX);
      const srcY = Math.round(y + offsetY);

      const srcIdx = (srcY * w + srcX) * 4;
      const dstIdx = (y * w + x) * 4;

      if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
        dst[dstIdx] = src[srcIdx];
        dst[dstIdx + 1] = src[srcIdx + 1];
        dst[dstIdx + 2] = src[srcIdx + 2];
        dst[dstIdx + 3] = src[srcIdx + 3];
      } else {
        dst[dstIdx + 3] = 0;
      }
    }
  }

  ctx.putImageData(dstImage, 0, 0);
}

document.getElementById("saveBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "distorted.png";
  link.href = canvas.toDataURL();
  link.click();
});