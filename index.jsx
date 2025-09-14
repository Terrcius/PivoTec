<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monitoramento de Pivô</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #F0F2F5;
      margin: 0;
      padding: 0;
    }
    .shadow-card {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .pivot-arm {
      transform-origin: 50% 50%;
      transition: transform 1s linear;
    }
    .animate-spin-slowly {
      animation: spin-slowly 10s linear infinite;
    }
    @keyframes spin-slowly {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-reverse {
      animation: spin-reverse 10s linear infinite;
    }
    @keyframes spin-reverse {
      from { transform: rotate(0deg); }
      to { transform: rotate(-360deg); }
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const PieChart = ({ data, isAnimating, direction, speed }) => {
      let totalPercentage = 0;
      const armStyle = isAnimating
        ? { animation: `spin-${direction === 'Horário' ? 'slowly' : 'reverse'} ${speed}s linear infinite` }
        : {};

      return (
        <svg height="150" width="150" viewBox="0 0 100 100" className="absolute">
          <g transform="rotate(-90 50 50)">
            {data.map((slice, index) => {
              const { percentage, color } = slice;
              const startAngle = totalPercentage * 360 / 100;
              totalPercentage += percentage;
              const endAngle = totalPercentage * 360 / 100;

              const largeArc = endAngle - startAngle > 180 ? 1 : 0;
              const startX = 50 + 50 * Math.cos(startAngle * Math.PI / 180);
              const startY = 50 + 50 * Math.sin(startAngle * Math.PI / 180);
              const endX = 50 + 50 * Math.cos(endAngle * Math.PI / 180);
              const endY = 50 + 50 * Math.sin(endAngle * Math.PI / 180);

              const d = `M 50,50 L ${startX},${startY} A 50,50 0 ${largeArc},1 ${endX},${endY} Z`;

              return <path key={index} d={d} fill={color} />;
            })}
          </g>
          <g className="pivot-arm" style={armStyle}>
            <line x1="50" y1="50" x2="50" y2="0" stroke="#353A47" strokeWidth="2" />
          </g>
        </svg>
      );
    };

    const StatusCard = ({ color, label, value, status, onToggle }) => (
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl mb-2">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
          <span className="font-medium text-sm text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-500">{value}</span>
          <button
            onClick={onToggle}
            className={`relative w-10 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${status ? 'bg-green-500' : 'bg-gray-400'}`}
          >
            <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${status ? 'translate-x-4' : ''}`}></span>
          </button>
        </div>
      </div>
    );

    const MetricCard = ({ value, label }) => (
      <div className="flex-1 min-w-[calc(50%-10px)] max-w-[calc(50%-10px)] flex flex-col items-center justify-center bg-white p-5 rounded-xl shadow-card">
        <span className="text-xl font-bold text-green-500">{value}</span>
        <span className="text-xs text-gray-500 text-center mt-1">{label}</span>
      </div>
    );

    const App = () => {
      // COMENTÁRIO: Estas variáveis de estado representariam os dados que você receberia do seu banco de dados.
      // Você faria uma requisição (ex: usando fetch ou axios) a um endpoint do seu servidor para obter os valores atualizados.
      // Ex: `const data = await fetch('/api/pivot-status').then(res => res.json());`
      // E então, você usaria `setRotationStatus(data.status)`, etc.
      const [rotationStatus, setRotationStatus] = React.useState('Parado');
      const [direction, setDirection] = React.useState('Horário');
      const [isAnimating, setIsAnimating] = React.useState(false);
      const [speed, setSpeed] = React.useState(10); // 10 segundos por rotação
      const [isControllable, setIsControllable] = React.useState(true);

      // Estado para controlar o status de cada setor de forma individual
      const [sectors, setSectors] = React.useState([
        { label: 'Setor A Soja', value: '75%', color: '#70C250', status: true },
        { label: 'Setor B Milho', value: '45%', color: '#4F89BC', status: false },
        { label: 'Setor C Feijão', value: '60%', color: '#FFA500', status: true },
        { label: 'Setor D Trigo', value: '30%', color: '#E67D7D', status: false },
      ]);

      const handleStartRotation = () => {
        const newIsAnimating = !isAnimating;
        setIsAnimating(newIsAnimating);
        setRotationStatus(newIsAnimating ? 'Rodando' : 'Parado');
        setIsControllable(!newIsAnimating);
      };

      const handleToggleDirection = () => {
        setDirection(direction === 'Horário' ? 'Anti-horário' : 'Horário');
      };

      // Função para alternar o status de um setor específico
      const handleToggleStatus = (index) => {
        const newSectors = [...sectors];
        // COMENTÁRIO: Esta linha abaixo simularia o envio do comando para o ESP32/banco de dados.
        // Ex: `fetch('/api/set-sector-status', { method: 'POST', body: JSON.stringify({ sector: index, status: !newSectors[index].status }) });`
        newSectors[index].status = !newSectors[index].status;
        setSectors(newSectors);
      };
      
      // COMENTÁRIO: Cálculo das métricas dinâmicas.
      // Contagem de setores ativos:
      const activeSectorsCount = sectors.filter(sector => sector.status).length;

      // Nível médio de umidade do solo:
      const totalMoisture = sectors.reduce((sum, sector) => {
        const moisture = parseInt(sector.value.replace('%', ''), 10);
        return sum + moisture;
      }, 0);
      const averageMoisture = (totalMoisture / sectors.length).toFixed(0);

      // COMENTÁRIO: Gerando os dados do gráfico de pizza dinamicamente com base no status dos setores.
      const pieData = sectors.map((sector) => ({
        percentage: 100 / sectors.length,
        color: sector.status ? sector.color : '#d1d5db' // cor cinza para desativado
      }));

      return (
        <div className="min-h-screen p-5">
          <div className="flex flex-col gap-5">
            {/* Visualização do Pivô */}
            <div className="bg-white p-5 rounded-xl shadow-card">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Visualização do Pivô</h2>
              <div className="relative flex items-center justify-center w-full h-40">
                <PieChart data={pieData} isAnimating={isAnimating} direction={direction} speed={speed} />
                <div className="flex items-center justify-center w-14 h-14 bg-gray-200 rounded-full z-10">
                  <i className="fa-solid fa-water text-xl text-gray-700"></i>
                </div>
              </div>
            </div>

            {/* Controle Principal */}
            <div className="bg-white p-5 rounded-xl shadow-card">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Controle Principal</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  onClick={handleStartRotation}
                >
                  <i className="fa-solid fa-play-circle text-xl"></i>
                  <span>{isAnimating ? 'Parar Rotação' : 'Iniciar Rotação'}</span>
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors ${!isControllable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleToggleDirection}
                  disabled={!isControllable}
                >
                  <i className="fa-solid fa-sync-alt text-lg"></i>
                  <span>{direction}</span>
                </button>
              </div>

              <div className="mt-4">
                <label htmlFor="speed-control" className="block text-sm font-semibold text-gray-800">
                  Controle de Velocidade: <span className="text-gray-600 font-normal">({speed}s/rotação)</span>
                </label>
                <input
                  type="range"
                  id="speed-control"
                  min="1"
                  max="20"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className={`w-full mt-2 ${!isControllable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isControllable}
                />
              </div>

              <div className="flex justify-between items-center text-sm mt-4 px-2">
                <div>
                  <span className="font-semibold text-gray-800">Status: </span>
                  <span className="text-gray-600">{rotationStatus}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Direção: </span>
                  <span className="text-gray-600">{direction}</span>
                </div>
              </div>
            </div>

            {/* Status dos Setores */}
            <div className="bg-white p-5 rounded-xl shadow-card">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Status dos Setores</h2>
              {sectors.map((sector, index) => (
                <StatusCard
                  key={index}
                  color={sector.color}
                  label={sector.label}
                  value={sector.value}
                  status={sector.status}
                  onToggle={() => handleToggleStatus(index)}
                />
              ))}
            </div>

            {/* Métricas */}
            <div className="flex flex-wrap justify-between gap-5">
              <MetricCard value={activeSectorsCount} label="Setores Ativos" />
              <MetricCard value={`${averageMoisture}%`} label="Nível Médio" />
              <MetricCard value="4" label="Culturas" />
              <MetricCard value="360°" label="Cobertura" />
            </div>
          </div>
        </div>
      );
    };
    
    // Use createRoot para renderizar o componente principal
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>