class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.gameLoopCallbacks = [];

        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));
    }

    resizeCanvas() {
        // Set a fixed size for the game canvas, or make it responsive
        this.canvas.width = 800; 
        this.canvas.height = 600; 
    }

    start() {
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Execute all registered game loop callbacks
        this.gameLoopCallbacks.forEach(callback => {
            callback(deltaTime);
        });

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Register a function to be called every frame in the game loop.
     * @param {function(deltaTime: number)} callback - The function to call.
     */
    onUpdate(callback) {
        this.gameLoopCallbacks.push(callback);
    }

    /**
     * Get the 2D rendering context.
     * @returns {CanvasRenderingContext2D}
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Get the canvas element.
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }
}
