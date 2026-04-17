module.exports = async function handler(req, res) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { lat, lon, city } = req.query;

  let locationParam;
  if (city) {
    locationParam = `q=${encodeURIComponent(city)}`;
  } else if (lat && lon) {
    locationParam = `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  } else {
    return res.status(400).json({ error: 'Provide lat/lon or city' });
  }

  const base   = 'https://api.openweathermap.org/data/2.5';
  const params = `${locationParam}&appid=${apiKey}&units=imperial`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${base}/weather?${params}`),
      fetch(`${base}/forecast?${params}`),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      const failStatus = !currentRes.ok ? currentRes.status : forecastRes.status;
      return res.status(failStatus === 401 ? 401 : 502).json({ error: 'Weather data unavailable' });
    }

    const [currentData, forecastData] = await Promise.all([
      currentRes.json(),
      forecastRes.json(),
    ]);

    const current = {
      temp:       Math.round(currentData.main.temp),
      feels_like: Math.round(currentData.main.feels_like),
      condition:  currentData.weather[0].description,
      icon:       currentData.weather[0].icon,
      high:       Math.round(currentData.main.temp_max),
      low:        Math.round(currentData.main.temp_min),
    };

    // Group forecast intervals by date, skip today, take next 3 days
    const today = new Date().toISOString().split('T')[0];
    const byDay = {};

    forecastData.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (date === today) return;
      if (!byDay[date]) byDay[date] = { temps: [], icons: [], noonIcon: null };
      byDay[date].temps.push(item.main.temp);
      byDay[date].icons.push(item.weather[0].icon);
      if (!byDay[date].noonIcon && item.dt_txt.includes('12:00:00')) {
        byDay[date].noonIcon = item.weather[0].icon;
      }
    });

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const forecast = Object.entries(byDay).slice(0, 3).map(([date, data]) => ({
      day:  DAYS[new Date(date + 'T12:00:00').getDay()],
      icon: data.noonIcon || data.icons[Math.floor(data.icons.length / 2)],
      high: Math.round(Math.max(...data.temps)),
      low:  Math.round(Math.min(...data.temps)),
    }));

    res.status(200).json({ current, forecast });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
