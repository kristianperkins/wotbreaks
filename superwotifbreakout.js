console.log("AAAAAAAAAh");
/*
   javascript:var a,b,c=['https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js','http://nyan.alternative.ly/css-transform.js','http://nyan.alternative.ly/jquery-rotate.js','http://nyan.alternative.ly/nyan.js'];for(a=0;a!=c.length;a++){b=document.createElement('script');b.src=c[a];document.body.appendChild(b);}void(0);
 */

var startPos;
var ball;
var t0;
var w;
var $window;
var running = true;
var level = 0;
var score = 0;
var debugStep = false;
var bonus = $("<div class='breakout-bonus' style='width: 70px; height: 50px; left: 0px; top:0px; position: absolute; border-radius: 20%; background-image: linear-gradient(to bottom, #f5f9fc, #d1dbe4);'>stuff</div>");
var rows = $('table.matrix-content tr.deals:not(tr.wothotel)');

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Ball(id, velocity) {
    this.speed = 800;
    this.v = velocity;
    this.dom = $(id);
    this.width = this.dom.width();
    this.height = this.dom.height();
    var off = this.dom.offset();
    this.pos = new Point(off.left, off.top);

    this.collideWindow = function(curr, next) {
        var bottomBound = $(window).height() + $(document).scrollTop();
        var topBound = $('table.matrix-content').offset().top;
        var someTr = $('tr.grid-header').last();
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
            this.v.y = -this.v.y;
            next.y = bottomBound;
        }
    }


    this.collidePaddle = function(curr, next) {
        var PI = Math.PI;
        var $paddle = $('#paddle');
        var off = $paddle.offset();
        var w = $paddle.width();
        if (curr.y <= off.top && next.y > off.top  && next.x > off.left && next.x < off.left + w) {
            // reflect x based on distance from the midpoint
            var dist = (next.x - off.left) / w;  // dist along paddle, 0->1
            var theta =  -dist *  PI - PI;  // dist -PI/2 -> PI/2
            this.v.y = -Math.sin(theta);
            this.v.x = Math.cos(theta);
            console.log(this.v);
            //this.v.y = - this.v.y;
            // rotate though theta
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
                    if (Math.random() < 0.1) {
                        bonus.offset({top: curr.y, left: curr.x});
                        bonus.appendTo("body");
                    }
                    // add to score
                    score += +$b.text();
                    $(".breakout-score b").text(score);
                    b.hit = true;
                    $b.attr('class', 'anim sold').html('SOLD');
                    if ($('tr.deals:visible td:not(.sold)').not('.summary').length == 0) {
                        nextLevel();
                    }

                }
            }
        });
    }

    this.update = function(dt) {
        var nextPos = new Point(this.pos.x + dt * this.v.x * this.speed,
                                this.pos.y + dt * this.v.y * this.speed);
        this.collideWindow(this.pos, nextPos);
        this.collideBlocks(this.pos, nextPos);
        this.collidePaddle(this.pos, nextPos);
        $('.breakout-bonus').css('top', '+=1');
        this.pos = nextPos;
        this.dom.offset({
            left: this.pos.x,
            top: this.pos.y
        });
        console.log('frame');
    };
}

