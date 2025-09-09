interface ChartProps {
  data: number[];
  labels: string[];
  type: 'line' | 'bar' | 'doughnut';
  colors?: string[];
}

export default function SimpleChart({ data, labels, type, colors = ['#0D9E86', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#22C55E'] }: ChartProps) {
  const maxValue = Math.max(...data.filter(val => val != null && !isNaN(val))) || 1;
  
  if (type === 'line') {
    return (
      <div className="relative h-full flex items-end justify-between px-4 pb-8">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0D9E86" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#0D9E86" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path
            d={`M 50 ${180 - ((data[0] || 0) / maxValue) * 120} ${data.map((value, i) => 
              `L ${50 + (i * 40)} ${180 - ((value || 0) / maxValue) * 120}`
            ).join(' ')}`}
            stroke="#0D9E86"
            strokeWidth="3"
            fill="none"
            className="animate-pulse"
          />
          <path
            d={`M 50 180 L 50 ${180 - ((data[0] || 0) / maxValue) * 120} ${data.map((value, i) => 
              `L ${50 + (i * 40)} ${180 - ((value || 0) / maxValue) * 120}`
            ).join(' ')} L ${50 + ((data.length - 1) * 40)} 180 Z`}
            fill="url(#lineGradient)"
          />
          {data.map((value, i) => (
            <circle
              key={i}
              cx={50 + (i * 40)}
              cy={180 - ((value || 0) / (maxValue || 1)) * 120}
              r="4"
              fill="#0D9E86"
              className="animate-pulse"
            />
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-gray-500">
          {labels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="h-full flex items-end justify-between px-4 pb-8 space-x-2">
        {data.map((value, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div 
              className="w-full rounded-t-lg transition-all duration-1000 ease-out"
              style={{
                height: `${(value / maxValue) * 200}px`,
                backgroundColor: colors[i % colors.length],
                animationDelay: `${i * 0.1}s`
              }}
            />
            <span className="text-xs text-gray-500 mt-2">{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'doughnut') {
    const total = data.reduce((sum, val) => sum + val, 0);
    let currentAngle = 0;
    
    return (
      <div className="relative h-full flex items-center justify-center">
        <svg className="w-48 h-48" viewBox="0 0 200 200">
          {data.map((value, i) => {
            const percentage = value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = 100 + 70 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 100 + 70 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 100 + 70 * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = 100 + 70 * Math.sin((endAngle - 90) * Math.PI / 180);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 70 70 0 ${largeArc} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={i}
                d={pathData}
                fill={colors[i % colors.length]}
                className="hover:opacity-80 transition-opacity"
                style={{
                  animation: `fadeIn 0.8s ease-out ${i * 0.2}s both`
                }}
              />
            );
          })}
          <circle cx="100" cy="100" r="35" fill="white" />
        </svg>
        <div className="absolute bottom-4 left-0 right-0">
          <div className="flex justify-center space-x-4 text-xs">
            {labels.map((label, i) => (
              <div key={i} className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}