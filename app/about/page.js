'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiGlobe, FiCompass, FiLinkedin, FiTwitter } from 'react-icons/fi';

export default function AboutPage() {
    return (
        <main className="animate-fade-in bg-white min-h-screen pb-24">

            {/* Cinematic Hero Section */}
            <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80"
                    alt="The Maison"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-stone-900/40"></div>
                <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/70 mb-4 block">
                            Our Heritage
                        </span>
                        <h1 className="text-5xl md:text-7xl font-light text-white tracking-tight mb-6">
                            The <span className="font-serif italic font-bold">Maison</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Our Story Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-b border-stone-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-light text-stone-900 mb-8">Our <span className="font-serif italic font-bold">Story</span></h2>
                        <div className="space-y-6 text-sm text-stone-500 leading-relaxed">
                            <p>
                                Founded in 2018, ShopHub was born from a singular vision: to curate an uncompromising digital shopping experience that marries modern aesthetics with timeless quality. What began as a boutique operation has evolved into a globally recognized platform.
                            </p>
                            <p>
                                Our journey is defined by an obsessive dedication to craftsmanship, curation, and client experience. We travel the globe to partner with artisans, emerging designers, and heritage brands to bring you pieces that transcend fleeting trends.
                            </p>
                            <p>
                                As we look to the future, our foundational ethos remains unchanged. We believe that true luxury lies in simplicity, transparency, and the seamless connection between the creator and the connoisseur.
                            </p>
                        </div>
                    </div>
                    <div className="relative aspect-[4/5] lg:aspect-square overflow-hidden rounded-2xl bg-stone-100">
                        <Image
                            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                            alt="Atelier"
                            fill
                            className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                        />
                    </div>
                </div>
            </div>

            {/* Our Philosophy (Mission) */}
            <div className="bg-stone-50 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                            Our Ethos
                        </span>
                        <h2 className="text-3xl font-light text-stone-900 mb-6">The Philosophy</h2>
                        <p className="text-lg font-serif italic text-stone-600">
                            "To seamlessly connect discerning individuals with curated, high-quality pieces, while fostering an ecosystem rooted in trust, conscious craft, and modern elegance."
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
                        <div className="text-center group">
                            <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center mb-6 text-stone-900 border border-stone-200 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-500 shadow-sm">
                                <FiHeart size={24} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-3">Client Centricity</h3>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                We elevate the standard of service, anticipating needs and ensuring a bespoke experience from discovery to unboxing.
                            </p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center mb-6 text-stone-900 border border-stone-200 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-500 shadow-sm">
                                <FiGlobe size={24} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-3">Conscious Craft</h3>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                A steadfast commitment to sustainability, ethical sourcing, and partnering with creators who respect our planet.
                            </p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center mb-6 text-stone-900 border border-stone-200 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-500 shadow-sm">
                                <FiCompass size={24} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xs font-bold tracking-widest uppercase text-stone-900 mb-3">Modern Elegance</h3>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                We continuously refine our platform, prioritizing minimalist design and intuitive innovation for a seamless journey.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Timeline */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-b border-stone-200">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-light text-stone-900">The <span className="font-serif italic font-bold">Timeline</span></h2>
                </div>

                <div className="space-y-12 pl-4 md:pl-0">
                    {[
                        { year: "2018", title: "The Inception", desc: "ShopHub was founded in a modest studio with a vision to redefine digital curation. Launched with an exclusive collection of 50 handcrafted pieces." },
                        { year: "2020", title: "Global Reach", desc: "Expanded our operations internationally, establishing logistics hubs in Europe and North America to serve our growing clientele." },
                        { year: "2022", title: "Conscious Commitment", desc: "Launched our sustainability initiative, transitioning to 100% recycled packaging and carbon-neutral global shipping." },
                        { year: "2024", title: "The Future", desc: "Today, we operate with a global team of curators, serving millions of discerning customers while staying true to our boutique roots." }
                    ].map((item, index) => (
                        <div key={index} className="relative md:flex md:gap-8 items-start group">
                            {/* Line & Dot */}
                            <div className="absolute left-[-17px] md:left-[111px] top-0 bottom-[-48px] w-[1px] bg-stone-200 group-last:bottom-0 hidden md:block"></div>
                            <div className="absolute left-[-21px] md:left-[107px] top-1.5 w-2 h-2 rounded-full bg-stone-400 group-hover:bg-stone-900 transition-colors duration-300"></div>

                            <div className="md:w-24 flex-shrink-0 mb-2 md:mb-0 md:text-right">
                                <span className="text-xl font-serif italic text-stone-400 group-hover:text-stone-900 transition-colors duration-300">{item.year}</span>
                            </div>
                            <div className="md:flex-1 pb-6 md:pb-0">
                                <h3 className="text-sm font-bold tracking-widest uppercase text-stone-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Meet the Team */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4 block">
                        The Visionaries
                    </span>
                    <h2 className="text-3xl font-light text-stone-900">Our <span className="font-serif italic font-bold">Leadership</span></h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { name: "John Doe", role: "Creative Director & Founder", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80" },
                        { name: "Sarah Johnson", role: "Chief Operating Officer", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" },
                        { name: "Michael Chen", role: "Head of Digital Experience", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80" },
                        { name: "Emily Rodriguez", role: "Director of Curation", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" }
                    ].map((member, index) => (
                        <div key={index} className="group text-center">
                            <div className="relative aspect-[3/4] mb-6 overflow-hidden rounded-2xl bg-stone-100">
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                                />
                            </div>
                            <h3 className="text-base font-medium text-stone-900 mb-1">{member.name}</h3>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4">{member.role}</p>
                            <div className="flex justify-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <a href="#" className="text-stone-400 hover:text-stone-900 transition-colors"><FiLinkedin size={16} /></a>
                                <a href="#" className="text-stone-400 hover:text-stone-900 transition-colors"><FiTwitter size={16} /></a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editorial CTA Section */}
            <div className="bg-stone-900 text-white py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-5xl font-light mb-6 tracking-tight">Experience the <span className="font-serif italic font-bold">Difference</span></h2>
                    <p className="text-sm text-stone-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Join our community of discerning clientele and discover a curated selection of pieces designed to elevate your everyday.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/shop" className="bg-white text-stone-900 text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:bg-stone-200 transition-colors">
                            Explore Collections
                        </Link>
                        <Link href="/contact" className="bg-transparent border border-stone-500 text-white text-xs font-bold tracking-widest uppercase px-10 py-4 rounded-full hover:border-white transition-colors">
                            Contact Concierge
                        </Link>
                    </div>
                </div>
            </div>

        </main>
    );
}