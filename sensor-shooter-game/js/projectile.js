class Projectile {
    constructor(x, y, angle, speed, radius, color) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.radius = radius;
        this.color = color;
        this.isAlive = true;

        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;
    }

    update(deltaTime) {
        if (!this.isAlive) return;
        this.x += this.dx * deltaTime;
        this.y += this.dy * deltaTime;

        // Remove if out of bounds
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.isAlive = false;
        }
    }

    draw(ctx) {
        if (!this.isAlive) return;
        console.log(`Drawing Projectile at (${this.x}, ${this.y})`);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Simple circle-circle collision detection
    checkCollision(enemy) {
        if (!enemy.isAlive) return false;
        const distance = Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2));
        return distance < this.radius + enemy.radius;
    }
}
