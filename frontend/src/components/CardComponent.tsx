import React from 'react';

interface Card{
    id: number
    name: string
    email: string
}

const CardComponent: React.FC<{card: Card}> = ({card}) => {
    return (
        <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg'>  
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">User #{card.id}</div>
                    <div className="text-lg font-semibold text-slate-900">{card.name}</div>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                    Active
                </span>
            </div>
            <div className="text-sm text-slate-500">{card.email}</div>
        </div>
    );
}   

export default CardComponent;