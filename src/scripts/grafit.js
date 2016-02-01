var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    functions = [],
    graphInputs = document.querySelector('#graph .inputs'),
    funcInputs = document.querySelector('#functions .inputs'),
    viewport,
    scale,
    offset,
    colors = [
        '#662d8f',
        '#00adee',
        '#ec038a',
        '#8bc543',
        '#f69322',
        '#ed1d24',
        '#0054a4',
        '#007137',
        '#ed1659',
    ];

function canvasPoint(point)
{
    return {
        x: (point.x + -viewport[0].x) / scale.x,
        y: (point.y + -viewport[0].y) / scale.y,
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
        x = viewport[0].x;

    while (x <= viewport[1].x) {
        points.push({
            x: x,
            y: f(x),
        });
        x += scale.x;
    }

    context.beginPath();
    var point = canvasPoint(points[0]);
    context.moveTo(point.x, point.y);
    for (var i = 1, l = points.length; i < l; ++i) {
        var point = canvasPoint(points[i]);
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
                      "    return Math.sin(x/10) * 20;\n" +
                      "}\n",
                color: colors[0],
            }
        ];
    }

    for (var i = 0, l = storedFunctions.length; i !== l; ++i) {
        var element = createInput();
        element.value = storedFunctions[i].func;
        element.style.borderColor = storedFunctions[i].color;
        handleFunctionInput(element);
    }
}

function handleFunctionInput(element)
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
        element.classList.add('error');
    }

    return func;
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
    func;

    for (var i = 0, l = wrappers.length; i !== l; ++i) {
        evaluate = wrappers[i].head + text + wrappers[i].tail;
        try {
            eval(evaluate);
            if (typeof(func) === 'function') {
                return func;
            }
        }
        catch (error) {
        }
    }

    throw error;
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
        var func = handleFunctionInput(textarea);
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
        updateFunctions();
        storeFunctions();
    }
});

document.addEventListener('click', function(event) {
    if (event.target.name === 'createInput') {
        createInput();
    }
});

graphInputs.addEventListener('change', function(event) {
    readViewportSize();
    drawAll();
});

fetchFunctions();
readViewportSize();
updateCanvasSize();
updateFunctions();
drawAll();
