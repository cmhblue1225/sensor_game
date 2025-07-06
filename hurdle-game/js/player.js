class Player {
    constructor(x, y, color, isAI = false) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
        this.color = color;
        this.isAI = isAI;

        this.speed = 200; // pixels per second
        this.velocityY = 0;
        this.gravity = 800; // pixels per second squared
        this.jumpStrength = -400; // initial jump velocity

        this.isJumping = false;
        this.isGrounded = true;
        this.distance = 0; // distance covered
        this.rank = 0; // current rank
        this.finished = false; // true if finished the race
    }

    update(deltaTime) {
        if (this.finished) return;

        // Apply gravity
        this.velocityY += this.gravity * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Keep player on the ground
        if (this.y + this.height > 500) { // Assuming ground is at y=500
            this.y = 500 - this.height;
            this.velocityY = 0;
            this.isJumping = false;
            this.isGrounded = true;
        }

        // Move forward
        this.x += this.speed * deltaTime;
        this.distance += this.speed * deltaTime;
    }

    jump() {
        if (this.isGrounded) {
            this.velocityY = this.jumpStrength;
            this.isJumping = true;
            this.isGrounded = false;
        }
    }

    draw(ctx, cameraOffset) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - cameraOffset, this.y, this.width, this.height);

        // Draw a simple head
        ctx.beginPath();
        ctx.arc(this.x - cameraOffset + this.width / 2, this.y - 15, 15, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    // Check collision with a hurdle
    checkCollision(hurdle) {
        // Simple AABB collision detection
        return this.x < hurdle.x + hurdle.width &&
               this.x + this.width > hurdle.x &&
               this.y < hurdle.y + hurdle.height &&
               this.y + this.height > hurdle.y;
    }
}
