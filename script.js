document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const keys = document.querySelector('.calculator-keys');
    const displayCurrent = document.querySelector('[data-current-operand]');
    const displayPrevious = document.querySelector('[data-previous-operand]');
    const historyToggleBtn = document.querySelector('[data-action="toggle-history"]');
    const historyPanel = document.querySelector('.history-panel');
    const historyList = document.querySelector('.history-list');
    const clearHistoryBtn = document.querySelector('[data-action="clear-history"]');

    // --- Calculator State ---
    let currentOperand = '0';
    let previousOperand = '';
    let operation = undefined;
    let shouldResetScreen = false;
    let calculationHistory = [];

    // --- Core Functions ---
    const clear = () => {
        currentOperand = '0';
        previousOperand = '';
        operation = undefined;
        updateDisplay();
    };

    const del = () => {
        if (currentOperand.length <= 1) {
            currentOperand = '0';
        } else {
            currentOperand = currentOperand.toString().slice(0, -1);
        }
        updateDisplay();
    };
    
    const appendNumber = (number) => {
        if (currentOperand === '0' || shouldResetScreen) {
            currentOperand = number;
            shouldResetScreen = false;
        } else {
            if (currentOperand.length > 15) return; // Limit input length
            currentOperand += number;
        }
        updateDisplay();
    };

    const appendDecimal = () => {
        if (shouldResetScreen) {
            currentOperand = '0.';
            shouldResetScreen = false;
            return;
        }
        if (currentOperand.includes('.')) return;
        currentOperand += '.';
        updateDisplay();
    };

    const chooseOperation = (op) => {
        if (currentOperand === '' && previousOperand !== '') {
             operation = op;
             updateDisplay();
             return;
        }
        if (currentOperand === '') return;
        if (previousOperand !== '') {
            compute();
        }
        operation = op;
        previousOperand = currentOperand;
        currentOperand = '';
        shouldResetScreen = true;
        updateDisplay();
    };

    const compute = () => {
        let computation;
        const prev = parseFloat(previousOperand);
        const current = parseFloat(currentOperand);

        if (isNaN(prev) || isNaN(current)) return;
        
        const expression = `${formatNumber(previousOperand)} ${getOperationSymbol(operation)} ${formatNumber(current)}`;

        switch (operation) {
            case 'add': computation = prev + current; break;
            case 'subtract': computation = prev - current; break;
            case 'multiply': computation = prev * current; break;
            case 'divide':
                if (current === 0) {
                   displayCurrent.innerText = "Error";
                   setTimeout(clear, 1500);
                   return;
                }
                computation = prev / current;
                break;
            default: return;
        }
        
        const result = parseFloat(computation.toPrecision(15)).toString();
        calculationHistory.push({ expression, result });
        updateHistoryDisplay();

        currentOperand = result;
        operation = undefined;
        previousOperand = '';
        shouldResetScreen = true;
        updateDisplay();
    };

    const handlePercent = () => {
        if (currentOperand === '') return;
        const current = parseFloat(currentOperand);
        if (isNaN(current)) return;
        currentOperand = (current / 100).toString();
        updateDisplay();
    };

    const updateDisplay = () => {
        displayCurrent.innerText = formatNumber(currentOperand);
        if (operation != null) {
            displayPrevious.innerText = `${formatNumber(previousOperand)} ${getOperationSymbol(operation)}`;
        } else {
            displayPrevious.innerText = '';
        }
    };

    const formatNumber = (number) => {
        if (number === '' || number === null) return '';
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    };
    
    const getOperationSymbol = (op) => {
        const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
        return symbols[op] || '';
    }
    
    // --- History Functions ---
    const toggleHistory = () => historyPanel.classList.toggle('active');

    const updateHistoryDisplay = () => {
        historyList.innerHTML = ''; // Clear existing list
        if (calculationHistory.length === 0) {
            historyList.innerHTML = '<li class="empty-history">No history yet.</li>';
            return;
        }
        calculationHistory.slice().reverse().forEach(item => { // Show newest first
            const li = document.createElement('li');
            li.dataset.result = item.result;

            const expressionSpan = document.createElement('span');
            expressionSpan.className = 'expression';
            expressionSpan.textContent = item.expression;

            const resultSpan = document.createElement('span');
            resultSpan.className = 'result';
            resultSpan.textContent = `= ${formatNumber(item.result)}`;
            
            li.appendChild(expressionSpan);
            li.appendChild(resultSpan);
            historyList.appendChild(li);
        });
    };

    const clearHistory = () => {
        calculationHistory = [];
        updateHistoryDisplay();
    };

    const useHistoryValue = (e) => {
        const targetLi = e.target.closest('li');
        if (!targetLi || targetLi.classList.contains('empty-history')) return;
        
        currentOperand = targetLi.dataset.result;
        operation = undefined;
        previousOperand = '';
        shouldResetScreen = true;
        toggleHistory(); // Hide history panel after selection
        updateDisplay();
    };

    // --- Event Listeners ---
    keys.addEventListener('click', e => {
        if (!e.target.matches('button')) return;
        
        createRipple(e);

        const { action } = e.target.dataset;
        const displayedNum = e.target.innerText;

        if (e.target.hasAttribute('data-number')) appendNumber(displayedNum);
        else if (action === 'decimal') appendDecimal();
        else if (action === 'clear') clear();
        else if (action === 'delete') del();
        else if (action === 'calculate') compute();
        else if (action === 'percent') handlePercent();
        else if (e.target.classList.contains('operator')) chooseOperation(action);
    });
    
    historyToggleBtn.addEventListener('click', toggleHistory);
    clearHistoryBtn.addEventListener('click', clearHistory);
    historyList.addEventListener('click', useHistoryValue);

    // --- Ripple Effect Function ---
    const createRipple = (event) => {
        const button = event.target;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        const rect = button.getBoundingClientRect();
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple");

        const ripple = button.getElementsByClassName("ripple")[0];
        if (ripple) ripple.remove();

        button.appendChild(circle);
    };
    
    // --- Initialize ---
    updateHistoryDisplay();

    // --- Particle Background Animation ---
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particlesArray;

    class Particle {
        constructor(x, y, directionX, directionY, size) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = 'rgba(173, 216, 230, 0.4)';
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function initParticles() {
        particlesArray = [];
        let numberOfParticles = (canvas.height * canvas.width) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * .4) - .2;
            let directionY = (Math.random() * .4) - .2;
            particlesArray.push(new Particle(x, y, directionX, directionY, size));
        }
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connectParticles();
    }

    function connectParticles() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                    ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                    opacityValue = 1 - (distance / 20000);
                    ctx.strokeStyle = 'rgba(173, 216, 230,' + opacityValue + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    window.addEventListener('resize', () => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        initParticles();
    });

    initParticles();
    animateParticles();
});
