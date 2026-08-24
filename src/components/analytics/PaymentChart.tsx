import { useState, useMemo, useRef } from 'react';
import { TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

interface MemberEntry {
  uid: string;
  username: string;
  avatar_url?: string;
  xp: number;
  level: number;
  createdAt: unknown;
  status: string;
  email?: string;
  hasPaid?: boolean;
}

interface PaymentChartProps {
  allProfiles: MemberEntry[];
}

function parseProfileDate(createdAt: any): Date | null {
  if (!createdAt) return null;
  try {
    if (typeof createdAt === 'object') {
      if ('toDate' in createdAt && typeof createdAt.toDate === 'function') {
        return createdAt.toDate();
      }
      if ('seconds' in createdAt) {
        return new Date(createdAt.seconds * 1000);
      }
      if ('_seconds' in createdAt) {
        return new Date(createdAt._seconds * 1000);
      }
    }
    if (typeof createdAt === 'string') {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) return d;
    }
  } catch (e) {
    console.warn('Error parsing date:', e);
  }
  return null;
}

export default function PaymentChart({ allProfiles }: PaymentChartProps) {
  const [rangeMode, setRangeMode] = useState<'30days' | 'mtd'>('30days');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Generate date points and aggregate data
  const chartData = useMemo(() => {
    const now = new Date();
    const days: { date: Date; dateStr: string; label: string; count: number }[] = [];

    if (rangeMode === '30days') {
      // Last 30 days (including today)
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
        const label = d.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' });
        days.push({ date: d, dateStr, label, count: 0 });
      }
    } else {
      // Month to date: from the 1st of the current month until today
      const todayDay = now.getDate();
      for (let i = 1; i <= todayDay; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const dateStr = d.toLocaleDateString('sv-SE');
        const label = d.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' });
        days.push({ date: d, dateStr, label, count: 0 });
      }
    }

    // Populate counts
    allProfiles.forEach((profile) => {
      // Only count if profile has paid, or status is active (which implies active subscription)
      if (profile.hasPaid !== true && profile.status !== 'active') return;

      const pDate = parseProfileDate(profile.createdAt);
      if (!pDate) return;

      const pDateStr = pDate.toLocaleDateString('sv-SE');
      const dayMatch = days.find((day) => day.dateStr === pDateStr);
      if (dayMatch) {
        dayMatch.count += 1;
      }
    });

    return days;
  }, [allProfiles, rangeMode]);

  // Calculations for SVG
  const width = 500;
  const height = 160;
  const paddingX = 25;
  const paddingY = 25;
  const chartWidth = width - 2 * paddingX;
  const chartHeight = height - 2 * paddingY;

  const maxCount = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.count), 0);
    return maxVal === 0 ? 1 : maxVal;
  }, [chartData]);

  const totalPayments = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.count, 0);
  }, [chartData]);

  const totalRevenue = totalPayments * 49;

  const points = useMemo(() => {
    const len = chartData.length;
    return chartData.map((d, i) => {
      const x = paddingX + (len > 1 ? (i / (len - 1)) * chartWidth : chartWidth / 2);
      const y = height - paddingY - (d.count / maxCount) * chartHeight;
      return { x, y, ...d };
    });
  }, [chartData, maxCount, chartWidth, chartHeight]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baseLineY = height - paddingY;
    return `${linePath} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;
  }, [points, linePath]);

  // Handle Mouse Hover / Touch
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    // Convert to index
    const len = points.length;
    let index = Math.round(percentage * (len - 1));
    if (index < 0) index = 0;
    if (index >= len) index = len - 1;

    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Grid line levels
  const gridLines = [0, 0.5, 1];

  return (
    <div className="ursa-card p-6 border-white/5 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" />
            <span>Analitika Plaćanja</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1 tracking-tight">PREGLED PRIHODA</h2>
        </div>

        {/* Range Switch */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1 w-full sm:w-auto">
          <button
            onClick={() => {
              setRangeMode('30days');
              setHoveredIndex(null);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              rangeMode === '30days'
                ? 'bg-primary text-black'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Zadnjih 30 dana
          </button>
          <button
            onClick={() => {
              setRangeMode('mtd');
              setHoveredIndex(null);
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              rangeMode === 'mtd'
                ? 'bg-primary text-black'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Od početka mjeseca
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-black/20 rounded-2xl border border-white/5 p-4">
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Ukupno uplata</span>
          <span className="text-2xl font-black text-white mt-0.5 block flex items-baseline gap-1">
            {totalPayments}
            <span className="text-xs font-bold text-primary">uplat{totalPayments === 1 ? 'a' : 'e'}</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Ukupan iznos</span>
          <span className="text-2xl font-black text-white mt-0.5 block text-primary">
            {totalRevenue.toLocaleString('hr-HR')}€
          </span>
        </div>
        <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Razdoblje</span>
          <span className="text-xs font-bold text-white/70 mt-1 block flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {chartData.length > 0 && (
              <>
                {chartData[0].label} — {chartData[chartData.length - 1].label}
              </>
            )}
          </span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Definitions for Gradients and Filters */}
          <defs>
            {/* Glow Filter */}
            <filter id="chart-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Gradient under area */}
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4FF00" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#D4FF00" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((percent, idx) => {
            const y = paddingY + chartHeight * percent;
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Render Area Path */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#chart-gradient)"
            />
          )}

          {/* Render Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#D4FF00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#chart-glow)"
            />
          )}

          {/* Interactive Hover Indicator Line */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <>
              <line
                x1={points[hoveredIndex].x}
                y1={paddingY}
                x2={points[hoveredIndex].x}
                y2={height - paddingY}
                stroke="rgba(212, 255, 0, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={points[hoveredIndex].x}
                cy={points[hoveredIndex].y}
                r="5.5"
                fill="#0A0A0A"
                stroke="#D4FF00"
                strokeWidth="2.5"
                className="transition-all duration-100"
              />
            </>
          )}

          {/* X Axis Labels (first, middle, last to prevent overlap) */}
          {points.length > 1 && (
            <>
              <text
                x={points[0].x}
                y={height - 5}
                fill="rgba(255, 255, 255, 0.4)"
                fontSize="8"
                fontWeight="black"
                textAnchor="start"
                className="uppercase font-sans tracking-widest"
              >
                {points[0].label}
              </text>
              <text
                x={points[Math.floor(points.length / 2)].x}
                y={height - 5}
                fill="rgba(255, 255, 255, 0.4)"
                fontSize="8"
                fontWeight="black"
                textAnchor="middle"
                className="uppercase font-sans tracking-widest"
              >
                {points[Math.floor(points.length / 2)].label}
              </text>
              <text
                x={points[points.length - 1].x}
                y={height - 5}
                fill="rgba(255, 255, 255, 0.4)"
                fontSize="8"
                fontWeight="black"
                textAnchor="end"
                className="uppercase font-sans tracking-widest"
              >
                {points[points.length - 1].label}
              </text>
            </>
          )}
        </svg>

        {/* HTML Tooltip overlaid when hovered */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 bg-[#161616] border border-white/10 p-3 rounded-xl shadow-2xl pointer-events-none text-left"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${Math.max(10, (points[hoveredIndex].y / height) * 100 - 30)}%`,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
          >
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
              {points[hoveredIndex].date.toLocaleDateString('hr-HR', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <p className="text-xs font-black text-white mt-1 flex items-center gap-1">
              <span>Uplate:</span>
              <span className="text-primary text-sm font-black">{points[hoveredIndex].count}</span>
            </p>
            {points[hoveredIndex].count > 0 && (
              <p className="text-[10px] font-bold text-emerald-400 mt-0.5 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                +{points[hoveredIndex].count * 49}€
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
