// NutriSport - Calculs, macros, ration, UI
function getPAL(activity) {
  switch(activity) {
    case 'sedentary': return 1.2;
    case 'light': return 1.45;
    case 'moderate': return 1.65;
    case 'high': return 1.85;
    case 'athlete': return 2.1;
    default: return 1.2;
  }
}
function getMacros(goal, weight, totalCalories) {
  let protein = weight * (goal==='gain'?2:1.6); // g
  let fat = weight * 1; // g
  let proteinCal = protein * 4;
  let fatCal = fat * 9;
  let carbsCal = totalCalories - proteinCal - fatCal;
  let carbs = carbsCal / 4;
  return {
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs)
  };
}
function calcNutriSport() {
  const age = parseInt(document.getElementById('ns-age').value)||0;
  const weight = parseFloat(document.getElementById('ns-weight').value)||0;
  const height = parseFloat(document.getElementById('ns-height').value)||0;
  const gender = document.getElementById('ns-gender').value;
  const activity = document.getElementById('ns-activity').value;
  const goal = document.getElementById('ns-goal').value;
  const pal = getPAL(activity);
  const heightM = height/100;
  let rmr = gender==='male' ? (9.65*weight + 573*heightM - 5.08*age + 260) : (7.38*weight + 607*heightM - 2.31*age + 43);
  let totalCalories = rmr * pal;
  if(goal==='lose') totalCalories -= 300;
  else if(goal==='gain') totalCalories += 300;
  document.getElementById('ns-rmr-value').textContent = Math.round(rmr);
  document.getElementById('ns-totalCalories').textContent = Math.round(totalCalories);
  const macros = getMacros(goal, weight, totalCalories);
  document.getElementById('ns-proteinNeeds').textContent = macros.protein;
  document.getElementById('ns-carbNeeds').textContent = macros.carbs;
  document.getElementById('ns-fatNeeds').textContent = macros.fat;
  if(window.nsMacroChart) window.nsMacroChart.destroy();
  const ctx = document.getElementById('ns-macroChart').getContext('2d');
  window.nsMacroChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Protéines', 'Glucides', 'Lipides'],
      datasets: [{
        data: [macros.protein*4, macros.carbs*4, macros.fat*9],
        backgroundColor: ['#2563eb','#f59e42','#f43f5e'],
      }]
    },
    options: {responsive:true,plugins:{legend:{display:true}}}
  });
}
// Sécurisation addEventListener sur ns-calculateNeeds
const nsBtn = document.getElementById('ns-calculateNeeds');
if (nsBtn) nsBtn.addEventListener('click', calcNutriSport);
calcNutriSport();

// --- Plan alimentaire ---
let ration = [];
function renderFoodList(filter = '') {
  const tbody = document.getElementById('food-list');
  tbody.innerHTML = '';
  if(typeof aliments === 'undefined') return;
  aliments.filter(a => a.FOOD_LABEL.toLowerCase().includes(filter.toLowerCase())).slice(0,50).forEach(alim => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-2 py-1">${alim.FOOD_LABEL}</td>
      <td class="px-2 py-1 text-right">${alim.nrj_kcal}</td>
      <td class="px-2 py-1 text-right">${alim.proteines_g}</td>
      <td class="px-2 py-1 text-right">${alim.glucides_g}</td>
      <td class="px-2 py-1 text-right">${alim.lipides_g}</td>
      <td class="px-2 py-1 text-center"><button class="bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1 text-xs" onclick="addToRation(${alim.alim_code})"><i class='fas fa-plus'></i> Ajouter</button></td>
    `;
    tbody.appendChild(tr);
  });
}
function addToRation(alim_code) {
  const alim = aliments.find(a => a.alim_code === alim_code);
  if (!alim) return;
  const qty = prompt(`Quantité de "${alim.FOOD_LABEL}" en grammes ?`, "100");
  const q = parseFloat(qty);
  if(isNaN(q) || q<=0) return;
  ration.push({ ...alim, qty: q });
  renderRation();
}
function removeFromRation(idx) {
  ration.splice(idx,1);
  renderRation();
}
function renderRation() {
  const tbody = document.getElementById('ration-list');
  tbody.innerHTML = '';
  let totalQty=0, totalKcal=0, totalProt=0, totalGluc=0, totalLip=0;
  ration.forEach((item, idx) => {
    const kcal = item.nrj_kcal * item.qty / 100;
    const prot = item.proteines_g * item.qty / 100;
    const gluc = item.glucides_g * item.qty / 100;
    const lip = item.lipides_g * item.qty / 100;
    totalQty += item.qty;
    totalKcal += kcal;
    totalProt += prot;
    totalGluc += gluc;
    totalLip += lip;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-2 py-1">${item.FOOD_LABEL}</td>
      <td class="px-2 py-1 text-right">${item.qty}</td>
      <td class="px-2 py-1 text-right">${kcal.toFixed(1)}</td>
      <td class="px-2 py-1 text-right">${prot.toFixed(1)}</td>
      <td class="px-2 py-1 text-right">${gluc.toFixed(1)}</td>
      <td class="px-2 py-1 text-right">${lip.toFixed(1)}</td>
      <td class="px-2 py-1 text-center"><button class="text-red-600 hover:text-red-800" onclick="removeFromRation(${idx})"><i class='fas fa-trash'></i></button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('total-qty').textContent = totalQty ? totalQty.toFixed(0) : '';
  document.getElementById('total-kcal').textContent = totalKcal ? totalKcal.toFixed(0) : '';
  document.getElementById('total-prot').textContent = totalProt ? totalProt.toFixed(1) : '';
  document.getElementById('total-gluc').textContent = totalGluc ? totalGluc.toFixed(1) : '';
  document.getElementById('total-lip').textContent = totalLip ? totalLip.toFixed(1) : '';
}
// Sécurisation addEventListener sur food-search
const foodSearch = document.getElementById('food-search');
if (foodSearch) foodSearch.addEventListener('input', e => renderFoodList(e.target.value));
renderFoodList();
renderRation();
window.addToRation = addToRation;
window.removeFromRation = removeFromRation;

const btn = document.getElementById('insert-nutrition-btn');
if (btn) {
  btn.addEventListener('click', function() {
    const tdee = el('tdee').textContent;
    const nutritionStr = `⦿ Besoins totaux : ${tdee} kcal/jour`;
    // Cherche la ligne du jour
    const today = new Date().toISOString().slice(0,10);
    let targetRow = null;
    document.querySelectorAll('#training-table-body tr:not([id])').forEach(tr => {
      const dateInput = tr.querySelector('input[type="date"]');
      if (dateInput && dateInput.value === today) targetRow = tr;
    });
    // Si aucune ligne du jour, prend la première ligne
    if (!targetRow) targetRow = document.querySelector('#training-table-body tr:not([id])');
    if (targetRow) {
      // Colonne Nutrition = 18 (index 18, car colonne poubelle en 0)
      const nutritionCell = targetRow.cells[18];
      if (nutritionCell) {
        const input = nutritionCell.querySelector('input');
        if (input) input.value = nutritionStr;
        else nutritionCell.textContent = nutritionStr;
      }
    }
  });
}
