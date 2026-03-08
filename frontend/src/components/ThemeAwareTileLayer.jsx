import { useTheme } from '../context/ThemeContext';
import { TileLayer } from 'react-leaflet';

export default function ThemeAwareTileLayer() {
  const { theme } = useTheme();
  
  // Use dark tiles for dark mode, light tiles for light mode
  const darkTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const lightTileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  
  return (
    <TileLayer
      url={theme === 'dark' ? darkTileUrl : lightTileUrl}
      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
    />
  );
}
