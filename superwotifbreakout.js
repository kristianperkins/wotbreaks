// nuke these
var newMatrix = false;


var game; // ze game
var break_loc = $('script[src*=jq]').attr('src').slice(0, -5);

function Game() {
    this.startPos;
    this.ball;
    this.t0;
    this.w;
    this.$window;
    this.running = true;
    this.level = 0;
    this.score = 0;
    this.debugStep = false;
    this.sprites = [];
    this.balls = [];
    this.bullets = [];
    this.paddle;
    this.lives = 3;
    this.newMatrix = !wotifData.days;
    this._init = false;
    var self = this;

    this.getBallStartPos = function() {
        var $paddle = this.paddle.dom;
        var ballheight = 20; // look this up...
        var pos = new Point($paddle.offset().left + $paddle.width() / 2.2, $paddle.offset().top - ballheight);
        console.log('starting ball at', pos, 'while paddle top', $paddle.offset().top);
        return pos;
    };

    this.moveBallToStartPos = function(ball) {
        var startPos = this.getBallStartPos();
        ball.stuck = true;
        ball.phitx = this.paddle.dom.width() / 2.2;
        ball.pos = startPos;
        ball.dom.offset({left: startPos.x, top: startPos.y});
    };


    // game-loop body.
    this.step = function(t1) {
        var dt = ((t1 - self.t0) / 1000);
        for (var i = 0; i < self.sprites.length; i++) {
            self.sprites[i].update(dt);
        }
        self.t0 = t1;
        if (self.running) {
            window.requestAnimationFrame(self.step);
        }
    };


    // one-time init for the Game
    this.init = function() {
        $('html, body').animate({
            scrollTop: 0
        }, 1500, function(e) {
            if (self._init) {
                return; //fml
            }
            console.log('RUNNING INIT');
            self._init = true;
            self.level = 0;
            self.level = nextLevel(0);
            self.prepareDom();
            self.paddle = new Paddle();
            self.ball = new Ball(new Point(10,10), new Point(0, 1));
            self.moveBallToStartPos(self.ball);
            self.balls.push(self.ball);
            self.sprites.push(self.ball);

            $(window).mousemove(function(e) {
                var pwidth = self.paddle.dom.width();
                var $paddle = self.paddle.dom;
                $paddle.offset({left: e.pageX - pwidth / 2});
                for (var i = 0; i < self.balls.length; i++) {
                    var b = self.balls[i]
                    if (b.stuck) {
                        //var pleft = b.dom.offset().left - $paddle.offset().left;
                        var phitx = b.phitx || 0;
                        var bleft = e.pageX - pwidth / 2;
                        var btop = $paddle.offset().top - b.height;
                        b.dom.offset({
                            left: bleft + phitx,
                            top: btop
                        });
                        b.pos.x = bleft + phitx;
                        b.pos.y = btop;
                        console.log('paddletop:', $paddle.offset().top, 'balltop', b.dom.offset().top, 'bheight', b.height);
                    }
                }
            });

            $(window).mouseup(function(e) {
                if (self.paddle.lazermode && self.bullets.length < 6) {
                    var p = self.paddle.dom.offset();
                    var bullet1 = new Bullet(new Point(p.left + 20, p.top));
                    var bullet2 = new Bullet(new Point(p.left + self.paddle.dom.width() - 20, p.top));
                    self.sprites.push(bullet1);
                    self.sprites.push(bullet2);
                    self.bullets.push(bullet1);
                    self.bullets.push(bullet2);
                }
                for (var i = 0; i < self.balls.length; i++) {
                    var b = self.balls[i];
                    if (b.stuck) {
                        b.stuck = false;
                    }
                    if (self.paddle.sticks > 0) {
                        self.paddle.sticks--;
                    }
                }
                if (self.paddle.sticks == 0) {
                    self.paddle.dom.removeClass('S');
                }
            });
            startPlaylist();
            t0 = window.performance.now();
            window.requestAnimationFrame(self.step);
            //step(0);
        });

        // cheats for bonuses
        $(document).keydown(function(e) {
            console.log(e);
            var char = String.fromCharCode(e.which);
            if (Bonus.types.indexOf(char) > -1) {
                game.sprites.push(new Bonus(new Point($(window).width() / 2, 100), char));
            }
        });
    }; // init


    // remove and add some elements for the game.
    this.prepareDom = function() {
        // styles
        $("<link/>", {
           rel: "stylesheet",
           type: "text/css",
           id: "yeah",
           href: break_loc + "/superwotifbreakout.css"
        }).appendTo("head");
        $("<link/>", {
           rel: "stylesheet",
           type: "text/css",
            id: "font-awesome-stylesheet",
           href: "http://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css"
        }).appendTo("head");
        $("<link/>", {
           rel: "stylesheet",
           type: "text/css",
            id: "opensanscondensed-stylesheet",
           href: "http://fonts.googleapis.com/css?family=Open+Sans+Condensed:300,700"
        }).appendTo("head");


        // remove some elements.
        $('div.results-search').slideUp('slow');
        $('#map-button').slideUp('slow');
        $('.w-toolbar').slideUp('slow');
        $('.results-header').slideUp('slow');
        $('#hotel-deals').slideUp('slow');
        $('.results-count').slideUp('slow');
        $('#all-filters').slideUp('slow'); // new matrix specific
        $('body').height(window.innerHeight);
        $(window).resize(function() {
            $('body').height(window.innerHeight);
        });
        $(document).css({
            overflow: 'hide'
        });
        $(".shortlist-summary").hide();
        $('.w-footer').hide();
        $('pre').hide();  //  What is this thing?
        var hheight = $('.w-header').height();


        // add level, scoreboard, lives
        $("<div id='level-head-div'><h1 id='level-heading'>Level X</h1></div>").appendTo("body");
        $('<div id="overlay" unselectable="on" onselectstart="return false;">:</div>').appendTo('body');
        $('.wrapper-outer').css('height', '100%').css('height', '-= ' + hheight + 'px');  // XXX: This won't work with resize!
        $(".w-header__inner.container").html('<a href="http://www.wotif.com/" class="w-logo w-logo--centered">Wotif.com</a><div class="breakout-score">SCORE <b>0</b></div><div class="breakout-level">LEVEL <b>1</b></div>')
        $(".w-header__inner.container").append(livesDisplay(self.lives));
    };
}

