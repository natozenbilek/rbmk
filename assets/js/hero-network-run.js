(function() {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;

  const C = window.RBMK_NET_CONFIG;
  const M = window.RBMKMath;
  const { nodes, edges, adj } = window.RBMK_NET;
  const SECTORS = C.SECTORS;
  const CRISIS_COL = C.CRISIS_COL;
  const { rgba, lerp, lerp3 } = M;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  let W, H;

  const NORMAL_DUR = C.NORMAL_DUR;
  const RAMP_UP = C.RAMP_UP;
  const PEAK_DUR = C.PEAK_DUR;
  const RAMP_DOWN = C.RAMP_DOWN;
  const CYCLE = NORMAL_DUR + RAMP_UP + PEAK_DUR + RAMP_DOWN;
  const NET_SCALE = C.NET_SCALE;
  const SHOCK_SPEED = C.SHOCK_SPEED;
  const SHOCK_MAX = C.SHOCK_MAX;

  let crisisPhase = 0;
  let crisisTimer = 0;
  let hubNode = -1;
  let shockOrigin = { x: 0, y: 0 };
  let shockAge = -1;
  let mouse = { x: -1e3, y: -1e3 };
  let nearestNode = -1;

  function pickHub() {
    hubNode = Math.floor(Math.random() * nodes.length);
    shockOrigin = { x: nodes[hubNode].x, y: nodes[hubNode].y };
    shockAge = 0;
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes.forEach(n => { n.baseX = n.nx * W; n.baseY = n.ny * H; });
  }

  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (W / r.width);
    mouse.y = (e.clientY - r.top) * (H / r.height);
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = mouse.y = -1e3; });

  let t = 0;
  (function draw() {
    t++;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W * 0.5, H * 0.5);
    ctx.scale(NET_SCALE, NET_SCALE);
    ctx.translate(-W * 0.5, -H * 0.5);

    crisisTimer = (crisisTimer + 1) % CYCLE;
    if (crisisTimer < NORMAL_DUR) {
      crisisPhase = Math.max(0, crisisPhase - 0.006);
    } else if (crisisTimer === NORMAL_DUR) {
      pickHub();
    }
    if (crisisTimer >= NORMAL_DUR && crisisTimer < NORMAL_DUR + RAMP_UP) {
      crisisPhase = Math.min(1, crisisPhase + 1 / RAMP_UP);
    } else if (crisisTimer >= NORMAL_DUR + RAMP_UP && crisisTimer < NORMAL_DUR + RAMP_UP + PEAK_DUR) {
      crisisPhase = 1;
    } else if (crisisTimer >= NORMAL_DUR + RAMP_UP + PEAK_DUR) {
      crisisPhase = Math.max(0, crisisPhase - 1 / RAMP_DOWN);
    }
    const cp = crisisPhase;

    if (shockAge >= 0 && shockAge < SHOCK_MAX) shockAge++;

    const centerX = W * 0.5, centerY = H * 0.5;
    nodes.forEach((n) => {
      const bx = n.baseX + Math.sin(t * n.sp + n.ph) * n.ax;
      const by = n.baseY + Math.cos(t * n.sp * 0.7 + n.ph) * n.ay;
      n.x = lerp(bx, centerX, cp * 0.12);
      n.y = lerp(by, centerY, cp * 0.12);
      n.highlight = Math.max(0, n.highlight - 0.03);
    });

    nearestNode = -1;
    let minD = 70;
    nodes.forEach((n, i) => {
      const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      if (d < minD) { minD = d; nearestNode = i; }
    });
    if (nearestNode >= 0) {
      nodes[nearestNode].highlight = 1;
      adj[nearestNode].forEach(a => { nodes[a.node].highlight = Math.max(nodes[a.node].highlight, 0.6); });
    }

    edges.forEach((e) => {
      const na = nodes[e.a], nb = nodes[e.b];
      const secA = SECTORS[na.sector];

      let hov = 0;
      if (nearestNode >= 0 && (e.a === nearestNode || e.b === nearestNode)) hov = 1;

      let alpha, width, col;

      if (e.intra) {
        const baseCol = secA.color;
        col = lerp3(baseCol, CRISIS_COL, cp * 0.7);
        alpha = lerp(0.12, 0.30, cp) + hov * 0.2;
        width = lerp(e.baseW * 0.7, e.baseW * 1.4, cp) + hov * 0.4;
      } else {
        col = lerp3([170, 170, 170], CRISIS_COL, cp);
        alpha = lerp(0.0, 0.22, cp) + hov * 0.15;
        width = lerp(0, e.baseW * 1.2, cp) + hov * 0.3;
      }

      if (alpha < 0.005) return;

      if (!e.intra && cp < 0.5) ctx.setLineDash([3, 4]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
      ctx.strokeStyle = rgba(col, alpha);
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    if (shockAge >= 0 && shockAge < SHOCK_MAX) {
      const radius = shockAge * SHOCK_SPEED;
      const fade = Math.max(0, 1 - shockAge / SHOCK_MAX);
      ctx.beginPath();
      ctx.arc(shockOrigin.x, shockOrigin.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(CRISIS_COL, fade * 0.12);
      ctx.lineWidth = 1.5 * fade;
      ctx.stroke();
      if (radius > 20) {
        ctx.beginPath();
        ctx.arc(shockOrigin.x, shockOrigin.y, radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(CRISIS_COL, fade * 0.06);
        ctx.lineWidth = 0.8 * fade;
        ctx.stroke();
      }
    }

    nodes.forEach((n, i) => {
      const sec = SECTORS[n.sector];
      const col = lerp3(sec.color, CRISIS_COL, cp * 0.6);
      const isHub = (i === hubNode && cp > 0.3);
      const r = isHub ? lerp(n.r, n.r * 2.2, cp) : n.r;
      const hov = n.highlight;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(col, lerp(0.35, 0.65, cp) + hov * 0.25);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(col, lerp(0.25, 0.55, cp) + hov * 0.3);
      ctx.lineWidth = 0.7 + hov * 0.5;
      ctx.stroke();

      if (isHub) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6 * cp, 0, Math.PI * 2);
        ctx.fillStyle = rgba(CRISIS_COL, cp * 0.08);
        ctx.fill();
      }
    });

    ctx.restore();
    requestAnimationFrame(draw);
  })();
})();
