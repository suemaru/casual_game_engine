import { BusinessCardSpec } from '../data/businessCardSpec';

const MM_PER_INCH = 25.4;

const FONT_FAMILY = '"Inter", "Helvetica Neue", system-ui, -apple-system, sans-serif';

const SAFE_TEXT_COLOR = '#0f172a';

function mmToPx(mm: number, dpi: number) {
  return Math.round((mm * dpi) / MM_PER_INCH);
}

async function loadImage(src: string): Promise<HTMLImageElement | undefined> {
  if (!src) return undefined;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  if (!text) return y;
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;
  let linesUsed = 0;

  const pushLine = (content: string, isLast: boolean) => {
    const display = !isLast ? content : content.trimEnd();
    ctx.fillText(display, x, currentY);
    currentY += lineHeight;
    linesUsed += 1;
  };

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      pushLine(line, linesUsed + 1 === maxLines);
      if (linesUsed >= maxLines) {
        return currentY;
      }
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    const isLast = linesUsed + 1 === maxLines;
    if (isLast && ctx.measureText(line).width > maxWidth) {
      let truncated = line;
      while (ctx.measureText(`${truncated}…`).width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      pushLine(`${truncated}…`, true);
    } else {
      pushLine(line, true);
    }
  }

  return currentY;
}

