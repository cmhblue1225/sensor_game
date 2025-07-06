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

        this.isColliding = false;
        this.collisionTimer = 0;
        this.jumpFeedbackTimer = 0;
    }

    update(deltaTime) {
        if (this.finished) return;

        // Update collision feedback timer
        if (this.isColliding) {
            this.collisionTimer -= deltaTime;
            if (this.collisionTimer <= 0) {
                this.isColliding = false;
            }
        }

        // Update jump feedback timer
        if (this.jumpFeedbackTimer > 0) {
            this.jumpFeedbackTimer -= deltaTime;
        }

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
            this.jumpFeedbackTimer = 0.1; // Show jump feedback for 0.1 seconds
        }
    }

    handleCollisionFeedback() {
        this.isColliding = true;
        this.collisionTimer = 0.2; // Show collision feedback for 0.2 seconds
    }

    draw(ctx, cameraOffset) {
        const drawX = this.x - cameraOffset;

        let displayColor = this.color;
        if (this.isColliding) {
            displayColor = 'orange'; // Collision feedback color
        } else if (this.jumpFeedbackTimer > 0) {
            displayColor = 'yellow'; // Jump feedback color
        }

        // Body
        ctx.fillStyle = displayColor;
        ctx.fillRect(drawX, this.y, this.width, this.height);

        // Head
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2, this.y - 15, 15, 0, Math.PI * 2);
        ctx.fillStyle = displayColor;
        ctx.fill();

        // Simple legs (for running animation feel)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Darker color for legs
        if (this.isJumping) {
            ctx.fillRect(drawX + 5, this.y + this.height - 10, 10, 20); // Leg 1
            ctx.fillRect(drawX + this.width - 15, this.y + this.height - 20, 10, 20); // Leg 2
        } else {
            // Simple running animation by shifting legs slightly
            const legOffset = (Math.sin(Date.now() * 0.01 * (this.speed / 100)) * 5); // Adjust speed for animation
            ctx.fillRect(drawX + 5, this.y + this.height - 10 + legOffset, 10, 20); // Leg 1
            ctx.fillRect(drawX + this.width - 15, this.y + this.height - 10 - legOffset, 10, 20); // Leg 2
        }
    }

    // Check collision with a hurdle
    checkCollision(hurdle) {
        // Simple AABB collision detection
        const collided = this.x < hurdle.x + hurdle.width &&
               this.x + this.width > hurdle.x &&
               this.y < hurdle.y + hurdle.height &&
               this.y + this.height > hurdle.y;

        if (collided) {
            this.handleCollisionFeedback();
        }
        return collided;
    }
}
