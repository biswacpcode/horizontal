class EMFieldVisualizer {
    constructor() {
        this.eCanvas = document.getElementById('eFieldCanvas');
        this.hCanvas = document.getElementById('hFieldCanvas');
        this.eCtx = this.eCanvas.getContext('2d');
        this.hCtx = this.hCanvas.getContext('2d');
        
        this.setupEventListeners();
        this.draw();
    }

    setupEventListeners() {
        const angleSlider = document.getElementById('angleSlider');
        const angleInput = document.getElementById('angleInput');

        // Sync slider and input
        angleSlider.addEventListener('input', (e) => {
            angleInput.value = e.target.value;
            this.draw();
        });

        angleInput.addEventListener('input', (e) => {
            let value = parseFloat(e.target.value);
            
            // Clamp the value between 0 and 90
            if (value < 0) value = 0;
            if (value > 90) value = 90;
            if (isNaN(value)) value = 0;
            
            // Update both the input and slider
            e.target.value = value;
            angleSlider.value = value;
            this.draw();
        });

        // Add blur event to handle invalid inputs
        angleInput.addEventListener('blur', (e) => {
            let value = parseFloat(e.target.value);
            
            // Clamp the value between 0 and 90
            if (value < 0 || isNaN(value)) value = 0;
            if (value > 90) value = 90;
            
            // Update both the input and slider
            e.target.value = value;
            angleSlider.value = value;
            this.draw();
        });

        // Add other inputs
        ['epsilon1', 'epsilon2'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.draw());
        });
    }

    calculateReflectionCoefficients() {
        const epsilon1 = parseFloat(document.getElementById('epsilon1').value);
        const epsilon2 = parseFloat(document.getElementById('epsilon2').value);
        const theta1 = parseFloat(document.getElementById('angleSlider').value) * Math.PI / 180;
        
        // Special case for 90 degrees (tangential incidence)
        if (theta1 === Math.PI/2) {
            return {
                rE: 1,  // Total reflection at tangential incidence
                rH: 1,
                theta2: Math.PI/2
            };
        }
        
        // Calculate theta2 using Snell's law
        const sinTheta2 = Math.sqrt(epsilon1/epsilon2) * Math.sin(theta1);
        
        // Check for total internal reflection
        if (sinTheta2 > 1) {
            return {
                rE: 1,
                rH: 0,
                theta2: theta1
            };
        }
        
        const theta2 = Math.asin(sinTheta2);
        
        // Fresnel equations for perpendicular polarization (E-field)
        const rE = (Math.sqrt(1/epsilon1) * Math.cos(theta1) - Math.sqrt(1/epsilon2) * Math.cos(theta2)) /
                  (Math.sqrt(1/epsilon1) * Math.cos(theta1) + Math.sqrt(1/epsilon2) * Math.cos(theta2));
        
        // Factor for transmitted ray
        const rH = (Math.sqrt(1/epsilon2)*2*(Math.cos(theta1)))/((Math.sqrt(1/epsilon1)*Math.cos(theta1))-(Math.sqrt(1/epsilon2)*Math.cos(theta2)));

        const b = Math.atan(Math.sqrt(epsilon2/epsilon1))
    
        const sidebox = document.getElementById('side-box');
        sidebox.innerHTML = `Reflection coefficient: ${rE}<br/><br/><br/>Transmission Coefficient : ${rH}<br/><br/><br/> &Beta; : ${b}`;

        return { rE, rH, theta2 };
    }

    draw() {
        const { rE, rH, theta2 } = this.calculateReflectionCoefficients();
        
        // Clear canvases
        this.eCtx.clearRect(0, 0, this.eCanvas.width, this.eCanvas.height);
        this.hCtx.clearRect(0, 0, this.hCanvas.width, this.hCanvas.height);
        
        // Draw boundary line
        this.drawBoundary(this.eCtx);
        this.drawBoundary(this.hCtx);
        
        const theta1 = parseFloat(document.getElementById('angleSlider').value) * Math.PI / 180;
        
        // E-field visualization
        this.drawRays(this.eCtx, theta1, theta2, rE, rH ,'Electric Field (E)', true);
        
        // H-field visualization
        this.drawRays(this.hCtx, theta1, theta2, rE, rH, 'Magnetic Field (H)', false);
    }

    drawBoundary(ctx) {
        const theta1 = parseFloat(document.getElementById('angleSlider').value) * Math.PI / 180;
        
        // Draw main boundary line
        ctx.beginPath();
        ctx.moveTo(400, 0);
        ctx.lineTo(400, 300);
        ctx.strokeStyle = '#000';
        ctx.stroke();
        
        // Determine if this is E-field or H-field canvas
        const isEField = ctx === this.eCtx;
        
        if (isEField) {
            // Surface charges - maximum at normal incidence (0°), zero at grazing (90°)
            const chargeDensity = Math.abs(Math.cos(theta1));
            if (chargeDensity > 0.1) {
                for(let y = 20; y < 300; y += 40) {
                    ctx.beginPath();
                    ctx.arc(400, y, 3 * chargeDensity, 0, 2 * Math.PI);
                    ctx.fillStyle = '#f00';
                    ctx.fill();
                }
            }
        } else {
            // Surface currents - maximum at grazing incidence (90°), zero at normal (0°)
            const currentDensity = Math.abs(Math.sin(theta1));
            if (currentDensity > 0.1) {
                for(let y = 20; y < 300; y += 40) {
                    ctx.beginPath();
                    ctx.moveTo(400, y - 5 * currentDensity);
                    ctx.lineTo(400, y + 5 * currentDensity);
                    ctx.strokeStyle = '#0a0';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(400, y + 5 * currentDensity);
                    ctx.lineTo(400 - 3, y + 5 * currentDensity - 3);
                    ctx.lineTo(400 + 3, y + 5 * currentDensity - 3);
                    ctx.fillStyle = '#0a0';
                    ctx.fill();
                }
            }
        }
    }

    drawRays(ctx, theta1, theta2, rE, rH, fieldType, isEField) {
        const centerX = 400;
        const centerY = 150;
        const rayLength = 150;

        // Draw heading
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(fieldType, 10, 20);

        // Special case for tangential incidence (90 degrees)
        if (theta1 === Math.PI/2) {
            // Draw incident and reflected rays parallel to boundary
            ctx.beginPath();
            ctx.moveTo(centerX - 5, centerY - rayLength);
            ctx.lineTo(centerX - 5, centerY);
            ctx.strokeStyle = '#00f';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(centerX - 5, centerY);
            ctx.lineTo(centerX - 5, centerY + rayLength);
            ctx.strokeStyle = '#00f';
            ctx.stroke();

            return;
        }

        // For normal incidence (0 degrees), ray should be horizontal
        if (theta1 === 0) {
            // Incident ray
            ctx.beginPath();
            ctx.moveTo(centerX - rayLength, centerY);
            ctx.lineTo(centerX, centerY);
            ctx.strokeStyle = '#00f';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Reflected ray
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX - rayLength, centerY);
            ctx.strokeStyle = `rgba(0, 0, 255, ${Math.abs(rE)})`;
            ctx.stroke();

            // Transmitted ray
            if (Math.abs(r) < 1) {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + rayLength, centerY);
                ctx.strokeStyle = `rgba(0, 0, 255, ${Math.sqrt(1 - rE*rE)})`;
                ctx.stroke();
            }

            return;
        }
        // For angles between 0 and 90 degrees
        const startX = centerX - rayLength * Math.cos(theta1);
        const startY = centerY - rayLength * Math.sin(theta1);

        // Incident ray
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(centerX, centerY);
        ctx.strokeStyle = '#00f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw field indicators
        if(isEField) {
            this.drawElectricFieldIndicators(ctx, centerX, centerY, theta1, rayLength, "incident", 1);
        } else {
            this.drawMagneticFieldIndicators(ctx, centerX, centerY, theta1, rayLength, "incident", 1);
        }

        // Reflected ray
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(startX, centerY + (centerY - startY));
        ctx.strokeStyle = `rgba(0, 0, 255, ${Math.abs(rE)})`;
        ctx.stroke();
        if(isEField) {
            this.drawElectricFieldIndicators(ctx, centerX, centerY, theta1, rayLength, "reflected", rE);
        } else {
            this.drawMagneticFieldIndicators(ctx, centerX, centerY, theta1, rayLength, "reflected", rE);
        }

        // Transmitted ray (only if not total internal reflection)
        if (Math.abs(rE) < 1) {
            const transmittedX = centerX + rayLength * Math.cos(theta2);
            const transmittedY = centerY + rayLength * Math.sin(theta2);
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(transmittedX, transmittedY);
            ctx.strokeStyle = `rgba(0, 0, 255, ${Math.sqrt(1 - rE*rE)})`;
            ctx.stroke();
        }

        if(isEField) {
            this.drawElectricFieldIndicators(ctx, centerX, centerY, theta2, rayLength, "transmitted", rH);
        } else {
            this.drawMagneticFieldIndicators(ctx, centerX, centerY, theta2, rayLength, "transmitted", rH);
        }

        // Labels
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText('Incident', startX - 40, startY - 10);
        ctx.fillText('Reflected', startX - 40, centerY + (centerY - startY) + 20);
        if (Math.abs(rE) < 1) {
            ctx.fillText('Transmitted', centerX + rayLength * Math.cos(theta2) - 40,
                        centerY + rayLength * Math.sin(theta2) + 20);
        }
    }

    drawElectricFieldIndicators(ctx, centerX, centerY, theta1, rayLength, type, r) {
        if(r===0) return;
        
        // Scale the arrow length based on the coefficient
        const baseArrowLength = 15;
        const arrowLength = baseArrowLength * Math.abs(r); // Use absolute value of coefficient
        const numArrows = 3;
        
        if(type==="incident")
        for(let i = 1; i <= numArrows; i++) {
            // Calculate the position for each arrow along the ray
            const x = centerX - (rayLength * i / numArrows) * Math.cos(theta1);
            const y = centerY - (rayLength * i / numArrows) * Math.sin(theta1);
            
            // Save the context state before rotation
            ctx.save();
    
            // Move the origin to the position of the arrow and rotate
            ctx.translate(x, y);
            ctx.rotate(theta1-(Math.PI)/2); 
    
            // Draw the arrow line
            ctx.beginPath();
            ctx.moveTo(-arrowLength / 2, 0);
            ctx.lineTo(arrowLength / 2, 0);
            ctx.strokeStyle = '#f00';
            ctx.stroke();
    
            // Draw the arrowhead
            ctx.beginPath();
            ctx.moveTo(arrowLength / 2, 0);
            ctx.lineTo(arrowLength / 2 - 5, -5);
            ctx.lineTo(arrowLength / 2 - 5, 5);
            ctx.closePath();
            ctx.fillStyle = '#f00';
            ctx.fill();
    
            // Restore the context state after drawing each arrow
            ctx.restore();
        }
        else if(type==="reflected")
        for(let i = 1; i <= numArrows; i++) {
            // Calculate the position for each arrow along the ray
            const x = centerX - (rayLength * i / numArrows) * Math.cos(theta1);
            const y = centerY + (rayLength * i / numArrows) * Math.sin(theta1);
            
            // Save the context state before rotation
            ctx.save();
    
            // Move the origin to the position of the arrow and rotate
            ctx.translate(x, y);
            ctx.rotate(Math.PI/2-theta1); 
    
            // Draw the arrow line
            ctx.beginPath();
            ctx.moveTo(-arrowLength / 2, 0);
            ctx.lineTo(arrowLength / 2, 0);
            ctx.strokeStyle = '#f00';
            ctx.stroke();
    
            // Draw the arrowhead
            ctx.beginPath();
            ctx.moveTo(arrowLength / 2, 0);
            ctx.lineTo(arrowLength / 2 - 5, -5);
            ctx.lineTo(arrowLength / 2 - 5, 5);
            ctx.closePath();
            ctx.fillStyle = '#f00';
            ctx.fill();
    
            // Restore the context state after drawing each arrow
            ctx.restore();
        }
        else if(type==="transmitted")
        for(let i = 1; i <= numArrows; i++) {
            // Calculate the position for each arrow along the ray
            const x = centerX + (rayLength * i / numArrows) * Math.cos(theta1);
            const y = centerY + (rayLength * i / numArrows) * Math.sin(theta1);
            
            // Save the context state before rotation
            ctx.save();
    
            // Move the origin to the position of the arrow and rotate
            ctx.translate(x, y);
            ctx.rotate(theta1-Math.PI/2); 
    
            // Draw the arrow line
            ctx.beginPath();
            ctx.moveTo(-arrowLength / 2, 0);
            ctx.lineTo(arrowLength / 2, 0);
            ctx.strokeStyle = '#f00';
            ctx.stroke();
    
            // Draw the arrowhead
            ctx.beginPath();
            ctx.moveTo(arrowLength / 2, 0);
            ctx.lineTo(arrowLength / 2 - 5, -5);
            ctx.lineTo(arrowLength / 2 - 5, 5);
            ctx.closePath();
            ctx.fillStyle = '#f00';
            ctx.fill();
    
            // Restore the context state after drawing each arrow
            ctx.restore();
        }
    }
    

    drawMagneticFieldIndicators(ctx, centerX, centerY, theta1, rayLength, type, r) {
        if(r===0) return;
        
        // Scale the radius based on the coefficient
        const baseRadius = 5;
        const radius = baseRadius * Math.abs(r); // Use absolute value of coefficient
        const numIndicators = 3;
        
        if(type==="incident")
        for(let i = 1; i <= numIndicators; i++) {
            const x = centerX - (rayLength * i/numIndicators) * Math.cos(theta1);
            const y = centerY - (rayLength * i/numIndicators) * Math.sin(theta1);
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#0a0';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, 2 * Math.PI);
            ctx.fillStyle = '#0a0';
            ctx.fill();
        }
        else if(type==="reflected")
            for(let i = 1; i <= numIndicators; i++) {
                const x = centerX - (rayLength * i/numIndicators) * Math.cos(theta1);
                const y = centerY + (rayLength * i/numIndicators) * Math.sin(theta1);
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = '#0a0';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fillStyle = '#0a0';
                ctx.fill();
            }

            else if( type==="transmitted")
            for(let i = 1; i <= numIndicators; i++) {
                const x = centerX + (rayLength * i/numIndicators) * Math.cos(theta1);
                const y = centerY + (rayLength * i/numIndicators) * Math.sin(theta1);
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = '#0a0';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fillStyle = '#0a0';
                ctx.fill();
            }
    }
}

