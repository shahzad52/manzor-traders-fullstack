import StatCard from "./StatCard";

/** 2 cards per row on mobile, 4 on large screens */
export default function StatsGrid({ cards, large = false }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} large={large} />
      ))}
    </div>
  );
}
