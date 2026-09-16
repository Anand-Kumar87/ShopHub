'use client';

import React from 'react';

/**
 * Ultra-crisp vector SVG country flags with rounded borders.
 * Eliminates Windows OS font rendering bugs where flag emojis display as ugly two-letter ISO tags.
 */
export default function CountryFlag({ code = 'IN', className = 'w-5 h-3.5' }) {
    const country = code?.toUpperCase();

    switch (country) {
        case 'IN': // India
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#f93" d="M0 0h640v160H0z" />
                    <path fill="#fff" d="M0 160h640v160H0z" />
                    <path fill="#128807" d="M0 320h640v160H0z" />
                    <g transform="matrix(3.2 0 0 3.2 320 240)">
                        <circle r="20" fill="none" stroke="#008" strokeWidth="2" />
                        <circle r="3.5" fill="#008" />
                        <g id="d">
                            <g id="c">
                                <g id="b">
                                    <path fill="#008" d="m0-20 .7 15L0-3l-.7-2z" />
                                    <circle cy="-17" r=".7" fill="#008" />
                                </g>
                                <use href="#b" transform="rotate(30)" />
                            </g>
                            <use href="#c" transform="rotate(60)" />
                        </g>
                        <use href="#d" transform="rotate(120)" />
                        <use href="#d" transform="rotate(240)" />
                    </g>
                </svg>
            );

        case 'US': // United States
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <g fill="#bd3d44">
                        <path d="M0 0h640v37H0zM0 74h640v37H0zM0 148h640v37H0zM0 222h640v37H0zM0 295h640v37H0zM0 369h640v37H0zM0 443h640v37H0z" />
                    </g>
                    <g fill="#fff">
                        <path d="M0 37h640v37H0zM0 111h640v37H0zM0 185h640v37H0zM0 258h640v37H0zM0 332h640v37H0zM0 406h640v37H0z" />
                    </g>
                    <path fill="#192f5d" d="M0 0h260v258H0z" />
                    <g fill="#fff">
                        <circle cx="28" cy="20" r="8" />
                        <circle cx="70" cy="20" r="8" />
                        <circle cx="112" cy="20" r="8" />
                        <circle cx="154" cy="20" r="8" />
                        <circle cx="196" cy="20" r="8" />
                        <circle cx="238" cy="20" r="8" />
                        <circle cx="49" cy="45" r="8" />
                        <circle cx="91" cy="45" r="8" />
                        <circle cx="133" cy="45" r="8" />
                        <circle cx="175" cy="45" r="8" />
                        <circle cx="217" cy="45" r="8" />
                        <circle cx="28" cy="70" r="8" />
                        <circle cx="70" cy="70" r="8" />
                        <circle cx="112" cy="70" r="8" />
                        <circle cx="154" cy="70" r="8" />
                        <circle cx="196" cy="70" r="8" />
                        <circle cx="238" cy="70" r="8" />
                        <circle cx="49" cy="95" r="8" />
                        <circle cx="91" cy="95" r="8" />
                        <circle cx="133" cy="95" r="8" />
                        <circle cx="175" cy="95" r="8" />
                        <circle cx="217" cy="95" r="8" />
                        <circle cx="28" cy="120" r="8" />
                        <circle cx="70" cy="120" r="8" />
                        <circle cx="112" cy="120" r="8" />
                        <circle cx="154" cy="120" r="8" />
                        <circle cx="196" cy="120" r="8" />
                        <circle cx="238" cy="120" r="8" />
                    </g>
                </svg>
            );

        case 'EU': // European Union
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#039" d="M0 0h640v480H0z" />
                    <g fill="#fc0" transform="matrix(20 0 0 20 320 240)">
                        <circle cx="0" cy="-6" r="1.1" />
                        <circle cx="3" cy="-5.2" r="1.1" />
                        <circle cx="5.2" cy="-3" r="1.1" />
                        <circle cx="6" cy="0" r="1.1" />
                        <circle cx="5.2" cy="3" r="1.1" />
                        <circle cx="3" cy="5.2" r="1.1" />
                        <circle cx="0" cy="6" r="1.1" />
                        <circle cx="-3" cy="5.2" r="1.1" />
                        <circle cx="-5.2" cy="3" r="1.1" />
                        <circle cx="-6" cy="0" r="1.1" />
                        <circle cx="-5.2" cy="-3" r="1.1" />
                        <circle cx="-3" cy="-5.2" r="1.1" />
                    </g>
                </svg>
            );

        case 'GB': // United Kingdom
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#012169" d="M0 0h640v480H0z" />
                    <path fill="#fff" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-179L0 63V0z" />
                    <path fill="#c8102e" d="m424 288 216 153v39h-38L382 320zm-208-96L0 39V0h38l220 160zm167 48 257 192h-43L340 240zm-286 0L0 440v40l297-220z" />
                    <path fill="#fff" d="M240 0h160v480H240zM0 160h640v160H0z" />
                    <path fill="#c8102e" d="M267 0h106v480H267zM0 187h640v106H0z" />
                </svg>
            );

        case 'CA': // Canada
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#d52b1e" d="M0 0h160v480H0zm480 0h160v480H480z" />
                    <path fill="#fff" d="M160 0h320v480H160z" />
                    <path fill="#d52b1e" d="m320 80 18 52 46-24-18 52 50 16-42 34 32 40-52-4-10 48-18-42-6 72h-12l-6-72-18 42-10-48-52 4 32-40-42-34 50-16-18-52 46 24z" />
                </svg>
            );

        case 'AU': // Australia
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#00008b" d="M0 0h640v480H0z" />
                    {/* Mini Union Jack canton */}
                    <g transform="scale(0.5)">
                        <path fill="#012169" d="M0 0h640v480H0z" />
                        <path fill="#fff" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-179L0 63V0z" />
                        <path fill="#c8102e" d="m424 288 216 153v39h-38L382 320zm-208-96L0 39V0h38l220 160zm167 48 257 192h-43L340 240zm-286 0L0 440v40l297-220z" />
                        <path fill="#fff" d="M240 0h160v480H240zM0 160h640v160H0z" />
                        <path fill="#c8102e" d="M267 0h106v480H267zM0 187h640v106H0z" />
                    </g>
                    {/* Federation Star & Southern Cross */}
                    <circle cx="160" cy="360" r="32" fill="#fff" />
                    <circle cx="480" cy="110" r="14" fill="#fff" />
                    <circle cx="420" cy="210" r="14" fill="#fff" />
                    <circle cx="530" cy="210" r="14" fill="#fff" />
                    <circle cx="480" cy="310" r="14" fill="#fff" />
                    <circle cx="500" cy="250" r="8" fill="#fff" />
                </svg>
            );

        case 'AE': // UAE
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#00732f" d="M160 0h480v160H160z" />
                    <path fill="#fff" d="M160 160h480v160H160z" />
                    <path fill="#000" d="M160 320h480v160H160z" />
                    <path fill="#f00" d="M0 0h160v480H0z" />
                </svg>
            );

        case 'JP': // Japan
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#fff" d="M0 0h640v480H0z" />
                    <circle cx="320" cy="240" r="144" fill="#bc002d" />
                </svg>
            );

        case 'SG': // Singapore
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#ed2939" d="M0 0h640v240H0z" />
                    <path fill="#fff" d="M0 240h640v240H0z" />
                    <circle cx="160" cy="120" r="70" fill="#fff" />
                    <circle cx="185" cy="120" r="65" fill="#ed2939" />
                    <circle cx="190" cy="85" r="8" fill="#fff" />
                    <circle cx="215" cy="105" r="8" fill="#fff" />
                    <circle cx="210" cy="135" r="8" fill="#fff" />
                    <circle cx="180" cy="150" r="8" fill="#fff" />
                    <circle cx="165" cy="120" r="8" fill="#fff" />
                </svg>
            );

        case 'CH': // Switzerland
            return (
                <svg className={`${className} inline-block rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-stone-200/60`} viewBox="0 0 640 480">
                    <path fill="#d52b1e" d="M0 0h640v480H0z" />
                    <path fill="#fff" d="M270 120h100v240H270zM180 210h280v60H180z" />
                </svg>
            );

        default:
            return (
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-stone-100 text-stone-700 rounded border border-stone-200">
                    {country}
                </span>
            );
    }
}
