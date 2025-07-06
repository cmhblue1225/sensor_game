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
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - cameraOffset, this.y, this.width, this.height);
    }
}