// Initialize the visualizer when the page loads
window.addEventListener('load', () => {
    new EMFieldVisualizer();
});

// Initial state
let isLocked = false;

// Questions and answers arrays
const qs = [
    "Man Of the match awards in World Cup?",
    "Number of ODI played?",
    "Most ODI runs in a calendar year?",
    "Only Cricketer to have played 200 test matches? (True/False)",
    "International Career runs?",
    "Only Player to score 5 Test Hundreds before the age of 20? (True/False)",
    "Number of Different grounds played on?",
    "Runs in world cup?"
];

const ans = ["9", "463", "1894", "True", "34357", "True", "90", "2278"];

// Select elements
const lockButton = document.getElementById('lockButton');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const answerInput = document.getElementById('answerInput');
const answerButton = document.getElementById('answerButton');
const closeModal = document.getElementById('closeModal');

// Toggle lock button
lockButton.addEventListener('click', () => {
    console.log("lock clicked = " + isLocked)
  if (isLocked) {
    // Unlock attempt - show modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    answerInput.value = ''; 
    modalText.innerHTML= qs[i];
    // Clear input for each attempt
    modalText.classList.remove('error');
  } else {
    // Lock the values again
    isLocked = true;
    toggleControlsState()
    lockButton.classList.add('locked');
    lockButton.classList.remove('unlocked');
  }

  console.log("lock clicked and now changed= " + isLocked)
});

