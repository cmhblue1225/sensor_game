class Hurdle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#8B4513'; // SaddleBrown
        this.passedByAI = []; // To track which AI players have attempted this hurdle
    }

    draw(ctx, cameraOffset) {
        const drawX = this.x - cameraOffset;

        // Vertical posts
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX, this.y, this.width * 0.2, this.height); // Left post
        ctx.fillRect(drawX + this.width * 0.8, this.y, this.width * 0.2, this.height); // Right post

        // Horizontal bar
        ctx.fillStyle = '#A0522D'; // Sienna, slightly different color
        ctx.fillRect(drawX, this.y + this.height * 0.2, this.width, this.height * 0.1); // Main bar
    }
}
