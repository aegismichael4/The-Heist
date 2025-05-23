class Player extends Phaser.GameObjects.Sprite {

    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

        scene.add.existing(this);

        this.scene = scene;

        this.setScale(1.5);
        
        this.init();
        this.create();

        return this;
    }

    init() {

        this.flipped = false;
        this.flipPause = false;

        // physics config
        this.MAX_X_VELOCITY = 400;
        this.ACCELERATION = 2000;
        this.GROUND_TURN_AROUND = 5000;
        this.AIR_ACCELERATION = 1000;
        this.AIR_TURN_AROUND = 3500;
        this.AIR_TURN_AROUND_BOOST = 6000;
        this.TRUE_MAX_X_VELOCITY = 1000;
        this.GROUND_DRAG = 1800;
        this.AIR_DRAG = 400;
        this.INITIAL_JUMP_Y_VELOCITY = -800;
        this.SUSTAINED_JUMP_Y_ACCELERATION = -300;
        this.SHORT_HOP_DESCELERATION = 4500;
        this.WALL_JUMP_X_VELOCITY = 200;
        this.WALL_JUMP_Y_VELOCITY = -650;
        this.SLIDE_X_VELOCITY = 600;
        this.SLIDE_JUMP_X_VELOCITY = 800;
        this.SLIDE_JUMP_Y_VELOCITY = -450;
        this.DIVE_X_VELOCITY = 650;
        this.DIVE_Y_VELOCITY = -500;

        // fixing phaser's silly bug
        this.outOfBoundsY = this.scene.game.config.height - this.scene.map.tileHeight * 6;
        this.returnToY = this.outOfBoundsY - 35;

        // i cant figure out how to get the name of the current animation i hate phaser
        this.running = false;

        // coyote jump
        this.coyoteTime = 0.1 * 1000; // how long the player can still jump after walking off of a ledge
        this.coyoteTimer = 0;
        this.jumpStartedTimer = false;
        this.startedCoyoteTime = false;

        // walljump
        this.maxSpeedToActivateWallStick = 250; // stops player from wallsticking if they're falling or rising too fast
        this.wallStickTime = 0.15 * 1000; // how long the player actually sticks to a ledge
        this.wallStickForgivenessTime = -0.2 * 1000; // how many updates after the player leaves a wallstick that they can still walljump
        this.usedWallStick = false;
        this.wallStickTimer = 0;
        this.wallStickX;
        this.wallStickY;
        this.wallJumpRight;
        this.maxWallJumpDistance = 5;

        // slide
        this.slideTime = 0.4 * 1000;
        this.slideTimer = 0;
        this.slideCooldown = 0.2 * 1000;
        this.slideCooldownTimer = 0;
        this.sliding = false;
        this.slideDoubleJump = false; // allows the player to jump mid-air after sliding off of a ledge
        this.slideJumped = false;
        this.slideRight = false;

        // dive (midair slide)
        this.diveTime = 0.3 * 1000;
        this.diving = false;
        this.usedDive = false;

        // for determining if we play thud
        this.lastFrameYVelocity = 0;

        //collider shape
        this.tall = true;

    }

    initPhysics(groundBTLayer, groundPILayer, door, artifact, goal) {

        this.scene.physics.add.sprite(this).setScale(SCALE);

        // Enable collision handling
        this.scene.physics.add.collider(this, groundBTLayer);
        this.scene.physics.add.collider(this, groundPILayer);

        this.arcadeBody = this.scene.physics.add.existing(this, 0);

        this.setColliderTall();
        this.anims.play('idle');
        this.setFlip(false);

        this.scene.physics.add.overlap(this, door, this.crushedByDoor, null, this);
        
        let artifactCollider = this.scene.physics.add.overlap(this, artifact, this.gotArtifact, null, this);
        this.scene.setArtifactCollider(artifactCollider);

    //    this.body.setMaxVelocityX(this.TRUE_MAX_X_VELOCITY); 
    }


    create() {

        // set up keys
        this.wKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.aKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.sKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.dKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    }

    update(delta) {

        this.coyoteTimer-= delta;
        this.wallStickTimer-= delta;
        this.slideCooldownTimer-= delta;

        if (this.flipped) {
            this.flippedGroundMovement();
            this.flippedTouchingGround();
            this.flippedJump();
            this.flippedSlide(delta);
            this.flippedCapVelocities();
            this.lastFrameYVelocity = this.body.velocity.x;
        } else {
            this.groundMovement();
            this.touchingGround();
            this.jump();
            this.slide(delta);
            this.capVelocities();
            this.lastFrameYVelocity = this.body.velocity.y;
        }

        this.collisionCheck();
        
    }

    groundMovement() {

        if (this.sliding || this.diving) return;
        
        // left movement
        if(this.aKey.isDown) {
            
            if (this.body.blocked.down) { // grounded

                this.body.setAccelerationX(this.body.velocity.x <= 0 ? -this.ACCELERATION : -this.GROUND_TURN_AROUND);


            } else { // midair

                // if you havent used wall stick and turn away from a wall while pressed against it
                if (!this.usedWallStick &&  Math.abs(this.body.velocity.y) < this.maxSpeedToActivateWallStick && this.body.velocity.x <= 0 && this.tileCheck(this.body.x + 25 + this.maxWallJumpDistance, this.y)) {
                    this.wallStickX = this.x;
                    this.wallStickY = this.y;
                    this.wallStickTimer = this.wallStickTime;
                    this.usedWallStick = true;
                    this.wallJumpRight = false;
                    this.anims.play("wall_stick");
                    this.running = false;

                } else { // just moving normally midair

                    if (this.body.velocity.x <= 0) {

                        this.body.setAccelerationX(this.body.velocity.x < -this.MAX_X_VELOCITY ? 0 : -this.AIR_ACCELERATION);

                    }else {
                        
                        this.body.setAccelerationX(this.body.velocity.x < -this.MAX_X_VELOCITY ? -this.AIR_TURN_AROUND_BOOST : -this.AIR_TURN_AROUND);
                    }
                }
            }
            

            this.setFlip(true);
            if (this.wallStickTimer < this.wallStickForgivenessTime && !(this.sliding || this.diving)) {
                this.anims.play("run", true);
                this.running = true;
                
            }

        } else if(this.dKey.isDown) {

            if (this.body.blocked.down) { // grounded

                this.body.setAccelerationX(this.body.velocity.x >= 0 ? this.ACCELERATION : this.GROUND_TURN_AROUND);

                
            } else { // midair

                // if you havent used wall stick and turn away from a wall while pressed against it
                if (!this.usedWallStick && Math.abs(this.body.velocity.y) < this.maxSpeedToActivateWallStick && this.body.velocity.x >= 0 && this.tileCheck(this.body.x - 8 - this.maxWallJumpDistance, this.y)) {
                    this.wallStickX = this.x;
                    this.wallStickY = this.y;
                    this.wallStickTimer = this.wallStickTime;
                    this.usedWallStick = true;
                    this.wallJumpRight = true;
                    this.anims.play("wall_stick");
                    this.running = false;

                } else {

                    if (this.body.velocity.x >= 0) {

                        this.body.setAccelerationX(this.body.velocity.x > this.MAX_X_VELOCITY ? 0 : this.AIR_ACCELERATION);

                    } else {
                        this.body.setAccelerationX(this.body.velocity.x > this.MAX_X_VELOCITY ? this.AIR_TURN_AROUND_BOOST : this.AIR_TURN_AROUND);
                    }
                }
            }

            this.setFlip(false, false);
            if (this.wallStickTimer < 0 && !(this.sliding || this.diving)) {
                this.anims.play("run", true);
                this.running = true;
                
            }
            
        } else {

            this.body.setAccelerationX(0);

            this.body.setDragX(this.body.blocked.down ? this.GROUND_DRAG : this.AIR_DRAG);

            if (this.wallStickTimer < 0 && !(this.sliding || this.diving)) {
                this.anims.play('idle');
                this.running = false;
                
            }
        }
    }

    flippedGroundMovement() {

        if (this.sliding || this.diving) return;
        
        // right movement
        if(this.dKey.isDown) {
            
            if (this.body.blocked.right) { // grounded

                this.body.setAccelerationY(this.body.velocity.y <= 0 ? -this.ACCELERATION : -this.GROUND_TURN_AROUND);


            } else { // midair

                // if you havent used wall stick and turn away from a wall while pressed against it
                if (!this.usedWallStick &&  Math.abs(this.body.velocity.x) < this.maxSpeedToActivateWallStick && this.body.velocity.y <= 0 && this.tileCheck(this.x, this.y + 14 + this.maxWallJumpDistance)) {
                    this.wallStickX = this.x;
                    this.wallStickY = this.y;
                    this.wallStickTimer = this.wallStickTime;
                    this.usedWallStick = true;
                    this.wallJumpRight = false;
                    this.anims.play("wall_stick");
                    this.running = false;


                } else { // just moving normally midair

                    if (this.body.velocity.y <= 0) {

                        this.body.setAccelerationY(this.body.velocity.y < -this.MAX_X_VELOCITY ? 0 : -this.AIR_ACCELERATION);

                    }else {
                        
                        this.body.setAccelerationY(this.body.velocity.y < -this.MAX_X_VELOCITY ? -this.AIR_TURN_AROUND_BOOST : -this.AIR_TURN_AROUND);
                    }
                }
            }
            

            this.setFlip(false);
            if (this.wallStickTimer < 0 && !(this.sliding || this.diving)) {
                this.anims.play('run', true);
                this.running = true;
            }

        } else if(this.aKey.isDown) { // left movement

            if (this.body.blocked.right) { // grounded

                this.body.setAccelerationY(this.body.velocity.y >= 0 ? this.ACCELERATION : this.GROUND_TURN_AROUND);

                
            } else { // midair

                // if you havent used wall stick and turn away from a wall while pressed against it
                if (!this.usedWallStick && Math.abs(this.body.velocity.x) < this.maxSpeedToActivateWallStick && this.body.velocity.y >= 0 && this.tileCheck(this.x, this.y - 14 - this.maxWallJumpDistance)) {
                    this.wallStickX = this.x;
                    this.wallStickY = this.y;
                    this.wallStickTimer = this.wallStickTime;
                    this.usedWallStick = true;
                    this.wallJumpRight = true;
                    this.anims.play("wall_stick");
                    this.running = false;

                } else {

                    if (this.body.velocity.y >= 0) {

                        this.body.setAccelerationY(this.body.velocity.y > this.MAX_X_VELOCITY ? 0 : this.AIR_ACCELERATION);

                    } else {
                        this.body.setAccelerationY(this.body.velocity.y > this.MAX_X_VELOCITY ? this.AIR_TURN_AROUND_BOOST : this.AIR_TURN_AROUND);
                    }
                }
            }

            this.setFlip(true, false);
            if (this.wallStickTimer < 0 && !(this.sliding || this.diving)) {
                this.anims.play('run', true);
                this.running = true;
            }

        } else {

            this.body.setAccelerationY(0);

            this.body.setDragY(this.body.blocked.right ? this.GROUND_DRAG : this.AIR_DRAG);

            if (this.wallStickTimer < 0 && !(this.sliding || this.diving)) {
                this.anims.play('idle');
                this.running = false;
            }        
        }
    }

    touchingGround() {

        // player touching ground or not
        if(!this.body.blocked.down) {
            this.running = false;


            if (this.wallStickTimer < 0 && !this.sliding && !this.diving) {

                if (this.body.velocity.y < 0) {

                    if (this.body.velocity.y > -200) this.anims.play('jump_1');
                    else this.anims.play('jump_2');

                } else {

                    if (this.body.velocity.y < 200) this.anims.play('jump_3');
                    else this.anims.play('jump_4');

                }
            }
            

            if (!this.startedCoyoteTime && !this.jumpStarted) {
                this.coyoteTimer = this.coyoteTime;
                this.startedCoyoteTime = true;
            }

        } else {
            this.startedCoyoteTime = false;
            this.jumpStarted = false;
            this.usedWallStick = false;
            this.slideDoubleJump = false;
            this.usedDive = false; 

            if (!this.sliding && !this.diving && this.lastFrameYVelocity > 50) {
                this.scene.thudSFX(this.lastFrameYVelocity);
            }
        }
    }

    flippedTouchingGround() {

        // player touching ground or not
        if(!this.body.blocked.right) {

            this.running = false;

            if (this.wallStickTimer < 0 && !this.sliding && !this.diving) {

                if (this.body.velocity.x < 0) {

                    if (this.body.velocity.x > -200) this.anims.play('jump_1');
                    else this.anims.play('jump_2');

                } else {

                    if (this.body.velocity.x < 200) this.anims.play('jump_3');
                    else this.anims.play('jump_4');

                }
            }

            if (!this.startedCoyoteTime && !this.jumpStarted) {
                this.coyoteTimer = this.coyoteTime;
                this.startedCoyoteTime = true;
            }

        } else {

            this.startedCoyoteTime = false;
            this.jumpStarted = false;
            this.usedWallStick = false;
            this.slideDoubleJump = false;
            this.usedDive = false; 

            if (!this.sliding && !this.diving && this.lastFrameYVelocity > 50) {
                this.scene.thudSFX(this.lastFrameYVelocity);
            }
        }
    }

    jump() {


        // player jump
        if(Phaser.Input.Keyboard.JustDown(this.spaceKey)) {

            // walljump
            if (this.wallStickTimer > this.wallStickForgivenessTime) {

                this.wallStickTimer = 0;
                this.usedWallStick = false;
                this.body.setVelocityY(this.WALL_JUMP_Y_VELOCITY);
                this.body.setVelocityX(this.wallJumpRight ? this.WALL_JUMP_X_VELOCITY : -this.WALL_JUMP_X_VELOCITY);
                this.scene.wallJump.play();

            } else if (this.sliding || (this.diving && this.body.blocked.down)) { // slide jump

                // make sure player doesnt jump through collidable terrain
                // (x, y - 36) is the tile above the player
                // (x +/- 36, y - 36) is the tile to the left or right of the tile above the player, depending which way they're moving
                if (!this.tileCheck(this.body.x, this.y - 55) && !this.tileCheck(this.body.x + (Math.sign(this.body.velocity.x) * 36), this.y - 55)) {

                    this.body.setVelocityX(Math.sign(this.body.velocity.x) * this.SLIDE_JUMP_X_VELOCITY);
                    this.body.setVelocityY(this.SLIDE_JUMP_Y_VELOCITY);

                    this.sliding = false;
                    this.diving = false;
                    this.setColliderTall();
                    this.y -= 18;
                    this.slideJumped = true;
                    this.jumpStarted = true;
                    this.slideDoubleJump = false;
                    this.scene.slideSFX(false);
                    this.scene.longJump.play();
                }

                

            } else if (this.body.blocked.down || this.coyoteTimer > 0 || this.slideDoubleJump) { // regular jump off of the ground
                this.body.setVelocityY(this.INITIAL_JUMP_Y_VELOCITY);
                this.jumpStarted = true;
                this.slideDoubleJump = false;
                this.coyoteTimer = 0;
                this.scene.jump.play();
            }
            

        }

        // player moving upwards
        if (this.body.velocity.y < 0) {

            if (!this.slideJumped) {

                if (this.spaceKey.isDown) {
                    this.body.setAccelerationY(this.SUSTAINED_JUMP_Y_ACCELERATION); // apply sustained acceleration
                } else {
                    this.body.setAccelerationY(this.SHORT_HOP_DESCELERATION); // apply hollow knight desceleration
                }
            }
        } else {
            this.body.setAccelerationY(0);
            this.slideJumped = false;
        }
    }

    flippedJump() {

        // player jump
        if(Phaser.Input.Keyboard.JustDown(this.spaceKey)) {

            // walljump
            if (this.wallStickTimer > this.wallStickForgivenessTime) {

                this.wallStickTimer = 0;
                this.usedWallStick = false;
                this.body.setVelocityX(this.WALL_JUMP_Y_VELOCITY);
                this.body.setVelocityY(this.wallJumpRight ? this.WALL_JUMP_X_VELOCITY : -this.WALL_JUMP_X_VELOCITY);
                this.scene.wallJump.play();

            } else if (this.sliding || (this.diving && this.body.blocked.right)) { // slide jump

                // make sure player doesnt jump through collidable terrain
                if (!this.tileCheck(this.x - 55, this.y) && !this.tileCheck(this.x - 55, this.y + (Math.sign(this.body.velocity.y) * 36))) {

                    this.body.setVelocityY(Math.sign(this.body.velocity.y) * this.SLIDE_JUMP_X_VELOCITY);
                    this.body.setVelocityX(this.SLIDE_JUMP_Y_VELOCITY);

                    this.sliding = false;
                    this.diving = false;
                    this.setColliderLong();
                    this.x -= this.scene.map.tileHeight;
                    this.slideJumped = true;
                    this.jumpStarted = true;
                    this.slideDoubleJump = false;

                    this.scene.resumeCamera();
                    this.scene.slideSFX(false);
                    this.scene.longJump.play();
                }

                

            } else if (this.body.blocked.right || this.coyoteTimer > 0 || this.slideDoubleJump) { // regular jump off of the ground
                this.body.setVelocityX(this.INITIAL_JUMP_Y_VELOCITY);
                this.jumpStarted = true;
                this.slideDoubleJump = false;
                this.scene.jump.play();
            }
            

        }

        // player moving upwards
        if (this.body.velocity.x < 0) {

            if (!this.slideJumped) {

                if (this.spaceKey.isDown) {
                    this.body.setAccelerationX(this.SUSTAINED_JUMP_Y_ACCELERATION); // apply sustained acceleration
                } else {
                    this.body.setAccelerationX(this.SHORT_HOP_DESCELERATION); // apply hollow knight desceleration
                }
            }
        } else {
            this.body.setAccelerationX(1);
            this.slideJumped = false;
        }
    }

    slide(delta) {

        // start sliding
        if (Phaser.Input.Keyboard.JustDown(this.sKey) && !this.sliding && this.slideCooldownTimer <= 0) {

        


            // regular ground slide
            if (this.body.blocked.down) {

                // make sure theres room to slide
                if ((this.dKey.isDown && !this.tileCheck(this.body.x + 30, this.y + 17)) ||
                    (this.aKey.isDown && !this.tileCheck(this.body.x - 15, this.y + 17))) {

                    this.sliding = true;
                    this.slideTimer = this.slideTime;
                    this.slideCooldownTimer = this.slideTime + this.slideCooldown;
                    this.setColliderLong();
                    this.y += 35;

                    this.body.setVelocityX(Math.sign(this.body.velocity.x) * this.SLIDE_X_VELOCITY);
                    this.slideRight = (this.dKey.isDown);

                    this.anims.play("slide");
                    this.running = false;
                    this.scene.slideSFX(true);
                }

            } else if (!this.usedDive) { // dive (midair slide)

                if ((this.body.velocity.x > 0 && !this.tileCheck(this.body.x + 30, this.y + 17)) ||
                    (this.body.velocity.x < 0 && !this.tileCheck(this.body.x - 15, this.y + 17))) {

                    this.diving = true;
                    this.usedWallStick = true;
                    this.slideTimer = this.diveTime;
                    this.usedDive = true;
                    this.slideCooldownTimer = this.diveTime + this.slideCooldown;
                    this.setColliderLong();
                    this.y += this.scene.map.tileHeight;
                    this.body.setVelocityX(Math.sign(this.body.velocity.x) * this.SLIDE_X_VELOCITY);

                    this.body.setVelocityX(Math.sign(this.body.velocity.x) * this.DIVE_X_VELOCITY);
                    this.body.setVelocityY(this.DIVE_Y_VELOCITY);
                    this.slideRight = (this.body.velocity.x > 0);

                    this.anims.play("slide");
                    this.running = false;
                    this.scene.dive.play();

                }

            }

                
        }

        // while sliding
        if (this.sliding) {

            this.slideTimer-= delta;
            this.body.setVelocityX(this.slideRight ? this.SLIDE_X_VELOCITY : -this.SLIDE_X_VELOCITY);

            // slide ends
            if (this.slideTimer <= 0) {

                if (!this.tileCheck(this.body.x, this.y - 55)) {

                    this.sliding = false;
                    this.setColliderTall();
                    this.body.setVelocityX(this.slideRight ? this.MAX_X_VELOCITY : -this.MAX_X_VELOCITY);
                    this.y -= 18;
                    this.scene.slideSFX(false);
                }
            }

            if (!this.body.blocked.down) {
                this.slideDoubleJump = true;
            }
        }

        // while diving
        if (this.diving) {

            this.slideTimer-= delta;
            this.body.setVelocityX(this.slideRight? this.DIVE_X_VELOCITY : -this.DIVE_X_VELOCITY);

            if (this.body.blocked.down) this.scene.slideSFX(true);

            // dive ends
            if (this.slideTimer <= 0) {

                if (!this.tileCheck(this.body.x, this.y - 55)) {

                    this.diving = false;
                    this.usedWallStick = false;
                    this.setColliderTall();
                    this.body.setVelocityX(this.slideRight ? this.MAX_X_VELOCITY : -this.MAX_X_VELOCITY);
                    if (this.body.blocked.down) {
                        this.y -= 36;
                        this.body.setVelocityY(0);
                    }
                    this.scene.slideSFX(false);
                }
            }
        }
    }

    flippedSlide(delta) {

        // start sliding
        if (Phaser.Input.Keyboard.JustDown(this.sKey) && !this.sliding && this.slideCooldownTimer <= 0) {


            // regular ground slide
            if (this.body.blocked.right) {

                // make sure theres room to slide
                if ((this.dKey.isDown && !this.tileCheck(this.x + 17, this.y - 30)) ||
                    (this.aKey.isDown && !this.tileCheck(this.x + 17, this.y + 15))) {

                    this.sliding = true;
                    this.slideTimer = this.slideTime;
                    this.slideCooldownTimer = this.slideTime + this.slideCooldown;
                    this.setColliderTall();
                    this.x += 35;

                    this.body.setVelocityY(Math.sign(this.body.velocity.y) * this.SLIDE_X_VELOCITY);
                    this.slideRight = (this.dKey.isDown);

                    this.anims.play("slide");
                    this.running = false;

                    this.scene.freezeCamera();

                    this.scene.slideSFX(true);

                }

            } else if (!this.usedDive) { // dive (midair slide)

                if ((this.body.velocity.y > 0 && !this.tileCheck(this.body.x + 17, this.y - 30)) ||
                    (this.body.velocity.y < 0 && !this.tileCheck(this.body.x + 17, this.y + 15))) {

                    this.diving = true;
                    this.usedWallStick = true;
                    this.slideTimer = this.diveTime;
                    this.usedDive = true;
                    this.slideCooldownTimer = this.diveTime + this.slideCooldown;
                    this.setColliderTall();
                    this.x += this.scene.map.tileHeight;

                    this.body.setVelocityY(-Math.sign(this.body.velocity.y) * this.DIVE_X_VELOCITY);
                    this.body.setVelocityX(this.DIVE_Y_VELOCITY);
                    this.slideRight = (this.body.velocity.y > 0);

                    this.anims.play("slide");
                    this.running = false;
                    this.scene.dive.play();

                }

            }

                
        }

        // while sliding
        if (this.sliding) {

            this.slideTimer-= delta;
            this.body.setVelocityY(this.slideRight ? -this.SLIDE_X_VELOCITY : this.SLIDE_X_VELOCITY);

            // slide ends
            if (this.slideTimer <= 0) {

                this.scene.resumeCamera();

                if (!this.tileCheck(this.x - 55, this.y)) {

                    this.sliding = false;
                    this.setColliderLong();
                    this.body.setVelocityY(this.slideRight ? -this.MAX_X_VELOCITY : this.MAX_X_VELOCITY);
                    this.x -= 18;
                }

                this.scene.slideSFX(false);
            }

            if (!this.body.blocked.right) {

                if (this.slideTimer < this.slideTime - 50 && this.body.velocity.x > 50) this.scene.resumeCamera();
                this.slideDoubleJump = true;
            }
        }

        // while diving
        if (this.diving) {

            this.slideTimer-= delta;
            this.body.setVelocityY(this.slideRight? -this.DIVE_X_VELOCITY : this.DIVE_X_VELOCITY);

            if (this.body.blocked.right) this.scene.slideSFX(true);

            // dive ends
            if (this.slideTimer <= 0) {

                if (!this.tileCheck(this.x - 55, this.y)) {

                    this.diving = false;
                    this.usedWallStick = false;
                    this.setColliderLong();
                    this.body.setVelocityY(this.slideRight ? -this.MAX_X_VELOCITY : this.MAX_X_VELOCITY);
                    if (this.body.blocked.right) this.x -= 18;

                }

                this.scene.slideSFX(false);
            }
        }
    }

    capVelocities() {

        // freeze player while they're wall sticking
        if (this.wallStickTimer > 0) {
            this.x = this.wallStickX;
            this.y = this.wallStickY;
            this.body.setVelocity(0, 0);
        }

        // cap walk speed
        if (this.body.blocked.down && Math.abs(this.body.velocity.x) > this.MAX_X_VELOCITY) {

            this.body.setAccelerationX(0);
            this.body.setDragX(this.body.blocked.down ? this.GROUND_DRAG : this.AIR_DRAG);
        }

        /*
        // stop player from FALLING off of the FREAKING MAP I HATE PHASER
        if (this.y > this.outOfBoundsY) {
            this.y = this.returnToY;
            this.body.setVelocityY(0);
        }
            */
    }

    flippedCapVelocities() {

        // freeze player while they're wall sticking
        if (this.wallStickTimer > 0) {
            this.x = this.wallStickX;
            this.y = this.wallStickY;
            this.body.setVelocity(0, 0);
        }

        // cap walk speed
        if (this.body.blocked.right && Math.abs(this.body.velocity.y) > this.MAX_X_VELOCITY) {

            this.body.setAccelerationY(0);
            this.body.setDragY(this.body.blocked.right ? this.GROUND_DRAG : this.AIR_DRAG);
        }
    }

    flip() {

        this.flipped = true;
        this.setColliderLong();

        this.body.velocity.y = 0;
        this.body.velocity.x = 0;
        this.body.setAcceleration(0,0);
    }

    //seperate for the "cutscene" to work
    rotateSprite() {
        this.rotation = -Math.PI/2;
        this.body.velocity.y = -100;
        this.body.velocity.x = 100;

    }

    exitLevel() {
        this.body.setVelocity(0, 0);
        this.body.setAcceleration(0,0);
    }

    crushedByDoor() {
        this.setVisible(false);
        this.body.velocityX = 0;
        this.body.velocityY = 0;
        this.x = 23;
        this.scene.killPlayer(0,0);
    }

    touchedObstacle() {
        this.setVisible(false);
        this.scene.killPlayer(this.body.velocity.x, this.body.velocity.y);
    }

    gotArtifact() {
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.scene.flipGravity();
    }

    // returns true if tile at specified position exists and is collidable
    tileCheck(x, y) {

        let tile = this.scene.map.getTileAtWorldXY(x, y, false, this.scene.camera, this.scene.groundBTLayer);
        if (!tile) tile = this.scene.map.getTileAtWorldXY(x, y, false, this.scene.camera, this.scene.groundPILayer);

        return (tile && tile.canCollide);
    }

    collisionCheck() {

        if (this.tall) {

            // check four points for general danger
            let tile = this.scene.map.getTileAtWorldXY(this.body.x + 4, this.body.y + 4, false, this.scene.camera, this.scene.dangerLayer);
            if (tile) this.touchedObstacle();

            tile = this.scene.map.getTileAtWorldXY(this.body.x + 20, this.body.y + 4, false, this.scene.camera, this.scene.dangerLayer);
            if (tile) this.touchedObstacle();

            tile = this.scene.map.getTileAtWorldXY(this.body.x + 4, this.body.y + 54, false, this.scene.camera, this.scene.dangerLayer);
            if (tile) this.touchedObstacle();

            tile = this.scene.map.getTileAtWorldXY(this.body.x + 20, this.body.y + 54, false, this.scene.camera, this.scene.dangerLayer);
            if (tile) this.touchedObstacle();


        } else {

            let tile = this.scene.map.getTileAtWorldXY(this.body.x + 4, this.body.y + 4, false, this.scene.camera, this.scene.dangerLayer);
            if (tile) this.touchedObstacle();

            tile = this.scene.map.getTileAtWorldXY(this.body.x + 54, this.body.y + 4, false, this.scene.camera, this.scene.dangerLayer);
            if (tile) this.touchedObstacle();

            tile = this.scene.map.getTileAtWorldXY(this.body.x + 4, this.body.y + 20, false, this.scene.camera, this.scene.dangerLayer);
            if (tile) this.touchedObstacle();

            tile = this.scene.map.getTileAtWorldXY(this.body.x + 54, this.body.y + 20, false, this.scene.camera, this.scene.dangerLayer);
            if (tile) this.touchedObstacle();
            
        }
    }

    // sorry jim i do it this way because i was struggling to do it the phaser way for a long time
    setColliderTall() {

        this.tall = true;

        this.body.setSize(this.scene.map.tileWidth - 5, this.scene.map.tileHeight * 2 - 5);

        if (this.flipped) {

            this.body.setOffset(-5 + 8, 0);

        } else {

            if (this.tileCheck(this.body.x + 5, this.body.y + 36)) this.y -= 18;

            this.body.setOffset(2.5 + 8, 5);
        }
    }

    setColliderLong() {

        this.tall = false;

        this.body.setSize(this.scene.map.tileWidth* 2 - 5, this.scene.map.tileHeight - 5);

        if (this.flipped) {

            this.body.setOffset(-5 + 8, 12);


            if (this.tileCheck(this.body.x + 36, this.body.y + 5)) this.x -= 18;


        } else {
            this.body.setOffset(5, 2.5);
  
        }

        
    }
}