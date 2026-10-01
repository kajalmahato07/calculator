(() => {
    "use strict";

    const display = document.querySelector("#display");
    const expression = document.querySelector("#expression");
    const keypad = document.querySelector("#keypad");

    let current = "0";
    let stored = null;
    let operator = null;
    let replaceCurrent = false;
    let hasError = false;

    const format = (value) => {
        if (!Number.isFinite(value)) return "Error";
        if (Object.is(value, -0)) value = 0;
        const rounded = Number(value.toPrecision(12));
        const plain = String(rounded);
        if (plain.length <= 12) return plain;
        return rounded.toExponential(6).replace(/\.?(0+)e/, "e");
    };

    function render() {
        display.textContent = current;
        expression.textContent = operator && stored !== null ? `${format(stored)} ${operator}` : "";
        keypad.querySelectorAll("[data-op]").forEach((key) => {
            const active = operator === key.dataset.op && !replaceCurrent;
            key.classList.toggle("is-selected", active);
            if (active) key.setAttribute("aria-pressed", "true");
            else key.removeAttribute("aria-pressed");
        });
    }

    function clear() {
        current = "0";
        stored = null;
        operator = null;
        replaceCurrent = false;
        hasError = false;
        render();
    }

    function enterDigit(digit) {
        if (hasError) clear();
        if (replaceCurrent) {
            current = digit;
            replaceCurrent = false;
        } else if (current === "0") {
            current = digit;
        } else if (current === "-0") {
            current = `-${digit}`;
        } else if (current.replace(/\D/g, "").length < 12) {
            current += digit;
        }
        render();
    }

    function enterDecimal() {
        if (hasError) clear();
        if (replaceCurrent) {
            current = "0.";
            replaceCurrent = false;
        } else if (!current.includes(".")) {
            current += ".";
        }
        render();
    }

    function calculate(left, right, op) {
        switch (op) {
            case "+": return left + right;
            case "-": return left - right;
            case "*": return left * right;
            case "/": return right === 0 ? NaN : left / right;
            default: return right;
        }
    }

    function chooseOperator(nextOperator) {
        if (hasError) return;
        const value = Number(current);
        if (operator && !replaceCurrent) {
            const answer = calculate(stored, value, operator);
            if (!Number.isFinite(answer)) {
                current = "Error";
                stored = null;
                operator = null;
                hasError = true;
                render();
                return;
            }
            current = format(answer);
            stored = answer;
        } else {
            stored = value;
        }
        operator = nextOperator;
        replaceCurrent = true;
        render();
    }

    function equals() {
        if (hasError || !operator || stored === null) return;
        const left = stored;
        const op = operator;
        const right = Number(current);
        const answer = calculate(left, right, op);
        expression.textContent = `${format(left)} ${op} ${format(right)} =`;
        operator = null;
        stored = null;
        replaceCurrent = true;
        if (!Number.isFinite(answer)) {
            current = "Error";
            hasError = true;
        } else {
            current = format(answer);
        }
        render();
        expression.textContent = `${format(left)} ${op} ${format(right)} =`;
    }

    function act(action) {
        if (action === "clear") return clear();
        if (action === "equals") return equals();
        if (hasError) clear();
        if (action === "decimal") return enterDecimal();
        if (action === "delete") {
            if (replaceCurrent) return;
            current = current.length > 1 ? current.slice(0, -1) : "0";
            if (current === "-" || current === "-0") current = "0";
        } else if (action === "sign") {
            if (current !== "0") current = current.startsWith("-") ? current.slice(1) : `-${current}`;
        } else if (action === "percent") {
            current = format(Number(current) / 100);
        }
        render();
    }

    keypad.addEventListener("click", (event) => {
        const key = event.target.closest("button");
        if (!key) return;
        if (key.dataset.digit !== undefined) enterDigit(key.dataset.digit);
        else if (key.dataset.op) chooseOperator(key.dataset.op);
        else if (key.dataset.action) act(key.dataset.action);
    });

    document.addEventListener("keydown", (event) => {
        if (/^[0-9]$/.test(event.key)) return enterDigit(event.key);
        if (event.key === "." || event.key === ",") { event.preventDefault(); return enterDecimal(); }
        if (event.key === "Enter" || event.key === "=") { event.preventDefault(); return equals(); }
        if (event.key === "Backspace") { event.preventDefault(); return act("delete"); }
        if (event.key === "Escape" || event.key.toLowerCase() === "c") return clear();
        const operators = { "+": "+", "-": "-", "*": "*", "x": "*", "X": "*", "/": "/" };
        if (operators[event.key]) { event.preventDefault(); chooseOperator(operators[event.key]); }
        if (event.key === "%") act("percent");
    });

    render();
})();


