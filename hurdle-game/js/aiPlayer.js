class AIPlayer extends Player {
    constructor(x, y, color, aiStrategy) {
        super(x, y, color, true);
        this.aiStrategy = aiStrategy; // Function that dictates AI behavior
        this.speed = 180 + Math.random() * 40; // Slightly varied speed
    }

    update(deltaTime, hurdles) {
        super.update(deltaTime);

        if (this.finished) return;

        // AI logic to jump over hurdles
        for (let i = 0; i < hurdles.length; i++) {
            const hurdle = hurdles[i];
            // Check if hurdle is approaching and not yet jumped over
            if (hurdle.x > this.x && hurdle.x < this.x + this.width + 150 && !hurdle.passedByAI.includes(this)) {
                if (this.isGrounded) {
                    this.jump();
                    hurdle.passedByAI.push(this); // Mark hurdle as attempted by this AI
                }
                break; // Only consider the closest hurdle
            }
        }
    }
}
