class Timer extends Phaser.Scene {

    constructor() {
        super('timer');

    }

    init(scene) {
        this.scene = scene;
    }

    create() {
        
        this.scoreText = this.scene.add.text(20, 10, "", {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#000000',
        });

        this.elapsedTime = 0;
    }

    update(delta) {

        this.scoreText.x = this.scene.camera.scrollX + 20;

        this.elapsedTime += delta;


    //    let elapsedMS = Math.floor(this.elapsedTime / 10);
        let elapsedSeconds = (this.elapsedTime / 1000);
        let elapsedMinutes = Math.floor(elapsedSeconds / 60);

        elapsedSeconds -= 60 * elapsedMinutes;
        elapsedSeconds = Math.trunc(elapsedSeconds * 100) / 100

        if (elapsedMinutes < 10) this.scoreText.text = "0" + String(elapsedMinutes) + ":" + String(elapsedSeconds);
        else this.scoreText.text = String(elapsedMinutes) + ":" + String(elapsedSeconds);

    }
}