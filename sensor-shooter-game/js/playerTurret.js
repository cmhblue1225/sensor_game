class PlayerTurret {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.aimX = x; // Aiming target X
        this.aimY = y; // Aiming target Y
        this.angle = 0; // Angle of the turret barrel
        this.fireRate = 0.2; // Seconds between shots
        this.lastShotTime = 0;
        this.health = 100;
    }

    update(deltaTime, tiltInput) {
        // Update aim based on tiltInput
        // Assuming tiltInput.x and tiltInput.y are normalized values (-1 to 1)
        // Map these to canvas coordinates
        const canvasWidth = 800; // Assuming canvas width
        const canvasHeight = 600; // Assuming canvas height

        // Adjust sensitivity for aiming
        const aimSensitivity = 200; 
        this.aimX = this.x + tiltInput.x * aimSensitivity;
        this.aimY = this.y + tiltInput.y * aimSensitivity;

        // Clamp aimX and aimY to stay within reasonable bounds (e.g., within the canvas)
        this.aimX = Math.max(0, Math.min(canvasWidth, this.aimX));
        this.aimY = Math.max(0, Math.min(canvasHeight, this.aimY));

        // Calculate angle to aim target
        this.angle = Math.atan2(this.aimY - this.y, this.aimX - this.x);

        // Update last shot time
        this.lastShotTime += deltaTime;
    }

    draw(ctx) {
        console.log(`Drawing PlayerTurret at (${this.x}, ${this.y}) aiming at (${this.aimX}, ${this.aimY})`);
        // Draw turret base
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw turret barrel
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'gray';
        ctx.fillRect(0, -5, this.radius + 20, 10); // Barrel
        ctx.restore();

        // Draw aim target (crosshair)
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.aimX, this.aimY, 10, 0, Math.PI * 2);
        ctx.moveTo(this.aimX - 15, this.aimY);
        ctx.lineTo(this.aimX + 15, this.aimY);
        ctx.moveTo(this.aimX, this.aimY - 15);
        ctx.lineTo(this.aimX, this.aimY + 15);
        ctx.stroke();
    }

    canShoot() {
        return this.lastShotTime >= this.fireRate;
    }

    shoot() {
        this.lastShotTime = 0;
        // Return projectile properties
        const barrelLength = this.radius + 20;
        const projectileX = this.x + Math.cos(this.angle) * barrelLength;
        const projectileY = this.y + Math.sin(this.angle) * barrelLength;
        return { x: projectileX, y: projectileY, angle: this.angle };
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
}
