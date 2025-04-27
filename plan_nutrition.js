// Générateur de plan nutritionnel ergonomique (utilise ciqual_foods.json)
// À inclure sous le calculateur de macros

(async function() {
  // Chargement dynamique de la base CIQUAL
  let foods = [];
  try {
    const resp = await fetch('ciqual_foods.json');
    let data = await resp.json();
    // Gère les deux formats : tableau direct ou objet avec clé
    if (Array.isArray(data)) {
      foods = data;
    } else if (data && Array.isArray(data.foods)) {
      foods = data.foods;
    } else {
      console.error('Format JSON CIQUAL inattendu:', data);
      section.innerHTML += '<div class="text-red-600 text-center mt-4">Erreur : format JSON CIQUAL inattendu.</div>';
      return;
    }
    if (!Array.isArray(foods) || foods.length === 0) {
      console.error('Aucun aliment CIQUAL chargé. Vérifiez le chemin et le format du JSON.');
      section.innerHTML += '<div class="text-red-600 text-center mt-4">Erreur : aucun aliment CIQUAL chargé.</div>';
      return;
    }
    console.log(`CIQUAL chargé : ${foods.length} aliments.`);
  } catch (e) {
    console.error('Erreur chargement CIQUAL:', e);
    section.innerHTML += '<div class="text-red-600 text-center mt-4">Erreur chargement CIQUAL.</div>';
    return;
  }

  // Création du bloc UI
  const section = document.createElement('section');
  section.className = 'bg-white shadow-xl rounded-2xl p-8 w-full max-w-4xl mx-auto mt-8 space-y-6';
  section.innerHTML = `
    <h2 class="text-2xl font-bold text-center mb-4">Plan Nutritionnel Journalier</h2>
    <div class="mb-4 flex flex-col sm:flex-row gap-4">
      <input type="text" id="ciqual-search" placeholder="Rechercher un aliment..." class="border p-2 rounded w-full sm:w-2/3" autocomplete="off">
      <input type="number" id="ciqual-grams" placeholder="Quantité (g)" class="border p-2 rounded w-full sm:w-1/3" min="1" value="100">
      <button id="ciqual-add" class="bg-blue-600 text-white px-4 py-2 rounded">Ajouter</button>
      <button id="export-csv" class="bg-green-600 text-white px-4 py-2 rounded">Exporter CSV</button>
      <button id="export-pdf" class="bg-red-600 text-white px-4 py-2 rounded">Exporter PDF</button>
      <button id="export-sheets" class="bg-yellow-600 text-white px-4 py-2 rounded">Exporter Sheets</button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm border border-gray-300 rounded shadow-sm">
        <thead class="bg-blue-100">
          <tr>
            <th class="px-2 py-2 border">Aliment</th>
            <th class="px-2 py-2 border">Quantité (g)</th>
            <th class="px-2 py-2 border">Protéines (g)</th>
            <th class="px-2 py-2 border">Glucides (g)</th>
            <th class="px-2 py-2 border">Lipides (g)</th>
            <th class="px-2 py-2 border">Énergie (kcal)</th>
            <th class="px-2 py-2 border"></th>
          </tr>
        </thead>
        <tbody id="ciqual-plan-body"></tbody>
        <tfoot class="bg-gray-100 font-bold">
          <tr>
            <td class="px-2 py-2 border">Total</td>
            <td class="px-2 py-2 border" id="ciqual-total-qte">0</td>
            <td class="px-2 py-2 border" id="ciqual-total-prot">0</td>
            <td class="px-2 py-2 border" id="ciqual-total-glu">0</td>
            <td class="px-2 py-2 border" id="ciqual-total-lip">0</td>
            <td class="px-2 py-2 border" id="ciqual-total-kcal">0</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  // Insertion juste après #nutrisport-section
  const nutriSection = document.getElementById('nutrisport-section');
  nutriSection?.insertAdjacentElement('afterend', section);

  // State du plan
  let plan = [];

  // Ajout d'un aliment
  function addFoodRow(food, grams) {
    const prot = (food.proteines_g || 0) * grams / 100;
    const glu  = (food.glucides_g || 0) * grams / 100;
    const lip  = (food.lipides_g || 0) * grams / 100;
    const kcal = (food.nrj_kcal || 0) * grams / 100;
    plan.push({ name: food.FOOD_LABEL, grams, prot, glu, lip, kcal });
    renderPlan();
  }

  // Affichage du plan
  function renderPlan() {
    const tbody = section.querySelector('#ciqual-plan-body');
    tbody.innerHTML = '';
    let totalQte=0, totalProt=0, totalGlu=0, totalLip=0, totalKcal=0;
    plan.forEach((item, idx) => {
      totalQte  += item.grams;
      totalProt += item.prot;
      totalGlu  += item.glu;
      totalLip  += item.lip;
      totalKcal += item.kcal;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-2 py-1 border">${item.name}</td>
        <td class="px-2 py-1 border">${item.grams}</td>
        <td class="px-2 py-1 border">${item.prot.toFixed(1)}</td>
        <td class="px-2 py-1 border">${item.glu.toFixed(1)}</td>
        <td class="px-2 py-1 border">${item.lip.toFixed(1)}</td>
        <td class="px-2 py-1 border">${item.kcal.toFixed(0)}</td>
        <td class="px-1 py-1 border"><button data-rm="${idx}" class="text-red-600">🗑️</button></td>
      `;
      tbody.appendChild(row);
    });
    // Met à jour les totaux avec les bons IDs
    section.querySelector('#ciqual-total-qte').textContent = totalQte;
    section.querySelector('#ciqual-total-prot').textContent = totalProt.toFixed(1);
    section.querySelector('#ciqual-total-glu').textContent  = totalGlu.toFixed(1);
    section.querySelector('#ciqual-total-lip').textContent  = totalLip.toFixed(1);
    section.querySelector('#ciqual-total-kcal').textContent = totalKcal.toFixed(0);
    // Suppression
    tbody.querySelectorAll('button[data-rm]').forEach(btn => {
      btn.onclick = () => { plan.splice(btn.dataset.rm, 1); renderPlan(); };
    });
    // Met à jour les histogrammes après chaque rendu
    renderMacroCharts();
  }

  // Fonction de normalisation pour recherche tolérante (casse, accents, espaces)
  function normalize(str) {
    return (str || "")
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
      .replace(/\s+/g, ''); // retire les espaces
  }

  // Masque le bouton Ajouter et le select natif s'ils existent
  section.querySelector('#ciqual-add').style.display = 'none';
  if (typeof selectBox !== 'undefined') selectBox.style.display = 'none';

  // Supprime toute ancienne dropdown
  if (section.querySelector('.ciqual-dropdown')) section.querySelector('.ciqual-dropdown').remove();

  // Création d'une vraie dropdown custom sous l'input
  const dropdown = document.createElement('ul');
  dropdown.className = 'ciqual-dropdown absolute z-50 bg-white border border-gray-300 rounded shadow max-h-56 overflow-y-auto w-full mt-1 hidden';
  section.querySelector('#ciqual-search').parentNode.appendChild(dropdown);

  // Affiche la liste custom lors de la saisie
  section.querySelector('#ciqual-search').addEventListener('input', function() {
    const q = normalize(this.value);
    dropdown.innerHTML = '';
    if (!q) { dropdown.classList.add('hidden'); return; }
    const foundList = foods.filter(f => typeof f.FOOD_LABEL === 'string' && normalize(f.FOOD_LABEL).startsWith(q)).slice(0, 20);
    if (foundList.length === 0) { dropdown.classList.add('hidden'); return; }
    foundList.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f.FOOD_LABEL;
      li.className = 'px-3 py-2 cursor-pointer hover:bg-blue-100';
      li.tabIndex = 0;
      li.onclick = () => {
        const grams = parseInt(section.querySelector('#ciqual-grams').value, 10) || 100;
        addFoodRow(f, grams);
        section.querySelector('#ciqual-search').value = '';
        dropdown.classList.add('hidden');
      };
      dropdown.appendChild(li);
    });
    dropdown.classList.remove('hidden');
  });

  // Cache la liste si on clique ailleurs
  document.addEventListener('click', function(e) {
    if (!section.querySelector('#ciqual-search').contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  // Cache la liste si entrée
  section.querySelector('#ciqual-search').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      dropdown.classList.add('hidden');
    }
  });

  // === HISTOGRAMMES MACRONUTRIMENTS AVEC POURCENTAGE (robuste) ===
  function cleanNumber(val) {
    if (!val) return 0;
    return parseFloat(val.replace(/[^\d.,-]/g,'').replace(',','.')) || 0;
  }
  function renderMacroCharts() {
    const protTarget = cleanNumber(document.getElementById('protG')?.textContent);
    const carbTarget = cleanNumber(document.getElementById('carbG')?.textContent);
    const fatTarget  = cleanNumber(document.getElementById('fatG')?.textContent);
    const protPlan = cleanNumber(document.getElementById('ciqual-total-prot')?.textContent);
    const carbPlan = cleanNumber(document.getElementById('ciqual-total-glu')?.textContent);
    const fatPlan  = cleanNumber(document.getElementById('ciqual-total-lip')?.textContent);
    // Log pour debug
    console.log('[MacroCharts] Prot:',protTarget,protPlan,'Carb:',carbTarget,carbPlan,'Fat:',fatTarget,fatPlan);
    // Calcul des pourcentages
    const pct = (plan, target) => target ? Math.round(plan/target*100) : 0;
    const protPct = pct(protPlan, protTarget);
    const carbPct = pct(carbPlan, carbTarget);
    const fatPct  = pct(fatPlan, fatTarget);
    const chartIds = ['macrochart-prot','macrochart-carb','macrochart-fat'];
    const pctIds = ['macrochart-prot-pct','macrochart-carb-pct','macrochart-fat-pct'];
    const pctVals = [protPct, carbPct, fatPct];
    ['prot','carb','fat'].forEach((type,i) => {
      let parent = document.getElementById(type+'G')?.parentNode;
      if (!parent) return;
      let old = parent.querySelector('canvas.macrochart');
      if (old) old.remove();
      let oldPct = parent.querySelector('.macrochart-pct');
      if (oldPct) oldPct.remove();
      let canvas = document.createElement('canvas');
      canvas.id = chartIds[i];
      canvas.className = 'macrochart my-2';
      canvas.height = 38;
      parent.appendChild(canvas);
      // Ajout du pourcentage
      let span = document.createElement('span');
      span.className = 'macrochart-pct block text-sm text-center font-semibold mt-1';
      span.id = pctIds[i];
      span.textContent = pctVals[i] + '% de l\'objectif';
      parent.appendChild(span);
    });
    // Protéines
    if (window.macroProtChart) window.macroProtChart.destroy();
    window.macroProtChart = new Chart(document.getElementById('macrochart-prot').getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Objectif','Plan'],
        datasets: [{
          label: 'Protéines',
          data: [protTarget, protPlan],
          backgroundColor: ['#2ecc40','#0074D9']
        }]
      },
      options: {responsive: false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
    });
    // Glucides
    if (window.macroCarbChart) window.macroCarbChart.destroy();
    window.macroCarbChart = new Chart(document.getElementById('macrochart-carb').getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Objectif','Plan'],
        datasets: [{
          label: 'Glucides',
          data: [carbTarget, carbPlan],
          backgroundColor: ['#ffdc00','#ff851b']
        }]
      },
      options: {responsive: false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
    });
    // Lipides
    if (window.macroFatChart) window.macroFatChart.destroy();
    window.macroFatChart = new Chart(document.getElementById('macrochart-fat').getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Objectif','Plan'],
        datasets: [{
          label: 'Lipides',
          data: [fatTarget, fatPlan],
          backgroundColor: ['#b10dc9','#f012be']
        }]
      },
      options: {responsive: false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
    });
  }

  // Met à jour les histogrammes après chaque update
  setTimeout(renderMacroCharts, 500);
  [
    'input','change'
  ].forEach(evt=>{
    document.body.addEventListener(evt, function(e){
      if(e.target.closest('#ciqual-plan-body')||e.target.closest('#resultsMacros')) setTimeout(renderMacroCharts, 200);
    });
  });

  // --- EXPORT CSV (Nutrition + Entraînement) ---
  document.getElementById('export-csv').onclick = function() {
    // Nutrition
    let nutriTable = document.querySelector('.min-w-full');
    let nutriRows = Array.from(nutriTable.querySelectorAll('tr'));
    let nutriCsv = nutriRows.map(r => Array.from(r.children).map(td => '"'+td.textContent.replace(/"/g,'""')+'"').join(',')).join('\n');
    // Entraînement
    let trainTable = document.querySelector('#training-table-body')?.closest('table');
    let trainCsv = '';
    if (trainTable) {
      let trainRows = Array.from(trainTable.querySelectorAll('tr'));
      trainCsv = trainRows.map(r => Array.from(r.children).map(td => '"'+(td.querySelector('input,select') ? td.querySelector('input,select').value : td.textContent.replace(/"/g,'""'))+'"').join(',')).join('\n');
    }
    let finalCsv = 'Plan Nutritionnel\n'+nutriCsv+'\n\nTableau Entraînement\n'+trainCsv;
    let blob = new Blob([finalCsv], {type: 'text/csv'});
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'suivi_sport_nutrition.csv';
    a.click();
  };

  // --- EXPORT PDF (Nutrition + Entraînement) ---
  document.getElementById('export-pdf').onclick = function() {
    if (typeof jsPDF === 'undefined' || typeof window.jspdfAutoTable === 'undefined') {
      alert('jsPDF ou AutoTable non chargé.');
      return;
    }
    let doc = new jsPDF();
    // Nutrition
    doc.setFontSize(16); doc.text('Plan Nutritionnel', 14, 18);
    window.jspdfAutoTable.autoTable({
      html: document.querySelector('.min-w-full'),
      theme: 'grid',
      headStyles: {fillColor: [41,128,185]},
      margin: {top: 24},
      didDrawPage: data => doc.setFontSize(16)
    });
    // Entraînement
    let trainTable = document.querySelector('#training-table-body')?.closest('table');
    if (trainTable) {
      let y = doc.lastAutoTable.finalY + 20 || 60;
      doc.setFontSize(16); doc.text('Tableau Entraînement', 14, y);
      window.jspdfAutoTable.autoTable({
        html: trainTable,
        theme: 'grid',
        headStyles: {fillColor: [41,128,185]},
        margin: {top: y+6},
        startY: y+8
      });
    }
    doc.save('suivi_sport_nutrition.pdf');
  };

  // --- EXPORT SHEETS (CSV compatible) ---
  document.getElementById('export-sheets').onclick = function() {
    // Même logique que CSV
    let nutriTable = document.querySelector('.min-w-full');
    let nutriRows = Array.from(nutriTable.querySelectorAll('tr'));
    let nutriCsv = nutriRows.map(r => Array.from(r.children).map(td => '"'+td.textContent.replace(/"/g,'""')+'"').join(',')).join('\n');
    let trainTable = document.querySelector('#training-table-body')?.closest('table');
    let trainCsv = '';
    if (trainTable) {
      let trainRows = Array.from(trainTable.querySelectorAll('tr'));
      trainCsv = trainRows.map(r => Array.from(r.children).map(td => '"'+(td.querySelector('input,select') ? td.querySelector('input,select').value : td.textContent.replace(/"/g,'""'))+'"').join(',')).join('\n');
    }
    let finalCsv = 'Plan Nutritionnel\n'+nutriCsv+'\n\nTableau Entraînement\n'+trainCsv;
    let blob = new Blob([finalCsv], {type: 'text/csv'});
    let url = 'https://docs.google.com/spreadsheets/u/0/';
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'suivi_sport_nutrition.csv';
    a.click();
    setTimeout(()=>{window.open(url, '_blank');}, 500);
  };

  // Ajout dynamique de jsPDF/AutoTable si absent
  if (typeof jsPDF === 'undefined') {
    let s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.body.appendChild(s);
  }
  if (typeof window.jspdfAutoTable === 'undefined') {
    let s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.7.0/jspdf.plugin.autotable.min.js';
    document.body.appendChild(s);
  }
})();
