var sw = 20, //一个方块的宽度
    sh = 20, //一个方块的高度
    tr = 30, //行数
    td = 30; //列数

var snake = null,// 蛇的实例
    food = null,  // 食物的实例
    game = null;// 游戏的实例

// 方块构造函数
function Square ( x, y, classname) {
    // (0,0) (20,0) (40,0)
    // (0,0) (1,0) (2,0)

    this.x = x * sw;
    this.y = y * sh;
    this.class = classname;
    this.viewContent = document.createElement('div');  // 方块对应的DOM元素
    this.viewContent.className = this.class;
    this.parent = document.getElementById('snakeWrap');  //方块的父级
}

// 创建方块DOM,并添加到页面里
Square.prototype.create = function () {
    this.viewContent.style.position = 'absolute';
    this.viewContent.style.width = sw + 'px';
    this.viewContent.style.height = sh + 'px';
    this.viewContent.style.left = this.x + 'px';
    this.viewContent.style.top = this.y + 'px';
    this.parent.appendChild(this.viewContent);
};

Square.prototype.remove = function () {
    this.parent.removeChild(this.viewContent);
}

// 蛇
function Snake () {
    this.head = null; // 存一下蛇头的信息
    this.tail = null; // 存一下蛇尾的信息
    this.pos = []; // 存储蛇身上的每一个方块的位置
    this.directionNum = {
        left: {
            x: -1,
            y: 0,
            rotate: 180  // 蛇头在不同方向中应该进行旋转
        },
        right: {
            x: 1,
            y: 0,
            rotate: 0
        },
        up: {
            x: 0,
            y: -1,
            rotate: -90
        },
        down: {
            x: 0,
            y: 1,
            rotate: 90
        }
    } // 存储蛇走的方向，用一个对象表示
}

Snake.prototype.init = function () {
    // 创建一个蛇头
    var snakeHead = new Square(2,0, 'snakeHead');
    snakeHead.create();
    this.head = snakeHead;  //存储蛇头信息
    this.pos.push([2,0]);  //把蛇头的位置存起来

    // 创建蛇身体1
    var snakeBody1 = new Square(1,0, 'snakeBody');
    snakeBody1.create();
    this.pos.push([1,0]);  // 把蛇身体1的位置存一下

    // 创建蛇身体2
    var snakeBody2 = new Square(0,0, 'snakeBody');
    snakeBody2.create();
    this.tail = snakeBody2; //把蛇尾的信息存起来
    this.pos.push([0,0]);  // 把蛇身体2的位置存一下

    // 形成链表关系
    snakeHead.last = null;
    snakeHead.next = snakeBody1;

    snakeBody1.last = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.last = snakeBody1;
    snakeBody2.next = null;

    // 给蛇添加一条属性，用来表示蛇默认的方向
    this.direction = this.directionNum.right;
}

// 这个方法用来获取蛇头的下一个位置对应的元素，要根据元素做不同的事情
Snake.prototype.getNextPos = function () {
    var nextPos = [  //蛇头要走的下一点的坐标
        this.head.x/sw + this.direction.x,
        this.head.y/sh + this.direction.y
    ]

    // 下个点是自己,代表撞到了自己，游戏结束
    var selfCollied = false;
    this.pos.forEach(function (value) {
        if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
            // 如果数组中的两个数据都相等，说明下一个点在蛇身体里面能找到，代表撞到自己了
            selfCollied = true;
        }
    })
    if (selfCollied) {
        this.strategies.die.call(this);
        return;  //阻止函数继续往下走，或者返回特定值
    }
    // 下个点是围墙，游戏结束
    if (nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td-1 || nextPos[1] > tr-1) {
        this.strategies.die.call(this);
        return;
    }

    // 下个点是食物，吃掉
    if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
        // 如果这个条件成立，说明现在蛇头下一个点是食物
        this.strategies.eat.call(this);
    }
    
    // 下个点什么都不是，走
    this.strategies.move.call(this);
}

