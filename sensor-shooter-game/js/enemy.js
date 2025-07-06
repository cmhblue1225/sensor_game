class Enemy {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.health = 5;
        this.isAlive = true;

        // Calculate direction towards center (400, 300)
        const targetX = 400;
        const targetY = 300;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    update(deltaTime) {
        if (!this.isAlive) return;
        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;
    }

    draw(ctx) {
        if (!this.isAlive) return;
        console.log(`Drawing Enemy at (${this.x}, ${this.y}) with radius ${this.radius}`);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar (simple)
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2 * (this.health / 5), 5);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isAlive = false;
        }
    }

    // Check if enemy reached the center
    hasReachedCenter() {
        const centerX = 400;
        const centerY = 300;
        const distance = Math.sqrt(Math.pow(this.x - centerX, 2) + Math.pow(this.y - centerY, 2));
        return distance < this.radius; // If distance is less than its radius, it's at the center
    }
}
