window.addEventListener("load", () =>{
  
  const API_URL = "https://healthmanagementsystem-iot.onrender.com/temp";

  async function fetchTemperature() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      document.getElementById("value").innerText = `${data.value} ${data.unit}`;
    } catch (err) {
      console.error("Error fetching temperature:", err);
    }
  }

  setInterval(fetchTemperature, 5000); // fetch every 5s
  fetchTemperature();

})