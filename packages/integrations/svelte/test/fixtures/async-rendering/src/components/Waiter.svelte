<script>
	const req = await fetch("https://api.open-meteo.com/v1/forecast?latitude=28.52&longitude=-80.68&current=temperature_2m,wind_speed_10m");
	const weather = await req.json();
</script>


<p class="weather">The current temperature at KSC is {weather.current.temperature_2m}{weather.current_units.temperature_2m}, with a 
wind speed of {weather.current.wind_speed_10m} {weather.current_units.wind_speed_10m}. 🚀
</p>
