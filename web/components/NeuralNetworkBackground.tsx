'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  pulse: number;
  pulseDirection: number;
}

interface Connection {
  from: number;
  to: number;
  strength: number;
  active: boolean;
  pulsePosition: number;
}

export default function NeuralNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes
    const nodeCount = 25;
    const nodes: Node[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: [],
        pulse: Math.random() * Math.PI * 2,
        pulseDirection: Math.random() > 0.5 ? 1 : -1
      });
    }

    // Create connections
    const connections: Connection[] = [];
    const maxDistance = 150;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance && Math.random() > 0.7) {
          connections.push({
            from: i,
            to: j,
            strength: 1 - (distance / maxDistance),
            active: Math.random() > 0.5,
            pulsePosition: 0
          });
          nodes[i].connections.push(j);
          nodes[j].connections.push(i);
        }
      }
    }

    nodesRef.current = nodes;
    connectionsRef.current = connections;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;

      // Update and draw connections
      connectionsRef.current.forEach((connection, index) => {
        const fromNode = nodesRef.current[connection.from];
        const toNode = nodesRef.current[connection.to];
        
        // Update pulse position
        connection.pulsePosition += 0.02;
        if (connection.pulsePosition > 1) {
          connection.pulsePosition = 0;
          connection.active = Math.random() > 0.3;
        }

        if (connection.active) {
          const gradient = ctx.createLinearGradient(
            fromNode.x, fromNode.y,
            toNode.x, toNode.y
          );
          
          const pulsePos = connection.pulsePosition;
          const tealColor = `rgba(20, 184, 166, ${connection.strength * 0.8})`;
          const transparentTeal = `rgba(20, 184, 166, 0)`;
          
          gradient.addColorStop(0, transparentTeal);
          gradient.addColorStop(Math.max(0, pulsePos - 0.1), transparentTeal);
          gradient.addColorStop(pulsePos, tealColor);
          gradient.addColorStop(Math.min(1, pulsePos + 0.1), transparentTeal);
          gradient.addColorStop(1, transparentTeal);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2 * connection.strength;
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();
        }
      });

      // Update and draw nodes
      nodesRef.current.forEach((node, index) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep nodes in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Update pulse
        node.pulse += 0.02 * node.pulseDirection;
        if (node.pulse > Math.PI * 2) node.pulse = 0;

        // Draw node
        const pulseIntensity = (Math.sin(node.pulse) + 1) * 0.5;
        const baseRadius = 3;
        const radius = baseRadius + pulseIntensity * 2;
        
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 2
        );
        
        gradient.addColorStop(0, `rgba(20, 184, 166, ${0.8 + pulseIntensity * 0.2})`);
        gradient.addColorStop(0.5, `rgba(20, 184, 166, ${0.4 + pulseIntensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(20, 184, 166, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + pulseIntensity * 0.1})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Randomly activate/deactivate connections
      if (Math.random() > 0.98) {
        const randomConnection = connectionsRef.current[Math.floor(Math.random() * connectionsRef.current.length)];
        if (randomConnection) {
          randomConnection.active = !randomConnection.active;
          randomConnection.pulsePosition = 0;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b  50%, #334155 100%)',
        zIndex: -1
      }}
    />
  );
}