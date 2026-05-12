import React from 'react';

interface Card{
    id: number
    name: string
    email: string
}

const CardComponent: React.FC<{card: Card}> = ({card}) => {
    return (
        <div>  
            <h1>{card.name}</h1>
            <p>{card.email}</p>   
        </div>
    );
}   

export default CardComponent;