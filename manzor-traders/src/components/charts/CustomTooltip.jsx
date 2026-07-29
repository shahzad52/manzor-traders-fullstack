export default function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-blue-100 shadow-lg rounded-xl p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="capitalize">
            {p.name}: <span className="font-semibold">Rs {p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}