function main() {
    window.broken = true;
    //
    //
    // initialise dom and scroll top etc
    //
    var init = false;
    $('html, body').animate({
        //scrollTop: $("form.dateForm").offset().top
        scrollTop: 0
    }, 1500, function(e) {
        level = 0;
        nextLevel();
        $('div.results-search').slideUp('slow');
        $('#map-button').slideUp('slow');
        $('.w-toolbar').slideUp('slow');
        $('.results-header').slideUp('slow');
        $('#hotel-deals').slideUp('slow');
        $('.results-count').slideUp('slow');
        console.log(e);
        if (init) {
            return; //fml
        }
        $('body').height(window.innerHeight);
        $(window).resize(function() {
            $('body').height(window.innerHeight);
        });
		$("<div id='paddle' style='background:pink; width: 200px; height:1em; left:15px; bottom:15px; position: fixed;z-index=1000000;'></div>").appendTo("body");
		$("<div id='ball' class='ball' style='width: 20px; height:20px; top:15px; bottom:15px; position: fixed; z-index=1000000; border-radius: 50%; margin: 0; background: radial-gradient(circle at 7px 7px, #CCC, #000);'></div>").appendTo("body");
        $("<div id='level-head-div' style='display: none; top: 260px; width: 100%; height: 40px; position: absolute; background-image: linear-gradient(to bottom, #f5f9fc, #d1dbe4); vertical-align: middle; text-align: centre'><h1 id='level-heading' style='text-align: center; margin: auto; padding-top: 5px;'>Level X</h1></div>").appendTo("body");
        init = true;
        var m = $('#main');
        startPos = {
            top: $('#paddle').offset().top - 50,
            left: m.offset().left + m.width() / 2,
        };
        $window = $(window);
        w = new Point($('#m').width(), $('#m').height());
        ball = new Ball('#ball', new Point(0, 1));
        ball.dom.offset(startPos);
        ball.pos = new Point(startPos.left, startPos.top);

		$(document).css({
			overflow: 'hide'
		});
        $(".shortlist-summary").hide();
        $(".shortlist-summary").after("<div class='breakout-score' style='text-align: right; float: right; padding-right: 2em;'>SCORE<b>0</b></div>");
        $(".shortlist-summary").after("<div class='breakout-level' style='text-align: right; float: right;'>LEVEL<b>1</b></div>");
        console.log("lIOADEDED!");
        t0 = window.performance.now();
        window.requestAnimationFrame(step);
        //step(0);
    });



    $("<link/>", {
       rel: "stylesheet",
       type: "text/css",
        id: "yeah",
       href: "http://localhost:8000/animate-custom.css"
    }).appendTo("head");
    var HORIZ_POS = 15;
    var TIME_FOR_MOVEMENT = 20;
    var PX_FOR_MOVEMENT = 20;

    var keys = {};
    movementCodes = {   LEFT: 37,
                        RIGHT: 39,
                        UP: 38,
                        DOWN: 40
                    };
 
    console.log("doin it");
    previousPoint = {
        x: 15,
        y: 15
    };
    $(window).mousemove(function(e) { $('#paddle').offset({left: e.pageX  });  } );
    $(document).keydown(function(e) {
        keys[e.which] = true;
        movement();
    });
    $(document).keyup(function(e) {
        delete keys[e.which];
    });
        function movement() {
            var pos = $('#paddle').position();
            if(keys[movementCodes.RIGHT] && (pos.left + $("#paddle").width() < $(document).width())) {
                console.log('move right');
                pos.left += PX_FOR_MOVEMENT;
                $('#paddle').offset(pos);
                /*$('#paddle').animate(
                    {"left": "+=" + PX_FOR_MOVEMENT + "px"},
                    TIME_FOR_MOVEMENT,
                    function () {
                        //alert('hi');
                    }
                );*/
            }
            else if(keys[movementCodes.LEFT] && pos.left > 0) {
                console.log('move left');
                pos.left -= PX_FOR_MOVEMENT;
                $('#paddle').offset(pos);
                /*$('#paddle').animate(
                    {
                        left: "-="+ PX_FOR_MOVEMENT + "px"
                    },
                    TIME_FOR_MOVEMENT,
                    function () {
                        //alert('hi');
                    }
                );*/
            }
        }

        $(window).click(function() {
            nextLevel();
        });
	}

function nextLevel() {
    console.log(level, 'rows', rows.size());
    if (Math.ceil(rows.size() / 4) > level) {
        $('table.matrix-content tr:not(.grid-header)').hide();
        rows.slice(level * 4, (level + 1) * 4).show();
        level++;
        $("#level-heading").text("Level " + level);
        $(".breakout-level b").text(level);
        $("#level-head-div").slideDown().delay(2000).slideUp();
    } else {
        $("#level-heading").text("You Win!");
        $("#level-head-div").slideDown();
        running = false;
    }
}

    function step(t1) {
        var dt = ((t1 - t0) / 1000);
        ball.update(dt);
        t0 = t1;
        if (running) {
            window.requestAnimationFrame(step);
        }
    }
    //function step(delay) {
    //    ball.update();
    //    if (running) {
    //        window.setTimeout(step, delay); 
    //    }
    //}
	
	if(!window.broken) {
		main();
	}
