
        MathJax = {
            loader: { load: ['input/tex', 'output/chtml'] },
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                packages: {'[+]': ['base', 'ams']},
                processEscapes: true
            },
            chtml: { scale: 0.9, mtextInheritFont: true },
            startup: {
                typeset: false,
                pageReady() {
                    MathJax.startup.defaultPageReady();
                    document.dispatchEvent(new Event('MathJaxReady'));
                }
            }
        };
    

        function loadDecimalFallback() {
            console.warn('Local Decimal.js failed to load. Attempting to load from CDN...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/decimal.js/10.4.3/decimal.min.js';
            script.async = true;
            script.onerror = () => {
                console.error('Failed to load Decimal.js from CDN. Some calculations may not work correctly.');
                alert('Unable to load Decimal.js. Please check your network connection or ensure the local file is available.');
            };
            script.onload = () => {
                console.log('Decimal.js loaded successfully from CDN.');
                initializeDecimal();
            };
            document.head.appendChild(script);
        }

        function initializeDecimal() {
            if (typeof Decimal !== 'undefined') {
                Decimal.set({ precision: 20, toExpNeg: -9, toExpPos: 20 });
            }
        }

        if (typeof Decimal !== 'undefined') {
            initializeDecimal();
        }
    

        function loadMathJaxFallback(attempt = 1, maxAttempts = 2) {
            console.warn(`Local MathJax failed to load. Attempting to load from CDN (Attempt ${attempt}/${maxAttempts})...`);
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            script.async = true;
            script.onerror = () => {
                if (attempt < maxAttempts) {
                    console.warn(`MathJax CDN attempt ${attempt} failed. Retrying...`);
                    loadMathJaxFallback(attempt + 1, maxAttempts);
                } else {
                    console.error('Failed to load MathJax from CDN after multiple attempts.');
                    alert('Unable to load MathJax. Equations will be displayed as plain text.');
                    document.getElementById('mathjax-loading').textContent = 'Failed to load equations.';
                    document.getElementById('mathjax-loading').style.display = 'block';
                    document.dispatchEvent(new Event('MathJaxReady'));
                }
            };
            script.onload = () => {
                console.log('MathJax loaded successfully from CDN.');
                document.getElementById('mathjax-loading').style.display = 'none';
                MathJax.startup.getComponents();
            };
            document.head.appendChild(script);
        }
    

        // Named constants
        const CONSTANTS = {
            MAX_CALCULATIONS: 15,
            ACB_DEFAULT_A: 417.000,
            ACB_DEFAULT_C: 84.375,
            ACB_TOTAL_A: 1668.000,
            ACB_TOTAL_C: 337.500,
            Q_MAX: 9999999,
            W_MAX: 99.99,
            A_MAX: 100.00,
            MATHJAX_TIMEOUT: 10000
        };

        // Configure Decimal.js
        Decimal.set({ precision: 20, toExpNeg: -9, toExpPos: 20 });

        // Cache DOM elements
        const domCache = {
            QInput: document.getElementById("Q"),
            waterInput: document.getElementById("water"),
            assayInput: document.getElementById("assay"),
            waterGroup: document.querySelector("#water").parentElement,
            assayGroup: document.querySelector("#assay").parentElement,
            buttons: document.querySelector(".button-row"),
            progressBar: document.getElementById("progressBar"),
            calculationSteps: document.getElementById("calculationSteps"),
            stepsContainer: document.getElementById("stepsContainer"),
            formulaCalculator: document.getElementById("formulaCalculator"),
            acbCalculator: document.getElementById("acbCalculator"),
            menuFormula: document.getElementById("menuFormula"),
            menuAcb: document.getElementById("menuAcb"),
            toggleEditBtn: document.getElementById("toggleEditBtn"),
            acbNotice: document.getElementById("acb-notice"),
            mathJaxLoading: document.getElementById("mathjax-loading"),
            stdQtyInput: document.getElementById("stdQty"),
            dispensedQty: document.getElementById("dispensedQty"),
            remainingQty: document.getElementById("remainingQty"),
            quantityWarning: document.getElementById("quantityWarning"),
            lotSelect: document.getElementById("lotSelect"),
            lotSelectGroup: document.getElementById("lotSelectGroup"),
            acbInputs: {
                a: ['lot1-a', 'lot2-a', 'lot3-a', 'lot4-a'].map(id => document.getElementById(id)),
                b: ['lot1-b', 'lot2-b', 'lot3-b', 'lot4-b'].map(id => document.getElementById(id)),
                c: ['lot1-c', 'lot2-c', 'lot3-c', 'lot4-c'].map(id => document.getElementById(id)),
                results: ['lot1-result', 'lot2-result', 'lot3-result', 'lot4-result'].map(id => document.getElementById(id)),
                totals: {
                    a: document.getElementById("total-a"),
                    b: document.getElementById("total-b"),
                    c: document.getElementById("total-c"),
                    result: document.getElementById("total-result")
                }
            }
        };

        // State variables
        let calculationCount = 0;
        let isMathJaxReady = false;
        let hasCalculated = false;
        let isACBEditingEnabled = false;
        let acbNoticeTimeout;
        let calculations = [];
        let mathJaxQueue = [];
        let mathJaxPending = false;

        // MathJax readiness
        document.addEventListener('MathJaxReady', () => {
            isMathJaxReady = true;
            domCache.mathJaxLoading.style.display = 'none';
            MathJax.typesetPromise().then(() => {
                document.querySelectorAll('.calculation-entry').forEach(entry => {
                    const content = entry.querySelector('.calculation-content');
                    const refValues = entry.querySelector('.reference-values');
                    if (content && refValues) {
                        const refBounds = refValues.getBoundingClientRect();
                        const contentBounds = content.getBoundingClientRect();
                        if (refBounds.bottom > contentBounds.top) {
                            content.style.marginTop = `${parseFloat(content.style.marginTop || '35') + 5}mm`;
                        }
                    }
                });
            }).catch(err => console.error("MathJax initial typeset error:", err));
        });

        // MathJax retry mechanism
        function retryMathJaxLoad(attempt = 1, maxAttempts = 2) {
            if (attempt > maxAttempts) {
                alert("Failed to render equations. Displaying plain text.");
                isMathJaxReady = true;
                domCache.mathJaxLoading.style.display = 'none';
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            script.async = true;
            script.onload = () => {
                MathJax.startup.getComponents();
                isMathJaxReady = true;
                domCache.mathJaxLoading.style.display = 'none';
                MathJax.typesetPromise().catch(err => {
                    console.error(`MathJax retry ${attempt} typeset error:`, err);
                    retryMathJaxLoad(attempt + 1, maxAttempts);
                });
            };
            script.onerror = () => retryMathJaxLoad(attempt + 1, maxAttempts);
            document.head.appendChild(script);
        }

        // Truncate to 12 digits
        function truncateTo12Digits(num) {
            try {
                const numStr = new Decimal(num).toString();
                const isNegative = numStr.startsWith("-");
                const absNumStr = isNegative ? numStr.slice(1) : numStr;
                let result = isNegative ? "-" : "";
                let digitCount = 0;
                for (let i = 0; i < absNumStr.length && digitCount < 12; i++) {
                    if (absNumStr[i] === ".") {
                        result += ".";
                    } else {
                        result += absNumStr[i];
                        digitCount++;
                    }
                }
                return result;
            } catch {
                return num.toString();
            }
        }

        // Format number with caching
        const formatNumber = (() => {
            const cache = new Map();
            const maxCacheSize = 500;
            return (num, isAW = false) => {
                const cacheKey = `${num}_${isAW}`;
                if (cache.has(cacheKey)) return cache.get(cacheKey);
                try {
                    const d = new Decimal(num);
                    const formatted = isAW ? d.toFixed(2) : d.toString();
                    const result = truncateTo12Digits(formatted);
                    if (cache.size >= maxCacheSize) cache.clear();
                    cache.set(cacheKey, result);
                    return result;
                } catch {
                    return num.toString();
                }
            };
        })();

        // Queue MathJax rendering
        function queueMathJax(element) {
            mathJaxQueue.push(element);
            if (!mathJaxPending) {
                mathJaxPending = true;
                requestAnimationFrame(() => {
                    MathJax.typesetPromise(mathJaxQueue).then(() => {
                        mathJaxPending = false;
                        mathJaxQueue = [];
                    }).catch(err => {
                        console.error("MathJax error:", err);
                        mathJaxPending = false;
                        mathJaxQueue = [];
                        retryMathJaxLoad();
                    });
                });
            }
        }

        // Create calculation
        function createCalculation(formulaType, Q, W, A) {
            try {
                const hundred = new Decimal(100);
                const formattedQ = formatNumber(Q);
                const formattedA = formatNumber(A, true);
                const formattedW = formatNumber(W, true);

                if (formulaType === "F1" || formulaType === "F3") {
                    const step1 = Q.mul(hundred);
                    const step2 = step1.mul(hundred);
                    const step3 = hundred.sub(W);
                    const step4 = A.mul(step3);
                    const numerator = step2;
                    const denominator = step4;
                    if (denominator.isZero()) throw new Error("Division by zero");
                    const result = numerator.div(denominator);
                    const roundedResult = result.toFixed(3);

                    return {
                        mathJax: `
                            $$ F_${formulaType === "F1" ? "1" : "3"} = \\frac{${formattedQ} \\times 100 \\times 100}{${formattedA} \\times (100 - ${formattedW})} $$ <br><br>
                            $$ = \\frac{${formattedQ} \\times 100 \\times 100}{${formattedA} \\times ${formatNumber(step3)}} $$ <br><br>
                            $$ = \\frac{${formatNumber(numerator)}}{${formatNumber(denominator)}} $$ <br><br>
                            $$ = ${truncateTo12Digits(roundedResult)} \\text{ (original: } ${formatNumber(result)} \\text{)} $$
                        `,
                        plainText: `
                            F${formulaType === "F1" ? "1" : "3"} = (${formattedQ} × 100 × 100) / (${formattedA} × (100 - ${formattedW}))
                            <br><br>
                            = (${formattedQ} × 100 × 100) / (${formattedA} × ${formatNumber(step3)})
                            <br><br>
                            = ${formatNumber(numerator)} / ${formatNumber(denominator)}
                            <br><br>
                            = ${truncateTo12Digits(roundedResult)} <br> (original: ${formatNumber(result)})
                        `,
                        formulaType,
                        Q: Q.toString(),
                        W: W.toString(),
                        A: A.toString(),
                        result: roundedResult,
                        isFinal: true
                    };
                } else if (formulaType === "F2") {
                    const step1 = hundred.sub(W);
                    const step2 = A.mul(step1);
                    const step3 = Q.mul(step2);
                    const denominator = hundred.mul(hundred);
                    const numerator = step3;
                    const result = numerator.div(denominator);
                    const roundedResult = result.toFixed(3);

                    return {
                        mathJax: `
                            $$ F_2 = \\frac{${formattedQ} \\times ${formattedA} \\times (100 - ${formattedW})}{100 \\times 100} $$ <br><br>
                            $$ = \\frac{${formattedQ} \\times ${formattedA} \\times ${formatNumber(step1)}}{${formatNumber(denominator)}} $$ <br><br>
                            $$ = \\frac{${formatNumber(numerator)}}{${formatNumber(denominator)}} $$ <br><br>
                            $$ = ${truncateTo12Digits(roundedResult)} \\text{ (original: } ${formatNumber(result)} \\text{)} $$
                        `,
                        plainText: `
                            F2 = (${formattedQ} × ${formattedA} × (100 - ${formattedW})) / (100 × 100)
                            <br><br>
                            = (${formattedQ} × ${formattedA} × ${formatNumber(step1)}) / ${formatNumber(denominator)}
                            <br><br>
                            = ${formatNumber(numerator)} / ${formatNumber(denominator)}
                            <br><br>
                            = ${truncateTo12Digits(roundedResult)} <br> (original: ${formatNumber(result)})
                        `,
                        formulaType,
                        Q: Q.toString(),
                        W: W.toString(),
                        A: A.toString(),
                        result: roundedResult,
                        isFinal: false
                    };
                }
                return null;
            } catch (err) {
                console.error("Calculation error:", err);
                throw err;
            }
        }

        // Update quantity tracker with lot selection visibility
        function updateQuantityTracker() {
            const stdQty = new Decimal(domCache.stdQtyInput.value || 0);
            let dispensed = new Decimal(0);
            let remainingCalc = new Decimal(0);
            let hasFinalCalculations = false;
            let hasF2Calculations = false;

            calculations.forEach(calc => {
                if (calc.formulaType === "F2") {
                    dispensed = dispensed.plus(calc.Q);
                    remainingCalc = remainingCalc.plus(calc.result);
                    hasF2Calculations = true;
                } else if (calc.formulaType === "F1" || calc.formulaType === "F3") {
                    dispensed = dispensed.plus(calc.result);
                    remainingCalc = remainingCalc.plus(calc.Q);
                    hasFinalCalculations = true;
                }
            });

            domCache.dispensedQty.textContent = formatNumber(dispensed);
            if (stdQty.isZero() || !domCache.stdQtyInput.value.trim()) {
                domCache.remainingQty.textContent = '-';
                domCache.quantityWarning.classList.remove('active');
                domCache.lotSelectGroup.style.display = 'none';
            } else {
                const remaining = stdQty.minus(remainingCalc);
                domCache.remainingQty.textContent = formatNumber(remaining);
                
                // Show lot selection when remaining is zero
                const showLotSelect = remaining.eq(0);
                domCache.lotSelectGroup.style.display = showLotSelect ? 'block' : 'none';
                
                const lastCalculation = calculations.length > 0 ? calculations[calculations.length - 1].formulaType : null;
                const isLastF1orF3 = lastCalculation === "F1" || lastCalculation === "F3";
                if ((hasFinalCalculations && !remaining.eq(0)) || 
                    (hasF2Calculations && remaining.lte(0) && !(isLastF1orF3 && remaining.eq(0)))) {
                    domCache.quantityWarning.classList.add('active');
                } else {
                    domCache.quantityWarning.classList.remove('active');
                }
            }
        }

        // Update dispensed quantity in ACB calculator based on lot selection
        function updateLotDispensedQty() {
            const lotIndex = parseInt(domCache.lotSelect.value) - 1;
            if (lotIndex >= 0 && lotIndex < domCache.acbInputs.b.length) {
                const dispensedQty = domCache.dispensedQty.textContent;
                const input = domCache.acbInputs.b[lotIndex];
                input.value = dispensedQty;
                input.classList.add('acb-manual-input');
                updateACB(input, lotIndex, 'b');
                
                // Switch to ACB calculator and focus on the input
                showCalculator('acb');
                input.focus();
                
                // Reset the lot selection
                domCache.lotSelect.value = '';
                domCache.lotSelectGroup.style.display = 'none';
            }
        }

        // Copy remaining quantity to Q input when clicked
        function copyRemainingToQ() {
            if (domCache.remainingQty.textContent !== '-' && domCache.remainingQty.textContent !== '0.000') {
                if (confirm(`Copy ${domCache.remainingQty.textContent} to Quantity (Q) field? This will clear current inputs.`)) {
                    domCache.QInput.value = domCache.remainingQty.textContent;
                    domCache.waterInput.value = '';
                    domCache.assayInput.value = '';
                    domCache.progressBar.style.width = "33%";
                    domCache.buttons.style.display = "none";
                    domCache.assayGroup.style.display = "block";
                    domCache.QInput.focus();
                }
            }
        }

        // Reset ACB calculator
        function resetACBCalculator() {
            if (!confirm("Are you sure you want to reset the (A+C)-B calculator? This will clear all entered values.")) {
                return;
            }
            
            // Reset standard values
            domCache.acbInputs.a.forEach(input => {
                input.value = CONSTANTS.ACB_DEFAULT_A.toFixed(3);
                input.classList.remove('edited', 'acb-manual-input');
                input.classList.add('acb-prefilled');
            });
            
            domCache.acbInputs.c.forEach(input => {
                input.value = CONSTANTS.ACB_DEFAULT_C.toFixed(3);
                input.classList.remove('edited', 'acb-manual-input');
                input.classList.add('acb-prefilled');
            });
            
            // Clear issued values
            domCache.acbInputs.b.forEach(input => {
                input.value = '';
                input.classList.remove('acb-manual-input');
            });
            
            // Reset totals
            domCache.acbInputs.totals.a.textContent = CONSTANTS.ACB_TOTAL_A.toFixed(3);
            domCache.acbInputs.totals.b.textContent = '0.000';
            domCache.acbInputs.totals.c.textContent = CONSTANTS.ACB_TOTAL_C.toFixed(3);
            domCache.acbInputs.totals.result.textContent = '0.000';
            
            // Reset results
            domCache.acbInputs.results.forEach(result => {
                result.textContent = '-';
                result.classList.remove('acb-output', 'acb-prefilled');
            });
            
            // Reset edit mode if active
            if (isACBEditingEnabled) {
                toggleEdit();
            }
        }

        // Calculate
        function calculate(formulaType) {
            if (calculationCount >= CONSTANTS.MAX_CALCULATIONS) {
                alert(`Maximum of ${CONSTANTS.MAX_CALCULATIONS} calculations reached. Press F5 to reset or delete a calculation.`);
                return;
            }

            let Q, W, A;
            try {
                Q = new Decimal(domCache.QInput.value || 0);
                W = new Decimal(domCache.waterInput.value || 0);
                A = new Decimal(domCache.assayInput.value || 0);
            } catch {
                alert("Invalid input values.");
                return;
            }

            if (Q.isNaN() || W.isNaN() || A.isNaN() || Q.lte(0) || W.lte(0) || A.lte(0)) {
                alert("Please enter valid values for Q, W, and A (all must be greater than 0).");
                return;
            }

            if (Q.gt(CONSTANTS.Q_MAX)) {
                alert(`Quantity (Q) must be less than or equal to ${CONSTANTS.Q_MAX}.`);
                return;
            }

            if (A.gt(CONSTANTS.A_MAX) || W.gt(CONSTANTS.W_MAX)) {
                alert("Invalid values: Ensure A ≤ 100 and W ≤ 99.99.");
                return;
            }

            hasCalculated = true;
            let calculationResult;
            try {
                calculationResult = createCalculation(formulaType, Q, W, A);
                if (!calculationResult) throw new Error("Failed to create calculation");
            } catch {
                alert("Calculation failed. Please check inputs.");
                return;
            }

            calculations.push(calculationResult);
            const newEntry = document.createElement("div");
            newEntry.className = "calculation-entry";
            newEntry.setAttribute("tabindex", "0");
            newEntry.setAttribute("role", "region");
            newEntry.setAttribute("aria-label", `Calculation ${formulaType}`);
            newEntry.innerHTML = `
                <button type="button" class="delete-button" onclick="deleteCalculation(this)" title="Delete" aria-label="Delete calculation">❌</button>
                <div class="lot-label"></div>
                <div class="reference-values">W="${formatNumber(W, true)}" A="${formatNumber(A, true)}"</div>
                <div class="calculation-content">${calculationResult.plainText}</div>
                <div class="page-number">${calculationCount + 1}/${calculationCount + 1}</div>
                <span class="loading-indicator">Rendering...</span>
            `;

            domCache.stepsContainer.insertBefore(newEntry, domCache.stepsContainer.firstChild);
            calculationCount++;
            domCache.calculationSteps.classList.remove("hidden");

            updatePageNumbers();
            updateQuantityTracker();

            if (isMathJaxReady) {
                setTimeout(() => {
                    newEntry.innerHTML = `
                        <button type="button" class="delete-button" onclick="deleteCalculation(this)" title="Delete" aria-label="Delete calculation">❌</button>
                        <div class="lot-label"></div>
                        <div class="reference-values">W="${formatNumber(W, true)}" A="${formatNumber(A, true)}"</div>
                        <div class="calculation-content">${calculationResult.mathJax}</div>
                        <div class="page-number">${calculationCount}/${calculationCount}</div>
                    `;
                    queueMathJax(newEntry);
                }, 50);
            } else {
                newEntry.querySelector('.loading-indicator').style.display = 'block';
                setTimeout(() => {
                    if (!isMathJaxReady) retryMathJaxLoad();
                }, CONSTANTS.MATHJAX_TIMEOUT);
            }

            newEntry.focus();
        }

        // Input handling
        function handleInput(event) {
            const input = event.target;
            const value = input.value.trim();
            let numericValue;
            const errorElement = input.nextElementSibling?.classList.contains('error-message') ? input.nextElementSibling : null;

            try {
                numericValue = parseFloat(value);
            } catch {
                showError(input, "Enter a valid number.");
                return;
            }

            if (value === "") {
                clearError(input);
                updateProgress();
                return;
            }

            if (input.id === "water" || input.id === "assay") {
                if (!/^\d*\.?\d{0,2}$/.test(value)) {
                    input.value = value.slice(0, -1);
                    return;
                }
                if (isNaN(numericValue) || numericValue <= 0) {
                    showError(input, `${input.id === "water" ? "Water Content (W)" : "Assay Content (A)"} must be greater than 0.`);
                    return;
                }
                if (numericValue > 100.00) {
                    input.value = "";
                    showError(input, `${input.id === "water" ? "Water Content (W)" : "Assay Content (A)"} cannot exceed 100.00.`);
                    alert(`${input.id === "water" ? "Water Content (W)" : "Assay Content (A)"} cannot exceed 100.00.`);
                    input.focus();
                    return;
                }
                clearError(input);
            }

            if (event.key === "Enter" && value !== "") {
                event.preventDefault();
                const nextInput = input.id === "Q" ? domCache.waterInput : input.id === "water" ? domCache.assayInput : null;
                if (nextInput) {
                    nextInput.parentElement.style.display = "block";
                    nextInput.focus();
                } else {
                    input.blur();
                }
            }

            if (event.type === "change" && input.id === "water") {
                if (numericValue > 20 && numericValue <= 100.00) {
                    if (confirm("Water content seems high (>20). Swap with assay content?")) {
                        domCache.assayInput.value = input.value;
                        input.value = "";
                    }
                    input.focus();
                    return;
                } else {
                    input.value = numericValue.toFixed(2);
                    domCache.assayInput.focus();
                }
            }

            if (hasCalculated && (input.id === "water" || input.id === "assay")) {
                if (input.id === "assay" && numericValue < 10 && numericValue > 0) {
                    showError(input, "Assay Content (A) should be greater than 80.");
                } else if (input.id === "water" && numericValue > 80 && numericValue <= 100.00) {
                    showError(input, "Water Content (W) should be less than 10.");
                } else {
                    clearError(input);
                }
            }

            updateProgress();
        }

        function showError(input, message) {
            clearError(input);
            const error = document.createElement('div');
            error.className = 'error-message';
            error.id = `${input.id}-error`;
            error.textContent = message;
            input.parentElement.appendChild(error);
            input.setAttribute('aria-describedby', error.id);
            input.setCustomValidity(message);
            input.reportValidity();
        }

        function clearError(input) {
            const errorElement = input.nextElementSibling?.classList.contains('error-message') ? input.nextElementSibling : null;
            if (errorElement) errorElement.remove();
            input.removeAttribute('aria-describedby');
            input.setCustomValidity("");
        }

        function updateProgress() {
            let filledFields = 0;
            if (domCache.QInput.value.trim()) filledFields++;
            if (domCache.waterInput.value.trim()) filledFields++;
            if (domCache.assayInput.value.trim()) filledFields++;
            domCache.progressBar.style.width = (filledFields / 3) * 100 + "%";
            domCache.waterGroup.style.display = domCache.QInput.value.trim() ? "block" : "none";
            domCache.assayGroup.style.display = domCache.waterInput.value.trim() ? "block" : "none";
            domCache.buttons.style.display = filledFields === 3 ? "flex" : "none";
        }

        // Show calculator
        function showCalculator(calculator) {
            domCache.formulaCalculator.classList.toggle('active', calculator === 'formula');
            domCache.acbCalculator.classList.toggle('active', calculator === 'acb');
            domCache.menuFormula.classList.toggle('active', calculator === 'formula');
            domCache.menuAcb.classList.toggle('active', calculator === 'acb');
            domCache.menuQtyTracker.classList.toggle('hidden', calculator === 'acb');
            domCache.calculationSteps.classList.toggle('hidden', calculator !== 'formula' || calculationCount === 0);
            (calculator === 'formula' ? domCache.QInput : domCache.acbInputs.b[0]).focus();
        }

        // Info modal
        function showInfo() {
            const modal = document.getElementById('infoModal');
            const formulaInfo = document.getElementById('formulaInfo');
            const acbInfo = document.getElementById('acbInfo');
            formulaInfo.style.display = domCache.formulaCalculator.classList.contains('active') ? 'block' : 'none';
            acbInfo.style.display = domCache.formulaCalculator.classList.contains('active') ? 'none' : 'block';
            modal.style.display = 'block';
            document.querySelector('.close').focus();
        }

        function closeModal() {
            document.getElementById('infoModal').style.display = 'none';
            (domCache.formulaCalculator.classList.contains('active') ? domCache.QInput : domCache.acbInputs.b[0]).focus();
        }

        // Clear fields
        function clearAllFields() {
            if (!confirm("Are you sure you want to clear all formula calculator fields and calculations?")) return;
            domCache.QInput.value = "";
            domCache.waterInput.value = "";
            domCache.assayInput.value = "";
            domCache.stepsContainer.innerHTML = "";
            domCache.progressBar.style.width = "0%";
            domCache.buttons.style.display = "none";
            domCache.calculationSteps.classList.add("hidden");
            domCache.assayGroup.style.display = "none";
            domCache.waterGroup.style.display = "none";
            calculationCount = 0;
            hasCalculated = false;
            calculations = [];
            updateQuantityTracker();
            domCache.QInput.focus();
        }

        function clearInputsOnly() {
            if (!confirm("Are you sure you want to clear all input fields in the formula calculator?")) return;
            domCache.QInput.value = "";
            domCache.waterInput.value = "";
            domCache.assayInput.value = "";
            domCache.progressBar.style.width = "0%";
            domCache.buttons.style.display = "none";
            domCache.assayGroup.style.display = "none";
            domCache.waterGroup.style.display = "none";
            updateQuantityTracker();
            domCache.QInput.focus();
        }

        // Delete calculation
        function deleteCalculation(button) {
            if (!confirm("Are you sure you want to delete this calculation?")) return;
            const entry = button.parentElement;
            const entries = Array.from(domCache.stepsContainer.children);
            const entryIndex = entries.indexOf(entry);
            const arrayIndex = calculations.length - 1 - entryIndex;
            if (arrayIndex >= 0 && arrayIndex < calculations.length) {
                calculations.splice(arrayIndex, 1);
            }
            entry.remove();
            calculationCount--;
            if (calculationCount === 0) domCache.calculationSteps.classList.add("hidden");
            updatePageNumbers();
            updateQuantityTracker();
            domCache.QInput.focus();
        }

        // Update page numbers
        function updatePageNumbers() {
            const entries = domCache.stepsContainer.getElementsByClassName("calculation-entry");
            const total = entries.length;
            Array.from(entries).forEach((entry, i) => {
                const pageNumber = entry.querySelector(".page-number");
                if (pageNumber) pageNumber.textContent = `${total - i}/${total}`;
            });
        }

        // Validate input
        function validateInput(input) {
            const value = input.value;
            const maxDecimals = input.id === "stdQty" || input.id.includes('-b') ? 3 : 2;
            if (!/^\d*\.?\d{0,3}$/.test(value) && value !== '') {
                input.value = value.slice(0, -1);
            }
        }

        // ACB Calculator
        function toggleEdit() {
            isACBEditingEnabled = !isACBEditingEnabled;
            domCache.toggleEditBtn.textContent = isACBEditingEnabled ? 'Disable Edit' : 'Enable Edit';
            domCache.acbInputs.a.concat(domCache.acbInputs.c).forEach(input => {
                input.readOnly = !isACBEditingEnabled;
            });
            if (isACBEditingEnabled) showACBNotice();
        }

        function showACBNotice() {
            domCache.acbNotice.style.display = 'block';
            clearTimeout(acbNoticeTimeout);
            acbNoticeTimeout = setTimeout(() => {
                domCache.acbNotice.style.display = 'none';
            }, 3000);
        }

        function updateACB(input, lotIndex, type) {
            try {
                const value = new Decimal(input.value || 0);
                if (type === 'a' || type === 'c') {
                    const original = new Decimal(type === 'a' ? CONSTANTS.ACB_DEFAULT_A : CONSTANTS.ACB_DEFAULT_C);
                    input.classList.toggle('edited', !value.eq(original));
                    input.classList.remove('acb-prefilled');
                    input.classList.add('acb-manual-input');
                    if (lotIndex === 0) {
                        domCache.acbInputs[type].slice(1).forEach((otherInput, i) => {
                            otherInput.value = formatNumber(value);
                            otherInput.classList.toggle('edited', !value.eq(original));
                            otherInput.classList.remove('acb-manual-input');
                            otherInput.classList.add('acb-prefilled');
                        });
                    }
                } else {
                    input.classList.add('acb-manual-input');
                }
            } catch {
                input.value = "";
            }

            let totalA = new Decimal(0), totalB = new Decimal(0), totalC = new Decimal(0), totalResult = new Decimal(0);
            domCache.acbInputs.a.forEach((aInput, i) => {
                const a = new Decimal(aInput.value || 0);
                const b = new Decimal(domCache.acbInputs.b[i].value || 0);
                const c = new Decimal(domCache.acbInputs.c[i].value || 0);
                const resultElement = domCache.acbInputs.results[i];

                if (b.isZero() || !domCache.acbInputs.b[i].value.trim()) {
                    resultElement.textContent = '-';
                    resultElement.classList.remove('acb-output', 'acb-prefilled');
                } else {
                    const result = a.plus(c).minus(b);
                    resultElement.textContent = formatNumber(result);
                    resultElement.classList.add('acb-output');
                    resultElement.classList.remove('acb-prefilled');
                    totalResult = totalResult.plus(result);
                }

                totalA = totalA.plus(a);
                totalB = totalB.plus(b);
                totalC = totalC.plus(c);
            });

            domCache.acbInputs.totals.a.textContent = formatNumber(totalA);
            domCache.acbInputs.totals.b.textContent = formatNumber(totalB);
            domCache.acbInputs.totals.c.textContent = formatNumber(totalC);
            domCache.acbInputs.totals.result.textContent = formatNumber(totalResult);

            [domCache.acbInputs.totals.a, domCache.acbInputs.totals.b, domCache.acbInputs.totals.c].forEach(element => {
                element.classList.add('acb-output');
                element.classList.remove('acb-prefilled');
            });

            domCache.acbInputs.totals.result.classList.toggle('acb-prefilled', totalResult.isZero());
            domCache.acbInputs.totals.result.classList.toggle('acb-output', !totalResult.isZero());
        }

        // Print with screen size check
        function printWithCheck() {
            if (window.innerWidth <= 768 && !confirm("For optimal printing, use a larger screen or PC. Continue?")) {
                return;
            }
            window.print();
        }

        // Initialize
        document.addEventListener("DOMContentLoaded", () => {
            domCache.assayGroup.style.display = "none";
            domCache.waterGroup.style.display = "none";
            domCache.buttons.style.display = "none";
            domCache.calculationSteps.classList.add("hidden");
            domCache.QInput.focus();

            // Input listeners
            [domCache.QInput, domCache.waterInput, domCache.assayInput].forEach(input => {
                input.addEventListener("input", e => {
                    validateInput(input);
                    handleInput(e);
                });
                input.addEventListener("keydown", e => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
                    if (e.key === "Enter") handleInput(e);
                });
                input.addEventListener("contextmenu", e => e.preventDefault());
            });

            // ACB input delegation
            domCache.acbCalculator.addEventListener("input", e => {
                const input = e.target;
                const match = input.id.match(/lot(\d+)-([abc])/);
                if (match) {
                    const [, lotIndex, type] = match;
                    validateInput(input);
                    updateACB(input, parseInt(lotIndex) - 1, type);
                    if ((type === 'a' || type === 'c') && isACBEditingEnabled) showACBNotice();
                }
            });

            // ACB navigation
            const inputFields = ['a', 'b', 'c'].flatMap(type => [1, 2, 3, 4].map(i => `lot${i}-${type}`));
            inputFields.forEach((id, index) => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            let nextIndex = index + 1;
                            while (nextIndex < inputFields.length) {
                                if (nextIndex >= inputFields.length) nextIndex = 0;
                                const nextInput = document.getElementById(inputFields[nextIndex]);
                                if (nextInput && !nextInput.readOnly) {
                                    nextInput.focus();
                                    break;
                                }
                                nextIndex++;
                            }
                        }
                    });
                }
            });

            // Modal listeners
            window.addEventListener('click', e => {
                if (e.target === document.getElementById('infoModal')) closeModal();
            });

            // Keyboard shortcuts
            document.addEventListener("keydown", e => {
                switch (e.key) {
                    case "F1": e.preventDefault(); calculate("F1"); break;
                    case "F2": e.preventDefault(); calculate("F2"); break;
                    case "F3": e.preventDefault(); calculate("F3"); break;
                    case "F4": e.preventDefault(); if (calculationCount > 0) printWithCheck(); break;
                    case "F5": e.preventDefault(); clearAllFields(); break;
                    case "F8": e.preventDefault(); clearInputsOnly(); break;
                }
            });

            // Standard quantity input
            domCache.stdQtyInput.addEventListener('input', () => {
                validateInput(domCache.stdQtyInput);
                updateQuantityTracker();
            });

            // Remaining quantity click handler
            domCache.remainingQty.addEventListener('click', copyRemainingToQ);

            // Lot selection handler
            domCache.lotSelect.addEventListener('change', updateLotDispensedQty);

            // Initialize quantity tracker
            updateQuantityTracker();

            // MathJax loading
            if (!isMathJaxReady) {
                domCache.mathJaxLoading.style.display = 'block';
                setTimeout(() => {
                    if (!isMathJaxReady) retryMathJaxLoad();
                }, CONSTANTS.MATHJAX_TIMEOUT);
            }

            // Prevent accidental page reload
            window.addEventListener('beforeunload', e => {
                if (calculationCount > 0) {
                    e.preventDefault();
                    e.returnValue = 'You have unsaved calculations. Are you sure you want to leave?';
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', updatePageNumbers);
    