// 处理碰撞后要做的事
Snake.prototype.strategies = {
    move: function (format) {  //此参数决定是否删除蛇尾,当传了参数后，表示之后的动作是吃
        // 创建新的身体（在旧蛇头的位置）
        var newBody = new Square(this.head.x/sw,this.head.y/sh ,'snakeBody')
        // 更新链表关系
        newBody.next = this.head.next;
        newBody.next.last = newBody;
        newBody.last = null;
        // 干掉旧蛇头
        this.head.remove();
        newBody.create();
        // 创建新蛇头(下一个要走的位置)
        var newHead = new Square( this.head.x/sw + this.direction.x, this.head.y/sh + this.direction.y, 'snakeHead')
        // 更新链表关系
        newHead.next = newBody;
        newHead.last = null;
        newBody.last = newHead;
        newHead.viewContent.style.transform = 'rotate('+ this.direction.rotate +'deg)';
        newHead.create();
        // 蛇身上每一个方块的坐标也要更新
        this.pos.splice(0,0,[this.head.x/sw + this.direction.x, this.head.y/sh + this.direction.y])
        // 还要把this.head的信息更新一下
        this.head = newHead;

        if (!format) {  // 即format的值false，表示需要删除（即除了吃的操作）
            this.tail.remove();
            this.tail = this.tail.last;
            this.pos.pop();
        }
        
    },
    eat: function () {
        this.strategies.move.call(this, true)
        createFood();
        game.score++;
        return;
    },
    die: function () {
        // console.log('die')
        game.over();
    }
}

snake = new Snake();

// 创建食物
function createFood () {
    // 食物小方块的随机坐标;
    var x = null;
    var y = null;
    var include = true;  // 循环跳出的条件，true表示生成的食物的坐标在蛇身上（继续循环），false表示食物的坐标不在蛇身上（不能循环）
    while(include) {
        x = Math.round(Math.random() * (td - 1));
        y = Math.round(Math.random() * (tr - 1));

        snake.pos.forEach(function (value) {
            if (x !== value[0] && y !== value[1]) {
                // 这个条件成立说明在随机出来的坐标不在蛇身上
                include = false;
            }
        })
    }

    // 生成食物
    food  = new Square(x, y, 'apple');
    food.pos = [x, y];  // 存储生成食物的坐标。用于跟蛇头的下一个点的坐标作对比
    var foodDom = document.querySelector('.apple');
    if (foodDom) {
        foodDom.style.left = x * sw + 'px';
        foodDom.style.top = y * sh + 'px';
    }else{
        food.create();
    }
}




// 控制游戏
function Game () {
    this.timer = null;
    this.score = 0;
}
Game.prototype.init = function () {
    snake.init();
    // snake.getNextPos();
    createFood();
    
    document.onkeydown = function(e) {
        var ev = e || event;
        if (ev.keyCode == 37 && snake.direction != snake.directionNum.right) { //按下左键时之前，蛇是不能往右走的
            snake.direction = snake.directionNum.left;
        }else if (ev.keyCode == 38 && snake.direction != snake.directionNum.down){
            snake.direction = snake.directionNum.up;
        }else if (ev.keyCode == 39 && snake.direction != snake.directionNum.left) {
            snake.direction = snake.directionNum.right;
        }else if (ev.keyCode == 40 && snake.direction != snake.directionNum.up) {
            snake.direction = snake.directionNum.down;
        }
    }
    this.start();
}
// 开始游戏
Game.prototype.start = function () {
    this.timer = setInterval(function () {
        snake.getNextPos();
    },200)
}
Game.prototype.pause = function () {
    clearInterval(this.timer)
}

// 结束游戏
Game.prototype.over = function () {
    clearInterval(this.timer);
    alert('你的得分为：' + this.score);
    // 游戏回到最初始的状态
    var snakeWrap = document.getElementById('snakeWrap');
    snakeWrap.innerHTML = '';
    snake = new Snake();
    game = new Game();
    var startBtnWrap = document.querySelector('.startBtn');
    startBtnWrap.style.display = 'block';
}

// 开启游戏
game = new Game();
var startBtn = document.querySelector('.startBtn button');
startBtn.onclick = function () {
    startBtn.parentNode.style.display = 'none';
    game.init();
}

// 暂停游戏
snakeWrap = document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.pauseBtn button');
snakeWrap.onclick = function () {
    game.pause();
    pauseBtn.parentNode.style.display = 'block';
}

pauseBtn.onclick = function () {
    game.start();
    pauseBtn.parentNode.style.display = 'none';
}