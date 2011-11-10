(function () {
    var canvas = document.getElementById('snakeCanvas'),
        ctx = canvas.getContext('2d'),
        score = 0,
        hiScore = 20,
        leftButton = document.getElementById('leftButton'),
        rightButton = document.getElementById('rightButton'),
        input = { left: false, right: false }; 

    canvas.width = 320;
    canvas.height = 350;

    // check for keypress and set input properties
    window.addEventListener('keyup', function(e) {
       switch (e.keyCode) {
            case 37: input.left = true; break;                            
            case 39: input.right = true; break;                            
       } 
    }, false);

    //let's assume we're not using a touch capable device
    var clickEvent = 'click';
    // now we try a simple test to see if we have touch
    try {
        document.createEvent('TouchEvent');
        // it seems we do, so we should check for it rather than click
        clickEvent = 'touchend';
    } catch(e) { }

    leftButton.addEventListener(clickEvent, function(e) {
        e.preventDefault();
        input.left = true;
    }, false);

    rightButton.addEventListener(clickEvent, function(e) {
        e.preventDefault();
        input.right = true;
    }, false);

    // a collection of methods for making our mark on the canvas
    var draw = {
        clear: function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },    

        rect: function (x, y, w, h, col) {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, w, h);
        },
       
        circle: function (x, y, radius, col) {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fill();
        },
        
        text: function (str, x, y, size, col) {
            ctx.font = 'bold ' + size + 'px monospace';
            ctx.fillStyle = col;
            ctx.fillText(str, x, y);
        }
    };

    // main snake class
    var Snake = function() {

        this.init = function() {

            this.dead = false;
            this.len = 0; // length of the snake (number of segments)
            this.speed = 4; // amount of pixels moved per frame
            this.history = []; // we'll need to keep track of where we've been
            this.dir = [    // the four compass points in which the snake moves
                [0, -1],    // up
                [1, 0],     // right
                [0, 1],     // down
                [-1, 0]     // left
            ];
            this.currentDir = 2;    // i.e. this.dir[2] = down

            this.x = 100;
            this.y = 100;
            this.w = this.h = 16;
            this.col = 'darkgreen';
        };
  
        this.move = function() {

            if (this.dead) {
                return;
            }

            // check if a button has been pressed 
            if (input.left) {
                this.currentDir += 1;
                if (this.currentDir > 3) {
                    this.currentDir = 0;
                }
            } else if (input.right) {
                this.currentDir -= 1;
                if (this.currentDir < 0) {
                    this.currentDir = 3;
                }
            }

            // check if out of bounds
            if (this.x < 0 || this.x > (canvas.width - this.w)
                || this.y < 0 || this.y > (canvas.height - this.h)) {
                this.dead = true;    
            }

            // update position
            this.x += (this.dir[this.currentDir][0] * this.speed);
            this.y += (this.dir[this.currentDir][1] * this.speed);

            // store this position in the history array
            this.history.push({x: this.x, y: this.y, dir: this.currentDir});

        };

		this.draw = function () {

			var i, offset, segPos, col;

            // loop through each segment of the snake, 
            // drawing & checking for collisions
			for (i = 1; i <= this.len; i += 1) {

                // offset calculates the location in the history array
				offset = i * Math.floor(this.w / this.speed);
				offset = this.history.length - offset;
				segPos = this.history[offset];
 
                col = this.col;

                // reduce the area we check for collision, to be a bit
                // more forgiving with small overlaps
                segPos.w = segPos.h = (this.w - this.speed);

                if (i > 2 && i !== this.len && this.collides(segPos)) {
                    this.dead = true;
                    col = 'darkred'; // highlight hit segments
                }

                draw.rect(segPos.x, segPos.y, this.w, this.h, col);
			}

            draw.rect(this.x, this.y, this.w, this.h, this.col); // draw head
			draw.rect(this.x + 4, this.y + 1, 3, 3, 'white');    // draw eyes	
			draw.rect(this.x + 12, this.y + 1, 3, 3, 'white');
		};

        this.collides = function(obj) {

            // this sprite's rectangle
            this.left = this.x;
            this.right = this.x + this.w;
            this.top = this.y;
            this.bottom = this.y + this.h;

            // other object's rectangle
            obj.left = obj.x;
            obj.right = obj.x + obj.w;
            obj.top = obj.y;
            obj.bottom = obj.y + obj.h;

            // determine if not intersecting
            if (this.bottom < obj.top) { return false; }
            if (this.top > obj.bottom) { return false; }
            if (this.right < obj.left) { return false; }
            if (this.left > obj.right) { return false; }
            // otherwise, it's a hit
            return true;
        };

    };

    var Apple = function() {
    
        this.x = 0;
        this.y = 0;
        this.w = 16;
        this.h = 16;
        this.col = 'red';
        this.replace = 0;   // game turns until we move the apple elsewhere

        this.draw = function() {

            if (this.replace === 0) { // time to move the apple elsewhere
                this.relocate();
            }

            draw.rect(this.x, this.y, this.w, this.h, this.col);
            this.replace -= 1;
        };

        this.relocate = function() {
            this.x = Math.floor(Math.random() * (canvas.width - this.w)); 
            this.y = Math.floor(Math.random() * (canvas.height -this.h)); 
            this.replace = Math.floor(Math.random() * 200) + 200; 
        };

    };

    // create an instance of the Snake class, called p1
    var p1 = new Snake();
    p1.init();
    // and let there be an apple 
    var apple = new Apple();
   
    function loop() {

        draw.clear();
        p1.move();
        p1.draw();

        if (p1.collides(apple)) {
            score += 1;
            p1.len += 1;
            apple.relocate();
        }

        if (score > hiScore) {
            hiScore = score;
        }

        apple.draw();
        draw.text('Score: '+score, 20, 20, 12, 'black');
        draw.text('Hi: '+hiScore, 260, 20, 12, 'black');

        if (p1.dead === true) {
            draw.text('Game Over', 100, 200, 20, 'black'); 
            if (input.right || input.left) {
                p1.init();
                score = 0;
            } 
        } 

        input.right = input.left = false;

    }

    window.scrollTo(0, 0);
    setInterval(loop, 30);

}());
