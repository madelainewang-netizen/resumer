export async function prepareProfilePhoto(file) {
  if (!file || !["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("请选择 JPG 或 PNG 图片");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("图片不能超过 8MB");
  }

  const source = await fileToDataURL(file);
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const width = 360;
  const height = 480;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;
  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = Math.max(0, (image.height - sh) * 0.35);
  }

  context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片格式无法识别"));
    image.src = src;
  });
}
