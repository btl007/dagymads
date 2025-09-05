import React from 'react'

import Header from '../components/Header';
import bgVideo from '../../src/bg.mp4'

export default function Home() {
    return(
        <section className="relative w-full min-h-screen flex flex-col justify-center items-center text-center px-6">
            
            {/* Header Positioning */}
            <Header />
        
            {/* flowing Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 via-blue-400 to-blue-800
                bg-[length:200%_200%] bg-flowing z-10" />

            {/* glassmorphism Overlay */}
            <div className="absolute top-0 left-0 w-full h-full backdrop-blur-xl bg-white/10 z-20" />

            {/* Center Circle Gradient */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                            w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-white/50 via-pink-300/30 to-transparent
                            blur-xl opacity-80 z-20 pointer-events-none" />

            {/* Main Text */}
            <div className="relative z-30 space-y-6">
                <div className="flex items-baseline">
                <h1 className="text-5xl md:text-7xl font-thin font-robert">
                    Authentic
                </h1>
                <h1 className="ml-5 text-5xl md:text-8xl font-base font-roboto leading-tight tracking-tight">
                    KEY
                </h1>
                <h1 className="ml-5 text-5xl md:text-7xl font-light font-clash font-italic leading-tight tracking-tight">
                    of
                </h1>
                <h1 className="ml-5 text-5xl md:text-7xl font-bold font-unbounded leading-tight tracking-tight">
                    Frames
                </h1>
                </div>
                <p className="text-lg md:text-xl font-thin font-robert">
                    SYMPHATIC, AUTHENTIC, CONTEMPORARY <br />BASED IN SEOUL
                </p>
            </div>
        </section>
    );
}



/*
<div className="relative w-[640px] h-[640px] overflow-hidden flex mx-auto justify-center">
            
                <video autoPlay muted loop playsInline
                    className="justify-center mx-auto flex w-full h-full object-cover">
                    <source src={bgVideo} type="video/mp4" />
                </video>
                <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0)_30%,_rgba(10,10,19,1)_60%,_rgba(10,10,19,1)_100%)]" />
                <div className="absolute inset-0 z-20 justify-center items-center flex text-white text-6xl font-bold">
                    WELCOME
                </div>
                <p className="absolute inset-0 z-20 justify-center items-center flex mt-30 text-white text-xl font-light">
                    Here is WSKCRW.
                </p>
            
        </div>
*/