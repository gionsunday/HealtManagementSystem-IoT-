window.addEventListener('load', () =>{ 

  // ===== CONFIGURE THIS =====
  const API_URL = "https://healthmanagementsystem-iot.onrender.com/temp"; // <-- replace with your endpoint
  const POLL_INTERVAL = 5000; // ms

  // ===== state =====
  const history = [];
  const historyEl = document.getElementById('history');
  const valueEl = document.getElementById('value');
  const tsEl = document.getElementById('timestamp');
  const statusEl = document.getElementById('status');
  const refreshBtn = document.getElementById('refresh');

  async function fetchLatest(){
    try{
      statusEl.textContent = 'Updating...';
      const res = await fetch(API_URL, {cache: 'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();

      if(data.status === "offline"){
        // Handle offline case
        valueEl.textContent = "Device Offline";
        tsEl.textContent = "N/A";
        statusEl.textContent = data.message;
        console.log(data)

        // Push an offline entry into history
        history.unshift({v: "Offline", unit: "", t: new Date().toISOString(), offline: true});
        if(history.length > 12) history.pop();
        renderHistory();

        return;
      }

      // Handle online case
      const v = data.value ?? data.temp ?? data.temperature ?? '--';
      const unit = data.unit ?? '°C';
      const t = data.timestamp ?? new Date().toISOString();

      valueEl.textContent = `${v} ${unit}`;
      tsEl.textContent = new Date(t).toLocaleString();
      statusEl.textContent = 'Online';

      // push to history
      history.unshift({v, unit, t, offline: false});
      if(history.length > 12) history.pop();
      renderHistory();

    }catch(err){
      console.error(err);
      statusEl.textContent = 'Error fetching';
      valueEl.textContent = "Device Offline";
      
      tsEl.textContent = "N/A";

      // Log error as offline event
      history.unshift({v: "Error", unit: "", t: new Date().toISOString(), offline: true});
      if(history.length > 12) history.pop();
      renderHistory();
    }
  }

  function renderHistory(){
    if(history.length === 0){
      historyEl.innerHTML = '<div class="row"><div>Waiting for readings...</div><div></div></div>';
      return;
    }

    historyEl.innerHTML = history.map(h => {
      const local = new Date(h.t).toLocaleTimeString();
      if(h.offline){
        return `<div class="row" style="color:red;"><div>⚠️ ${h.v === "Error" ? "Fetch Error" : "System Offline"}</div><div>${local}</div></div>`;
      } else {
        return `<div class="row" style="color:green;"><div>${h.v} ${h.unit}</div><div>${local}</div></div>`;
      }
    }).join('');
  }

  // initial fetch
  fetchLatest();
  const timer = setInterval(fetchLatest, POLL_INTERVAL);

  refreshBtn.addEventListener('click', fetchLatest);

  })

