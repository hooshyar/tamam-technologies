/**
 * Elegant Vector Data Store Visualization
 * Minimal, refined presentation with larger nodes
 */

class VectorStoreVisualization {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');

    // Tamam Brand Colors (from logo)
    this.colors = {
      primary: { r: 233, g: 30, b: 158 },      // #E91E9E - Pink/Magenta
      primaryLight: { r: 245, g: 77, b: 184 }, // #F54DB8 - Light Pink
      secondary: { r: 26, g: 43, b: 95 },      // #1A2B5F - Dark Navy Blue
      secondaryLight: { r: 37, g: 58, b: 122 },// #253A7A - Light Navy
    };

    // Vector database style nodes
    this.nodes = [];
    this.numNodes = 45;

    // Vector database style labels
    this.labels = [
      'doc_0x7f2a', 'query_128', 'embed_512', 'vec_0xa3', 'idx_1024',
      'doc_0x3b1c', 'query_256', 'embed_768', 'vec_0xf9', 'idx_2048',
      'chunk_42', 'token_89', 'node_0x1f', 'ref_384', 'dim_1536',
      'doc_0x8e4d', 'query_64', 'embed_384', 'vec_0x2c', 'idx_512',
      'chunk_17', 'token_33', 'node_0x7a', 'ref_128', 'dim_768',
      'doc_0x5f9e', 'query_512', 'embed_256', 'vec_0xb4', 'idx_768',
      'chunk_91', 'token_56', 'node_0x3d', 'ref_256', 'dim_512',
      'doc_0x2a7b', 'query_384', 'embed_1024', 'vec_0x8f', 'idx_384',
      'chunk_28', 'token_71', 'node_0x9c', 'ref_512', 'dim_256'
    ];

    // Subtle connections
    this.connections = [];

    // Mouse
    this.mouse = { x: null, y: null, active: false };

    // Animation
    this.time = 0;

    // Mobile adjustments
    if (window.innerWidth < 768) {
      this.numNodes = 25;
    }

