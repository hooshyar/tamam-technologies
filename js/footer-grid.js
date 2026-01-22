/**
 * Interactive Footer Grid
 * Force-directed graph with draggable nodes and spring physics
 * Inspired by robot.co/playground/grid
 */

class FooterGrid {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'footer-grid-canvas';
    this.ctx = this.canvas.getContext('2d');

    // Insert canvas as first child
    this.container.insertBefore(this.canvas, this.container.firstChild);

    // Brand colors
    this.colors = {
      primary: { r: 233, g: 30, b: 158 },
      secondary: { r: 26, g: 43, b: 95 },
      line: 'rgba(233, 30, 158, 0.15)',
      lineHover: 'rgba(233, 30, 158, 0.4)',
    };

    // Physics settings
    this.physics = {
      springStrength: 0.03,
      damping: 0.85,
      repulsion: 800,
      centerGravity: 0.001,
    };

    // Nodes (footer items)
    this.nodes = [];
    this.connections = [];

    // Interaction state
    this.mouse = { x: 0, y: 0, isDown: false };
    this.draggedNode = null;
    this.hoveredNode = null;

    // Initialize
    this.init();
  }

  init() {
    this.resize();
    this.createNodes();
    this.createConnections();
    this.setupEvents();
    this.animate();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  createNodes() {
    // Find all interactive elements in footer
    const elements = this.container.querySelectorAll('.grid-node');

    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      const node = {
        el: el,
        id: el.dataset.nodeId || `node-${index}`,
        group: el.dataset.nodeGroup || 'default',
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
        targetX: rect.left - containerRect.left + rect.width / 2,
        targetY: rect.top - containerRect.top + rect.height / 2,
        originX: rect.left - containerRect.left + rect.width / 2,
        originY: rect.top - containerRect.top + rect.height / 2,
        vx: 0,
        vy: 0,
        width: rect.width,
        height: rect.height,
        radius: Math.max(rect.width, rect.height) / 2,
        isDragging: false,
        isHovered: false,
      };

      this.nodes.push(node);

      // Make element draggable
      el.style.position = 'absolute';
      el.style.left = (node.x - rect.width / 2) + 'px';
      el.style.top = (node.y - rect.height / 2) + 'px';
      el.style.cursor = 'grab';
      el.style.userSelect = 'none';
      el.style.transition = 'transform 0.1s ease';
    });
  }

  createConnections() {
    // Connect nodes based on groups and proximity
    const groups = {};

    // Group nodes
    this.nodes.forEach(node => {
      if (!groups[node.group]) groups[node.group] = [];
      groups[node.group].push(node);
    });

    // Connect within groups
    Object.values(groups).forEach(groupNodes => {
      for (let i = 0; i < groupNodes.length; i++) {
        for (let j = i + 1; j < groupNodes.length; j++) {
          this.connections.push({
            from: groupNodes[i],
            to: groupNodes[j],
            strength: 0.5,
          });
        }
      }
    });

    // Connect to center/brand node
    const centerNode = this.nodes.find(n => n.group === 'brand');
    if (centerNode) {
      this.nodes.forEach(node => {
        if (node !== centerNode && node.group !== 'brand') {
          this.connections.push({
            from: centerNode,
            to: node,
            strength: 0.2,
          });
        }
      });
    }
  }

  setupEvents() {
    // Mouse events
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.container.addEventListener('mouseup', () => this.onMouseUp());
    this.container.addEventListener('mouseleave', () => this.onMouseUp());

    // Touch events
    this.container.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.container.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.container.addEventListener('touchend', () => this.onMouseUp());

    // Resize
    window.addEventListener('resize', () => {
      this.resize();
      this.updateNodeOrigins();
    });
  }

  onMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    if (this.draggedNode) {
      this.draggedNode.targetX = this.mouse.x;
      this.draggedNode.targetY = this.mouse.y;
    }

    // Check for hover
    this.hoveredNode = null;
    this.nodes.forEach(node => {
      const dx = this.mouse.x - node.x;
      const dy = this.mouse.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      node.isHovered = dist < node.radius + 20;
      if (node.isHovered) this.hoveredNode = node;
    });
  }

  onMouseDown(e) {
    this.mouse.isDown = true;

    // Find clicked node
    this.nodes.forEach(node => {
      const dx = this.mouse.x - node.x;
      const dy = this.mouse.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < node.radius + 20) {
        this.draggedNode = node;
        node.isDragging = true;
        node.el.style.cursor = 'grabbing';
        node.el.style.zIndex = '10';
      }
    });
  }

  onMouseUp() {
    this.mouse.isDown = false;

    if (this.draggedNode) {
      this.draggedNode.isDragging = false;
      this.draggedNode.el.style.cursor = 'grab';
      this.draggedNode.el.style.zIndex = '';

      // Spring back to origin with momentum
      this.draggedNode.targetX = this.draggedNode.originX;
      this.draggedNode.targetY = this.draggedNode.originY;
      this.draggedNode = null;
    }
  }

  onTouchStart(e) {
    const touch = e.touches[0];
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = touch.clientX - rect.left;
    this.mouse.y = touch.clientY - rect.top;
    this.mouse.isDown = true;

    this.nodes.forEach(node => {
      const dx = this.mouse.x - node.x;
      const dy = this.mouse.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < node.radius + 30) {
        this.draggedNode = node;
        node.isDragging = true;
      }
    });
  }

  onTouchMove(e) {
    if (this.draggedNode) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;
      this.draggedNode.targetX = this.mouse.x;
      this.draggedNode.targetY = this.mouse.y;
    }
  }

  updateNodeOrigins() {
    this.nodes.forEach(node => {
      const rect = node.el.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      node.originX = rect.left - containerRect.left + rect.width / 2;
      node.originY = rect.top - containerRect.top + rect.height / 2;
      if (!node.isDragging) {
        node.targetX = node.originX;
        node.targetY = node.originY;
      }
    });
  }

  update() {
    // Update physics for each node
    this.nodes.forEach(node => {
      if (node.isDragging) {
        // Direct follow with slight lag
        const dx = node.targetX - node.x;
        const dy = node.targetY - node.y;
        node.vx = dx * 0.3;
        node.vy = dy * 0.3;
      } else {
        // Spring physics back to origin
        const dx = node.targetX - node.x;
        const dy = node.targetY - node.y;

        node.vx += dx * this.physics.springStrength;
        node.vy += dy * this.physics.springStrength;

        // Damping
        node.vx *= this.physics.damping;
        node.vy *= this.physics.damping;
      }

      // Apply velocity
      node.x += node.vx;
      node.y += node.vy;

      // Update element position
      node.el.style.left = (node.x - node.width / 2) + 'px';
      node.el.style.top = (node.y - node.height / 2) + 'px';

      // Scale effect on hover/drag
      if (node.isDragging) {
        node.el.style.transform = 'scale(1.05)';
      } else if (node.isHovered) {
        node.el.style.transform = 'scale(1.02)';
      } else {
        node.el.style.transform = 'scale(1)';
      }
    });

    // Apply connection forces (pull connected nodes slightly)
    if (this.draggedNode) {
      this.connections.forEach(conn => {
        if (conn.from === this.draggedNode || conn.to === this.draggedNode) {
          const other = conn.from === this.draggedNode ? conn.to : conn.from;
          const dx = this.draggedNode.x - other.x;
          const dy = this.draggedNode.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0) {
            const force = conn.strength * 0.05;
            other.vx += (dx / dist) * force * dist * 0.01;
            other.vy += (dy / dist) * force * dist * 0.01;
          }
        }
      });
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw connections
    this.connections.forEach(conn => {
      const isActive = conn.from.isDragging || conn.to.isDragging ||
                       conn.from.isHovered || conn.to.isHovered;

      this.ctx.beginPath();
      this.ctx.moveTo(conn.from.x, conn.from.y);
      this.ctx.lineTo(conn.to.x, conn.to.y);
      this.ctx.strokeStyle = isActive ? this.colors.lineHover : this.colors.line;
      this.ctx.lineWidth = isActive ? 2 : 1;
      this.ctx.stroke();

      // Draw small dots at connection points
      if (isActive) {
        [conn.from, conn.to].forEach(node => {
          this.ctx.beginPath();
          this.ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
          this.ctx.fillStyle = `rgba(233, 30, 158, 0.5)`;
          this.ctx.fill();
        });
      }
    });

    // Draw node indicators (subtle dots)
    this.nodes.forEach(node => {
      const alpha = node.isDragging ? 0.8 : (node.isHovered ? 0.5 : 0.2);
      const size = node.isDragging ? 6 : (node.isHovered ? 5 : 4);

      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(233, 30, 158, ${alpha})`;
      this.ctx.fill();
    });
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure CSS has been applied
  setTimeout(() => {
    new FooterGrid('footer-grid-container');
  }, 100);
});
