let data = [];

async function loadData() {
  try {
    const res = await fetch("data/ipas.json?ts=" + Date.now());
    data = await res.json();
  } catch (e) {
    data = [];
  }
  renderTable();
}

function renderTable() {
  const tbody = document.querySelector("#ipaTable tbody");
  tbody.innerHTML = "";
  data.forEach((app, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input value="${app.id||""}" onchange="updateField(${i},'id',this.value)"></td>
      <td><input value="${app.name||""}" onchange="updateField(${i},'name',this.value)"></td>
      <td><input value="${app.bundleId||""}" onchange="updateField(${i},'bundleId',this.value)"></td>
      <td><input value="${app.version||""}" onchange="updateField(${i},'version',this.value)"></td>
      <td><input value="${app.minIOS||""}" onchange="updateField(${i},'minIOS',this.value)"></td>
      <td><input value="${app.sizeBytes||""}" onchange="updateField(${i},'sizeBytes',this.value)"></td>
      <td><input value="${app.iconUrl||""}" onchange="updateField(${i},'iconUrl',this.value)"></td>
      <td><input value="${(app.tags||[]).join(', ')}" onchange="updateArray(${i},'tags',this.value)"></td>
      <td><textarea onchange="updateArray(${i},'features',this.value)">${(app.features||[]).join("\\n")}</textarea></td>
      <td><textarea onchange="updateMirrors(${i},this.value)">${JSON.stringify(app.mirrors||[])}</textarea></td>
      <td><button class="del-btn" onclick="deleteRow(${i})">🗑</button></td>
    `;
    tbody.appendChild(row);
  });
}

function updateField(i, key, val) {
  data[i][key] = val;
}
function updateArray(i, key, val) {
  data[i][key] = val.split(/\s*[,\\n]\\s*/).filter(Boolean);
}
function updateMirrors(i, val) {
  try { data[i].mirrors = JSON.parse(val); }
  catch { alert("Ошибка в JSON mirrors"); }
}

function addRow() {
  data.push({
    id:"", name:"", bundleId:"", version:"",
    minIOS:"", sizeBytes:"", iconUrl:"",
    tags:[], features:[], mirrors:[]
  });
  renderTable();
}

function deleteRow(i) {
  if (confirm("Удалить запись?")) {
    data.splice(i,1);
    renderTable();
  }
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ipas.json";
  a.click();
}

loadData();
