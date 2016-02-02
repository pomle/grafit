var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    functions = [],
    graphInputs = document.querySelector('#graph .inputs'),
    funcInputs = document.querySelector('#functions .inputs'),
    zoomRect = document.querySelector('#graph .zoom'),
    viewport,
    scale,
    offset,
    colors = [
        '#00adee',
        '#ec038a',
        '#662d8f',
        '#8bc543',
        '#f69322',
        '#ed1d24',
        '#0054a4',
        '#007137',
        '#ed1659',
    ];

function canvasPoint(point)
{
    var x = (point.x + -viewport[0].x) / scale.x,
        y = (point.y + -viewport[0].y) / scale.y,
        minY = -1,
        maxY = canvas.height + 1;

    if (y < minY) {
        y = minY;
    }
    else if (y > maxY) {
        y = maxY;
    }

    return {
        x: x,
        y: y,
    }
}

function viewportPoint(point)
{
    return {
        x: point.x * scale.x + viewport[0].x,
        y: point.y * scale.y + viewport[0].y,
    }
}

function createInput()
{
    if (colors.counter === undefined) {
        colors.counter = 0;
    }

    var element = document.createElement('textarea');
    var color = colors[colors.counter++ % colors.length];
    element.style.borderColor = color;
    funcInputs.appendChild(element);
    return element;
}

function detectGraphSizeChange()
{
    var rect = canvas.getBoundingClientRect();
    if (canvas.lastW !== rect.width || canvas.lastH !== rect.height) {
        updateCanvasSize();
    }
}

function drawAll()
{
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    for (var i = 0, l = functions.length; i !== l; ++i) {
        if (functions[i]) {
            drawFunction(functions[i]);
        }
    }
}

function drawFunction(f)
{
    var points = [],
        xMin = Math.min(viewport[0].x, viewport[1].x),
        xMax = Math.max(viewport[0].x, viewport[1].x),
        xDiff = xMax - xMin,
        xStep = xDiff / canvas.width,
        x = xMin;

    if (xDiff === 0) {
        console.error('Viewport zero size');
        return;
    }

    while (x <= xMax) {
        points.push({
            x: x,
            y: f(x),
        });
        x += xStep;
    }

    context.beginPath();
    var point = canvasPoint(points[0]);
    context.moveTo(point.x, point.y);
    for (var i = 1, l = points.length; i !== l; ++i) {
        point = canvasPoint(points[i]);
        context.lineTo(point.x, point.y);
    }
    context.strokeStyle = f.color;
    context.stroke();
    context.closePath();
}

function drawGrid()
{
    var point;
    context.beginPath();
    point = canvasPoint({
        x: viewport[0].x,
        y: 0,
    });
    context.moveTo(point.x, point.y);
    point = canvasPoint({
        x: viewport[1].x,
        y: 0,
    });
    context.lineTo(point.x, point.y);
    point = canvasPoint({
        x: 0,
        y: viewport[0].y,
    });
    context.moveTo(point.x, point.y);
    point = canvasPoint({
        x: 0,
        y: viewport[1].y,
    });
    context.lineTo(point.x, point.y);
    context.strokeStyle = '#1e9dcc';
    context.stroke();
    context.closePath();
}

function fetchFunctions()
{
    try {
        var json = localStorage.getItem('functions'),
            storedFunctions = JSON.parse(json);
    } catch(error) {
        console.error(error);
    }

    if (!Array.isArray(storedFunctions) || storedFunctions.length === 0) {
        storedFunctions = [
            {
                func: "function (x) {\n" +
                      "    return Math.sin(x) * 2;\n" +
                      "}\n",
                color: colors[0],
            }
        ];
    }

    for (var i = 0, l = storedFunctions.length; i !== l; ++i) {
        var element = createInput();
        element.value = storedFunctions[i].func;
        element.style.borderColor = storedFunctions[i].color;
        parseTextarea(element);
    }
}

function parseFunction(text)
{
    var wrappers = [
        {
            head: 'func =',
            tail: '',
        },
        {
            head: 'func = function(x) {',
            tail: ';}',
        },
    ],
    evaluate,
    func,
    error;

    for (var i = 0, l = wrappers.length; i !== l; ++i) {
        evaluate = wrappers[i].head + text + wrappers[i].tail;
        try {
            eval(evaluate);
            if (typeof(func) === 'function') {
                if (!isFinite(func(1))) {
                    throw new Error('Invalid return value');
                }
                return func;
            }
        }
        catch (e) {
            error = e;
        }
    }

    throw error;
}

function parseTextarea(element)
{
    var text = element.value.trim();

    element.classList.remove('error');
    if (text.length === 0) {
        return false;
    }

    try {
        func = parseFunction(text);
        func.color = element.style.borderColor;
        return func;
    }
    catch (error) {
        console.error(error);
        element.classList.add('error');
    }

    return func;
}

