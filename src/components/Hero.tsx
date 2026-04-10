import { useState } from 'react';

const filters = ['2k8', '2k9', '2k10'];

export default function Hero() {
  const [activeFilter, setActiveFilter] = useState('2k8');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-indigo-deep mb-8">
        KHÓA HỌC
      </h1>
      
      <div className="flex gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-academic-sm text-sm font-bold transition-all ${
              activeFilter === filter
                ? 'bg-indigo-deep text-white shadow-academic-lg'
                : 'bg-surface text-on-surface-variant hover:bg-surface-bright'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </section>
  );
}
