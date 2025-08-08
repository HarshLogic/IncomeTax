// Set up event listeners for the age and regime options
document.addEventListener('DOMContentLoaded', function() {
    const ageOptions = document.querySelectorAll('.age-option');
    ageOptions.forEach(option => {
        option.addEventListener('click', () => {
            ageOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    const regimeOptions = document.querySelectorAll('.regime-option');
    regimeOptions.forEach(option => {
        option.addEventListener('click', () => {
            regimeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
});

// A simple function to format in Indian Rupees
function formatCurrency(number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(number);
}

// Function to show the custom modal
function showModal(message) {
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal-overlay').classList.add('visible');
}

// Function to close the custom modal
function closeModal() {
    document.getElementById('modal-overlay').classList.remove('visible');
}

// Tax calculation and display
function calculateTax() {
    // user input
    const income = parseFloat(document.getElementById('annual-income').value);
    const ageGroup = document.querySelector('.age-option.selected').dataset.age;
    const taxRegime = document.querySelector('.regime-option.selected').dataset.regime;

    // Simple validation
    if (isNaN(income) || income < 0) {
        showModal("Please enter a valid, positive annual income.");
        return;
    }

    // --- Calculation Logic ---
    let taxPay = 0;
    let surcharge = 0;
    let cess = 0;
    let slabs;
    let taxableIncome = income;

    // Apply standard deduction for salaried person
    if (taxRegime === 'new') {
        const standardDeduction = 75000;
        taxableIncome = income - standardDeduction;
        if (taxableIncome < 0) {
            taxableIncome = 0;
        }
    } else { // Old Tax Regime
        const standardDeduction = 50000;
        taxableIncome = income - standardDeduction;
        if (taxableIncome < 0) {
            taxableIncome = 0;
        }
    }

    if (taxRegime === 'new') {
        slabs = [
            { limit: 400000, rate: 0.00 },
            { limit: 800000, rate: 0.05 },
            { limit: 1200000, rate: 0.10 },
            { limit: 1600000, rate: 0.15 },
            { limit: 2000000, rate: 0.20 },
            { limit: 2400000, rate: 0.25 },
            { limit: Infinity, rate: 0.30 }
        ];
    } else { // Old Tax Regime
        if (ageGroup === 'regular') {
            slabs = [
                { limit: 250000, rate: 0.00 },
                { limit: 500000, rate: 0.05 },
                { limit: 1000000, rate: 0.20 },
                { limit: Infinity, rate: 0.30 }
            ];
        } else if (ageGroup === 'senior') {
            slabs = [
                { limit: 300000, rate: 0.00 },
                { limit: 500000, rate: 0.05 },
                { limit: 1000000, rate: 0.20 },
                { limit: Infinity, rate: 0.30 }
            ];
        } else if (ageGroup === 'super-senior') {
            slabs = [
                { limit: 500000, rate: 0.00 },
                { limit: 1000000, rate: 0.20 },
                { limit: Infinity, rate: 0.30 }
            ];
        }
    }

    let previousSlabLimit = 0;
    for (const slab of slabs) {
        if (taxableIncome > previousSlabLimit) {
            const taxableAmountInSlab = Math.min(taxableIncome, slab.limit) - previousSlabLimit;
            taxPay += taxableAmountInSlab * slab.rate;
        }
        previousSlabLimit = slab.limit;
    }

    let rebate = 0;
    if (taxRegime === 'new' && taxableIncome <= 1200000) {
        rebate = Math.min(taxPay, 60000);
    } else if (taxRegime === 'old' && taxableIncome <= 500000) {
        rebate = Math.min(taxPay, 12500);
    }
    
    let finalTaxBeforeSurchargeCess = Math.max(0, taxPay - rebate);

    // Surcharge calculation with distinction for new and old regimes
    if (taxableIncome > 5000000) {
        if (taxableIncome <= 10000000) {
            surcharge = finalTaxBeforeSurchargeCess * 0.10;
        } else if (taxableIncome <= 20000000) {
            surcharge = finalTaxBeforeSurchargeCess * 0.15;
        } else if (taxableIncome <= 50000000) {
            surcharge = finalTaxBeforeSurchargeCess * 0.25;
        } else { // income > 50000000
            surcharge = taxRegime === 'new' ? finalTaxBeforeSurchargeCess * 0.25 : finalTaxBeforeSurchargeCess * 0.37;
        }
    }

    // Health and Education Cess (4% on Tax + Surcharge)
    cess = (finalTaxBeforeSurchargeCess + surcharge) * 0.04;

    const totalTax = finalTaxBeforeSurchargeCess + surcharge + cess;
    const remainingAmount = income - totalTax;

    // --- Display Results ---
    const resultsDiv = document.getElementById('results-display');
    resultsDiv.innerHTML = `
        <h2>Estimated Tax Breakdown</h2>
        <div class="result-item">
            <span class="result-item-label">Total Taxable Income</span>
            <span class="result-item-value">${formatCurrency(taxableIncome)}</span>
        </div>
        <div class="result-item">
            <span class="result-item-label">Tax Payable</span>
            <span class="result-item-value">${formatCurrency(finalTaxBeforeSurchargeCess)}</span>
        </div>
        <div class="result-item">
            <span class="result-item-label">Rebate (Sec. 87A)</span>
            <span class="result-item-value">${formatCurrency(rebate)}</span>
        </div>
        <div class="result-item">
            <span class="result-item-label">Surcharge</span>
            <span class="result-item-value">${formatCurrency(surcharge)}</span>
        </div>
        <div class="result-item">
            <span class="result-item-label">Cess</span>
            <span class="result-item-value">${formatCurrency(cess)}</span>
        </div>
        <div class="result-item total-tax-due">
            <span class="result-item-label">Total Tax Due</span>
            <span class="result-item-value">${formatCurrency(totalTax)}</span>
        </div>
        <div class="result-item remaining-income">
            <span class="result-item-label">Remaining Income</span>
            <span class="result-item-value">${formatCurrency(remainingAmount)}</span>
        </div>
    `;
    
    // Draw the bar chart
    drawChart(totalTax, remainingAmount);
}

// Function to draw the bar chart
function drawChart(totalTax, remainingAmount) {
    const canvas = document.getElementById('taxChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalAmount = totalTax + remainingAmount;
    if (totalAmount === 0) {
        return;
    }

    const data = [
        { label: 'Tax', value: totalTax },
        { label: 'Remaining', value: remainingAmount }
    ];

    const colors = ['#0f4c81', '#4b88d4'];
    const barWidth = 60;
    const gap = 40;
    const startX = canvas.width / 2;
    const startY = canvas.height - 30;
    const scale = (startY - 50) / totalAmount;

    ctx.font = '14px Poppins';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';

    data.forEach((item, index) => {
        const x = startX + (index - (data.length - 1) / 2) * (barWidth + gap);
        const barHeight = item.value * scale;

        ctx.fillStyle = colors[index];
        ctx.fillRect(x - barWidth / 2, startY - barHeight, barWidth, barHeight);

        ctx.fillStyle = '#555';
        ctx.fillText(item.label, x, startY + 15);
        
        if (item.value > 0) {
            ctx.fillText(formatCurrency(item.value), x, startY - barHeight - 5);
        }
    });
}