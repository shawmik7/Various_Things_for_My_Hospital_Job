// ==UserScript==
// @name         Discount Calculator
// @author       Sohanur Rahman Shawmik
// @namespace    https://github.com/shawmik7/
// @version      3.0
// @description  Calculates the discounts and automatically puts that in the discount field, in the web app of Comfort Diagnostic Centre Pvt. Ltd. Also adds the small changes (like 5 taka) to the discount to make the payable rounded to next 10
// @match        http://115.127.77.187:8080/*
// @match        http://192.168.1.1:8080/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/shawmik7/Various_Things_for_My_Hospital_Job/main/discount_calculator.user.js
// @downloadURL  https://raw.githubusercontent.com/shawmik7/Various_Things_for_My_Hospital_Job/main/discount_calculator.user.js
// ==/UserScript==

(function () {
    'use strict';

    const discountRules = {
        "vacuette": 0,
        "blood  cbc": 0,
        "dengue": 0,
        "bone merrow": 0,
        "bronchoscopy": 0,
        "colposcopy": 0,
        "pap-smear c. c": 0,
        "cervical smear c.c": 0,
        "volt smear c c": 0,
        "h.v.s. for c/c": 0,
        "collection charge for nipple swap": 0,
        "x-ray": 50,
        "usg": 50,
        "echo": 50,
        "e.e.g": 12,
        "eeg": 12,
        "urodynamics study": 5.55,
        "uroflowmetry": 20
    };

    const imagingTests = ["x-ray", "usg", "echo", "e.c.g", "e.e.g", "eeg"];
    let lastSelectedPercent = null;

    function getSuffix(id) {
        const parts = id.split("_");
        return parts.length > 1 ? parts[1] : null;
    }

function applyDiscount(selectedPercent) {
    lastSelectedPercent = selectedPercent;

    const testFields = document.querySelectorAll('input[name="f04"]');
    let totalDiscount = 0;
    let totalTestRate = 0;

    const imagingCapInput = document.querySelector('#imaging-cap-input');
    let manualImagingCap = parseFloat(imagingCapInput?.value);
    if (isNaN(manualImagingCap)) manualImagingCap = null;

    testFields.forEach(testInput => {
        const testName = testInput.value.trim().toLowerCase();
        if (!testName) return;

        const suffix = getSuffix(testInput.id);
        if (!suffix) return;

        const rateInput = document.querySelector(`#f07_${suffix}`);
        if (!rateInput) return;

        const rate = parseFloat(rateInput.value);
        if (isNaN(rate) || rate <= 0) return;

        totalTestRate += rate;

        const isImaging = imagingTests.some(keyword => testName.includes(keyword));
        let allowedPercent = selectedPercent;

        for (const key in discountRules) {
            if (testName.includes(key)) {
                allowedPercent = Math.min(allowedPercent, discountRules[key]);
                break;
            }
        }

        if (isImaging && manualImagingCap !== null) {
            allowedPercent = Math.min(allowedPercent, manualImagingCap);
        }

        const discount = (rate * allowedPercent) / 100;
        totalDiscount += discount;
    });

    // Use totalTestRate to calculate final payable and round it
    let rawPayable = totalTestRate - totalDiscount;
    let payableRounded = Math.round(rawPayable); // Round to nearest integer
    let lastDigit = payableRounded % 10;
    let extraDiscount = lastDigit === 0 ? 0 : lastDigit;
    let finalDiscount = totalTestRate - (payableRounded - extraDiscount);

    // Apply final discount
    const discountField = document.querySelector('#P423_LUMSUM');
    if (discountField) {
        discountField.value = finalDiscount;
        discountField.dispatchEvent(new Event('change', { bubbles: true }));
        discountField.dispatchEvent(new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13
        }));
    }

    const remarkField = document.querySelector('#P423_INV_REMARK');
    if (remarkField) remarkField.value = `DISCOUNT BY DR (${selectedPercent}%)`;
}



    function createFloatingPanel() {
        const panel = document.createElement('div');
        panel.id = 'floating-discount-panel';

        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '15px',
            right: '15px',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: '9999',
            fontFamily: 'Segoe UI, sans-serif',
            width: '135px', // narrower panel
            fontSize: '11px',
            transform: 'translate(0, 0)',
            transition: 'transform 0.2s ease, opacity 0.2s ease'
        });

        panel.innerHTML = `
            <div id="discount-panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; cursor: move;">
                <strong style="font-size: 12px;">Discount</strong>
                <button id="toggle-panel" title="Minimize" style="background: none; border: none; font-size: 13px; cursor: pointer;">⚊</button>
            </div>
            <div id="discount-buttons" style="transition: all 0.2s ease-in-out;">
                <div style="display: flex; flex-direction: column; gap: 3px;">
                    <button data-rate="15">15%</button>
                    <button data-rate="20">20%</button>
                    <button data-rate="25">25%</button>
                    <button data-rate="30">30%</button>
                    <button data-rate="40">40%</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0 4px 0;">
                    <label for="manual-input" style="font-size: 10px;">Custom</label>
                    <input type="number" id="manual-input" step="5" value="20" style="width: 50px; font-size: 10px; padding: 2px; text-align: right; box-sizing: border-box;">
                </div>
                <hr style="margin: 4px 0; border: none; border-top: 2px solid #ccc;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label for="imaging-cap-input" style="font-size: 10px;">Imaging</label>
                    <input type="number" id="imaging-cap-input" step="5" value="20" style="width: 50px; font-size: 10px; padding: 2px; text-align: right; box-sizing: border-box;">
                </div>
                <div style="margin-top: 6px; padding: 4px; font-size: 9px; text-align: center; background: #f1f1f1; border: 1px solid #ccc; border-radius: 4px; color: #555;">
                    Developed by: <a href="https://github.com/shawmik7/" target="_blank">shawmik7</a>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        panel.querySelectorAll('#discount-buttons button').forEach(btn => {
            btn.style.padding = '3px';
            btn.style.fontSize = '10px';
            btn.style.width = '100%';
            btn.style.border = '1px solid #bbb';
            btn.style.borderRadius = '3px';
            btn.style.background = '#fafafa';
            btn.style.cursor = 'pointer';

            btn.addEventListener('mouseenter', () => btn.style.background = '#eee');
            btn.addEventListener('mouseleave', () => btn.style.background = '#fafafa');
        });

        panel.querySelectorAll('button[data-rate]').forEach(btn => {
            btn.addEventListener('click', () => {
                const rate = parseFloat(btn.getAttribute('data-rate'));
                applyDiscount(rate);
            });
        });

        const manualInput = panel.querySelector('#manual-input');
        manualInput.addEventListener('input', () => {
            const rate = parseFloat(manualInput.value);
            if (!isNaN(rate)) applyDiscount(rate);
        });

        const imagingInput = panel.querySelector('#imaging-cap-input');
        imagingInput.addEventListener('input', () => {
            if (lastSelectedPercent !== null) applyDiscount(lastSelectedPercent);
        });

        const toggleBtn = panel.querySelector('#toggle-panel');
        const buttonSection = panel.querySelector('#discount-buttons');
        toggleBtn.addEventListener('click', () => {
            const visible = buttonSection.style.display !== 'none';
            if (visible) {
                buttonSection.style.opacity = '0';
                setTimeout(() => {
                    buttonSection.style.display = 'none';
                    toggleBtn.textContent = '+';
                    toggleBtn.title = 'Maximize';
                }, 200);
            } else {
                buttonSection.style.display = 'block';
                buttonSection.style.opacity = '0';
                setTimeout(() => {
                    buttonSection.style.opacity = '1';
                    toggleBtn.textContent = '⚊';
                    toggleBtn.title = 'Minimize';
                }, 10);
            }
        });

        let isDragging = false, startX = 0, startY = 0, currentX = 0, currentY = 0;
        const header = panel.querySelector('#discount-panel-header');

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - currentX;
            startY = e.clientY - currentY;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                currentX = e.clientX - startX;
                currentY = e.clientY - startY;
                panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
    }

    function waitForPage() {
        const discountField = document.querySelector('#P423_LUMSUM');
        if (discountField) {
            createFloatingPanel();
        } else {
            setTimeout(waitForPage, 1000);
        }
    }

    waitForPage();
})();