function getTopBound() {
    if (newMatrix) {
        topBound = $('.container--matrix').last().offset().top;
    } else {
        topBound = $('table.matrix-content').offset().top;
    }
    return topBound;
}

function getSomeTr() {
    if (newMatrix) {
        someTr = $('.matrix__row').first();
    } else {
        someTr = $('tr.grid-header').last();
    }
    return someTr;
}

function rchoice(lst) {
    // le sigh
    return lst[Math.floor(Math.random() * lst.length)];
}


function Bullet(startPoint) {
    this.dom = $('<div class="bullet">I</div>');
    this.speed = 600;
    this.v = new Point(0, -1);
    this.dom.offset({top: startPoint.y, left: startPoint.x});
    this.dom.appendTo("body");
    this.width = this.dom.width();
    this.height = this.dom.height();
    var off = this.dom.offset();
    this.pos = new Point(startPoint.x, startPoint.y);

    this.update = function(dt) {
        var nextPos = new Point(this.pos.x + dt * this.v.x * this.speed,
                                this.pos.y + dt * this.v.y * this.speed);
        this.collideBlocks(this.pos, nextPos);
        this.collideWindow(this.pos, nextPos);
        this.pos = nextPos;
        this.dom.offset({
            left: this.pos.x,
            top: this.pos.y
        });
    };

    this.kill = function() {
        var idx = game.sprites.indexOf(this);
        if (idx > -1) {
            game.sprites.splice(idx, 1);
            this.dom.hide();
        }
        idx = game.bullets.indexOf(this);
        if (idx > -1) {
            game.bullets.splice(idx, 1);
        }
    };

    this.collideWindow = function(curr, next) {
        var topBound = getTopBound();
        if (next.y + this.height < topBound) {
            this.kill();
        }
    };


    // check intersection of line with points (curr, next) with
    // all the active blocks.
    this.collideBlocks = function(curr, next) {
        var blocks = $('tr.deals:visible').find('td.weekday, td.weekend'); //$$
        var self = this;
        blocks.each(function(idx, b) {
            var $b = $(b);
            var off = $b.offset();
            var w = $b.width();
            var h = $b.height();
            var hit = false;
            if (curr.y >= off.top + h && next.y < off.top + h && next.x > off.left && next.x < off.left + w) {
                // bottom side
                self.kill()
                hit = true;
            }
            // XXX: repeated code - should belong to Block?
            if (hit) {
                if ($b.hasClass("hotdeal")) {
                    $b.removeClass("hotdeal");
                } else {
                    if (Math.random() < 0.4) {
                        // spawn power-up!
                        var bonus = new Bonus(curr);

                        game.sprites.push(bonus);
                    }
                    // add to score
                    game.score += +$b.text();
                    $(".breakout-score b").text(game.score);
                    b.hit = true;
                    $b.attr('class', 'anim sold').html('SOLD');
                    if ($('tr.deals:visible td:not(.sold)').not('.summary').length == 0) {
                        nextLevel();
                    }

                }
            }
        });
    };
}


