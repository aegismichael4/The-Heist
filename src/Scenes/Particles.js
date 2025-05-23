class Particles extends Phaser.Scene {

    constructor() {
        super('particle');
    }

    init(sceneRef, playerRef) {
        this.scene = sceneRef;
        this.player = playerRef;

        this.minPlayerShineTime = 0.2 * 1000;
        this.maxPlayerShineTime = 0.4 * 1000;
        this.playerShineTimer = 0;
    }

    create() {

        this.playerShine = this.scene.add.particles(0, 0, "plus_particle", {

            follow: this.player,
            lifespan: 250,
            scale: { start: 2.5, end: 0 },
            maxAliveParticles: 1,
            stopAfter: 1,
            alpha: { min: 0.4, max: 0.8 }

        }).stop();

        this.shards = [];
        

    }

    update(delta) {

        this.playerShineTimer -= delta;
        if (this.playerShineTimer <= 0) {

            this.playerShineTimer = Phaser.Math.Between(this.minPlayerShineTime, this.maxPlayerShineTime);
            this.playerShine.setPosition(0,0);
            this.playerShine.x += Phaser.Math.Between(-14, 14);
            this.playerShine.y += Phaser.Math.Between(-36, 36);
            this.playerShine.start();
            
            /*
            if (Math.floor(Math.random() * 10) == 5) this.scene.sound.play("ding", {

                volume: 0.05 + Phaser.Math.Between(0, 0.01),
            });
            */
        }

        for (let shard in this.shards) {

        }

    }

    playerDied(velocityX, velocityY) {

        this.scene.sound.play("shatter3", { volume: 0.08 });


        for (let i = 0; i < Phaser.Math.Between(3, 4); i++) {

            this.shards.push( this.scene.add.particles(0,0, "glass_particle", {

                follow: this.player,
                lifespan: 2000,
                stopAfter: 1,
                scale: { min: 2, max: 4 },
                gravityY: 1800,
                bounce: 1,
                rotate: {min: 0, max: 180},

                speedX: { start: (velocityX * 0.75) + Phaser.Math.Between(-200, 200), end: 0 },
                speedY: (velocityY * 0.75) + Phaser.Math.Between(-400, -100),
            }));

            this.shards[this.shards.length - 1].setPosition(0,0);
            this.shards[this.shards.length - 1].x += Phaser.Math.Between(-16, 16);
            this.shards[this.shards.length - 1].y += Phaser.Math.Between(-25, 25);

        }
    }

    playerGotArtifact() {
        
        let artifactParticles = this.scene.add.particles(0,0, "glass_particle", {

            follow: this.player,
            lifespan: 2000,
            scale: { min: 2, max: 4 },
            gravityY: 1800,
            bounce: 1,
            rotate: {min: 0, max: 180},
            speedX: {min: -500, max: 500},
            speedY: {min: -800, max: -100},
            stopAfter: 50
        });
        
    }
}