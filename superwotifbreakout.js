console.log("AAAAAAAAAh");
/*
   javascript:var a,b,c=['https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js','http://nyan.alternative.ly/css-transform.js','http://nyan.alternative.ly/jquery-rotate.js','http://nyan.alternative.ly/nyan.js'];for(a=0;a!=c.length;a++){b=document.createElement('script');b.src=c[a];document.body.appendChild(b);}void(0);
 */

var ball;
var running = true;
var level = 0;
var score = 0;
var debugStep = false;

function Point(x, y) {
    this.x = x;
    this.y = y;
}


function Ball(id, velocity) {
    this.speed = 4;
    this.v = velocity;
    this.dom = $(id);
    this.update = function() {
        // TODO: bonds and collisions?
        this.collide();
        var pos = this.dom.position();
        var scrollTop = $(document).scrollTop();
        var topBound = $('table.matrix-content').offset().top;
        var someTr = $('tr.grid-header').last();
        var leftBound = someTr.offset().left;
        var rightBound = leftBound + someTr.width();
        if (pos.top <= topBound) {
            this.v.y = 1;
        } else if (pos.top >= $(window).height() + scrollTop) {
            console.log('woe to the fallen');
            this.v.y = -1;
        }
        if (pos.left <= leftBound) {
            this.v.x = 1;
        } else if (pos.left >= rightBound) {
            this.v.x = -1;
        }
        pos.left += (this.v.x * this.speed);
        pos.top += (this.v.y * this.speed);
        this.dom.offset(pos);
    };
    this.collisionPoint = function(div) {
        var d = $(div);
        var pos = d.offset();
        var w = d.width(), h = d.height();
        if (this.v.x > 0 ) {
            if (this.v.y > 0) {
                console.log("top left");
                return new Point(pos.left, pos.top);
            } else {
                console.log("bottom left");
                return new Point(pos.left, pos.top + h);
            }
        } else {
            if (this.v.y > 0) {
                console.log("top right");
                return new Point(pos.left + w, pos.top);
            } else {
                console.log("bottom right");
                return new Point(pos.left + w, pos.top + h);
            }
        }
    };
    this.collide = function() {
        var selector = 'div';
        var self = this;
        var bp = this.dom.position();
        var changeX = false;
        var changeY = false;
        self.dom.collision('tr.deals:visible').each(function(a, b) {
            var trId = '#' + b.id;
            var collided = false;
            self.dom.collision(trId + ' td.weekday, ' + trId + ' td.weekend').each(function(idx, elem) {
                $elem = $(elem);
                collided = true;
                if (!elem.hit) {
                    // ball response
                    var p = self.collisionPoint(elem);
                    console.log("collision corner: ", p);
                    console.log("bp: ", bp);
                    console.log("x difference", Math.abs(p.x - bp.left + 10));
                    console.log("y difference", Math.abs(p.y - bp.top + 10));
                    console.log("offsetWidth", elem.offsetWidth);
                    console.log("offsetHeight", elem.offsetHeight);
                    if (p.x < bp.left + 10 && bp.left + 10 < p.x + elem.offsetWidth) {
                        console.log("changing x within x..");
                        changeX = true;
                    } else if (p.y < bp.top + 10 && bp.top + 10 < p.y + elem.offsetHeight) {
                        console.log("changing y within y..");
                        changeY = true;
                    } else if (Math.abs(p.x - bp.left + 10) > Math.abs(p.y - bp.top + 10)) {
                        if (!changeY) {
                            console.log("changing y direction..");
                            changeY = true;
                        }
                    } else { 
                        if (!changeX ) {
                            console.log("changing x direction..");
                            changeX = true;
                        }
                    }
                    if ($elem.hasClass("hotdeal")) {
                        $elem.removeClass("hotdeal");
                    } else {
                        // add to score
                        score += +$(elem).text();
                        $(".breakout-score b").text(score);
                        elem.hit = true;
                        $elem.attr('class', 'anim sold').html('SOLD');
                    }
                    console.log(elem);
                    var pos = $(elem).position();
                }
                if (debugStep && !confirm("hit")) {
                  running = false;
                } 
                
            });
            if (changeX) {
                self.v.x *= -1;
                console.log("changing x ", self.v.x);
            }
            if (changeY) {
                self.v.y *= -1;
                console.log("changing y ", self.v.y);
            }
            if ($('tr.deals:visible td:not(.sold)').not('.summary').length == 0) {
                nextLevel();
            }
        });
        this.dom.collision('#paddle').each(function(idx, elem) {
            //self.v.x = - self.v.x;
            self.v.y = - self.v.y;
        });
    };
}

function main() {
    window.broken = true;
    //
    //
    // initialise dom and scroll top etc
    //
    $('#main').height($(window).height());
    var init = false;
    $('html, body').animate({
        //scrollTop: $("form.dateForm").offset().top
        scrollTop: 0
    }, 1500, function(e) {
        $('div.results-search').hide();
        $('#map-button').hide();
        $('.w-toolbar').hide();
        $('.results-header').hide();
        $('#hotel-deals').hide();
        $('.results-count').hide();
        level = 0;
        nextLevel();
        console.log(e);
        if (init) {
            return; //fml
        }
		$("<div id='paddle' style='background:pink; width: 200px; height:1em; left:15px; bottom:15px; position: fixed;z-index=1000000;'></div>").appendTo("body");
		$("<div id='ball' class='ball' style='width: 20px; height:20px; top:15px; bottom:15px; position: fixed; z-index=1000000; border-radius: 50%; margin: 0; background: radial-gradient(circle at 7px 7px, #CCC, #000);'></div>").appendTo("body");
        init = true;
        var m = $('#main');
        var startPos = {
            top: $('#paddle').offset().top - 20,
            left: m.offset().left + m.width() / 2,
        };
        ball = new Ball('#ball', new Point(1, 1));
        ball.dom.offset(startPos);

		//$('<img />', {
			//id: 'nyan-cat',
			//src: 'http://nyan.alternative.ly/nyan-cat3.gif',
		//}).appendTo("#nyan");
		
		$(document).css({
			overflow: 'hide'
		});
        $(".shortlist-summary").hide();
        $(".shortlist-summary").after("<div class='breakout-score' style='text-align: right; float: right; padding-right: 2em;'>SCORE<b>0</b></div>");
        $(".shortlist-summary").after("<div class='breakout-level' style='text-align: right; float: right;'>LEVEL<b>1</b></div>");
		//addMouseMovement();
		//addKeyboardMovement();
        console.log("lIOADEDED!");
        step(0);
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
    $('table.matrix-content tr:not(.grid-header)').hide();
    $('table.matrix-content tr.deals:not(tr.wothotel)').slice(level * 4, (level + 1) * 4).show();
    level++;
    $(".breakout-level  b").text(level);
}

    function step(delay) {
        ball.update();
        if (running) {
            window.setTimeout(step, delay); 
        }
    }
	
	if(!window.broken) {
		main();
	}