    this.init();
    this.setupEvents();
    this.animate();
  }

  init() {
    this.resize();
    this.createNodes();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  createNodes() {
    this.nodes = [];

    for (let i = 0; i < this.numNodes; i++) {
      const size = 3 + Math.random() * 4;
      const isPrimary = Math.random() > 0.5;

      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        baseX: 0,
        baseY: 0,
        size: size,
        baseSize: size,
        color: isPrimary ? this.colors.primary : this.colors.secondary,
        alpha: 0.4 + Math.random() * 0.3,
        baseAlpha: 0.4 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0003 + Math.random() * 0.0005,
        orbitRadius: 10 + Math.random() * 20,
        highlighted: false,
        pulse: 0,
        label: this.labels[i % this.labels.length]
      });

      this.nodes[i].baseX = this.nodes[i].x;
      this.nodes[i].baseY = this.nodes[i].y;
    }
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createNodes();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;
      this.mouse.active = true;
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.mouse.active = false;
    });
  }

  animate() {
    this.time += 0.008;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  update() {
    for (const node of this.nodes) {
      // Gentle floating motion
      const floatX = Math.sin(this.time + node.phase) * node.orbitRadius * 0.3;
      const floatY = Math.cos(this.time * 0.7 + node.phase) * node.orbitRadius * 0.3;

      node.x = node.baseX + floatX;
      node.y = node.baseY + floatY;

      // Slow drift of base position
      node.baseX += Math.sin(this.time * 0.1 + node.phase) * 0.1;
      node.baseY += Math.cos(this.time * 0.08 + node.phase) * 0.1;

      // Keep in bounds with soft wrapping
      if (node.baseX < -50) node.baseX = this.width + 50;
      if (node.baseX > this.width + 50) node.baseX = -50;
      if (node.baseY < -50) node.baseY = this.height + 50;
      if (node.baseY > this.height + 50) node.baseY = -50;

      // Mouse interaction
      if (this.mouse.active) {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactRadius = 200;

        if (dist < interactRadius) {
          const force = Math.pow(1 - dist / interactRadius, 2);
          node.highlighted = true;
          node.alpha = node.baseAlpha + force * 0.5;
          node.size = node.baseSize * (1 + force * 0.3);
          node.pulse = force;
        } else {
          node.highlighted = false;
          node.alpha += (node.baseAlpha - node.alpha) * 0.05;
          node.size += (node.baseSize - node.size) * 0.05;
          node.pulse *= 0.95;
        }
      } else {
        node.highlighted = false;
        node.alpha += (node.baseAlpha - node.alpha) * 0.05;
        node.size += (node.baseSize - node.size) * 0.05;
        node.pulse *= 0.95;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawConnections();
    this.drawNodes();

    if (this.mouse.active) {
      this.drawCursor();
    }
  }

  drawConnections() {
    // Draw elegant lines between nearby nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 180;

        if (dist < maxDist) {
          const alpha = Math.pow(1 - dist / maxDist, 2) * 0.12;

          // Brighten if either node is highlighted
          const highlightBoost = (a.highlighted || b.highlighted) ? 0.15 : 0;

          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = `rgba(233, 30, 158, ${alpha + highlightBoost})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    }

    // Draw lines to cursor
    if (this.mouse.active) {
      for (const node of this.nodes) {
        if (node.highlighted) {
          const dx = this.mouse.x - node.x;
          const dy = this.mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          this.ctx.beginPath();
          this.ctx.moveTo(node.x, node.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = `rgba(233, 30, 158, ${node.pulse * 0.3})`;
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
        }
      }
    }
  }

  drawNodes() {
    for (const node of this.nodes) {
      const c = node.color;

      // Outer glow (subtle)
      const glowSize = node.size * 2.5;
      const glowGradient = this.ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, glowSize
      );
      glowGradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${node.alpha * 0.5})`);
      glowGradient.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, ${node.alpha * 0.1})`);
      glowGradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
      this.ctx.fillStyle = glowGradient;
      this.ctx.fill();

      // Main node - soft circle
      const nodeGradient = this.ctx.createRadialGradient(
        node.x - node.size * 0.3, node.y - node.size * 0.3, 0,
        node.x, node.y, node.size
      );
      nodeGradient.addColorStop(0, `rgba(${c.r + 40}, ${c.g + 40}, ${c.b + 40}, ${node.alpha})`);
      nodeGradient.addColorStop(0.7, `rgba(${c.r}, ${c.g}, ${c.b}, ${node.alpha * 0.8})`);
      nodeGradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, ${node.alpha * 0.3})`);

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      this.ctx.fillStyle = nodeGradient;
      this.ctx.fill();

      // Inner highlight
      if (node.size > 10) {
        this.ctx.beginPath();
        this.ctx.arc(node.x - node.size * 0.25, node.y - node.size * 0.25, node.size * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${node.alpha * 0.4})`;
        this.ctx.fill();
      }

      // Pulse ring when highlighted
      if (node.pulse > 0.1) {
        const pulseRadius = node.size * (1.5 + node.pulse);
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${node.pulse * 0.3})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      // Draw label (vector database style - monospace, small)
      const labelAlpha = node.highlighted ? 0.85 : node.alpha * 0.7;
      this.ctx.font = `${node.highlighted ? '10px' : '9px'} 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace`;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${labelAlpha})`;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(node.label, node.x + node.size + 6, node.y + 3);
    }
  }

  drawCursor() {
    const c = this.colors.primary;

    // Subtle cursor glow
    const gradient = this.ctx.createRadialGradient(
      this.mouse.x, this.mouse.y, 0,
      this.mouse.x, this.mouse.y, 100
    );
    gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.08)`);
    gradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, 100, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Small center dot
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.6)`;
    this.ctx.fill();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new VectorStoreVisualization('hero-canvas');
});
