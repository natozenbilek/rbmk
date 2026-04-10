window.RBMKMath = {
  rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; },
  lerp(a, b, t) { return a + (b - a) * t; },
  lerp3(a, b, t) {
    return [
      this.lerp(a[0], b[0], t),
      this.lerp(a[1], b[1], t),
      this.lerp(a[2], b[2], t),
    ];
  },
};