function Bonus(startPoint, type) {
    this.type = rchoice(Bonus.types);
    if (type) {
        this.type = type;
    }
    this.speed = 200;
    this.v = new Point(0, 1);
    this.dom = $("<div class='breakout-bonus " + this.type + "'></div>");
    this.dom.offset({top: startPoint.y, left: startPoint.x});
    this.dom.appendTo("body");
    this.width = this.dom.width();
    this.height = this.dom.height();
    var off = this.dom.offset();
    this.pos = new Point(startPoint.x, startPoint.y);
    this.killit = null;
    this.fatt = null;
    this.lzr;


    this.collidePaddle = function(curr, next) {
        var $paddle = game.paddle.dom;
        var PI = Math.PI;
        var off = $paddle.offset();
        var w = $paddle.width();
        if (curr.y + this.height <= off.top && next.y + this.height > off.top  && next.x + this.width > off.left && next.x < off.left + w) {
            // power up hit the paddle
            this.startBonus();
            this.kill();
            game.paddle.dom.addClass(this.type);
        }
    }
    this.fatPaddle = function() {
        var paddle = game.paddle;
        var maxWidth = 350;
        var $paddle = paddle.dom;
        window.clearTimeout(this.fatt);
        window.clearTimeout(this.killit);
        $paddle.width(maxWidth);
        var self = this;
        this.fatt = window.setTimeout(function() {
            $paddle.width(paddle.width);
            $paddle.removeClass(self.type);
        }, 10000);
    };
    this.stickyBall = function() {
        game.paddle.sticks = 5;
    };
    this.thinPaddle = function() {
        var paddle = game.paddle;
        var minWidth = 100;
        var $paddle = paddle.dom;
        window.clearTimeout(this.killit);
        window.clearTimeout(this.fatt);
        $paddle.width(minWidth);
        var self = this;
        this.killit = window.setTimeout(function() {
            $paddle.width(paddle.width);
            $paddle.removeClass(self.type);
        }, 5000);
    };
    this.stickyBall = function() {
        paddle.sticks = 5;
    };
    this.lazers = function() {
        var paddle = game.paddle;
        paddle.lazermode = true;
        window.clearTimeout(this.lzr);
        var self = this;
        this.lzr = window.setTimeout(function() {
            paddle.lazermode = false;
            paddle.dom.removeClass(self.type);
        }, 5000);
    };
    this.multiBall = function() {
        var b0 = game.balls[0];
        var bb = game.balls.length;
        for (var i = 3; i > bb; i--) {
            var x = b0.v.x + .02 * i;
            var y = b0.v.y;
            var b = new Ball(new Point(b0.pos.x + i * 40, b0.pos.y), new Point(x, y));
            game.sprites.push(b);
            game.balls.push(b);
        }
    };

    this.kill = function() {
        var idx = game.sprites.indexOf(this);
        if (idx > -1) {
            game.sprites.splice(idx, 1);
            this.dom.hide();
        }
    }

    this.collideWindow = function(curr, next) {
        var bottomBound = $(window).height() + $(document).scrollTop();
        var topBound = getTopBound();
        var someTr = getSomeTr();
        var leftBound = someTr.offset().left;
        var rightBound = leftBound + someTr.width();
        if (next.y + this.height > bottomBound) {
            this.kill();
        }
    };

    this.update = function(dt) {
        var nextPos = new Point(this.pos.x + dt * this.v.x * this.speed,
                                this.pos.y + dt * this.v.y * this.speed);
        this.collidePaddle(this.pos, nextPos);
        this.collideWindow(this.pos, nextPos);
        this.pos = nextPos;
        this.dom.offset({
            left: this.pos.x,
            top: this.pos.y
        });
    };

    this.typeInit = {
        'M': this.multiBall,
        'S': this.stickyBall,
        'T': this.thinPaddle,
        'F': this.fatPaddle,
        'L': this.lazers
    };

    this.stopBonus = function() {
        if (this.type == 'M') {
            balls = [balls[0]];
        } else if (this.type == 'S') {
            paddle.sticks = 0;
        } else if (this.type == 'T') {
            paddle.dom.width(paddle.width);
        } else if (this.type == 'F') {
            paddle.dom.width(paddle.width);
        } else if (this.type == 'L') {
            paddle.lazermode = false;
        }
        paddle.dom.removeClass(this.type);
        this.typeInit[this.type]();
    };

    this.startBonus = function() {
        this.typeInit[this.type]();
    };
}
Bonus.types = 'MSTFL';
/**  These are the power-ups from Arkanoid
 * S - Slow
 * F - Fast
 * C - Catch
 * E - Expand
 * T - Tiny (shrink)
 * L - Laser
 * M - Multiball (disrupt)
 * P - Player (free life)
 *
 **/

