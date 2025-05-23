class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        this.physics.world.gravity.y = 1800;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("heist_json", 18, 18, 120, 20);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.industrial_tileset = this.map.addTilesetImage("pixel_industrial", "industrial_tiles");
        this.block_tileset = this.map.addTilesetImage("block_tiles", "block_tiles");

        // Create a layer
        this.groundBTLayer = this.map.createLayer("Ground - bt", this.block_tileset, 0, 0);
        this.groundPILayer = this.map.createLayer("Ground - pi", this.industrial_tileset, 0, 0);
        this.dangerLayer = this.map.createLayer("Danger", this.industrial_tileset, 0, 0);
        this.groundBTLayer.setScale(2); 
        this.groundPILayer.setScale(2);
        this.dangerLayer.setScale(2);

        // Make it collidable
        this.groundBTLayer.setCollisionByProperty({
            collides: true
        });
        this.groundPILayer.setCollisionByProperty({
            collides: true
        });

        // set up player avatar
        // default: 125, 550
        // test artifact: 4000, 300
        this.player = new Player(this, 125, 550, "glass-test");
        this.player.setScale(2);

        this.freezePlayer = false;

        
        this.physics.world.drawDebug = false;
        /*
        // debug key listener (assigned to J key)
        this.input.keyboard.on('keydown-J', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
        */

        this.input.keyboard.on('keydown-R', () => {
            this.slide.volume = 0;
            this.doorSFX.stop();
            this.scene.restart();
        });

        this.camera = this.cameras.main;
        this.camera.setBounds(0, 0, 4320, this.game.config.height);
        this.resumeCamera();

        this.artifact = new Artifact(this, 4068, 360, "artifact");
        this.artifactVisible = true;

        this.door = new Door(this, 18*4, -18 * 3, "door");
        this.door.setScale(2);
        this.door.setDepth(-10);

        this.physics.world.TILE_BIAS = 36;

        this.particles = new Particles();
        this.particles.init(this, this.player);
        this.particles.create();

        this.footstep1 = this.sound.add("footstep1", {
            volume: 1
        });

        this.footstep2 = this.sound.add("footstep2", {
            volume: 1
        });

        this.playFootstep1 = true;
        this.timeBetweenFootsteps = 0.3 * 1000;
        this.footstepTimer = this.timeBetweenFootsteps;

        this.thud = this.sound.add("thud");

        this.slide = this.sound.add("slide", {
            volume: 0,
            loop: true
        });
        this.slide.play();

        this.jump = this.sound.add("jump", {
            volume: 1.6
        });

        this.longJump = this.sound.add("long_jump", {
            volume: 1.6
        });

        this.wallJump = this.sound.add("wall_jump", {
            volume: 1.6
        });

        this.dive = this.sound.add("dive", {
            volume: 1.6
        });

        this.doorSFX = this.sound.add("door", {
            volume: 1.5,
            loop: true
        });

        this.doorCloseSFX = this.sound.add("door_close", {
            volume: 2
        });

        this.physics.add.sprite(this.door).setScale(2);
        this.physics.add.collider(this.door, this.player);
        this.door.arcadeBody = this.physics.add.existing(this.door, true);

        this.physics.add.sprite(this.artifact);
  //      this.physics.add.collider(this.artifact, this.player);
        this.artifact.arcadeBody = this.physics.add.existing(this.artifact, true);
        this.artifactCollider = null;

        this.invisibleWall = this.add.rectangle(0, 0, 40, 1440);
        this.physics.add.sprite(this.invisibleWall);
        this.physics.add.collider(this.invisibleWall, this.player, this.complete, null, this);
        this.invisibleWall.arcadeBody = this.physics.add.existing(this.invisibleWall, true);

        //set up arcade physics
        this.player.initPhysics(this.groundBTLayer, this.groundPILayer, this.door, this.artifact);

        
        this.timer = new Timer();
        this.timer.init(this);
        this.timer.create();
        this.runTimer = true;
      //  this.timer.scoreText.scrollF
                
    }

    complete() {
        if (this.player.flipped) {

            this.runTimer = false;
            this.slide.volume = 0;
            this.freezeCamera();
            this.player.exitLevel();
            this.freezePlayer = true;

            this.tweens.add({
                targets: this.player,
                x: -50,
                duration: 100
            })

        }
    }

    setArtifactCollider(collider) {
        this.artifactCollider = collider;
    }

    killPlayer(velocityX, velocityY) {
        this.slide.volume = 0;
        this.particles.playerDied(velocityX, velocityY);
        this.freezeCamera();
        delete this.player;
    }

    freezeCamera() {
        this.camera.stopFollow();
    }

    resumeCamera() {
        this.camera.startFollow(this.player, false, 1, 1, -200, 0);

    }

    flipGravity() {

        this.artifactVisible = false;
        this.artifactCollider.destroy();
        this.artifact.destroy();

        this.physics.world.gravity.y = 0;
        this.physics.world.gravity.x = 0;
        this.player.flip();

        this.sound.play("power_up", {
            volume: 0.7
        });
        this.particles.playerGotArtifact();

        
        //pan camera left
        this.camera.stopFollow();
        this.time.addEvent({
            callback: () => this.camera.pan(0, 0, 2000),
            callbackContext: this,
            delay: 2000
        });

        

        // pan camera right
        this.time.addEvent({
            callback: () => this.camera.pan(4000, 0, 2000),
            callbackContext: this,
            delay: 6000
        });

        this.time.addEvent({
            callback: () => this.resumeCamera,
            callbackContext: this,
            delay: 8000
        });
        

        // freeze player
        this.setFreezePlayer(true);
        this.time.addEvent({
            callback: () => this.setFreezePlayer(false),
            callbackContext: this,
            delay: 8500
        });

        this.time.addEvent({
            callback: () => this.player.rotateSprite(),
            callbackContext: this,
            delay: 8500
        });

        this.time.addEvent({
            callback: () => this.physics.world.gravity.x = 1800,
            callbackContext: this,
            delay: 8500
        });

        
        

        this.door.startClosing();

        //setTimeout(this.player.flip, 1);
    }

    adjustRunSFX(delta) {

        if (this.player.running) {

            this.footstepTimer -= delta;
            if (this.footstepTimer <= 0) {

                this.footstepTimer = this.timeBetweenFootsteps;

                this.playFootstep1 ? this.footstep1.play() : this.footstep2.play();
                this.playFootstep1 = !this.playFootstep1;
            }

        } else {
            this.footstepTimer = 0;
        }

    }

    thudSFX(velocityY) {
        this.thud.volume = 0.8 + velocityY / 3000;
        this.thud.play();
    }

    slideSFX(play) {

        if (play) {
            this.slide.volume = 1.6;
        } else {
            this.tweens.add({
                targets:  this.slide,
                volume:   0,
                duration: 200
            });
        }
    }

    setFreezePlayer(freeze) {
        this.freezePlayer = freeze;
    }

    update(time, delta) {

        if (this.runTimer) this.timer.update(delta);
        this.artifact.update(this.artifactVisible);
        this.door.update();
        this.particles.update(delta);  

        if (this.player && !this.freezePlayer) {
            this.adjustRunSFX(delta);
            this.player.update(delta);
        }
    }
}