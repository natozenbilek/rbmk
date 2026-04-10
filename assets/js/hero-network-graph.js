(function() {
  const C = window.RBMK_NET_CONFIG;
  const SECTORS = C.SECTORS;
  const NODES_PER_SECTOR = C.NODES_PER_SECTOR;

  const nodes = [];
  SECTORS.forEach((sec, si) => {
    for (let j = 0; j < NODES_PER_SECTOR; j++) {
      const angle = (j / NODES_PER_SECTOR) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 0.06 + Math.random() * 0.08;
      nodes.push({
        sector: si,
        nx: sec.cx + Math.cos(angle) * dist,
        ny: sec.cy + Math.sin(angle) * dist * 0.7,
        baseX: 0, baseY: 0, x: 0, y: 0,
        r: 2.5 + Math.random() * 1.5,
        ph: Math.random() * Math.PI * 2,
        sp: 0.0004 + Math.random() * 0.0008,
        ax: 1.0 + Math.random() * 1.5,
        ay: 0.8 + Math.random() * 1.2,
        highlight: 0,
      });
    }
  });

  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].nx - nodes[j].nx, dy = nodes[i].ny - nodes[j].ny;
      const d = Math.sqrt(dx * dx + dy * dy);
      const sameSector = nodes[i].sector === nodes[j].sector;
      if (sameSector && d < 0.20) {
        edges.push({ a: i, b: j, intra: true, baseW: 0.6 + Math.random() * 0.4 });
      } else if (!sameSector && d < 0.22 && Math.random() < 0.15) {
        edges.push({ a: i, b: j, intra: false, baseW: 0.3 + Math.random() * 0.3 });
      }
    }
  }

  const adj = Array.from({ length: nodes.length }, () => []);
  edges.forEach((e, i) => {
    adj[e.a].push({ node: e.b, edge: i });
    adj[e.b].push({ node: e.a, edge: i });
  });

  window.RBMK_NET = { nodes, edges, adj };
})();