function readViewportSize()
{
    var map = {};
    [].forEach.call(graphInputs.querySelectorAll('input'), function(input) {
        map[input.name] = parseFloat(input.value);
    });

    viewport = [
        {x: map.x1, y: map.y1},
        {x: map.x2, y: map.y2},
    ];
    viewport.w = viewport[1].x - viewport[0].x;
    viewport.h = viewport[1].y - viewport[0].y;

    updateViewportMeta();
}

function storeFunctions()
{
    var storedFunctions = [];
    [].forEach.call(funcInputs.querySelectorAll('textarea'), function(textarea) {
        if (textarea.value.trim().length === 0) {
            return;
        }
        storedFunctions.push({
            func: textarea.value,
            color: textarea.style.borderColor,
        });
    });
    localStorage.setItem('functions', JSON.stringify(storedFunctions));
}
function updateCanvasSize()
{
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.lastW = rect.width;
    canvas.lastH = rect.height;
    updateViewportMeta();
    drawAll();
}

function updateFunctions()
{
    functions = [];
    [].forEach.call(funcInputs.querySelectorAll('textarea'), function(textarea) {
        var func = parseTextarea(textarea);
        if (func !== false) {
            functions.push(func);
        }
    });
    drawAll();
}

function updateViewportMeta()
{
    offset = {
        x: viewport[0].x - viewport.w,
        y: viewport[0].y - viewport.h,
    }

    scale = {
        x: viewport.w / canvas.width,
        y: viewport.h / canvas.height,
    }
}

setInterval(detectGraphSizeChange, 2000);

funcInputs.addEventListener('change', function(event) {
    if (event.target.tagName === 'TEXTAREA') {
        storeFunctions();
    }
    else if (event.target.name === 'theme') {
        console.log(event.target);
    }
});

funcInputs.addEventListener('keyup', function(event) {
    updateFunctions();
});


(function() {
    var themeSelector = document.querySelector('select[name=theme]');
    themeSelector.addEventListener('change', function(event) {
        var select = event.target,
            html = document.querySelector('html');
        [].forEach.call(select, function(opt) {
            html.classList.remove(opt.value);
        });
        html.classList.add(select.value);
        localStorage.setItem('theme', select.value);
    });

    var theme = localStorage.getItem('theme');
    if (theme) {
        themeSelector.value = theme;
        themeSelector.dispatchEvent(new Event('change'));
    }
})();

document.addEventListener('click', function(event) {
    if (event.target.name === 'createInput') {
        createInput();
    }
    else if (event.target.name === 'resetZoom') {
        updateViewportSize(-10, 10, 10, -10);
    }
});
document.addEventListener('mousedown', function(event) {
    if (event.target.id === 'canvas') {
        if (event.buttons === 1) {
            var target = event.target;
            zoomRect.start = {
                x: event.layerX,
                y: event.layerY,
            };
            zoomRect.classList.add('active');
            drawZoomRect(zoomRect.start.x, zoomRect.start.y, zoomRect.start.x, zoomRect.start.y);
        }
    }
});
document.addEventListener('mousemove', function(event) {
    if (zoomRect.classList.contains('active')) {
        drawZoomRect(zoomRect.start.x, zoomRect.start.y, event.layerX, event.layerY);
    }
});
document.addEventListener('mouseup', function(event) {
    if (zoomRect.classList.contains('active')) {
        zoomRect.classList.remove('active');
        var x1 = Math.min(zoomRect.start.x, event.layerX),
            x2 = Math.max(zoomRect.start.x, event.layerX),
            y1 = Math.min(zoomRect.start.y, event.layerY),
            y2 = Math.max(zoomRect.start.y, event.layerY);

        if (x1 === x2 || y1 === y2) {
            return;
        }

        var p1 = viewportPoint({x: x1, y: y1}),
            p2 = viewportPoint({x: x2, y: y2});
        updateViewportSize(p1.x, p1.y, p2.x, p2.y);
    }
});

function drawZoomRect(a, b, c, d)
{
    console.log(arguments);

    var w = Math.abs(a - c),
        h = Math.abs(b - d),
        l = Math.min(a, c),
        t = Math.min(b, d);
    zoomRect.style.left = l + 'px';
    zoomRect.style.top = t + 'px';
    zoomRect.style.width = w + 'px';
    zoomRect.style.height = h + 'px';
}

function updateViewportSize(x1, y1, x2, y2)
{
    var map = {
        x1: x1,
        x2: x2,
        y1: y1,
        y2: y2,
    };

    [].forEach.call(graphInputs.querySelectorAll('input'), function(input) {
        input.value = map[input.name];
    });

    readViewportSize();
    drawAll();
}

graphInputs.addEventListener('change', function(event) {
    readViewportSize();
    drawAll();
});

fetchFunctions();
readViewportSize();
updateCanvasSize();
updateFunctions();
drawAll();