var rows;
if (newMatrix) {
    rows = $('table.matrix tr.matrix__row');
} else {
    rows = $('table.matrix-content tr.deals:not(tr.wothotel)');
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Ball(startPoint, velocity) {
    console.log("Creating ball at", startPoint);
    this.stuck = false;
    this.speed = 600;
    this.v = velocity;
    this.phitx = null;
    this.dom = $("<div id='ball' class='ball'></div>");
    this.dom.offset({top: startPoint.y, left: startPoint.x});
    this.dom.appendTo("body");
    this.width = this.dom.width();
    this.height = 20; // XXX: fixme
    this.pos = new Point(startPoint.x, startPoint.y);

    this.update = function(dt) {
        if (this.stuck) {
            return;
        }
        this.nextPos = new Point(this.pos.x + dt * this.v.x * this.speed,
                                 this.pos.y + dt * this.v.y * this.speed);
        this.collideWindow(this.pos, this.nextPos);
        this.collideBlocks(this.pos, this.nextPos);
        this.collidePaddle(this.pos, this.nextPos);
        this.pos = this.nextPos;
        this.dom.offset({
            left: this.pos.x,
            top: this.pos.y
        });
    };


    this.collideWindow = function(curr, next) {
        var bottomBound = $(window).height() + $(document).scrollTop();
        var topBound = getTopBound();
        var someTr = getSomeTr();
        var leftBound = someTr.offset().left;
        var rightBound = leftBound + someTr.width();
        if (next.x < leftBound) {
            this.v.x = -this.v.x;
            next.x = leftBound;
        }
        if (next.y < topBound) {
            this.v.y = -this.v.y;
            next.y = topBound;
        }
        if (next.x > rightBound) {
            this.v.x = -this.v.x;
            next.x = rightBound;
        }
        if (next.y > bottomBound) {
            console.log('about to kill', this.v, this.pos);
            this.kill();
        }
    }


    this.kill = function() {
        this.dom.hide();
        var idx = game.sprites.indexOf(this);
        if (idx > -1) {
            game.sprites.splice(idx, 1);
        }
        idx = game.balls.indexOf(this);
        if (idx > -1) {
            game.balls.splice(idx, 1);
        }
        if (game.balls.length > 0) {
            // remove multiball
            console.log('removing multiball');
        } else if (game.balls.length == 0 && game.lives > 0) {
            console.log('decreasing lives', game.lives, 'balls', game.balls.length);
            game.lives--;
            $(".lives-div").replaceWith(livesDisplay(game.lives));
            var paddle = game.paddle;
            var $paddle = paddle.dom;
            paddle.sticks = 1;
            var ballheight = 20;
            startPos = new Point($paddle.offset().left + $paddle.width() / 2.2, $paddle.offset().top - ballheight);
            ball = new Ball(startPos, new Point(0, 1));
            ball.stuck = true;
            ball.phitx = startPos.x - $paddle.offset().left;
            game.balls.push(ball);
            game.sprites.push(ball);
        } else {
            console.log('you dead', game.lives, 'balls', game.balls.length);
            console.log("BAlLLLLLLLLLLLLLLLLLLLLLL DEAD!");
            $('.breakout-bonus').hide();
            $('#ball').hide();
            $("#level-heading").text("");
            //$("#level-heading").append("Game Over.  Final Score: " + score);
            $('#overlay').hide();
            $("#level-heading").append("<a class='fa fa-twitter-square' style='text-decoration: none' href='https://twitter.com/intent/tweet?text=Got%20to%20Level%20" + game.level + "%20on%20%23BreakWTF' ></a> Game Over - " + game.score);
            $("#level-head-div").slideDown();
            game.running = false;
        }
    }


    this.collidePaddle = function(curr, next) {
        var PI = Math.PI;
        var $paddle = game.paddle.dom;
        var off = $paddle.offset();
        var w = $paddle.width();
        var paddle = game.paddle;
        if (curr.y + this.height <= off.top && next.y + this.height > off.top  && next.x > off.left && next.x < off.left + w) {
            // reflect x based on distance from the midpoint
            this.phitx = next.x - off.left;
            if (paddle.sticks) {
                //var pwidth = paddle.dom.width();
                this.stuck = true;
                var btop = $paddle.offset().top - this.height;
                this.dom.offset({
                    //left: bleft + phitx,
                    top: btop
                });
                //b.pos.x = bleft + phitx;
                //this.pos.y = btop;
                this.nextPos.y = btop;
            }
            var dist = (next.x - off.left) / w;  // dist along paddle, 0->1
            var theta = 7/8 * PI - dist * 6/8 * PI;  // curve along paddle, 7PI/8 -> PI/8
            this.v.y = -Math.sin(theta);
            this.v.x = Math.cos(theta);
        }
    }


    // check intersection of line with points (curr, next) with
    // all the active blocks.
    this.collideBlocks = function(curr, next) {
        var blocks = $('tr.deals:visible').find('td.weekday, td.weekend'); //$$
        var self = this;
        blocks.each(function(idx, b) {
            var $b = $(b);
            var off = $b.offset();
            var w = $b.width();
            var h = $b.height();
            var hit = false;
            if (curr.x < off.left && next.x >= off.left && next.y > off.top && next.y < off.top + h) {
                // hit left side
                self.v.x = -self.v.x;
                hit = true;
            } else if (next.x <= off.left + w && curr.x > off.left + w && next.y > off.top && next.y < off.top + h) {
                // right side
                self.v.x = -self.v.x;
                hit = true;
            } else if (curr.y <= off.top && next.y > off.top && next.x > off.left && next.x < off.left + w) {
                // top side
                self.v.y = -self.v.y;
                hit = true;
            } else if (curr.y >= off.top + h && next.y < off.top + h && next.x > off.left && next.x < off.left + w) {
                // bottom side
                self.v.y = -self.v.y;
                hit = true;
            }
            if (hit) {
                if ($b.hasClass("hotdeal")) {
                    $b.removeClass("hotdeal");
                } else {
                    if (Math.random() < 0.4) {
                        // spawn power-up!
                        var bonus = new Bonus(curr);

                        game.sprites.push(bonus);
                    }
                    // add to score
                    game.score += +$b.text();
                    $(".breakout-score b").text(game.score);
                    b.hit = true;
                    $b.attr('class', 'anim sold').html('SOLD');
                    if ($('tr.deals:visible td:not(.sold)').not('.summary').length == 0) {
                        nextLevel();
                    }

                }
            }
        });
    };

}

function startPlaylist() {
	// globals
	var playa = document.createElement('audio');
	var playlist = ['wreckingball.mp3', 'sabotage.mp3', 'breakfree.mp3'];
	var current = 0;
	// var _stop = document.getElementById("stop"); TODO: mute button

	function playNext() {
		playa.src =break_loc + playlist[current];
		playa.play();

		current += 1;
		if (current >= playlist.length) {
			current = 0;
		}
	}

	// TODO: mute button
	// _stop.addEventListener("click", function () {
	// 	playa.pause();
	// });

	// get this show on the road...
	playNext();

	// rinse, repeat.
	playa.addEventListener("ended", playNext);
}

function Paddle() {
    this.sticks = 1;  // how many times ball will stick to the paddle
    this.lazermode = false;
    this.width = 150;
    this.dom = $('<span id="paddle"><span class="gradient-overlay"></span></span>').appendTo('body');
	//this.dom = $("<div id='paddle' style='width: " + this.width  + "px; height: 20px; left:15px; bottom:15px; position: fixed;z-index=1000000; background: linear-gradient(to bottom, rgb(97, 153, 199) 0%, rgb(58, 132, 195) 2%, rgb(65, 154, 214) 18%, rgb(75, 184, 240) 42%, rgb(58, 139, 194) 68%, rgb(38, 85, 139) 100%)'></div>").appendTo("body");
    this.dom.width(this.width);

    this.doLazer = function() {
    };
}


function nextLevel(level) {
    console.log(level, 'rows', rows.size());
    for (var i = game.balls.length - 1; i > 0; i--) {
        game.balls[i].kill();
    }
    if (game.balls.length > 0) {
        var ball = game.balls[0];
        game.moveBallToStartPos(ball);
    }
    if (Math.ceil(rows.size() / 4) > level) {
        if (newMatrix) {
            $('.matrix-card').hide();
            rows.hide();
            //$('.matrix-card').slice(level * 4, (level + 1) * 4).show();
            $('.matrix__spacer').hide();
        } else {
            $('table.matrix-content tr:not(.grid-header)').hide();
        }
        rows.slice(level * 4, (level + 1) * 4).show();
        level++;
        $("#level-heading").text("Level " + level);
        $(".breakout-level b").text(level);
        $("#level-head-div").slideDown().delay(2000).slideUp();
    } else {
        $('.breakout-bonus').hide();
        $('#ball').hide();
        $("#level-heading").text("Congratulations, You Completed " + wotifConfig.groupMapName + " Region");
        $("#level-head-div").slideDown();
        running = false;
        return level;
    }
}

function livesDisplay(lives) {
    var div = "<div id='lives-div' class='info lives-div'><ul class='starRating' data-rating='" + lives + "'>";
    for (var i = 0; i < 5; i++) {
        if (i < lives) {
            div += "<li><i class='fa fa-heart'></i></li>";
        } else {
            div += "<li><i class='fa fa-heart-o'></i></li>";
        }
    }
    div += "</ul></div>";
    return div;
};

if(!window.broken) {
    game = new Game();
    game.init();
}