async function renderFront(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  spec: BusinessCardSpec,
) {
  const { width, height } = canvas;
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  drawRoundedRect(ctx, 0, 0, width, height, Math.floor(width * 0.04));
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();

  const bannerHeight = Math.round(height * 0.33);
  const bannerImage = await loadImage(spec.front.bannerImage);
  if (bannerImage) {
    ctx.drawImage(bannerImage, 0, 0, bannerImage.width, bannerImage.height, 0, 0, width, bannerHeight);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, bannerHeight);
    gradient.addColorStop(0, spec.front.themeColor);
    gradient.addColorStop(1, '#6a51d8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, bannerHeight);
  }

  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.25;
  ctx.fillRect(0, bannerHeight - Math.round(height * 0.06), width, Math.round(height * 0.12));
  ctx.globalAlpha = 1;

  const profileRadius = Math.round(height * 0.16);
  const profileX = Math.round(width * 0.08) + profileRadius;
  const profileY = bannerHeight - Math.round(height * 0.04);

  const profileImage = await loadImage(spec.front.profileImage);
  ctx.save();
  ctx.beginPath();
  ctx.arc(profileX, profileY, profileRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = Math.max(4, Math.round(width * 0.008));
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.clip();
  if (profileImage) {
    ctx.drawImage(
      profileImage,
      0,
      0,
      profileImage.width,
      profileImage.height,
      profileX - profileRadius,
      profileY - profileRadius,
      profileRadius * 2,
      profileRadius * 2,
    );
  } else {
    const grad = ctx.createLinearGradient(
      profileX - profileRadius,
      profileY - profileRadius,
      profileX + profileRadius,
      profileY + profileRadius,
    );
    grad.addColorStop(0, '#f5a6ff');
    grad.addColorStop(1, '#7fa2ff');
    ctx.fillStyle = grad;
    ctx.fillRect(profileX - profileRadius, profileY - profileRadius, profileRadius * 2, profileRadius * 2);
  }
  ctx.restore();

  const textLeft = profileX + profileRadius + Math.round(width * 0.04);
  const textWidth = width - textLeft - Math.round(width * 0.05);
  const baseY = bannerHeight + Math.round(height * 0.05);

  ctx.fillStyle = SAFE_TEXT_COLOR;
  const nameFont = Math.round(height * 0.11);
  ctx.font = `${nameFont}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'top';
  const displayName = spec.profile.name + (spec.profile.accentEmoji ? ` ${spec.profile.accentEmoji}` : '');
  ctx.fillText(displayName, textLeft, baseY);

  if (spec.profile.isVerified) {
    const verifiedSize = Math.round(height * 0.05);
    ctx.fillStyle = spec.front.themeColor;
    ctx.beginPath();
    const nameWidth = ctx.measureText(displayName).width;
    const badgeX = textLeft + nameWidth + verifiedSize * 1.4;
    const badgeY = baseY + verifiedSize;
    ctx.arc(badgeX, badgeY, verifiedSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${Math.round(verifiedSize * 1.4)}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('✓', badgeX - verifiedSize * 0.55, badgeY - verifiedSize * 0.82);
    ctx.fillStyle = SAFE_TEXT_COLOR;
    ctx.font = `${nameFont}px ${FONT_FAMILY}`;
  }

  const usernameY = baseY + Math.round(height * 0.12);
  ctx.font = `${Math.round(height * 0.055)}px ${FONT_FAMILY}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(`@${spec.profile.username}`, textLeft, usernameY);

  const bioY = usernameY + Math.round(height * 0.06);
  ctx.font = `${Math.round(height * 0.052)}px ${FONT_FAMILY}`;
  ctx.fillStyle = SAFE_TEXT_COLOR;
  drawParagraph(ctx, spec.profile.bio, textLeft, bioY, textWidth, Math.round(height * 0.07), 3);

  const metaY = bioY + Math.round(height * 0.21);
  const metaFont = Math.round(height * 0.048);
  ctx.font = `${metaFont}px ${FONT_FAMILY}`;
  ctx.fillStyle = '#475569';

  const details: string[] = [];
  if (spec.profile.location) details.push(spec.profile.location);
  if (spec.profile.website) details.push(spec.profile.website);
  if (spec.profile.joinDate) details.push(`Joined ${spec.profile.joinDate}`);
  ctx.fillText(details.join('   •   '), textLeft, metaY);

  const statsY = metaY + Math.round(height * 0.09);
  ctx.fillStyle = SAFE_TEXT_COLOR;
  ctx.font = `${Math.round(height * 0.06)}px ${FONT_FAMILY}`;

  const statSpacing = Math.round(width * 0.22);
  spec.front.stats.forEach((stat, index) => {
    const statX = textLeft + index * statSpacing;
    ctx.fillText(`${stat.value.toLocaleString()}`, statX, statsY);
    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.round(height * 0.048)}px ${FONT_FAMILY}`;
    ctx.fillText(stat.label, statX + 4, statsY + Math.round(height * 0.06));
    ctx.fillStyle = SAFE_TEXT_COLOR;
    ctx.font = `${Math.round(height * 0.06)}px ${FONT_FAMILY}`;
  });

  ctx.restore();
}

function drawList(
  ctx: CanvasRenderingContext2D,
  items: string[],
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  let currentY = y;
  items.forEach((item) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, currentY + lineHeight / 2, lineHeight * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.restore();
    const afterText = drawParagraph(
      ctx,
      item,
      x + lineHeight * 0.6,
      currentY,
      maxWidth - lineHeight * 0.6,
      lineHeight,
      3,
    );
    currentY = afterText + lineHeight * 0.2;
  });
  return currentY;
}

async function renderBack(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  spec: BusinessCardSpec,
) {
  const { width, height } = canvas;
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  drawRoundedRect(ctx, 0, 0, width, height, Math.floor(width * 0.04));
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.clip();

  ctx.globalAlpha = 0.2;
  const bubbleRadius = Math.round(width * 0.2);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.2, bubbleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.arc(width * 0.3, height * 0.75, bubbleRadius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const padding = Math.round(width * 0.08);
  let cursorY = padding;

  ctx.fillStyle = '#e0f2fe';
  ctx.font = `${Math.round(height * 0.075)}px ${FONT_FAMILY}`;
  ctx.fillText(spec.back.headline, padding, cursorY);
  cursorY += Math.round(height * 0.1);

  ctx.fillStyle = '#cbd5f5';
  ctx.font = `${Math.round(height * 0.055)}px ${FONT_FAMILY}`;
  cursorY = drawParagraph(ctx, spec.back.summary, padding, cursorY, width - padding * 2, Math.round(height * 0.07), 4) + Math.round(height * 0.04);

  ctx.fillStyle = '#f8fafc';
  ctx.font = `${Math.round(height * 0.06)}px ${FONT_FAMILY}`;
  ctx.fillText('Highlights', padding, cursorY);
  cursorY += Math.round(height * 0.06);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = `${Math.round(height * 0.05)}px ${FONT_FAMILY}`;
  cursorY = drawList(ctx, spec.back.highlights, padding, cursorY, width - padding * 2, Math.round(height * 0.065));
  cursorY += Math.round(height * 0.05);

  ctx.fillStyle = '#f8fafc';
  ctx.font = `${Math.round(height * 0.06)}px ${FONT_FAMILY}`;
  ctx.fillText('Contact', padding, cursorY);
  cursorY += Math.round(height * 0.06);

  const contactFont = Math.round(height * 0.05);
  ctx.font = `${contactFont}px ${FONT_FAMILY}`;
  ctx.fillStyle = '#e2e8f0';
  spec.back.contact.forEach((entry, index) => {
    const contactY = cursorY + index * Math.round(height * 0.055);
    ctx.fillText(`${entry.label}: ${entry.value}`, padding, contactY);
  });

  if (spec.back.footerNote) {
    ctx.font = `${Math.round(height * 0.04)}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#cbd5f5';
    ctx.fillText(spec.back.footerNote, padding, height - padding);
  }

  ctx.restore();
}

export async function generateBusinessCardCanvases(spec: BusinessCardSpec) {
  const widthPx = mmToPx(spec.size.widthMm, spec.size.dpi);
  const heightPx = mmToPx(spec.size.heightMm, spec.size.dpi);

  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = widthPx;
  frontCanvas.height = heightPx;
  const frontCtx = frontCanvas.getContext('2d');
  if (!frontCtx) throw new Error('2D context not available for front canvas');

  const backCanvas = document.createElement('canvas');
  backCanvas.width = widthPx;
  backCanvas.height = heightPx;
  const backCtx = backCanvas.getContext('2d');
  if (!backCtx) throw new Error('2D context not available for back canvas');

  await renderFront(frontCanvas, frontCtx, spec);
  await renderBack(backCanvas, backCtx, spec);

  return { frontCanvas, backCanvas };
}
