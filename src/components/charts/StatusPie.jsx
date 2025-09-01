import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export default function StatusPie({ typeCounts = {}, title = "Claim Status" }) {
  const data = [
    { name: "Pending", value: Number(typeCounts?.Pending || 0) },
    { name: "Approved", value: Number(typeCounts?.Approved || 0) },
    { name: "Rejected", value: Number(typeCounts?.Rejected || 0) },
  ].filter(d => d.value > 0);

  const COLORS = ["#ffc658", "#82ca9d", "#ff8078"];

  return (
    <div className="card">
      <div className="between"><h4>{title}</h4></div>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie dataKey="value" nameKey="name" data={data} cx="50%" cy="50%" outerRadius={80} label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
