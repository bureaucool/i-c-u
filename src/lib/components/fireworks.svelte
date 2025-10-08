<script lang="ts">
	import { browser } from '$app/environment';
	import { useRaf } from '$lib/hooks/use-raf';

	let {
		width = 0,
		height = 0,
		spawnRate = 5,
		particlesPerBurst = 120,
		particleMinSpeed = 120,
		particleMaxSpeed = 380,
		particleMinLife = 700,
		particleMaxLife = 1400,
		particleSize = 5,
		colors = ['#ff6b6b', '#ffd93d', '#6bcBef', '#b28dff', '#6ee7b7'],
		opacity = 1,
		devicePixelRatioClamp = 2,
		paused = false,
		class: className = ''
	}: {
		width?: number;
		height?: number;
		spawnRate?: number; // bursts per second
		particlesPerBurst?: number;
		particleMinSpeed?: number; // px/s
		particleMaxSpeed?: number; // px/s
		particleMinLife?: number; // ms
		particleMaxLife?: number; // ms
		particleSize?: number; // CSS px (scaled by DPR)
		colors?: string[];
		opacity?: number;
		devicePixelRatioClamp?: number;
		paused?: boolean;
		class?: string;
	} = $props();

	let canvas: HTMLCanvasElement | undefined;
	let ctx: CanvasRenderingContext2D | null = null;
	let dpr = 1;

	type Particle = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number; // ms remaining
		ttl: number; // ms total
		color: string;
	};

	let particles: Particle[] = [];
	let accumulatorMs = 0;
	let lastSpawnAtMs = 0;

	function randomBetween(min: number, max: number) {
		return min + Math.random() * (max - min);
	}

	function resizeCanvas(targetWidth: number, targetHeight: number) {
		if (!canvas) return;
		// If width/height props are 0, use element/client size
		const cssWidth = targetWidth || canvas.clientWidth || (browser ? window.innerWidth : 0);
		const cssHeight = targetHeight || canvas.clientHeight || (browser ? window.innerHeight : 0);
		dpr = Math.min(browser ? window.devicePixelRatio || 1 : 1, devicePixelRatioClamp);
		canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
		canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
		canvas.style.width = cssWidth + 'px';
		canvas.style.height = cssHeight + 'px';
		ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.globalAlpha = opacity;
		}
	}

	function spawnBurst() {
		if (!canvas) return;
		const cx = (canvas.width / dpr) * 0.5;
		const cy = (canvas.height / dpr) * 0.5;
		const count = particlesPerBurst | 0;
		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = randomBetween(particleMinSpeed, particleMaxSpeed) / 1000; // px/ms
			const vx = Math.cos(angle) * speed;
			const vy = Math.sin(angle) * speed;
			const ttl = randomBetween(particleMinLife, particleMaxLife);
			const color = colors[(Math.random() * colors.length) | 0] || '#ffffff';
			particles.push({ x: cx, y: cy, vx, vy, life: ttl, ttl, color });
		}
	}

	function step(deltaMs: number) {
		if (!ctx || !canvas) return;
		if (!paused) {
			accumulatorMs += deltaMs;
			const spawnInterval = 1000 / Math.max(0.0001, spawnRate);
			if (accumulatorMs - lastSpawnAtMs >= spawnInterval) {
				lastSpawnAtMs = accumulatorMs;
				spawnBurst();
			}
		}

		// Clear
		ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

		// Update + draw
		const next: Particle[] = [];
		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];
			const lifeLeft = p.life - deltaMs;
			if (lifeLeft > 0) {
				p.life = lifeLeft;
				p.x += p.vx * deltaMs;
				p.y += p.vy * deltaMs;
				// Fading alpha based on remaining life
				const a = Math.max(0, Math.min(1, p.life / p.ttl));
				ctx.fillStyle = p.color;
				ctx.globalAlpha = a * opacity;
				ctx.beginPath();
				ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
				ctx.fill();
				next.push(p);
			}
		}
		particles = next;
		// Reset global alpha for next frame
		ctx.globalAlpha = opacity;
	}

	useRaf((delta) => {
		step(delta);
	});

	function handleResize() {
		resizeCanvas(width, height);
	}

	$effect(() => {
		if (!browser) return;
		handleResize();
		const onResize = () => handleResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	$effect(() => {
		// Reset particles when key parameters change
		particles = [];
		lastSpawnAtMs = 0;
		accumulatorMs = 0;
	});

	$inspect?.({ particles: () => particles.length });
</script>

<canvas bind:this={canvas} class="block {className}"></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
