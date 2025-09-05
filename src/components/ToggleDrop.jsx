import React, { useState } from 'react'

export default function ToggleDrop({ items }){
    const [openIndex, setOpenIndex] = useState(0); //기본 1번

    return (
        <div className="items-center gap-6 mt-5">
            <div className="w-full flex gap-3 md:gap-5">
                {items.map((item, index) => (
                    <button 
                        key={index}
                        onClick={() => setOpenIndex(index)}
                        className={`items-center px-4 md:px-12 py-2 font-ibm font-medium rounded-full bg-gray-800 hover:bg-gray-700 transition                            ${ openIndex === index ? 'text-white' : 'text-gray-400' }`}
                    >
                        {item.title}
                    </button>
                ))}
            </div>

            {/* Drop Content */}
            <div className="w-full text-left py-2 font-ibm text-base font-normal mt-5">
                {items[openIndex].content}
            </div>
        </div>
    );
}