const controls = document.querySelectorAll('input[type="number"], input[type="range"]');

// Disable/Enable controls based on locked state
function toggleControlsState() {
  controls.forEach(control => {
    control.disabled = isLocked;
     // Disable if locked, enable if unlocked
     console.log(isLocked)
  });
}

toggleControlsState();

// Validate answer
answerButton.addEventListener('click', () => {
  const answer = answerInput.value;
  if (answer === ans[i]) { // Change "4" to any correct answer you want
    // Correct answer - lock icon
    isLocked = false;
    toggleControlsState()
    modal.style.display = 'none';
    lockButton.classList.remove('locked');
    lockButton.classList.add('unlocked');
i++;
    if(i==qs.length)
        i=0
  } else {
    i++;
    if(i==qs.length)
        i=0
    // Wrong answer - display error message
    modalText.textContent = 'Oops! WROOONGGG!';

  }
});

// Close modal
closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
  modalText.classList.add('error');

});

// Mouse follower
const mouseFollower = document.querySelector('.mouse-follower');
document.addEventListener('mousemove', (e) => {
    mouseFollower.style.left = e.clientX + 'px';
    mouseFollower.style.top = e.clientY + 'px';
});

// Quote animation
const quotes = [
    document.getElementById('quote1'),
    document.getElementById('quote2')
];
let currentQuote = 0;

async function animateQuote(quote) {
    const words = quote.querySelectorAll('span');
    for(let word of words) {
        word.style.opacity = '1';
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
}

async function toggleQuote() {
    quotes[currentQuote].classList.remove('active');
    currentQuote = (currentQuote + 1) % quotes.length;
    const nextQuote = quotes[currentQuote];
    
    nextQuote.querySelectorAll('span').forEach(span => {
        span.style.opacity = '0';
    });
    
    nextQuote.classList.add('active');
    await animateQuote(nextQuote);
    
    setTimeout(toggleQuote, 2000);
}

// Start the animation
toggleQuote();

// Button click handler
document.querySelector('.simulate-btn').addEventListener('click', () => {
    window.location.href = 'simulation.html';
});



